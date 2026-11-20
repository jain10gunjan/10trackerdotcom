package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.RoadmapSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class RoadmapsUiState(
    val loading: Boolean = true,
    val roadmaps: List<RoadmapSummary> = emptyList(),
    val filtered: List<RoadmapSummary> = emptyList(),
    val categories: List<String> = listOf("All"),
    val selectedCategory: String = "All",
    val searchQuery: String = "",
    val disclaimer: String? = null,
    val error: String? = null,
)

class RoadmapsViewModel(private val api: ApiClient) : ViewModel() {
    private val _state = MutableStateFlow(RoadmapsUiState())
    val state: StateFlow<RoadmapsUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val res = api.getRoadmaps()
                val list = res.roadmaps
                val categories = listOf("All") + list
                    .map { it.examLabel?.takeIf { label -> label.isNotBlank() } ?: "General" }
                    .distinct()
                    .sorted()
                _state.update { current ->
                    val next = current.copy(
                        loading = false,
                        roadmaps = list,
                        categories = categories,
                        disclaimer = res.disclaimer,
                        error = when {
                            res.success || list.isNotEmpty() -> null
                            !res.setupHint.isNullOrBlank() -> res.setupHint
                            else -> res.error ?: "Could not load roadmaps"
                        },
                    )
                    next.copy(filtered = applyFilters(next))
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message ?: "Failed to load roadmaps")
                }
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

    private fun applyFilters(state: RoadmapsUiState): List<RoadmapSummary> {
        val q = state.searchQuery.trim().lowercase()
        return state.roadmaps.filter { roadmap ->
            val label = roadmap.examLabel?.takeIf { it.isNotBlank() } ?: "General"
            val categoryOk = state.selectedCategory == "All" || label == state.selectedCategory
            val searchOk = q.isEmpty() || listOf(
                roadmap.title,
                roadmap.slug,
                roadmap.description.orEmpty(),
                label,
            ).any { it.lowercase().contains(q) }
            categoryOk && searchOk
        }
    }

    companion object {
        fun factory(api: ApiClient) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = RoadmapsViewModel(api) as T
        }
    }
}
