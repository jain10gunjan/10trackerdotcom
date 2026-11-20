package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ArticleSummary
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ArticlesViewModel
import kotlinx.coroutines.flow.distinctUntilChanged

@Composable
fun ArticlesScreen(
    vm: ArticlesViewModel,
    onOpenArticle: (ArticleSummary) -> Unit,
) {
    val state by vm.state.collectAsState()
    val listState = rememberLazyListState()

    LaunchedEffect(listState, state.hasMore, state.loadingMore) {
        snapshotFlow {
            val info = listState.layoutInfo
            val last = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= info.totalItemsCount - 3
        }.distinctUntilChanged().collect { nearEnd ->
            if (nearEnd) vm.loadMore()
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Spacer(modifier = Modifier.height(12.dp))
        Text("Updates", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
        Text("Articles & current affairs from 10tracker.", style = MaterialTheme.typography.bodyMedium, color = Muted)
        Spacer(modifier = Modifier.height(12.dp))

        when {
            state.loading && state.articles.isEmpty() -> {
                LoadingState(message = "Loading updates…")
            }
            state.error != null && state.articles.isEmpty() -> {
                ErrorState(
                    message = state.error ?: "Could not load updates",
                    onRetry = { vm.refresh() },
                )
            }
            state.articles.isEmpty() -> {
                EmptyState(
                    message = "No updates yet.",
                    actionLabel = "Retry",
                    onAction = { vm.refresh() },
                )
            }
            else -> {
                LazyColumn(
                    state = listState,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 24.dp),
                ) {
                    items(state.articles, key = { it.id }) { article ->
                        ArticleCard(article = article, onClick = { onOpenArticle(article) })
                    }
                    if (state.loadingMore) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = Brand, modifier = Modifier.size(28.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ArticleCard(article: ArticleSummary, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(modifier = Modifier.padding(12.dp)) {
            if (!article.featured_image_url.isNullOrBlank()) {
                AsyncImage(
                    model = article.featured_image_url,
                    contentDescription = null,
                    modifier = Modifier.size(72.dp).clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop,
                )
                Spacer(modifier = Modifier.width(12.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                article.category?.let {
                    Text(it.replace('-', ' '), style = MaterialTheme.typography.labelSmall, color = Brand)
                }
                Text(article.title, fontWeight = FontWeight.SemiBold, color = Ink, maxLines = 2)
                if (!article.excerpt.isNullOrBlank()) {
                    Text(article.excerpt!!, style = MaterialTheme.typography.bodyMedium, maxLines = 2)
                }
            }
        }
    }
}
