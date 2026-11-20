package com.tentracker.nativeapp.ui.screens

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.viewinterop.AndroidView
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.util.isTenTrackerHost
import com.tentracker.nativeapp.ui.util.openSite

/**
 * Generic in-app WebView for leftover 10tracker.com pages (pricing, roadmaps,
 * mock leaderboard, checkout, etc.). Shares Auth.js cookies with OkHttp via
 * [CookieManager] — same jar the API client uses.
 */
@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun InAppBrowserScreen(
    url: String,
    title: String? = null,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    var loading by remember { mutableStateOf(true) }
    var progress by remember { mutableFloatStateOf(0f) }
    var pageTitle by remember { mutableStateOf(title.orEmpty()) }
    var pageError by remember { mutableStateOf<String?>(null) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    fun goBack() {
        val web = webViewRef
        if (web != null && web.canGoBack()) {
            web.goBack()
        } else {
            onBack()
        }
    }

    BackHandler { goBack() }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = pageTitle.ifBlank { "10tracker" },
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { goBack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            pageError = null
                            webViewRef?.reload()
                        },
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Reload")
                    }
                    IconButton(onClick = { openSite(context, url) }) {
                        Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = "Open in browser")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Ink,
                    navigationIconContentColor = Ink,
                    actionIconContentColor = Ink,
                ),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
        ) {
            if (loading && pageError == null) {
                LinearProgressIndicator(
                    progress = { progress.coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth(),
                    color = Brand,
                )
            }

            Box(modifier = Modifier.fillMaxSize()) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { ctx ->
                        WebView(ctx).apply {
                            webViewRef = this
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.setSupportZoom(true)
                            settings.builtInZoomControls = true
                            settings.displayZoomControls = false
                            CookieManager.getInstance().setAcceptCookie(true)
                            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

                            webChromeClient = object : WebChromeClient() {
                                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                    progress = newProgress / 100f
                                    loading = newProgress < 100
                                }

                                override fun onReceivedTitle(view: WebView?, t: String?) {
                                    if (!t.isNullOrBlank() && title.isNullOrBlank()) {
                                        pageTitle = t
                                    }
                                }
                            }

                            webViewClient = object : WebViewClient() {
                                override fun onPageStarted(view: WebView?, pageUrl: String?, favicon: Bitmap?) {
                                    loading = true
                                    pageError = null
                                }

                                override fun onPageFinished(view: WebView?, pageUrl: String?) {
                                    loading = false
                                    // Keep OkHttp session jar in sync with WebView cookies
                                    CookieManager.getInstance().flush()
                                }

                                override fun onReceivedError(
                                    view: WebView?,
                                    request: WebResourceRequest?,
                                    error: WebResourceError?,
                                ) {
                                    if (request?.isForMainFrame == true) {
                                        pageError = error?.description?.toString()
                                            ?: "Could not load page"
                                        loading = false
                                    }
                                }

                                override fun shouldOverrideUrlLoading(
                                    view: WebView?,
                                    request: WebResourceRequest?,
                                ): Boolean {
                                    val next = request?.url ?: return false
                                    val host = next.host
                                    if (isTenTrackerHost(host) ||
                                        host?.contains("accounts.google.com", true) == true ||
                                        host?.contains("google.com", true) == true
                                    ) {
                                        return false
                                    }
                                    val scheme = next.scheme?.lowercase()
                                    if (scheme != null && scheme != "http" && scheme != "https") {
                                        runCatching {
                                            context.startActivity(Intent(Intent.ACTION_VIEW, next))
                                        }
                                        return true
                                    }
                                    return false
                                }
                            }
                            loadUrl(url)
                        }
                    },
                    update = { /* URL set once in factory; reload via toolbar */ },
                )

                if (pageError != null) {
                    ErrorState(
                        message = pageError ?: "Could not load page",
                        title = "Page failed to load",
                        modifier = Modifier
                            .fillMaxSize()
                            .align(Alignment.Center),
                        onRetry = {
                            pageError = null
                            webViewRef?.reload()
                        },
                    )
                }
            }
        }
    }
}
