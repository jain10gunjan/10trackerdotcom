package com.tentracker.nativeapp.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ArticleDetail
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.motion.OgEaseOut
import com.tentracker.nativeapp.ui.motion.OgFadeSlideIn
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Neutral600
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.theme.Tw
import com.tentracker.nativeapp.ui.util.absoluteSiteUrl
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

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
                title = {
                    Text(
                        "Updates",
                        maxLines = 1,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = Tw.Type.base,
                    )
                },
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
                val categoryLabel = detail.category_name?.takeIf { it.isNotBlank() }
                    ?: detail.category?.replace('-', ' ')?.replaceFirstChar { it.uppercase() }

                OgFadeSlideIn(
                    delayMillis = 40,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = Tw.Space.s4, vertical = Tw.Space.s2),
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = Tw.Radius.shape2xl,
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.7f)),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        ) {
                            Column {
                                if (imageUrl != null) {
                                    FeaturedDetailImage(url = imageUrl, title = detail.title)
                                }
                                Column(
                                    modifier = Modifier.padding(
                                        horizontal = Tw.Space.s4,
                                        vertical = Tw.Space.s6,
                                    ),
                                ) {
                                    categoryLabel?.let {
                                        Text(
                                            it,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = CategoryAccent,
                                            modifier = Modifier
                                                .clip(Tw.Radius.shapeFull)
                                                .background(CategoryAccentSoft)
                                                .padding(
                                                    horizontal = Tw.Space.s2_5,
                                                    vertical = Tw.Space.s1,
                                                ),
                                        )
                                        Spacer(modifier = Modifier.height(Tw.Space.s4))
                                    }
                                    Text(
                                        detail.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = Tw.Type.text2xl,
                                        color = Ink,
                                        lineHeight = 29.sp,
                                    )
                                    detail.excerpt?.takeIf { it.isNotBlank() }?.let {
                                        Spacer(modifier = Modifier.height(Tw.Space.s3))
                                        Text(
                                            it,
                                            style = MaterialTheme.typography.bodyLarge,
                                            fontSize = Tw.Type.base,
                                            color = Neutral600,
                                            lineHeight = 24.sp,
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(Tw.Space.s4))
                                    ArticleDetailMeta(
                                        date = formatArticleDetailDate(detail.created_at),
                                        readMinutes = readMinutes,
                                    )
                                }
                                HorizontalDivider(color = Border.copy(alpha = 0.6f))
                                Column(
                                    modifier = Modifier.padding(
                                        horizontal = Tw.Space.s4,
                                        vertical = Tw.Space.s6,
                                    ),
                                ) {
                                    // Article HTML via HtmlText + JLatexMath only (no WebView).
                                    HtmlText(
                                        html = detail.content.orEmpty(),
                                        modifier = Modifier.fillMaxWidth(),
                                        textSizeSp = 16f,
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(Tw.Space.s8))
                    }
                }
            }
        }
    }
}

@Composable
private fun FeaturedDetailImage(url: String, title: String) {
    var loaded by remember { mutableStateOf(false) }
    val imageAlpha by animateFloatAsState(
        targetValue = if (loaded) 1f else 0f,
        animationSpec = tween(durationMillis = 500, easing = OgEaseOut),
        label = "articleImageFade",
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .background(Color(0xFFF5F5F5)),
    ) {
        if (!loaded) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color(0xFFF5F5F5),
                                Color(0xFFE5E5E5).copy(alpha = 0.6f),
                                Color(0xFFF5F5F5),
                            ),
                        ),
                    ),
            )
        }
        AsyncImage(
            model = url,
            contentDescription = title,
            modifier = Modifier.fillMaxSize().alpha(imageAlpha),
            contentScale = ContentScale.Crop,
            onState = { state ->
                loaded = state is AsyncImagePainter.State.Success
            },
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
        Icon(
            Icons.Default.Schedule,
            contentDescription = null,
            tint = Muted,
            modifier = Modifier.size(14.dp),
        )
        Spacer(modifier = Modifier.size(Tw.Space.s1))
        Text("$readMinutes min read", fontSize = 13.sp, color = Muted)
    }
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
