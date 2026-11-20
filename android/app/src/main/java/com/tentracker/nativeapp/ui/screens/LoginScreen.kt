package com.tentracker.nativeapp.ui.screens

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.Modifier
import com.tentracker.nativeapp.data.ApiClient

/**
 * One-time Google sign-in via the live site. Cookies then power native API calls.
 * No DB / auth schema changes required.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LoginScreen(onSignedIn: () -> Unit) {
    var loading by remember { mutableStateOf(true) }
    var finished by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "Sign in to 10Tracker",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(16.dp)
        )
        Text(
            text = "Use Google on the site once. Progress (including YouTube watch %) syncs to your account — same DB, no changes.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 8.dp)
        )
        if (loading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }
        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { context ->
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                        webViewClient = object : WebViewClient() {
                            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                loading = true
                            }

                            override fun onPageFinished(view: WebView?, url: String?) {
                                loading = false
                                CookieManager.getInstance().flush()
                                if (!finished && looksSignedIn(url)) {
                                    finished = true
                                    onSignedIn()
                                }
                            }

                            override fun shouldOverrideUrlLoading(
                                view: WebView?,
                                request: WebResourceRequest?
                            ): Boolean = false
                        }
                        loadUrl("${ApiClient.BASE_URL}/")
                    }
                }
            )
        }
    }
}

private fun looksSignedIn(url: String?): Boolean {
    if (url.isNullOrBlank()) return false
    val hostOk = url.contains("10tracker.com")
    if (!hostOk) return false
    // After OAuth callback users land back on first-party pages with a session cookie.
    val cm = CookieManager.getInstance()
    val cookies = cm.getCookie(ApiClient.BASE_URL).orEmpty()
    val hasSession =
        cookies.contains("authjs.session-token", true) ||
            cookies.contains("next-auth.session-token", true) ||
            cookies.contains("__Secure-authjs.session-token", true) ||
            cookies.contains("__Secure-next-auth.session-token", true)
    val notAuthPage = !url.contains("/api/auth") && !url.contains("accounts.google.com")
    return hasSession && notAuthPage
}
