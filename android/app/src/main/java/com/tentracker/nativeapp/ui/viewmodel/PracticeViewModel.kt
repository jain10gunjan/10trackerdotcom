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
    val completedIds: Set<String> = emptySet(),
    val correctIds: Set<String> = emptySet(),
    val hasMore: Boolean = false,
    val page: Int = 1,
    val totalCount: Int = 0,
    val error: String? = null,
    val saveHint: String? = null,
)

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
                    st.copy(
                        loading = false,
                        loadingMore = false,
                        questions = merged,
                        page = page,
                        hasMore = res.hasMore,
                        totalCount = res.totalCount,
                        completedIds = progress?.completed?.toSet().orEmpty() + st.completedIds,
                        correctIds = progress?.correct?.toSet().orEmpty() + st.correctIds,
                        error = if (merged.isEmpty()) (res.error ?: "No questions found") else null,
                        index = if (reset) 0 else st.index.coerceAtMost((merged.size - 1).coerceAtLeast(0)),
                        selected = if (reset) null else st.selected,
                        revealed = if (reset) false else st.revealed,
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
                completedIds = it.completedIds + q.id,
                correctIds = if (isCorrect) it.correctIds + q.id else it.correctIds,
            )
        }
        flushProgress()
    }

    fun next() {
        val st = _state.value
        val nextIndex = st.index + 1
        if (nextIndex >= st.questions.size) {
            if (st.hasMore) load(page = st.page + 1, reset = false)
            return
        }
        _state.update { it.copy(index = nextIndex, selected = null, revealed = false, saveHint = null) }
    }

    fun prev() {
        val st = _state.value
        if (st.index <= 0) return
        _state.update { it.copy(index = st.index - 1, selected = null, revealed = false) }
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
