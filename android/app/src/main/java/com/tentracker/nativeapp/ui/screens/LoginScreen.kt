package com.tentracker.nativeapp.ui.screens

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.ui.components.BrandLogo
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted

/**
 * Google sign-in — native shell matches web mobile sign-in; WebView runs the OAuth flow.
 */
@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LoginScreen(
    onSignedIn: () -> Unit,
    onBack: () -> Unit,
) {
    var showAuthWeb by remember { mutableStateOf(false) }
    var webLoading by remember { mutableStateOf(false) }
    var finished by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color(0xFFF8FAFC),
        topBar = {
            TopAppBar(
                title = {
                    if (!showAuthWeb) {
                        BrandLogo(nameSize = 18.sp)
                    } else {
                        Text("Sign in", fontWeight = FontWeight.SemiBold, color = Ink)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (showAuthWeb) showAuthWeb = false else onBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Ink,
                    navigationIconContentColor = Ink,
                ),
            )
        },
    ) { padding ->
        if (showAuthWeb) {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize(),
            ) {
                if (webLoading) {
                    LinearProgressIndicator(
                        modifier = Modifier.fillMaxWidth(),
                        color = Brand,
                    )
                }
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { context ->
                        WebView(context).apply {
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                            webViewClient = object : WebViewClient() {
                                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                    webLoading = true
                                }

                                override fun onPageFinished(view: WebView?, url: String?) {
                                    webLoading = false
                                    CookieManager.getInstance().flush()
                                    if (!finished && looksSignedIn(url)) {
                                        finished = true
                                        onSignedIn()
                                    }
                                }

                                override fun shouldOverrideUrlLoading(
                                    view: WebView?,
                                    request: WebResourceRequest?,
                                ): Boolean = false
                            }
                            loadUrl("${ApiClient.BASE_URL}/sign-in")
                        }
                    },
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                contentAlignment = Alignment.TopCenter,
            ) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, Border),
                    shadowElevation = 2.dp,
                ) {
                    Column(
                        modifier = Modifier
                            .padding(horizontal = 24.dp, vertical = 28.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        BrandLogo(nameSize = 22.sp)
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            "Welcome back",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = Ink,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Sign in to continue on 10Tracker",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Muted,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        OutlinedButton(
                            onClick = { showAuthWeb = true },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(1.dp, Border),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White),
                        ) {
                            GoogleMark()
                            Spacer(modifier = Modifier.size(10.dp))
                            Text(
                                "Continue with Google",
                                color = Ink,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 15.sp,
                            )
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                        ) {
                            TrustLine(Icons.Default.Lock, "Secure Google sign-in")
                            TrustLine(Icons.Default.Shield, "Free to start")
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "No credit card required",
                            fontSize = 11.sp,
                            color = Muted,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = Color.Transparent,
                        ) {
                            Text(
                                "By continuing, you agree to our Terms of Service and Privacy Policy on 10tracker.com.",
                                fontSize = 11.sp,
                                color = Muted,
                                textAlign = TextAlign.Center,
                                lineHeight = 16.sp,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TrustLine(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
        Text(label, fontSize = 11.sp, color = Muted)
    }
}

@Composable
private fun GoogleMark() {
    Box(
        modifier = Modifier
            .size(22.dp)
            .clip(CircleShape)
            .background(Color.White),
        contentAlignment = Alignment.Center,
    ) {
        Text("G", fontWeight = FontWeight.Bold, color = Color(0xFF4285F4), fontSize = 14.sp)
    }
}

private fun looksSignedIn(url: String?): Boolean {
    if (url.isNullOrBlank() || !url.contains("10tracker.com")) return false
    val cookies = CookieManager.getInstance().getCookie(ApiClient.BASE_URL).orEmpty()
    val hasSession =
        cookies.contains("authjs.session-token", true) ||
            cookies.contains("next-auth.session-token", true) ||
            cookies.contains("__Secure-authjs.session-token", true) ||
            cookies.contains("__Secure-next-auth.session-token", true)
    val notAuthPage = !url.contains("/api/auth") && !url.contains("accounts.google.com")
    return hasSession && notAuthPage
}