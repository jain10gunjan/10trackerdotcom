package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.MockAttemptQuestion
import com.tentracker.nativeapp.data.MockTestSummary
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class MockAttemptResult(
    val attempted: Int = 0,
    val correct: Int = 0,
    val incorrect: Int = 0,
    val skipped: Int = 0,
    val total: Int = 0,
    val percent: Int = 0,
    val secondsUsed: Int = 0,
)

data class MockAttemptUiState(
    val loading: Boolean = true,
    val test: MockTestSummary? = null,
    val questions: List<MockAttemptQuestion> = emptyList(),
    val index: Int = 0,
    val answers: Map<String, String> = emptyMap(),
    val started: Boolean = false,
    val submitted: Boolean = false,
    val result: MockAttemptResult? = null,
    val secondsRemaining: Int? = null,
    val secondsElapsed: Int = 0,
    val error: String? = null,
    val submitHint: String? = null,
)

class MockAttemptViewModel(
    private val api: ApiClient,
    private val category: String,
    private val testId: String,
    private val seedDurationMinutes: Int = 0,
    private val seedName: String = "",
) : ViewModel() {
    private val _state = MutableStateFlow(MockAttemptUiState())
    val state: StateFlow<MockAttemptUiState> = _state.asStateFlow()

    private var timerJob: Job? = null

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val detail = runCatching { api.getMockTest(testId).test }.getOrNull()
                val questionsRes = api.getMockTestQuestions(testId)
                val questions = questionsRes.questions
                if (questions.isEmpty()) {
                    _state.update {
                        it.copy(
                            loading = false,
                            error = questionsRes.error ?: "No questions available for this mock",
                        )
                    }
                    return@launch
                }
                val test = detail ?: MockTestSummary(
                    id = testId,
                    name = seedName.ifBlank { "Mock test" },
                    duration = seedDurationMinutes,
                    totalQuestions = questions.size,
                )
                val durationMin = test.duration.takeIf { it > 0 } ?: seedDurationMinutes
                _state.update {
                    it.copy(
                        loading = false,
                        test = test.copy(
                            duration = durationMin,
                            totalQuestions = test.totalQuestions.takeIf { q -> q > 0 } ?: questions.size,
                        ),
                        questions = questions,
                        secondsRemaining = if (durationMin > 0) durationMin * 60 else null,
                        error = null,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message ?: "Failed to load mock")
                }
            }
        }
    }

    fun start() {
        val st = _state.value
        if (st.started || st.questions.isEmpty()) return
        _state.update { it.copy(started = true, secondsElapsed = 0) }
        startTimer()
    }

    fun selectOption(letter: String) {
        val st = _state.value
        if (!st.started || st.submitted) return
        val q = st.questions.getOrNull(st.index) ?: return
        _state.update { it.copy(answers = it.answers + (q.id to letter.uppercase())) }
    }

    fun next() {
        val st = _state.value
        if (st.index >= st.questions.lastIndex) return
        _state.update { it.copy(index = st.index + 1) }
    }

    fun prev() {
        val st = _state.value
        if (st.index <= 0) return
        _state.update { it.copy(index = st.index - 1) }
    }

    fun goTo(index: Int) {
        val st = _state.value
        if (index !in st.questions.indices) return
        _state.update { it.copy(index = index) }
    }

    fun submit(auto: Boolean = false) {
        val st = _state.value
        if (st.submitted || st.questions.isEmpty()) return
        timerJob?.cancel()

        var correct = 0
        var incorrect = 0
        var attempted = 0
        st.questions.forEach { q ->
            val ans = st.answers[q.id]
            if (ans.isNullOrBlank()) return@forEach
            attempted++
            val key = q.correct_option?.trim()?.uppercase()?.take(1)
            if (key != null && ans.equals(key, ignoreCase = true)) correct++ else incorrect++
        }
        val skipped = st.questions.size - attempted
        val percent = if (st.questions.isEmpty()) 0 else (correct * 100) / st.questions.size
        val result = MockAttemptResult(
            attempted = attempted,
            correct = correct,
            incorrect = incorrect,
            skipped = skipped,
            total = st.questions.size,
            percent = percent,
            secondsUsed = st.secondsElapsed,
        )

        _state.update {
            it.copy(
                submitted = true,
                result = result,
                submitHint = if (auto) {
                    "Time up — scored locally. Open the web attempt to sync official results."
                } else {
                    "Scored locally. Server submit is web-only (auth + credits); use Custom Tabs to save."
                },
            )
        }

        viewModelScope.launch {
            runCatching {
                api.submitMockTestLegacy(
                    mapOf(
                        "testId" to testId,
                        "category" to category,
                        "answers" to st.answers,
                    )
                )
            }.onSuccess { res ->
                if (res.deprecated || !res.success) {
                    _state.update { cur ->
                        cur.copy(
                            submitHint = (res.error ?: cur.submitHint)
                                ?: "Submit via web to persist your attempt",
                        )
                    }
                }
            }
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                val cur = _state.value
                if (!cur.started || cur.submitted) break
                val nextElapsed = cur.secondsElapsed + 1
                val nextRemaining = cur.secondsRemaining?.minus(1)
                when {
                    nextRemaining != null && nextRemaining <= 0 -> {
                        _state.update {
                            it.copy(secondsElapsed = nextElapsed, secondsRemaining = 0)
                        }
                        submit(auto = true)
                        break
                    }
                    else -> _state.update {
                        it.copy(
                            secondsElapsed = nextElapsed,
                            secondsRemaining = nextRemaining,
                        )
                    }
                }
            }
        }
    }

    override fun onCleared() {
        timerJob?.cancel()
        super.onCleared()
    }

    companion object {
        fun factory(
            api: ApiClient,
            category: String,
            testId: String,
            durationMinutes: Int = 0,
            name: String = "",
        ) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                MockAttemptViewModel(api, category, testId, durationMinutes, name) as T
        }
    }
}
