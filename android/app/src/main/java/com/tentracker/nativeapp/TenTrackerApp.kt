package com.tentracker.nativeapp

import android.app.Application
import android.webkit.CookieManager
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.SessionStore

class TenTrackerApp : Application() {
    lateinit var sessionStore: SessionStore
        private set
    lateinit var api: ApiClient
        private set

    override fun onCreate() {
        super.onCreate()
        CookieManager.getInstance().setAcceptCookie(true)
        sessionStore = SessionStore(this)
        api = ApiClient(sessionStore)
    }
}
