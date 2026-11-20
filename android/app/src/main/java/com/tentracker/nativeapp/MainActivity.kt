package com.tentracker.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.tentracker.nativeapp.ui.TenTrackerNav
import com.tentracker.nativeapp.ui.theme.TenTrackerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as TenTrackerApp
        setContent {
            TenTrackerTheme {
                TenTrackerNav(api = app.api, sessionStore = app.sessionStore)
            }
        }
    }
}
