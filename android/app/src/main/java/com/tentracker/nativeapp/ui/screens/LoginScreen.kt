package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.ui.components.BrandLogo
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import kotlinx.coroutines.launch

/**
 * Google sign-in via Chrome Custom Tabs (no WebView). Session cookies from the browser
 * tab are not visible to the app CookieManager — user confirms with "I've signed in"
 * and we probe `GET /api/auth/session`.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    api: ApiClient,
    onSignedIn: () -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var checking by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    suspend fun probeSession(quiet: Boolean): Boolean {
        return try {
            val session = api.getAuthSession()
            val ok = !session.user?.email.isNullOrBlank()
            if (ok) {
                onSignedIn()
                true
            } else {
                if (!quiet) {
                    statusMessage =
                        "No active session yet. Finish Google sign-in in the browser, then tap \"I've signed in\"."
                }
                false
            }
        } catch (e: Exception) {
            if (!quiet) {
                statusMessage = e.message ?: "Could not verify session"
            }
            false
        }
    }

    fun openAuth(path: String) {
        statusMessage =
            "Complete sign-in in the browser tab. When done, return here and tap \"I've signed in\"."
        openSite(context, "${ApiClient.BASE_URL}$path")
    }

    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && !checking) {
                scope.launch { probeSession(quiet = true) }
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }

    Scaffold(
        containerColor = Color(0xFFFAFAFA),
        topBar = {
            TopAppBar(
                title = { BrandLogo(nameSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
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
                Box {
                    Box(
                        modifier = Modifier
                            .size(192.dp)
                            .align(Alignment.TopEnd)
                            .offset { IntOffset(64, -64) }
                            .background(Emerald.copy(alpha = 0.25f), RoundedCornerShape(999.dp)),
                    )
                    Column(
                        modifier = Modifier
                            .padding(horizontal = 24.dp, vertical = 32.dp)
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
                            onClick = { openAuth("/sign-in") },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(1.dp, Border),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White),
                        ) {
                            GoogleMark()
                            Spacer(modifier = Modifier.size(12.dp))
                            Text(
                                "Continue with Google",
                                color = Ink,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 15.sp,
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = {
                                checking = true
                                scope.launch {
                                    probeSession(quiet = false)
                                    checking = false
                                }
                            },
                            enabled = !checking,
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Brand),
                        ) {
                            if (checking) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp,
                                )
                            } else {
                                Text("I've signed in", fontWeight = FontWeight.SemiBold)
                            }
                        }
                        statusMessage?.let { msg ->
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                msg,
                                fontSize = 13.sp,
                                color = Muted,
                                textAlign = TextAlign.Center,
                                lineHeight = 18.sp,
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        SignUpPrompt(onSignUp = { openAuth("/sign-up") })
                        Spacer(modifier = Modifier.height(24.dp))
                        androidx.compose.material3.HorizontalDivider(color = Border.copy(alpha = 0.7f))
                        Spacer(modifier = Modifier.height(20.dp))
                        AuthTrustFooter()
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AuthTrustFooter() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterHorizontally),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            TrustLine(Icons.Default.Lock, "Secure Google sign-in")
            TrustLine(Icons.Default.Shield, "Free to start")
            Text("No credit card required", fontSize = 12.sp, color = Muted)
        }
        Text(
            "Sign-in opens in Chrome Custom Tabs. The app cannot read that browser's cookies; " +
                "use \"I've signed in\" after you finish.",
            fontSize = 12.sp,
            color = Muted,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp,
        )
        Text(
            "By continuing, you agree to our Terms of Service and Privacy Policy.",
            fontSize = 12.sp,
            color = Muted,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp,
        )
    }
}

@Composable
private fun TrustLine(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Emerald, modifier = Modifier.size(14.dp))
        Text(label, fontSize = 12.sp, color = Muted)
    }
}

@Composable
private fun SignUpPrompt(onSignUp: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text("New here? ", fontSize = 14.sp, color = Muted)
        Text(
            "Create an account",
            fontSize = 14.sp,
            color = Emerald,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.clickable(onClick = onSignUp),
        )
    }
}

@Composable
private fun GoogleMark() {
    Canvas(modifier = Modifier.size(20.dp)) {
        val s = size.minDimension / 24f
        val paths = listOf(
            "M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 " +
                "C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 " +
                "C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 " +
                "1.23999023,6.65002441 L5.26620003,9.76452941 Z" to Color(0xFFEA4335),
            "M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 " +
                "C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 " +
                "L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 " +
                "C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" to Color(0xFF34A853),
            "M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 " +
                "C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 " +
                "L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 " +
                "16.0407269,18.0125889 L19.834192,20.9995801 Z" to Color(0xFF4285F4),
            "M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 " +
                "C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 " +
                "L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 " +
                "C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" to Color(0xFFFBBC05),
        )
        withTransform({ scale(s, s) }) {
            paths.forEach { (data, color) ->
                val path = PathParser().parsePathString(data).toPath()
                drawPath(path, color)
            }
        }
    }
}