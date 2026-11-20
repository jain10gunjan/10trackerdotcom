package com.tentracker.nativeapp.ui.util

import android.net.Uri
import com.tentracker.nativeapp.data.ApiClient
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/** Maps https://10tracker.com links to in-app destinations; leftovers use Browser. */
sealed class AppDestination {
    data object MainHome : AppDestination()
    data object MainExams : AppDestination()
    data object MainTrackers : AppDestination()
    data object MainUpdates : AppDestination()
    data object MainMore : AppDestination()
    data object Login : AppDestination()
    data object Roadmaps : AppDestination()
    data class Path(val slug: String) : AppDestination()
    data class Exam(val slug: String, val name: String) : AppDestination()
    data class Article(val slug: String) : AppDestination()
    data class Practice(
        val category: String,
        val subject: String,
        val chapter: String,
        val title: String,
    ) : AppDestination()
    data class Mocks(val category: String, val title: String) : AppDestination()
    data class Browser(val url: String, val title: String? = null) : AppDestination()
}

fun isTenTrackerHost(host: String?): Boolean {
    val h = host?.lowercase()?.removePrefix("www.") ?: return false
    return h == "10tracker.com"
}

fun resolveDeepLink(uri: Uri?): AppDestination? {
    if (uri == null) return null
    val scheme = uri.scheme?.lowercase()
    if (scheme != "http" && scheme != "https") return null
    if (!isTenTrackerHost(uri.host)) return null

    val segments = uri.pathSegments.orEmpty().filter { it.isNotBlank() }
    if (segments.isEmpty()) return AppDestination.MainHome

    return when (segments[0].lowercase()) {
        "sign-in", "login" -> AppDestination.Login
        "roadmaps" -> when {
            segments.size == 1 -> AppDestination.Roadmaps
            else -> AppDestination.Browser(uri.toString(), "Roadmaps")
        }
        "og-trackers" -> when {
            segments.size == 1 -> AppDestination.MainTrackers
            segments.size >= 2 && segments[1].equals("exam", true) -> {
                val slug = segments.getOrNull(2).orEmpty()
                if (slug.isBlank()) AppDestination.MainExams
                else AppDestination.Exam(slug, slug.replace('-', ' '))
            }
            segments.size >= 2 && !segments[1].equals("settings", true) -> {
                AppDestination.Path(segments[1])
            }
            else -> AppDestination.Browser(uri.toString(), "OG Trackers")
        }
        "exams" -> when {
            segments.size == 1 -> AppDestination.MainExams
            else -> {
                val slug = segments[1]
                AppDestination.Exam(slug, slug.replace('-', ' '))
            }
        }
        "mock-test" -> when {
            segments.size == 1 -> AppDestination.Browser(uri.toString(), "Mock tests")
            segments.size >= 2 && !segments[1].equals("leaderboard", true) -> {
                val slug = segments[1]
                AppDestination.Mocks(slug, slug.replace('-', ' '))
            }
            else -> AppDestination.Browser(uri.toString(), "Mock tests")
        }
        "articles" -> when {
            segments.size == 1 -> AppDestination.MainUpdates
            segments.size >= 2 && !segments[1].equals("category", true) -> {
                AppDestination.Article(segments[1])
            }
            else -> AppDestination.Browser(uri.toString(), "Articles")
        }
        "article" -> AppDestination.Browser(uri.toString(), "Articles")
        else -> {
            // category/subject/chapter/practice -> native practice
            if (segments.size >= 4 && segments[3].equals("practice", true)) {
                val category = segments[0]
                val subject = segments[1]
                val chapter = segments[2]
                AppDestination.Practice(
                    category = category,
                    subject = subject,
                    chapter = chapter,
                    title = chapter.replace('-', ' '),
                )
            } else {
                AppDestination.Browser(uri.toString(), browserTitleForPath(segments[0]))
            }
        }
    }
}

fun browserRoute(url: String, title: String? = null): String {
    val encUrl = URLEncoder.encode(url, StandardCharsets.UTF_8.toString())
    val encTitle = URLEncoder.encode(title.orEmpty(), StandardCharsets.UTF_8.toString())
    return "browser/$encUrl/$encTitle"
}

fun absoluteOrSiteUrl(pathOrUrl: String): String {
    return absoluteSiteUrl(pathOrUrl) ?: (ApiClient.BASE_URL.trimEnd('/') + "/")
}

private fun browserTitleForPath(first: String): String = when (first.lowercase()) {
    "pricing" -> "Pricing"
    "roadmaps" -> "Roadmaps"
    "mock-test" -> "Mock tests"
    "checkout" -> "Checkout"
    "profile" -> "Profile"
    "practice" -> "Practice"
    else -> first.replace('-', ' ').replaceFirstChar { it.uppercase() }
}
