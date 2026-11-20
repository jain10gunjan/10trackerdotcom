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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
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
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val AccentFallback = Emerald
private val Neutral600 = Color(0xFF525252)
private val VioletGlow = Color(0xFFC4B5FD)

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
                    Spacer(modifier = Modifier.height(8.dp))
                    UpdatesHeroCard(
                        title = state.selectedCategory?.replace('-', ' ')?.replaceFirstChar { it.uppercase() }
                            ?: "Stay exam-ready with the latest updates",
                        subtitle = if (state.selectedCategory != null) {
                            "Browse ${state.selectedCategory!!.replace('-', ' ')} articles, alerts, and prep notes."
                        } else {
                            "Current affairs, exam alerts, admit cards, and preparation notes — clear and searchable."
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
                                "Categories",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Emerald,
                                letterSpacing = 0.5.sp,
                                fontSize = 12.sp,
                            )
                            if (hasFilters) {
                                TextButton(onClick = { vm.clearFilters() }) {
                                    Icon(Icons.Default.Close, contentDescription = null, tint = Muted, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Clear filters", fontSize = 12.sp, color = Muted, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
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
        Box(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 40.dp, y = (-48).dp)
                    .size(200.dp)
                    .blur(80.dp)
                    .background(Color(0xFFA7F3D0).copy(alpha = 0.35f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = (-40).dp, y = 48.dp)
                    .size(200.dp)
                    .blur(80.dp)
                    .background(VioletGlow.copy(alpha = 0.2f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White,
                                Color.White,
                                Color(0xFFFAFAFA).copy(alpha = 0.9f),
                            ),
                        ),
                    ),
            )

            Column(modifier = Modifier.padding(24.dp)) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(EmeraldSoft.copy(alpha = 0.8f))
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald, modifier = Modifier.size(14.dp))
                    Text(
                        "10Tracker · News & updates",
                        fontSize = 12.sp,
                        color = EmeraldDark,
                        fontWeight = FontWeight.Medium,
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    title,
                    fontSize = 30.sp,
                    lineHeight = 34.sp,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = Neutral600, lineHeight = 22.sp)
                Spacer(modifier = Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = onSearchChange,
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        placeholder = { Text("Search updates…", color = Muted) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Muted) },
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { onSearch() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF6EE7B7),
                            unfocusedBorderColor = Border,
                        ),
                    )
                    Button(
                        onClick = onSearch,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Ink, contentColor = Color.White),
                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 14.dp),
                    ) {
                        Text("Search", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "${"%,d".format(Locale.US, totalCount)} ${if (totalCount == 1) "article" else "articles"}",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Ink,
                    )
                    if (searchQuery.isNotBlank()) {
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(
                            "Matching “$searchQuery”",
                            fontSize = 14.sp,
                            color = Muted,
                        )
                        TextButton(onClick = onClearFilters) {
                            Text("Clear", color = EmeraldDark, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
                    } else if (hasFilters) {
                        Spacer(modifier = Modifier.width(12.dp))
                        TextButton(onClick = onClearFilters) {
                            Text("Clear", color = EmeraldDark, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
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
        Text(label, color = if (active) Color.White else Ink, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
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
            ArticleHeroImage(
                article = article,
                modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f),
                topRadius = 24.dp,
            )
            Column(modifier = Modifier.padding(24.dp)) {
                ArticleMetaRow(article = article, showFeaturedBadge = true)
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    article.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    lineHeight = 30.sp,
                    color = Ink,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
                article.excerpt?.takeIf { it.isNotBlank() }?.let {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Neutral600,
                        lineHeight = 22.sp,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Spacer(modifier = Modifier.height(24.dp))
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
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    article.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    lineHeight = 22.sp,
                    color = Ink,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                article.excerpt?.takeIf { it.isNotBlank() }?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 14.sp,
                        color = Muted,
                        lineHeight = 20.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                ReadLink(label = "Read")
            }
        }
    }
}

@Composable
private fun ArticleHeroImage(
    article: ArticleSummary,
    modifier: Modifier = Modifier,
    topRadius: androidx.compose.ui.unit.Dp = 16.dp,
) {
    val shape = RoundedCornerShape(topStart = topRadius, topEnd = topRadius)
    val imageUrl = absoluteSiteUrl(article.featured_image_url)
    if (imageUrl != null) {
        AsyncImage(
            model = imageUrl,
            contentDescription = null,
            modifier = modifier.clip(shape),
            contentScale = ContentScale.Crop,
        )
    } else {
        Box(
            modifier = modifier.clip(shape).background(AccentFallback),
            contentAlignment = Alignment.Center,
        ) {
            Text("10Tracker", color = Color.White.copy(alpha = 0.9f), fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
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
        formatArticleListDate(article.created_at).takeIf { it.isNotBlank() }?.let { date ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Muted, modifier = Modifier.size(14.dp))
                Text(date, fontSize = 12.sp, color = Muted)
            }
        }
    }
}

@Composable
private fun ReadLink(label: String = "Read article") {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, color = EmeraldDark, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(16.dp))
    }
}

private val articleListDateFormatter: DateTimeFormatter =
    DateTimeFormatter.ofPattern("d MMM yyyy", Locale.forLanguageTag("en-IN"))

private fun formatArticleListDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    return try {
        Instant.parse(iso).atZone(ZoneId.of("Asia/Kolkata")).format(articleListDateFormatter)
    } catch (_: Exception) {
        try {
            Instant.parse("${iso}T00:00:00Z").atZone(ZoneId.of("Asia/Kolkata")).format(articleListDateFormatter)
        } catch (_: Exception) {
            iso.take(10)
        }
    }
}