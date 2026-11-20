package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ArticleDetail
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.util.NativeHtmlContent
import com.tentracker.nativeapp.ui.util.absoluteSiteUrl
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val Neutral600 = Color(0xFF525252)
private val CategoryAccent = Color(0xFF2563EB)
private val CategoryAccentSoft = CategoryAccent.copy(alpha = 0.07f)

private val articleDetailDateFormatter: DateTimeFormatter =
    DateTimeFormatter.ofPattern("d MMM yyyy", Locale.forLanguageTag("en-IN"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleDetailScreen(
    slug: String,
    api: ApiClient,
    onBack: () -> Unit,
) {
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var article by remember { mutableStateOf<ArticleDetail?>(null) }

    LaunchedEffect(slug) {
        loading = true
        error = null
        try {
            val res = api.getArticle(slug)
            article = res.data
            if (res.data == null) error = "Article not found"
        } catch (e: Exception) {
            error = e.message ?: "Failed to load"
        } finally {
            loading = false
        }
    }

    Scaffold(
        containerColor = SurfaceMuted,
        topBar = {
            TopAppBar(
                title = { Text("Updates", maxLines = 1, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
            )
        },
    ) { innerPadding ->
        when {
            loading -> LoadingState(
                modifier = Modifier.padding(innerPadding),
                message = "Loading article…",
            )
            error != null -> {
                ErrorState(
                    message = error ?: "Could not load article",
                    modifier = Modifier.padding(innerPadding),
                    retryLabel = "Back",
                    onRetry = onBack,
                )
            }
            article != null -> {
                val detail = article!!
                val imageUrl = absoluteSiteUrl(detail.featured_image_url)
                val readMinutes = estimateReadMinutes(detail.content.orEmpty())
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.7f)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    ) {
                        Column {
                            if (imageUrl != null) {
                                FeaturedDetailImage(url = imageUrl, title = detail.title)
                            }
                            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp)) {
                                val categoryLabel = detail.category_name?.takeIf { it.isNotBlank() }
                                    ?: detail.category?.replace('-', ' ')?.replaceFirstChar { it.uppercase() }
                                categoryLabel?.let {
                                    Text(
                                        it,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = CategoryAccent,
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(999.dp))
                                            .background(CategoryAccentSoft)
                                            .padding(horizontal = 10.dp, vertical = 4.dp),
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                }
                                Text(
                                    detail.title,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp,
                                    color = Ink,
                                    lineHeight = 29.sp,
                                )
                                detail.excerpt?.takeIf { it.isNotBlank() }?.let {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        it,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontSize = 16.sp,
                                        color = Neutral600,
                                        lineHeight = 24.sp,
                                    )
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                                ArticleDetailMeta(
                                    date = formatArticleDetailDate(detail.created_at),
                                    readMinutes = readMinutes,
                                )
                            }
                            HorizontalDivider(color = Border.copy(alpha = 0.6f))
                            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp)) {
                                ArticleBodyNative(content = detail.content.orEmpty())
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
private fun FeaturedDetailImage(url: String, title: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .background(Color(0xFFF5F5F5)),
    ) {
        AsyncImage(
            model = url,
            contentDescription = title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(64.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.1f)),
                    ),
                ),
        )
    }
}

@Composable
private fun ArticleDetailMeta(date: String, readMinutes: Int) {
    if (date.isBlank()) return
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(date, fontSize = 13.sp, color = Muted)
        Text(" · ", fontSize = 13.sp, color = Color(0xFFD4D4D4))
        Icon(Icons.Default.Schedule, contentDescription = null, tint = Muted, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.size(4.dp))
        Text("$readMinutes min read", fontSize = 13.sp, color = Muted)
    }
}

@Composable
private fun ArticleBodyNative(content: String) {
    val wrapped = """<div class="article-content">$content</div>"""
    NativeHtmlContent(
        rawHtml = wrapped,
        modifier = Modifier.fillMaxWidth(),
        textSizeSp = 16f,
        textColorArgb = Neutral600.toArgb(),
        linkColorArgb = Ink.toArgb(),
        canonicalize = true,
        stripLatex = false,
    )
}

private fun estimateReadMinutes(content: String): Int {
    val words = content.replace(Regex("<[^>]+>"), " ")
        .trim()
        .split(Regex("\\s+"))
        .count { it.isNotBlank() }
    return maxOf(1, (words + 199) / 200)
}

private fun formatArticleDetailDate(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    return try {
        Instant.parse(iso).atZone(ZoneId.of("Asia/Kolkata")).format(articleDetailDateFormatter)
    } catch (_: Exception) {
        try {
            Instant.parse("${iso}T00:00:00Z").atZone(ZoneId.of("Asia/Kolkata")).format(articleDetailDateFormatter)
        } catch (_: Exception) {
            iso.take(10)
        }
    }
}
