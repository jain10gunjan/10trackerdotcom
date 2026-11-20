package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.DashboardExamRef
import com.tentracker.nativeapp.data.SessionStore
import com.tentracker.nativeapp.data.UserDashboardResponse
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DashboardUiState(
    val loading: Boolean = false,
    val switchingExam: Boolean = false,
    val dashboard: UserDashboardResponse? = null,
    val focusExam: String = "",
    val heatmapRange: String = "12mo",
    val error: String? = null,
    val enabled: Boolean = true,
) {
    val initialLoading: Boolean get() = loading && dashboard == null
    val partialError: Boolean get() = error != null && dashboard != null
}

class DashboardViewModel(
    private val api: ApiClient,
    private val sessionStore: SessionStore,
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    private var loadJob: Job? = null

    fun setEnabled(enabled: Boolean) {
        _state.update { it.copy(enabled = enabled) }
        if (enabled && _state.value.dashboard == null && !_state.value.loading) {
            loadDashboard()
        }
    }

    fun loadDashboard(reason: String = "initial") {
        if (!_state.value.enabled) return
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            val hadData = _state.value.dashboard != null
            _state.update {
                it.copy(
                    loading = true,
                    switchingExam = hadData,
                    error = null,
                )
            }
            try {
                val focus = _state.value.focusExam
                val range = _state.value.heatmapRange
                val data = api.getUserDashboard(focusExam = focus, heatmapRange = range)
                if (!data.success) {
                    throw IllegalStateException(data.error ?: "Failed to load dashboard")
                }
                val nextRange = data.heatmap?.range ?: range
                _state.update {
                    it.copy(
                        loading = false,
                        switchingExam = false,
                        dashboard = data,
                        heatmapRange = nextRange,
                        error = null,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        loading = false,
                        switchingExam = false,
                        error = e.message ?: "Failed to load dashboard",
                    )
                }
            }
        }
    }

    fun reload() = loadDashboard(reason = "reload")

    fun changeFocusExam(slug: String) {
        val next = slug.trim().lowercase()
        if (next.isEmpty() || next == _state.value.focusExam) return
        _state.update { it.copy(focusExam = next) }
        loadDashboard(reason = "exam")
    }

    fun syncFocusFromDashboard() {
        val d = _state.value.dashboard ?: return
        val resolved = d.focusedExam?.slug?.takeIf { it.isNotBlank() }
            ?: d.primaryExam?.slug
            ?: ""
        if (resolved.isBlank()) return
        val current = _state.value.focusExam
        val allowed = d.examsPreparing.map { it.slug }.toSet()
        if (current.isNotEmpty() && allowed.contains(current)) return
        if (resolved != current) {
            _state.update { it.copy(focusExam = resolved) }
        }
    }

    fun changeHeatmapRange(nextRange: String) {
        val range = if (nextRange == "90d") "90d" else "12mo"
        if (range == _state.value.heatmapRange) return
        _state.update { st ->
            val grid = st.dashboard?.heatmapsByRange?.get(range)
            val patched = if (grid != null && st.dashboard != null) {
                st.dashboard.copy(heatmap = grid)
            } else {
                st.dashboard
            }
            st.copy(heatmapRange = range, dashboard = patched)
        }
        if (_state.value.dashboard?.heatmapsByRange?.get(range) == null) {
            loadDashboard(reason = "heatmap")
        }
    }

    fun filteredExamsPreparing(): List<DashboardExamRef> {
        val d = _state.value.dashboard ?: return emptyList()
        val list = d.examsPreparing
        val selected = d.profile?.target_exams?.map { it.trim().lowercase() }?.toSet().orEmpty()
        if (selected.isEmpty()) return list
        return list.filter { selected.contains(it.slug.lowercase()) }
    }

    fun reset() {
        loadJob?.cancel()
        _state.value = DashboardUiState(enabled = _state.value.enabled)
    }

    companion object {
        fun factory(api: ApiClient, sessionStore: SessionStore) =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return DashboardViewModel(api, sessionStore) as T
                }
            }
    }
}