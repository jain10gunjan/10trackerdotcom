package com.tentracker.nativeapp.ui.util

/**
 * Port of [canonicalizeQuestionContent.js] for consistent MathJax rendering.
 */
fun canonicalizeLatexTags(text: String?): String? {
    if (text.isNullOrEmpty()) return text
    var t = text
    t = t.replace(Regex("""\[latex\]""", RegexOption.IGNORE_CASE), "$")
    t = t.replace(Regex("""\[/latex\]""", RegexOption.IGNORE_CASE), "$")
    t = t.replace(Regex("""\\\(([\s\S]*?)\\\)""")) { m ->
        "$" + m.groupValues[1] + "$"
    }
    t = t.replace(Regex("""\\\[([\s\S]*?)\\\]""")) { m ->
        "$$" + m.groupValues[1] + "$$"
    }
    return t
}

fun canonicalizeQuestionHtml(html: String?): String? {
    if (html.isNullOrEmpty()) return html
    var t = canonicalizeLatexTags(html) ?: return html
    t = t.replace(Regex("""<p>\s*(?:&nbsp;|\s)*</p>""", RegexOption.IGNORE_CASE), "")
    t = t.replace(Regex("""<br\s*/?>""", RegexOption.IGNORE_CASE), "<br />")
    return t.trim()
}