package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.RoadmapDetailResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class RoadmapDetailUiState(
    val loading: Boolean = true,
    val detail: RoadmapDetailResponse? = null,
    val error: String? = null,
)

class RoadmapDetailViewModel(
    private val api: ApiClient,
    private val slug: String,
) : ViewModel() {
    private val _state = MutableStateFlow(RoadmapDetailUiState())
    val state: StateFlow<RoadmapDetailUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val res = api.getRoadmap(slug)
                _state.update {
                    it.copy(
                        loading = false,
                        detail = res.takeIf { r -> r.success && r.roadmap != null },
                        error = when {
                            res.success && res.roadmap != null -> null
                            !res.setupHint.isNullOrBlank() -> res.setupHint
                            else -> res.error ?: "Roadmap not found"
                        },
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message ?: "Failed to load roadmap")
                }
            }
        }
    }

    companion object {
        fun factory(api: ApiClient, slug: String) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                RoadmapDetailViewModel(api, slug) as T
        }
    }
}
