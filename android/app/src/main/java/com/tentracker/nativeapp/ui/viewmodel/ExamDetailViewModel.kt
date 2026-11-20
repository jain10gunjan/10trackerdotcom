package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ExamHubContinue
import com.tentracker.nativeapp.data.ExamHubSubjectProgress
import com.tentracker.nativeapp.data.MockLeaderboardTest
import com.tentracker.nativeapp.data.MockOfDayMock
import com.tentracker.nativeapp.data.SubjectGroup
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ExamDetailUiState(
    val loading: Boolean = true,
    val subjects: List<SubjectGroup> = emptyList(),
    val mock: MockOfDayMock? = null,
    val exam: ActiveExam? = null,
    val error: String? = null,
    val isSignedIn: Boolean = false,
    val mockTestCount: Int = 0,
    val topicMockCount: Int = 0,
    val dailyPracticeCount: Int = 0,
    val progressLoading: Boolean = false,
    val overallPercent: Int = 0,
    val progressSubjects: List<ExamHubSubjectProgress> = emptyList(),
    val continueItem: ExamHubContinue? = null,
)

class ExamDetailViewModel(
    private val api: ApiClient,
    private val category: String,
) : ViewModel() {
    private val _state = MutableStateFlow(ExamDetailUiState())
    val state: StateFlow<ExamDetailUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val subjects = api.getSubjects(category)
                val mock = runCatching { api.getMockOfDay(category).mockOfTheDay?.mock }.getOrNull()
                val exam = runCatching {
                    api.getActiveExams().exams.firstOrNull {
                        it.slug.equals(category, ignoreCase = true)
                    }
                }.getOrNull()
                val session = runCatching { api.getAuthSession() }.getOrNull()
                val isSignedIn = !session?.user?.email.isNullOrBlank()

                val leaderboardTests = runCatching { api.getMockLeaderboard(category).tests }.getOrDefault(emptyList())
                val mockTestCount = leaderboardTests.size
                    .takeIf { it > 0 }
                    ?: runCatching { api.getMockTests(category).size }.getOrDefault(0)
                val topicMockCount = leaderboardTests.count { it.isTopicWiseTest() }
                val dailyPracticeCount = runCatching { api.getDailyPracticeSetCount(category) }.getOrDefault(0)

                val subjectList = subjects.subjectsData
                _state.update {
                    it.copy(
                        loading = false,
                        subjects = subjectList,
                        mock = mock,
                        exam = exam,
                        isSignedIn = isSignedIn,
                        mockTestCount = mockTestCount,
                        topicMockCount = topicMockCount,
                        dailyPracticeCount = dailyPracticeCount,
                        error = null,
                    )
                }
                if (isSignedIn) {
                    loadHubProgress()
                } else {
                    _state.update {
                        it.copy(
                            progressLoading = false,
                            overallPercent = 0,
                            progressSubjects = emptyList(),
                            continueItem = null,
                        )
                    }
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Failed to load") }
            }
        }
    }

    private suspend fun loadHubProgress() {
        _state.update { it.copy(progressLoading = true) }
        val progress = runCatching { api.getExamHubProgress(category) }.getOrNull()
        _state.update {
            it.copy(
                progressLoading = false,
                overallPercent = progress?.overallPercent ?: 0,
                progressSubjects = progress?.subjects.orEmpty(),
                continueItem = progress?.continueItem,
            )
        }
    }

    companion object {
        fun factory(api: ApiClient, category: String) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                ExamDetailViewModel(api, category) as T
        }
    }
}

private fun MockLeaderboardTest.isTopicWiseTest(): Boolean {
    val mode = creation_mode?.trim()?.lowercase().orEmpty()
    if (mode.contains("motd")) return false
    if (mode == "topic_auto" || mode == "topic_wise" || mode.contains("topic")) return true
    val desc = description?.trim()?.lowercase().orEmpty()
    if (desc.startsWith("topic-wise test") || desc.contains("topic-wise test")) return true
    val nameL = name.trim().lowercase()
    return nameL.contains("topic test") || nameL.contains("topic-wise")
}