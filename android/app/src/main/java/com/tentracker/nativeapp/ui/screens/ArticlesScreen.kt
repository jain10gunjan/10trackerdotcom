package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ArticleSummary
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.AmberCoin
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.util.absoluteSiteUrl
import com.tentracker.nativeapp.ui.viewmodel.ArticlesViewModel
import kotlinx.coroutines.flow.distinctUntilChanged

private val AccentFallback = Emerald

@Composable
fun ArticlesScreen(
    vm: ArticlesViewModel,
    onOpenArticle: (ArticleSummary) -> Unit,
) {
    val state by vm.state.collectAsState()
    val listState = rememberLazyListState()
    val hasFilters = state.selectedCategory != null || state.searchQuery.isNotBlank()

    LaunchedEffect(listState, state.hasMore, state.loadingMore) {
        snapshotFlow {
            val info = listState.layoutInfo
            val last = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= info.totalItemsCount - 3
        }.distinctUntilChanged().collect { nearEnd ->
            if (nearEnd) vm.loadMore()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(SurfaceMuted)) {
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Spacer(modifier = Modifier.height(12.dp))
                    UpdatesHeroCard(
                        title = state.selectedCategory?.replace('-', ' ')?.replaceFirstChar { it.uppercase() }
                            ?: "Stay exam-ready with the latest updates",
                        subtitle = if (state.selectedCategory != null) {
                            "Browse ${state.selectedCategory!!.replace('-', ' ')} articles and prep notes."
                        } else {
                            "Current affairs, exam alerts, and preparation notes — clear and searchable."
                        },
                        searchQuery = state.searchQuery,
                        onSearchChange = vm::setSearchQuery,
                        onSearch = { vm.submitSearch() },
                        totalCount = state.totalCount,
                        hasFilters = hasFilters,
                        onClearFilters = { vm.clearFilters() },
                    )
                }
            }

            if (state.categories.isNotEmpty()) {
                item {
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                "CATEGORIES",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Emerald,
                                letterSpacing = 1.sp,
                            )
                            if (hasFilters) {
                                TextButton(onClick = { vm.clearFilters() }) {
                                    Text("Clear filters", fontSize = 12.sp, color = Muted)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            CategoryChip(
                                label = "All",
                                active = state.selectedCategory == null,
                                onClick = { vm.setCategory(null) },
                            )
                            state.categories.forEach { slug ->
                                CategoryChip(
                                    label = slug.replace('-', ' ').replaceFirstChar { it.uppercase() },
                                    active = state.selectedCategory == slug,
                                    onClick = { vm.setCategory(slug) },
                                )
                            }
                        }
                    }
                }
            }

            when {
                state.loading && state.articles.isEmpty() -> {
                    item {
                        LoadingState(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            message = "Loading updates…",
                        )
                    }
                }
                state.error != null && state.articles.isEmpty() -> {
                    item {
                        ErrorState(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            message = state.error ?: "Could not load updates",
                            onRetry = { vm.refresh() },
                        )
                    }
                }
                state.articles.isEmpty() -> {
                    item {
                        EmptyState(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            message = if (hasFilters) "No updates match your filters." else "No updates yet.",
                            actionLabel = if (hasFilters) "Clear filters" else "Retry",
                            onAction = {
                                if (hasFilters) vm.clearFilters() else vm.refresh()
                            },
                        )
                    }
                }
                else -> {
                    state.featuredArticle?.let { featured ->
                        item {
                            Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                                FeaturedArticleCard(
                                    article = featured,
                                    onClick = { onOpenArticle(featured) },
                                )
                            }
                        }
                    }
                    items(state.gridArticles, key = { it.id }) { article ->
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            ArticleListCard(article = article, onClick = { onOpenArticle(article) })
                        }
                    }
                    if (state.loadingMore) {
                        item {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                contentAlignment = Alignment.Center,
                            ) {
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
private fun UpdatesHeroCard(
    title: String,
    subtitle: String,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    totalCount: Int,
    hasFilters: Boolean,
    onClearFilters: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(EmeraldSoft)
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("10Tracker · News & updates", fontSize = 12.sp, color = EmeraldDark, fontWeight = FontWeight.Medium)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Ink)
            Spacer(modifier = Modifier.height(6.dp))
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = Muted)
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("Search updates…", color = Muted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Muted) },
                shape = RoundedCornerShape(12.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { onSearch() }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Emerald,
                    unfocusedBorderColor = Border,
                ),
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "$totalCount ${if (totalCount == 1) "article" else "articles"}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Ink,
                )
                if (hasFilters) {
                    Spacer(modifier = Modifier.width(12.dp))
                    TextButton(onClick = onClearFilters) {
                        Text("Clear", color = EmeraldDark, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun CategoryChip(label: String, active: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(12.dp)
    Box(
        modifier = Modifier
            .clip(shape)
            .clickable(onClick = onClick)
            .background(if (active) Ink else Color.White)
            .border(1.dp, if (active) Ink else Border, shape)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(label, color = if (active) Color.White else Ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
    }
}

@Composable
private fun FeaturedArticleCard(article: ArticleSummary, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column {
            ArticleHeroImage(article = article, modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f))
            Column(modifier = Modifier.padding(16.dp)) {
                ArticleMetaRow(article = article, showFeaturedBadge = true)
                Spacer(modifier = Modifier.height(8.dp))
                Text(article.title, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Ink, maxLines = 3)
                article.excerpt?.takeIf { it.isNotBlank() }?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = Muted, maxLines = 3)
                }
                Spacer(modifier = Modifier.height(12.dp))
                ReadLink()
            }
        }
    }
}

