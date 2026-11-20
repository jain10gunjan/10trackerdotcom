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
                _state.update {
                    it.copy(
                        loading = false,
                        exams = list,
                        error = if (res.success || list.isNotEmpty()) null else "Could not load exams",
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, error = e.message ?: "Failed to load exams") }
            }
        }
    }

    companion object {
        fun factory(api: ApiClient) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = ExamsViewModel(api) as T
        }
    }
}
