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
    val totalCount: Int = 0,
    val categories: List<String> = emptyList(),
    val selectedCategory: String? = null,
    val searchQuery: String = "",
    val error: String? = null,
) {
    val filteredArticles: List<ArticleSummary>
        get() = articles

    val featuredArticle: ArticleSummary?
        get() {
            if (page != 1 || selectedCategory != null || searchQuery.isNotBlank()) return null
            return articles.firstOrNull { it.is_featured } ?: articles.firstOrNull()
        }

    val gridArticles: List<ArticleSummary>
        get() {
            val featured = featuredArticle ?: return articles
            return articles.filter { it.id != featured.id }
        }
}

class ArticlesViewModel(private val api: ApiClient) : ViewModel() {
    private val _state = MutableStateFlow(ArticlesUiState())
    val state: StateFlow<ArticlesUiState> = _state.asStateFlow()

    private val knownCategories = linkedSetOf<String>()

    init {
        refresh()
    }

    fun refresh() = load(page = 1, reset = true)

    fun loadMore() {
        val st = _state.value
        if (st.loadingMore || !st.hasMore) return
        load(page = st.page + 1, reset = false)
    }

    fun setCategory(category: String?) {
        val slug = category?.takeIf { it.isNotBlank() }
        if (_state.value.selectedCategory == slug) return
        _state.update { it.copy(selectedCategory = slug) }
        refresh()
    }

    fun setSearchQuery(query: String) {
        _state.update { it.copy(searchQuery = query) }
    }

    fun submitSearch() {
        refresh()
    }

    fun clearFilters() {
        _state.update { it.copy(selectedCategory = null, searchQuery = "") }
        refresh()
    }

    private fun load(page: Int, reset: Boolean) {
        viewModelScope.launch {
            val querySnapshot = _state.value
            _state.update {
                it.copy(loading = reset, loadingMore = !reset, error = null)
            }
            try {
                val res = api.getArticles(
                    page = page,
                    limit = 20,
                    category = querySnapshot.selectedCategory,
                    query = querySnapshot.searchQuery.takeIf { it.isNotBlank() },
                )
                res.data.forEach { article ->
                    article.category?.takeIf { c -> c.isNotBlank() }?.let { knownCategories.add(it) }
                }
                val mergedArticles = if (reset) res.data else querySnapshot.articles + res.data
                mergedArticles.forEach { article ->
                    article.category?.takeIf { c -> c.isNotBlank() }?.let { knownCategories.add(it) }
                }
                _state.update { current ->
                    current.copy(
                        loading = false,
                        loadingMore = false,
                        articles = mergedArticles,
                        page = page,
                        hasMore = res.pagination?.hasMore == true,
                        totalCount = res.pagination?.totalCount ?: mergedArticles.size,
                        categories = knownCategories.sorted(),
                        error = null,
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