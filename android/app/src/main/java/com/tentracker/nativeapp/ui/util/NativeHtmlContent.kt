package com.tentracker.nativeapp.ui.util

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.drawable.ColorDrawable
import android.text.Html
import android.graphics.drawable.Drawable
import android.text.method.LinkMovementMethod
import android.text.util.Linkify
import android.widget.TextView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.text.HtmlCompat
import coil.ImageLoader
import coil.request.ImageRequest
import coil.size.Scale
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted

private val articleInk = Ink
private val articleBody = Muted.copy(alpha = 0.85f)

private fun stripLatexForNativeHtml(html: String): String {
    var t = html
    t = t.replace(Regex("""<script[\s\S]*?</script>""", RegexOption.IGNORE_CASE), "")
    t = t.replace(Regex("""<style[\s\S]*?</style>""", RegexOption.IGNORE_CASE), "")
    t = t.replace(Regex("""\$\$([\s\S]*?)\$\$""")) {
        "<p><b>${escapeHtml(it.groupValues[1].trim())}</b></p>"
    }
    t = t.replace(Regex("""\$([^$<\n]+)\$""")) {
        "<i>${escapeHtml(it.groupValues[1].trim())}</i>"
    }
    t = t.replace(Regex("""\\\[([\s\S]*?)\\\]""")) {
        "<p><b>${escapeHtml(it.groupValues[1].trim())}</b></p>"
    }
    t = t.replace(Regex("""\\\(([\s\S]*?)\\\)""")) {
        "<i>${escapeHtml(it.groupValues[1].trim())}</i>"
    }
    return t
}

private fun escapeHtml(text: String): String =
    text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")

private class CoilImageGetter(
    private val context: Context,
    private val textView: TextView,
    private val loader: ImageLoader,
) : Html.ImageGetter {
    override fun getDrawable(source: String): Drawable {
        val placeholder = ColorDrawable(0xFFF5F5F5.toInt()).apply {
            setBounds(0, 0, textView.width.coerceAtLeast(280), 160)
        }
        val url = absoluteSiteUrl(source) ?: source
        val request = ImageRequest.Builder(context)
            .data(url)
            .scale(Scale.FIT)
            .target(
                onSuccess = { drawable ->
                    val maxW = textView.width.coerceAtLeast(280)
                    val intrinsicW = drawable.intrinsicWidth.coerceAtLeast(1)
                    val intrinsicH = drawable.intrinsicHeight.coerceAtLeast(1)
                    val scale = minOf(1f, maxW.toFloat() / intrinsicW.toFloat())
                    val w = (intrinsicW * scale).toInt()
                    val h = (intrinsicH * scale).toInt()
                    drawable.setBounds(0, 0, w, h)
                    textView.text = textView.text
                },
                onError = {
                    placeholder.setBounds(0, 0, textView.width.coerceAtLeast(280), 80)
                    textView.text = textView.text
                },
            )
            .build()
        loader.enqueue(request)
        return placeholder
    }
}

/**
 * Renders sanitized HTML in a TextView (no WebView). Used on articles / mocks login-adjacent flows.
 */
@SuppressLint("SetTextI18n")
@Composable
fun NativeHtmlContent(
    rawHtml: String,
    modifier: Modifier = Modifier,
    textSizeSp: Float = 15f,
    linkColorArgb: Int = articleInk.toArgb(),
    textColorArgb: Int = articleBody.toArgb(),
    canonicalize: Boolean = true,
    stripLatex: Boolean = true,
) {
    val context = LocalContext.current
    val loader = remember(context) { ImageLoader(context) }
    val prepared = remember(rawHtml, canonicalize, stripLatex) {
        val base = if (canonicalize) canonicalizeQuestionHtml(rawHtml) ?: rawHtml else rawHtml
        if (stripLatex) stripLatexForNativeHtml(base) else base
    }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            TextView(ctx).apply {
                movementMethod = LinkMovementMethod.getInstance()
                linksClickable = true
                autoLinkMask = Linkify.WEB_URLS
                setLinkTextColor(linkColorArgb)
            }
        },
        update = { tv ->
            tv.textSize = textSizeSp
            tv.setTextColor(textColorArgb)
            tv.setLineSpacing(0f, 1.35f)
            val imageGetter = CoilImageGetter(context, tv, loader)
            tv.text = HtmlCompat.fromHtml(
                prepared.ifBlank { "—" },
                HtmlCompat.FROM_HTML_MODE_COMPACT,
                imageGetter,
                null,
            )
        },
    )
}