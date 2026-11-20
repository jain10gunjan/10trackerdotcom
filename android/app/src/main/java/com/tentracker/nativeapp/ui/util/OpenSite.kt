package com.tentracker.nativeapp.ui.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

fun openSite(context: Context, pathOrUrl: String) {
    val url = absoluteSiteUrl(pathOrUrl) ?: return
    val tabs = CustomTabsIntent.Builder()
        .setShowTitle(true)
        .build()
    runCatching {
        tabs.launchUrl(context, Uri.parse(url))
    }.onFailure {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
}
