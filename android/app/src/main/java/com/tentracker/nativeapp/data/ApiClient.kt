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
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
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

    suspend fun getActiveExams(): ActiveExamsResponse =
        get("/api/exams/active", ActiveExamsResponse::class.java)

    suspend fun getSubjects(category: String): SubjectsResponse {
        val q = URLEncoder.encode(category, StandardCharsets.UTF_8.toString())
        return get("/api/allsubtopics?category=$q", SubjectsResponse::class.java)
    }

    suspend fun getChapterQuestions(
        category: String,
        subject: String,
        chapter: String,
        page: Int = 1,
        limit: Int = 20,
    ): ChapterQuestionsResponse {
        val c = enc(category)
        val s = enc(subject)
        val ch = enc(chapter)
        return get(
            "/api/questions/chapter?category=$c&subject=$s&chapter=$ch&page=$page&limit=$limit",
            ChapterQuestionsResponse::class.java,
        )
    }

    suspend fun getPracticeProgress(area: String, topics: List<String>): PracticeProgressResponse {
        val a = enc(area)
        val t = enc(topics.joinToString(","))
        return get("/api/practice/progress?area=$a&topics=$t", PracticeProgressResponse::class.java)
    }

    suspend fun savePracticeProgress(entries: Map<String, Map<String, Any?>>): ProgressSaveResponse =
        post("/api/practice/progress", mapOf("entries" to entries), ProgressSaveResponse::class.java)

    suspend fun getArticles(
        page: Int = 1,
        limit: Int = 20,
        category: String? = null,
        query: String? = null,
    ): ArticlesResponse {
        val parts = mutableListOf("page=$page", "limit=$limit")
        category?.takeIf { it.isNotBlank() }?.let { parts.add("category=${enc(it)}") }
        query?.takeIf { it.isNotBlank() }?.let { parts.add("q=${enc(it)}") }
        return get("/api/articles?${parts.joinToString("&")}", ArticlesResponse::class.java)
    }

    suspend fun getArticle(slug: String): ArticleDetailResponse =
        get("/api/articles/${enc(slug)}", ArticleDetailResponse::class.java)

    suspend fun getMockOfDay(category: String): MockOfDayResponse {
        val q = enc(category)
        return get("/api/mock-test/mock-of-day?category=$q", MockOfDayResponse::class.java)
    }

    /** Auth.js session cookie → user email/name (or empty when signed out). */
    suspend fun getAuthSession(): AuthSessionResponse = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(BASE_URL + "/api/auth/session")
            .get()
            .header("Accept", "application/json")
            .build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty().trim()
            if (!response.isSuccessful) {
                return@withContext AuthSessionResponse()
            }
            if (text.isEmpty() || text == "null") {
                return@withContext AuthSessionResponse()
            }
            runCatching { gson.fromJson(text, AuthSessionResponse::class.java) }
                .getOrElse { AuthSessionResponse() }
                .also {
                    if (it.user?.email != null) sessionStore.markSignedInFromCookies()
                }
        }
    }

    suspend fun getUserProfile(): UserProfileResponse =
        get("/api/mock-test/profile", UserProfileResponse::class.java)

    suspend fun getCreditsWallet(): CreditsWalletResponse =
        get("/api/credits/wallet", CreditsWalletResponse::class.java)

    suspend fun getRoadmaps(
        page: Int = 1,
        limit: Int = 24,
        search: String = "",
        category: String = "All",
        sort: String = "featured",
    ): RoadmapsResponse {
        val q = buildString {
            append("/api/roadmaps?page=$page&limit=$limit&sort=${enc(sort)}")
            if (search.isNotBlank()) append("&search=${enc(search)}")
            if (category.isNotBlank() && category != "All") append("&category=${enc(category)}")
        }
        return get(q, RoadmapsResponse::class.java)
    }

    suspend fun getRoadmap(slug: String, dayLimit: Int = 14): RoadmapDetailResponse {
        val s = enc(slug)
        return get("/api/roadmaps/$s?dayLimit=$dayLimit", RoadmapDetailResponse::class.java)
    }
    /**
     * Public mock catalog for a category.
     * Prefer leaderboard `tests` (any exam); fall back to legacy gate-cse available list.
     */
    suspend fun getMockTests(category: String): List<MockTestSummary> {
        val fromLeaderboard = runCatching {
            getMockLeaderboard(category).tests.map { it.toSummary() }
        }.getOrDefault(emptyList())
        if (fromLeaderboard.isNotEmpty()) return fromLeaderboard.distinctBy { it.id }

        if (category.equals("gate-cse", ignoreCase = true)) {
            return runCatching { getGateCseAvailableMocks().tests }.getOrDefault(emptyList())
        }
        return emptyList()
    }

    suspend fun getMockLeaderboard(category: String, limit: Int = 50): MockLeaderboardResponse {
        val q = enc(category)
        return get(
            "/api/mock-test/leaderboard?category=$q&scope=overall&period=all&limit=$limit",
            MockLeaderboardResponse::class.java,
        )
    }

    suspend fun getGateCseAvailableMocks(): AvailableMocksResponse =
        get("/api/gate-cse/mock-test/available", AvailableMocksResponse::class.java)

    suspend fun getMockTest(testId: String): MockTestDetailResponse =
        get("/api/gate-cse/mock-test/${enc(testId)}", MockTestDetailResponse::class.java)

    suspend fun getMockTestQuestions(testId: String): MockTestQuestionsResponse =
        get(
            "/api/gate-cse/mock-test/${enc(testId)}/questions",
            MockTestQuestionsResponse::class.java,
        )

    /** Legacy submit is deprecated (HTTP 410). Native attempt scores locally. */
    suspend fun submitMockTestLegacy(payload: Map<String, Any?>): MockSubmitResponse =
        post("/api/gate-cse/mock-test/submit", payload, MockSubmitResponse::class.java)

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

    private fun enc(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.toString())

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
