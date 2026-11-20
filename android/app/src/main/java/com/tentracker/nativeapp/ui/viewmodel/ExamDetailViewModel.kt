package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.ApiClient
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
                val subjectList = subjects.subjectsData
                _state.update {
                    it.copy(
                        loading = false,
                        subjects = subjectList,
                        mock = mock,
                        exam = exam,
                        error = if (subjectList.isEmpty() && mock == null) {
                            "No subjects yet for this exam"
                        } else {
                            null
                        },
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Failed to load") }
            }
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
