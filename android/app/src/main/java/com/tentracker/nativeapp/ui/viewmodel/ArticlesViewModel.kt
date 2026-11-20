package com.tentracker.nativeapp.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ArticleSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ArticlesUiState(
    val loading: Boolean = true,
    val loadingMore: Boolean = false,
    val articles: List<ArticleSummary> = emptyList(),
    val page: Int = 1,
    val hasMore: Boolean = false,
    val error: String? = null,
)

class ArticlesViewModel(private val api: ApiClient) : ViewModel() {
    private val _state = MutableStateFlow(ArticlesUiState())
    val state: StateFlow<ArticlesUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() = load(page = 1, reset = true)

    fun loadMore() {
        val st = _state.value
        if (st.loadingMore || !st.hasMore) return
        load(page = st.page + 1, reset = false)
    }

    private fun load(page: Int, reset: Boolean) {
        viewModelScope.launch {
            _state.update {
                it.copy(loading = reset, loadingMore = !reset, error = null)
            }
            try {
                val res = api.getArticles(page = page, limit = 20)
                _state.update { st ->
                    st.copy(
                        loading = false,
                        loadingMore = false,
                        articles = if (reset) res.data else st.articles + res.data,
                        page = page,
                        hasMore = res.pagination?.hasMore == true,
                        error = if (res.data.isEmpty() && reset) "No updates yet" else null,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, loadingMore = false, error = e.message ?: "Failed to load")
                }
            }
        }
    }

    companion object {
        fun factory(api: ApiClient) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = ArticlesViewModel(api) as T
        }
    }
}
