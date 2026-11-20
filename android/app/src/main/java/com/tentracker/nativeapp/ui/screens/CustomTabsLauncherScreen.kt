package com.tentracker.nativeapp.ui.screens

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import com.tentracker.nativeapp.ui.util.openSite

/** Opens a URL in Chrome Custom Tabs and immediately pops the back stack — no WebView. */
@Composable
fun CustomTabsLauncherScreen(
    url: String,
    onDone: () -> Unit,
) {
    val context = LocalContext.current
    LaunchedEffect(url) {
        openSite(context, url)
        onDone()
    }
}