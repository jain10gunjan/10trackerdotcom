package com.tentracker.nativeapp.ui.screens

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.viewinterop.AndroidView
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.ArticleDetail
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState

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
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = { Text(article?.title ?: "Article", maxLines = 1, fontWeight = FontWeight.SemiBold) },
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
            else -> {
                val html = """
                    <!DOCTYPE html><html><head>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <style>
                      body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:16px;color:#171717;line-height:1.5;}
                      img{max-width:100%;height:auto;border-radius:12px;}
                      a{color:#3F5EB9;}
                    </style></head><body>
                    ${article?.content.orEmpty()}
                    </body></html>
                """.trimIndent()
                AndroidView(
                    modifier = Modifier.fillMaxSize().padding(innerPadding),
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
        }
    }
}
