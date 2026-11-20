package com.tentracker.nativeapp.data

import android.webkit.CookieManager
import com.google.gson.Gson
import com.tentracker.nativeapp.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

/**
 * Talks to existing 10tracker.com APIs. No DB changes —
 * uses Auth.js session cookies from the login WebView.
 */
class ApiClient(private val sessionStore: SessionStore) {

    private val gson = Gson()
    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .cookieJar(WebViewCookieJar())
        .addInterceptor(
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
        )
        .build()

    suspend fun getOgCatalog(): OgCatalogResponse = get("/api/og-trackers", OgCatalogResponse::class.java)

    suspend fun getPath(slug: String, sync: Boolean = false): OgPathDetailResponse {
        val qs = if (sync) "?sync=1" else ""
        return get("/api/og-trackers/$slug$qs", OgPathDetailResponse::class.java)
    }

    suspend fun getExamCategories(): ExamCategoriesResponse =
        get("/api/exams/categories", ExamCategoriesResponse::class.java)

    suspend fun saveVideoProgress(
        resourceId: String,
        percentWatched: Int,
        status: String? = null,
    ): ProgressSaveResponse = withContext(Dispatchers.IO) {
        val payload = mutableMapOf<String, Any>(
            "resourceId" to resourceId,
            "percentWatched" to percentWatched.coerceIn(0, 100),
        )
        if (status != null) payload["status"] = status
        post("/api/og-trackers/progress", payload, ProgressSaveResponse::class.java)
    }

    private suspend fun <T> get(path: String, clazz: Class<T>): T = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(BASE_URL + path)
            .get()
            .header("Accept", "application/json")
            .build()
        execute(request, clazz)
    }

    private suspend fun <T> post(path: String, body: Any, clazz: Class<T>): T =
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url(BASE_URL + path)
                .post(gson.toJson(body).toRequestBody(jsonMedia))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .build()
            execute(request, clazz)
        }

    private fun <T> execute(request: Request, clazz: Class<T>): T {
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                // Try parse error envelope; otherwise throw.
                val parsed = runCatching { gson.fromJson(text, clazz) }.getOrNull()
                if (parsed != null) return parsed
                error("HTTP ${response.code}: ${text.take(200)}")
            }
            sessionStore.markSignedInFromCookies()
            return gson.fromJson(text, clazz)
                ?: error("Empty response for ${request.url}")
        }
    }

    /** Bridge WebView CookieManager ↔ OkHttp so Auth.js cookies work natively. */
    private class WebViewCookieJar : CookieJar {
        override fun loadForRequest(url: HttpUrl): List<Cookie> {
            val raw = CookieManager.getInstance().getCookie(url.toString()) ?: return emptyList()
            return raw.split(";")
                .map { it.trim() }
                .mapNotNull { Cookie.parse(url, it) }
        }

        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
            val cm = CookieManager.getInstance()
            cookies.forEach { cm.setCookie(url.toString(), it.toString()) }
            cm.flush()
        }
    }

    companion object {
        val BASE_URL: String = BuildConfig.API_BASE
    }
}
