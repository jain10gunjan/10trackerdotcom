package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.PracticeQuestion
import com.tentracker.nativeapp.data.SessionStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PracticeUiState(
    val loading: Boolean = true,
    val loadingMore: Boolean = false,
    val questions: List<PracticeQuestion> = emptyList(),
    val index: Int = 0,
    val selected: String? = null,
    val revealed: Boolean = false,
    val lastCorrect: Boolean? = null,
    val showSolution: Boolean = false,
    val completedIds: Set<String> = emptySet(),
    val correctIds: Set<String> = emptySet(),
    /** In-session answers so jump-back can highlight the chosen option. */
    val selectedById: Map<String, String> = emptyMap(),
    val points: Int = 0,
    val hasMore: Boolean = false,
    val page: Int = 1,
    val totalCount: Int = 0,
    val error: String? = null,
    val saveHint: String? = null,
    val paletteExpanded: Boolean = false,
) {
    fun completedInChapter(): Int {
        if (questions.isEmpty()) return 0
        val loadedIds = questions.map { it.id }.toSet()
        val inLoaded = completedIds.count { it in loadedIds }
        // Progress API returns chapter-scoped IDs; prefer that count when paginated.
        return if (totalCount > questions.size) {
            completedIds.size.coerceAtMost(totalCount).coerceAtLeast(inLoaded)
        } else {
            inLoaded
        }
    }

    fun correctInChapter(): Int {
        if (questions.isEmpty()) return 0
        val loadedIds = questions.map { it.id }.toSet()
        val inLoaded = correctIds.count { it in loadedIds }
        return if (totalCount > questions.size) {
            correctIds.size.coerceAtMost(completedInChapter()).coerceAtLeast(inLoaded)
        } else {
            inLoaded
        }
    }

    val wrongInChapter: Int
        get() = (completedInChapter() - correctInChapter()).coerceAtLeast(0)

    val pendingInChapter: Int
        get() {
            val total = if (totalCount > 0) totalCount else questions.size
            return (total - completedInChapter()).coerceAtLeast(0)
        }

    val progressPct: Int
        get() {
            val total = if (totalCount > 0) totalCount else questions.size
            if (total <= 0) return 0
            return ((completedInChapter().toDouble() / total) * 100).toInt().coerceIn(0, 100)
        }

    val accuracyPct: Int
        get() {
            val c = completedInChapter()
            if (c <= 0) return 0
            return ((correctInChapter().toDouble() / c) * 100).toInt().coerceIn(0, 100)
        }

    val firstPendingIndex: Int
        get() = questions.indexOfFirst { it.id !in completedIds }
}

