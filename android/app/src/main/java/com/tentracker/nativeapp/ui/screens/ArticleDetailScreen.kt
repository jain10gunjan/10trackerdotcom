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
import com.tentracker.nativeapp.ui.util.MathJaxHtmlContent
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
                                ArticleBodyWebView(content = detail.content.orEmpty())
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
private fun ArticleBodyWebView(content: String) {
    val wrapped = """<div class="article-prose"><div class="article-content">$content</div></div>"""
    MathJaxHtmlContent(
        rawHtml = wrapped,
        modifier = Modifier.fillMaxWidth(),
        textSizeSp = 16f,
        bodyExtraCss = ARTICLE_CONTENT_CSS,
        canonicalize = true,
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

// Mirrors src/styles/article-content.css (mobile breakpoints)
private val ARTICLE_CONTENT_CSS = """
.article-prose{width:100%;}
.article-content{font-size:1rem;line-height:1.75;color:#404040;font-family:inherit;}
.article-content,.article-content *{font-family:inherit;}
.article-content > :first-child{margin-top:0!important;padding-top:0!important;}
.article-content p:empty,.article-content div:empty,.article-content span:empty{display:none!important;margin:0!important;padding:0!important;height:0!important;min-height:0!important;}
.article-content br + br{display:none;}
.article-content p{margin-top:1rem;margin-bottom:0;}
.article-content p + p{margin-top:1rem;}
.article-content h1,.article-content h2,.article-content h3,.article-content h4{color:#171717;font-weight:600;line-height:1.3;margin-top:2rem;margin-bottom:0.75rem;}
.article-content h1{font-size:1.375rem;}
.article-content h2{font-size:1.25rem;margin-top:1.75rem;}
.article-content h3{font-size:1.125rem;}
.article-content ul,.article-content ol{margin-top:1rem;padding-left:1.5rem;}
.article-content ul{list-style-type:disc;}
.article-content ol{list-style-type:decimal;}
.article-content li{margin-top:0.375rem;}
.article-content a{color:#171717;text-decoration:underline;text-underline-offset:2px;}
.article-content strong{color:#171717;font-weight:600;}
.article-content blockquote{margin:1.5rem 0;padding:1rem 1.25rem;border-left:3px solid #171717;background:#fafafa;border-radius:0 0.75rem 0.75rem 0;color:#525252;}
.article-content table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.9375rem;border:1px solid #e5e5e5;border-radius:0.75rem;overflow:hidden;}
.article-content th,.article-content td{border:1px solid #e5e5e5;padding:0.625rem 0.75rem;text-align:left;}
.article-content th{background:#fafafa;font-weight:600;color:#171717;}
.article-content tr:nth-child(even) td{background:#fafafa;}
.article-content img{max-width:100%;width:auto!important;height:auto!important;max-height:min(420px,55vh);object-fit:contain;border-radius:0.75rem;margin:1rem 0;}
.article-content iframe{max-width:100%;max-height:min(360px,50vh);margin:1rem 0;border:0;border-radius:0.75rem;}
.article-content pre{margin:1.25rem 0;padding:1rem;background:#fafafa;border:1px solid #e5e5e5;border-radius:0.75rem;overflow-x:auto;font-size:0.875rem;}
.article-content code{font-size:0.875em;background:#f5f5f5;padding:0.125rem 0.375rem;border-radius:0.25rem;}
.article-content hr{border:none;border-top:1px solid #e5e5e5;margin:2rem 0;}
""".trimIndent()