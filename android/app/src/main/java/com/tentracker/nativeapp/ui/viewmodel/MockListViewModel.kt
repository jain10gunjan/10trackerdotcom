package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.MockOfDayMock
import com.tentracker.nativeapp.data.MockTestSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MockListUiState(
    val loading: Boolean = true,
    val motd: MockOfDayMock? = null,
    val tests: List<MockTestSummary> = emptyList(),
    val error: String? = null,
)

class MockListViewModel(
    private val api: ApiClient,
    private val category: String,
) : ViewModel() {
    private val _state = MutableStateFlow(MockListUiState())
    val state: StateFlow<MockListUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val motd = runCatching { api.getMockOfDay(category).mockOfTheDay?.mock }.getOrNull()
                val catalog = runCatching { api.getMockTests(category) }.getOrDefault(emptyList())
                val motdId = motd?.id.orEmpty()
                val merged = buildList {
                    if (motd != null && motd.id.isNotBlank()) {
                        add(
                            MockTestSummary(
                                id = motd.id,
                                name = motd.name,
                                description = motd.description,
                                duration = motd.duration,
                                totalQuestions = motd.totalQuestions,
                                difficulty = motd.difficulty,
                                category = category,
                                isMockOfDay = true,
                            )
                        )
                    }
                    catalog
                        .filter { it.id.isNotBlank() && it.id != motdId }
                        .forEach { add(it.copy(isMockOfDay = false)) }
                }.distinctBy { it.id }

                _state.update {
                    it.copy(
                        loading = false,
                        motd = motd,
                        tests = merged,
                        error = if (merged.isEmpty()) "No mock tests published for this exam yet" else null,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message ?: "Failed to load mocks")
                }
            }
        }
    }

    companion object {
        fun factory(api: ApiClient, category: String) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                MockListViewModel(api, category) as T
        }
    }
}
