package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ExamCategory
import com.tentracker.nativeapp.data.OgCatalogResponse
import com.tentracker.nativeapp.data.RoadmapSummary
import com.tentracker.nativeapp.data.SessionStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val catalog: OgCatalogResponse? = null,
    val exams: List<ExamCategory> = emptyList(),
    val activeExams: List<ActiveExam> = emptyList(),
    val roadmaps: List<RoadmapSummary> = emptyList(),
    val error: String? = null,
    val signedIn: Boolean = false,
)

class HomeViewModel(
    private val api: ApiClient,
    private val sessionStore: SessionStore,
) : ViewModel() {

    private val _state = MutableStateFlow(
        HomeUiState(signedIn = sessionStore.hasSessionCookie() || sessionStore.signedInHint)
    )
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh(silent: Boolean = false) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    loading = !silent && it.catalog == null,
                    refreshing = silent,
                    error = null,
                    signedIn = sessionStore.hasSessionCookie() || sessionStore.signedInHint,
                )
            }
            try {
                val catalog = api.getOgCatalog()
                val exams = runCatching { api.getExamCategories() }.getOrNull()
                val active = runCatching { api.getActiveExams() }.getOrNull()
                val roadmaps = runCatching { api.getRoadmaps(limit = 12, sort = "featured") }.getOrNull()
                val activeList = active?.exams.orEmpty().filter { it.active || it.is_active }
                _state.update {
                    it.copy(
                        loading = false,
                        refreshing = false,
                        catalog = catalog,
                        exams = exams?.data.orEmpty(),
                        activeExams = activeList,
                        roadmaps = roadmaps?.roadmaps.orEmpty(),
                        error = if (catalog.success) null else (catalog.error ?: catalog.setupHint),
                        signedIn = sessionStore.hasSessionCookie() || sessionStore.signedInHint,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        loading = false,
                        refreshing = false,
                        error = e.message ?: "Failed to load",
                    )
                }
            }
        }
    }

    companion object {
        fun factory(api: ApiClient, sessionStore: SessionStore) =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeViewModel(api, sessionStore) as T
                }
            }
    }
}
