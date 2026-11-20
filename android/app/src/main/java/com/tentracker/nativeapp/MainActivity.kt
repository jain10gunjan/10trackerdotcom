package com.tentracker.nativeapp

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.tentracker.nativeapp.ui.TenTrackerNav
import com.tentracker.nativeapp.ui.theme.TenTrackerTheme
import kotlinx.coroutines.flow.MutableStateFlow

class MainActivity : ComponentActivity() {

    private val pendingDeepLink = MutableStateFlow<Uri?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        pendingDeepLink.value = intent?.data
        val app = application as TenTrackerApp
        setContent {
            TenTrackerTheme {
                val link by pendingDeepLink.collectAsState()
                TenTrackerNav(
                    api = app.api,
                    sessionStore = app.sessionStore,
                    pendingDeepLink = link,
                    onDeepLinkConsumed = { pendingDeepLink.value = null },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLink.value = intent.data
    }
}
