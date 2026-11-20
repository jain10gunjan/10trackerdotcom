package com.tentracker.nativeapp.ui.util

import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.OgResource

fun absoluteSiteUrl(pathOrUrl: String?): String? {
    if (pathOrUrl.isNullOrBlank()) return null
    return if (pathOrUrl.startsWith("http")) pathOrUrl
    else ApiClient.BASE_URL.trimEnd('/') + (if (pathOrUrl.startsWith("/")) pathOrUrl else "/$pathOrUrl")
}

fun resourceOpenUrl(resource: OgResource, pathSlug: String): String? {
    val type = resource.type.uppercase()
    val meta = resource.meta.orEmpty()
    return when (type) {
        "VIDEO" -> null // handled in-app
        "PRACTICE_CHAPTER" -> {
            val area = slug(meta["area"] ?: meta["category"])
            val subject = slug(meta["subject"])
            val chapter = slug(meta["chapter"])
            val built = if (area != null && subject != null && chapter != null) {
                "/$area/$subject/$chapter/practice"
            } else resource.externalUrl
            appendOg(built, pathSlug, resource.id)
        }
        "MOCK_TEST" -> {
            val exam = slug(meta["examCategory"] ?: meta["category"])
            val testId = (meta["testId"] ?: meta["test_id"])?.toString()?.trim().orEmpty()
            val built = if (!exam.isNullOrBlank() && testId.isNotBlank()) {
                "/mock-test/$exam/attempt/$testId"
            } else resource.externalUrl
            appendOg(built, pathSlug, resource.id)
        }
        else -> absoluteSiteUrl(resource.externalUrl)
    }?.let { absoluteSiteUrl(it) }
}

private fun slug(raw: Any?): String? {
    val s = raw?.toString()?.trim()?.lowercase() ?: return null
    if (s.isBlank()) return null
    return s.replace(Regex("[^a-z0-9]+"), "-").trim('-')
}

private fun appendOg(url: String?, pathSlug: String, resourceId: String): String? {
    if (url.isNullOrBlank()) return null
    val join = if (url.contains("?")) "&" else "?"
    return "$url${join}from=og&path=${pathSlug}&rid=$resourceId"
}
