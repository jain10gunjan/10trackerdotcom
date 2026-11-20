package com.tentracker.nativeapp.ui.util

/**
 * Accept raw video id or common YouTube URL shapes → 11-char id.
 * Mirrors website extractYouTubeVideoId.
 */
fun extractYouTubeVideoId(input: String?): String? {
    if (input.isNullOrBlank()) return null
    val raw = input.trim()
    if (RAW_ID.matches(raw)) return raw

    runCatching {
        val url = java.net.URI(raw).toURL()
        val host = url.host.removePrefix("www.")
        if (host == "youtu.be") {
            val id = url.path.trim('/').substringBefore('/')
            return id.takeIf { RAW_ID.matches(it) }
        }
        if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
            val v = url.query
                ?.split('&')
                ?.mapNotNull { part ->
                    val i = part.indexOf('=')
                    if (i <= 0) null else part.substring(0, i) to part.substring(i + 1)
                }
                ?.firstOrNull { it.first == "v" }
                ?.second
            if (v != null && RAW_ID.matches(v)) return v

            val parts = url.path.split('/').filter { it.isNotBlank() }
            val markers = setOf("embed", "shorts", "live", "v")
            for (i in 0 until parts.lastIndex) {
                if (parts[i] in markers && RAW_ID.matches(parts[i + 1])) return parts[i + 1]
            }
        }
    }

    return URL_ID.find(raw)?.groupValues?.getOrNull(1)
}

private val RAW_ID = Regex("^[\\w-]{11}$")
private val URL_ID = Regex("(?:v=|/embed/|/shorts/|youtu\\.be/)([\\w-]{11})")
