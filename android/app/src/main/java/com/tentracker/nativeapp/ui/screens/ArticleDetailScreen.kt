package com.tentracker.nativeapp.ui.screens

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ArticleDetail
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.util.absoluteSiteUrl

@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
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
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                ) {
                    Spacer(modifier = Modifier.height(8.dp))
                    if (imageUrl != null) {
                        AsyncImage(
                            model = imageUrl,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(16f / 10f)
                                .clip(RoundedCornerShape(20.dp))
                                .border(1.dp, Border, RoundedCornerShape(20.dp)),
                            contentScale = ContentScale.Crop,
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                    val categoryLabel = detail.category_name?.takeIf { it.isNotBlank() }
                        ?: detail.category?.replace('-', ' ')?.replaceFirstChar { it.uppercase() }
                    categoryLabel?.let {
                        Text(
                            it,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = EmeraldDark,
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(EmeraldSoft)
                                .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp),
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                    }
                    Text(detail.title, fontWeight = FontWeight.Bold, fontSize = 24.sp, color = Ink, lineHeight = 30.sp)
                    detail.excerpt?.takeIf { it.isNotBlank() }?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(it, style = MaterialTheme.typography.bodyLarge, color = Muted)
                    }
                    formatArticleDetailDate(detail.created_at).takeIf { it.isNotBlank() }?.let { date ->
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Muted, modifier = Modifier.size(16.dp).padding(end = 6.dp))
                            Text(date, fontSize = 13.sp, color = Muted)
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    ArticleBodyWebView(content = detail.content.orEmpty())
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}

@Composable
private fun ArticleBodyWebView(content: String) {
    val html = """
        <!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;color:#171717;line-height:1.65;font-size:16px;}
          img{max-width:100%;height:auto;border-radius:12px;}
          a{color:#3F5EB9;}
          h1,h2,h3{color:#171717;margin-top:1.25em;}
          p{margin:0.75em 0;}
        </style></head><body>
        $content
        </body></html>
    """.trimIndent()
    AndroidView(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(4.dp),
        factory = { ctx ->
            WebView(ctx).apply {
                webViewClient = WebViewClient()
                settings.javaScriptEnabled = false
                loadDataWithBaseURL(ApiClient.BASE_URL, html, "text/html", "UTF-8", null)
            }
        },
        update = { web ->
            web.loadDataWithBaseURL(ApiClient.BASE_URL, html, "text/html", "UTF-8", null)
        },
    )
}

private fun formatArticleDetailDate(iso: String?): String {
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