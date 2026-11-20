package com.tentracker.nativeapp.data

import android.content.Context
import android.webkit.CookieManager

class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("tentracker_session", Context.MODE_PRIVATE)

    var signedInHint: Boolean
        get() = prefs.getBoolean(KEY_SIGNED_IN, false)
        set(value) = prefs.edit().putBoolean(KEY_SIGNED_IN, value).apply()

    fun hasSessionCookie(): Boolean {
        val raw = CookieManager.getInstance().getCookie(ApiClient.BASE_URL) ?: return false
        return raw.contains("authjs.session-token", ignoreCase = true) ||
            raw.contains("next-auth.session-token", ignoreCase = true) ||
            raw.contains("__Secure-authjs.session-token", ignoreCase = true) ||
            raw.contains("__Secure-next-auth.session-token", ignoreCase = true)
    }

    fun markSignedInFromCookies() {
        signedInHint = hasSessionCookie()
    }

    fun clear() {
        signedInHint = false
        val cm = CookieManager.getInstance()
        cm.removeAllCookies(null)
        cm.flush()
    }

    companion object {
        private const val KEY_SIGNED_IN = "signed_in_hint"
    }
}
