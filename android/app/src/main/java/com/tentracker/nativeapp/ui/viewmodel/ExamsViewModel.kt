package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ExamsUiState(
    val loading: Boolean = true,
    val exams: List<ActiveExam> = emptyList(),
    val filtered: List<ActiveExam> = emptyList(),
    val categories: List<String> = listOf("All"),
    val selectedCategory: String = "All",
    val searchQuery: String = "",
    val sortBy: String = "popular",
    val totalQuestions: Int = 0,
    val error: String? = null,
)

class ExamsViewModel(private val api: ApiClient) : ViewModel() {
    private val _state = MutableStateFlow(ExamsUiState())
    val state: StateFlow<ExamsUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val res = api.getActiveExams()
                val list = res.exams.filter { it.active || it.is_active }
                val categories = listOf("All") + list
                    .map { it.category?.takeIf { c -> c.isNotBlank() } ?: "Other" }
                    .distinct()
                    .sorted()
                val totalQuestions = list.sumOf { questionCount(it) }
                _state.update { current ->
                    val next = current.copy(
                        loading = false,
                        exams = list,
                        categories = categories,
                        totalQuestions = totalQuestions,
                        error = if (res.success || list.isNotEmpty()) null else "Could not load exams",
                    )
                    next.copy(filtered = applyFilters(next))
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Failed to load exams") }
            }
        }
    }

    fun setSearch(query: String) {
        _state.update { current ->
            val next = current.copy(searchQuery = query)
            next.copy(filtered = applyFilters(next))
        }
    }

    fun setCategory(category: String) {
        _state.update { current ->
            val next = current.copy(selectedCategory = category)
            next.copy(filtered = applyFilters(next))
        }
    }

    fun setSort(sortBy: String) {
        _state.update { current ->
            val next = current.copy(sortBy = sortBy)
            next.copy(filtered = applyFilters(next))
        }
    }

    fun resetFilters() {
        _state.update { current ->
            val next = current.copy(searchQuery = "", selectedCategory = "All", sortBy = "popular")
            next.copy(filtered = applyFilters(next))
        }
    }

    private fun applyFilters(state: ExamsUiState): List<ActiveExam> {
        val q = state.searchQuery.trim().lowercase()
        val filtered = state.exams.filter { exam ->
            val category = exam.category?.takeIf { it.isNotBlank() } ?: "Other"
            val categoryOk = state.selectedCategory == "All" || category == state.selectedCategory
            val searchOk = q.isEmpty() || listOf(
                exam.name,
                exam.slug,
                exam.description.orEmpty(),
                category,
            ).any { it.lowercase().contains(q) }
            categoryOk && searchOk
        }
        return when (state.sortBy) {
            "name" -> filtered.sortedBy { it.name.lowercase() }
            "questions" -> filtered.sortedByDescending { questionCount(it) }
            else -> filtered.sortedByDescending { questionCount(it) }
        }
    }

    companion object {
        fun questionCount(exam: ActiveExam): Int =
            exam.question_count.takeIf { it > 0 } ?: exam.count

        fun factory(api: ApiClient) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = ExamsViewModel(api) as T
        }
    }
}