class PracticeViewModel(
    private val api: ApiClient,
    private val sessionStore: SessionStore,
    private val category: String,
    private val subject: String,
    private val chapter: String,
) : ViewModel() {
    private val _state = MutableStateFlow(PracticeUiState())
    val state: StateFlow<PracticeUiState> = _state.asStateFlow()

    private val pendingEntries = linkedMapOf<String, Map<String, Any?>>()
    private var didResume = false

    init {
        load(page = 1, reset = true)
    }

    fun load(page: Int, reset: Boolean) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    loading = reset,
                    loadingMore = !reset,
                    error = null,
                )
            }
            try {
                val res = api.getChapterQuestions(category, subject, chapter, page = page, limit = 15)
                val progress = runCatching {
                    api.getPracticeProgress(category, listOf(chapter, subject))
                }.getOrNull()
                _state.update { st ->
                    val merged = if (reset) res.questions else st.questions + res.questions
                    val completed = progress?.completed?.toSet().orEmpty() + st.completedIds
                    val correct = progress?.correct?.toSet().orEmpty() + st.correctIds
                    val points = when {
                        reset && progress != null -> progress.points
                        else -> maxOf(st.points, progress?.points ?: 0)
                    }

                    val resumeIndex = if (reset && !didResume && merged.isNotEmpty()) {
                        val firstOpen = merged.indexOfFirst { it.id !in completed }
                        if (firstOpen >= 0) firstOpen else 0
                    } else {
                        if (reset) 0 else st.index.coerceAtMost((merged.size - 1).coerceAtLeast(0))
                    }
                    if (reset && merged.isNotEmpty()) didResume = true

                    val q = merged.getOrNull(resumeIndex)
                    val restored = restoreAttempt(q, completed, correct, st.selectedById)

                    st.copy(
                        loading = false,
                        loadingMore = false,
                        questions = merged,
                        page = page,
                        hasMore = res.hasMore,
                        totalCount = res.totalCount,
                        completedIds = completed,
                        correctIds = correct,
                        points = points,
                        error = if (merged.isEmpty()) (res.error ?: "No questions found") else null,
                        index = resumeIndex,
                        selected = if (reset) restored.selected else st.selected,
                        revealed = if (reset) restored.revealed else st.revealed,
                        lastCorrect = if (reset) restored.lastCorrect else st.lastCorrect,
                        showSolution = if (reset) false else st.showSolution,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, loadingMore = false, error = e.message ?: "Failed to load")
                }
            }
        }
    }

    fun selectOption(letter: String) {
        val st = _state.value
        if (st.revealed) return
        _state.update { it.copy(selected = letter) }
    }

    fun checkAnswer() {
        val st = _state.value
        val q = st.questions.getOrNull(st.index) ?: return
        val selected = st.selected ?: return
        if (q.id in st.completedIds) {
            applyRestored(q)
            return
        }
        val correctLetter = q.correct_option?.trim()?.uppercase()?.take(1)
        val isCorrect = correctLetter != null && selected.equals(correctLetter, ignoreCase = true)
        pendingEntries[q.id] = mapOf(
            "area" to category.lowercase(),
            "topic" to chapter,
            "correct" to isCorrect,
            "points" to if (isCorrect) 100 else 0,
        )
        _state.update {
            it.copy(
                revealed = true,
                lastCorrect = isCorrect,
                showSolution = false,
                completedIds = it.completedIds + q.id,
                correctIds = if (isCorrect) it.correctIds + q.id else it.correctIds - q.id,
                selectedById = it.selectedById + (q.id to selected),
                points = it.points + if (isCorrect) 100 else 0,
            )
        }
        flushProgress()
    }

    fun toggleSolution() {
        val st = _state.value
        if (!st.revealed) return
        _state.update { it.copy(showSolution = !it.showSolution) }
    }

    fun togglePalette() {
        _state.update { it.copy(paletteExpanded = !it.paletteExpanded) }
    }

    fun jumpTo(index: Int) {
        val st = _state.value
        if (index < 0 || index >= st.questions.size) return
        val q = st.questions[index]
        val restored = restoreAttempt(q, st.completedIds, st.correctIds, st.selectedById)
        _state.update {
            it.copy(
                index = index,
                selected = restored.selected,
                revealed = restored.revealed,
                lastCorrect = restored.lastCorrect,
                showSolution = false,
                saveHint = null,
            )
        }
        // Prefetch next page near the end (mirrors web goToLoaded)
        if (index >= st.questions.size - 3 && st.hasMore && !st.loadingMore) {
            load(page = st.page + 1, reset = false)
        }
    }

    fun jumpToFirstOpen() {
        val st = _state.value
        val idx = st.firstPendingIndex
        if (idx >= 0) jumpTo(idx)
    }

    fun next() {
        val st = _state.value
        val nextIndex = st.index + 1
        if (nextIndex >= st.questions.size) {
            if (st.hasMore) load(page = st.page + 1, reset = false)
            return
        }
        jumpTo(nextIndex)
    }

    fun prev() {
        val st = _state.value
        if (st.index <= 0) return
        jumpTo(st.index - 1)
    }

    private data class RestoredAttempt(
        val selected: String?,
        val revealed: Boolean,
        val lastCorrect: Boolean?,
    )

    private fun restoreAttempt(
        q: PracticeQuestion?,
        completed: Set<String>,
        correct: Set<String>,
        selectedById: Map<String, String>,
    ): RestoredAttempt {
        if (q == null) return RestoredAttempt(null, false, null)
        val done = q.id in completed
        if (!done) return RestoredAttempt(null, false, null)
        val wasCorrect = q.id in correct
        val remembered = selectedById[q.id]
        val correctLetter = q.correct_option?.trim()?.uppercase()?.take(1)
        val selected = remembered ?: if (wasCorrect) correctLetter else null
        return RestoredAttempt(selected, revealed = true, lastCorrect = wasCorrect)
    }

    private fun applyRestored(q: PracticeQuestion) {
        val st = _state.value
        val restored = restoreAttempt(q, st.completedIds, st.correctIds, st.selectedById)
        _state.update {
            it.copy(
                selected = restored.selected,
                revealed = restored.revealed,
                lastCorrect = restored.lastCorrect,
            )
        }
    }

    private fun flushProgress() {
        if (pendingEntries.isEmpty()) return
        if (!sessionStore.hasSessionCookie() && !sessionStore.signedInHint) {
            _state.update { it.copy(saveHint = "Sign in to sync practice progress") }
            return
        }
        val snapshot = pendingEntries.toMap()
        viewModelScope.launch {
            try {
                val res = api.savePracticeProgress(snapshot)
                if (res.success) pendingEntries.keys.removeAll(snapshot.keys)
                _state.update {
                    it.copy(saveHint = if (res.success) "Progress saved" else (res.error ?: "Save failed"))
                }
            } catch (e: Exception) {
                _state.update { it.copy(saveHint = e.message ?: "Could not save") }
            }
        }
    }

    companion object {
        fun factory(
            api: ApiClient,
            sessionStore: SessionStore,
            category: String,
            subject: String,
            chapter: String,
        ) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                PracticeViewModel(api, sessionStore, category, subject, chapter) as T
        }
    }
}