@Composable
private fun ArticleListCard(article: ArticleSummary, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column {
            Box {
                ArticleHeroImage(article = article, modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f))
                if (article.is_featured) {
                    Row(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(12.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.White.copy(alpha = 0.95f))
                            .border(1.dp, Color(0xFFFEF3C7), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = AmberCoin, modifier = Modifier.size(12.dp))
                        Text("FEATURED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                    }
                }
            }
            Column(modifier = Modifier.padding(16.dp)) {
                ArticleMetaRow(article = article, showFeaturedBadge = false)
                Spacer(modifier = Modifier.height(6.dp))
                Text(article.title, fontWeight = FontWeight.SemiBold, fontSize = 17.sp, color = Ink, maxLines = 2)
                article.excerpt?.takeIf { it.isNotBlank() }?.let {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = Muted, maxLines = 2)
                }
                Spacer(modifier = Modifier.height(12.dp))
                ReadLink(label = "Read")
            }
        }
    }
}

@Composable
private fun ArticleHeroImage(article: ArticleSummary, modifier: Modifier = Modifier) {
    val imageUrl = absoluteSiteUrl(article.featured_image_url)
    if (imageUrl != null) {
        AsyncImage(
            model = imageUrl,
            contentDescription = null,
            modifier = modifier.clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)),
            contentScale = ContentScale.Crop,
        )
    } else {
        Box(
            modifier = modifier.background(AccentFallback),
            contentAlignment = Alignment.Center,
        ) {
            Text("10Tracker", color = Color.White.copy(alpha = 0.9f), fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun ArticleMetaRow(article: ArticleSummary, showFeaturedBadge: Boolean) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (showFeaturedBadge && article.is_featured) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFFFFBEB))
                    .border(1.dp, Color(0xFFFEF3C7), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            ) {
                Icon(Icons.Default.Star, contentDescription = null, tint = AmberCoin, modifier = Modifier.size(12.dp))
                Text("Featured", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF92400E))
            }
        }
        article.category?.takeIf { it.isNotBlank() }?.let { cat ->
            Text(
                cat.replace('-', ' ').replaceFirstChar { it.uppercase() },
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = EmeraldDark,
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(EmeraldSoft)
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                    .padding(horizontal = 8.dp, vertical = 3.dp),
            )
        }
        formatArticleDate(article.created_at).takeIf { it.isNotBlank() }?.let { date ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Muted, modifier = Modifier.size(14.dp))
                Text(date, fontSize = 12.sp, color = Muted)
            }
        }
    }
}

@Composable
private fun ReadLink(label: String = "Read article") {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, color = EmeraldDark, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(16.dp))
    }
}

private fun formatArticleDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    val datePart = iso.take(10)
    val parts = datePart.split("-")
    if (parts.size != 3) return datePart
    val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    val monthIdx = parts[1].toIntOrNull()?.minus(1) ?: return datePart
    val month = months.getOrElse(monthIdx) { parts[1] }
    val day = parts[2].toIntOrNull()?.toString() ?: parts[2]
    return "$day $month ${parts[0]}"
}