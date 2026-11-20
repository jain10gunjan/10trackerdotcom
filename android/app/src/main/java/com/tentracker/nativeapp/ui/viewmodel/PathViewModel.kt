package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.OgPathDetailResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PathUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val detail: OgPathDetailResponse? = null,
    val error: String? = null,
)

class PathViewModel(
    private val api: ApiClient,
    private val slug: String,
) : ViewModel() {

    private val _state = MutableStateFlow(PathUiState())
    val state: StateFlow<PathUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh(sync: Boolean = false, silent: Boolean = false) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    loading = !silent && it.detail == null,
                    refreshing = silent || sync,
                    error = null,
                )
            }
            try {
                val detail = api.getPath(slug, sync = sync)
                _state.update {
                    it.copy(
                        loading = false,
                        refreshing = false,
                        detail = detail,
                        error = if (detail.success) null else (detail.error ?: detail.setupHint),
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        loading = false,
                        refreshing = false,
                        error = e.message ?: "Failed to load path",
                    )
                }
            }
        }
    }

    companion object {
        fun factory(api: ApiClient, slug: String) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return PathViewModel(api, slug) as T
            }
        }
    }
}
