package com.tentracker.nativeapp.ui.components

import android.widget.ImageView
import android.widget.TextView
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.text.HtmlCompat
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.util.canonicalizeQuestionHtml
import ru.noties.jlatexmath.JLatexMathDrawable

private sealed class ContentSegment {
    data class HtmlBlock(val text: String) : ContentSegment()
    data class LatexBlock(val tex: String, val display: Boolean) : ContentSegment()
}

private fun splitHtmlAndLatex(input: String): List<ContentSegment> {
    val out = mutableListOf<ContentSegment>()
    val html = StringBuilder()
    var i = 0

    fun flushHtml() {
        if (html.isNotEmpty()) {
            out.add(ContentSegment.HtmlBlock(html.toString()))
            html.clear()
        }
    }

    while (i < input.length) {
        when {
            i + 1 < input.length && input[i] == '$' && input[i + 1] == '$' -> {
                val end = input.indexOf("$$", i + 2)
                if (end < 0) {
                    html.append(input[i])
                    i++
                    continue
                }
                flushHtml()
                out.add(ContentSegment.LatexBlock(input.substring(i + 2, end).trim(), display = true))
                i = end + 2
            }
            input[i] == '$' -> {
                val end = input.indexOf('$', i + 1)
                if (end < 0) {
                    html.append(input[i])
                    i++
                    continue
                }
                flushHtml()
                val tex = input.substring(i + 1, end).trim()
                if (tex.isNotEmpty()) {
                    out.add(ContentSegment.LatexBlock(tex, display = false))
                }
                i = end + 1
            }
            else -> {
                html.append(input[i])
                i++
            }
        }
    }
    flushHtml()
    if (out.isEmpty()) out.add(ContentSegment.HtmlBlock(input))
    return out
}

@Composable
fun HtmlText(
    html: String,
    modifier: Modifier = Modifier,
    textSizeSp: Float = 15f,
    canonicalize: Boolean = true,
) {
    val source = html.ifBlank { "—" }
    val canonical = remember(source, canonicalize) {
        if (canonicalize) canonicalizeQuestionHtml(source) ?: source else source
    }
    val segments = remember(canonical) { splitHtmlAndLatex(canonical) }
    val density = LocalDensity.current
    val textColor = Ink.toArgb()

    Column(modifier = modifier.fillMaxWidth()) {
        segments.forEachIndexed { index, segment ->
            key(index, segment) {
                when (segment) {
                    is ContentSegment.HtmlBlock -> {
                        if (segment.text.isNotBlank()) {
                            AndroidView(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .wrapContentHeight(),
                                factory = { ctx ->
                                    TextView(ctx).apply {
                                        setTextColor(textColor)
                                        textSize = textSizeSp
                                    }
                                },
                                update = { tv ->
                                    tv.text = HtmlCompat.fromHtml(
                                        segment.text,
                                        HtmlCompat.FROM_HTML_MODE_COMPACT,
                                    )
                                    tv.textSize = textSizeSp
                                },
                            )
                        }
                    }
                    is ContentSegment.LatexBlock -> {
                        val texPx = with(density) {
                            (textSizeSp * if (segment.display) 1.15f else 1f).sp.toPx()
                        }
                        val scroll = if (segment.display) rememberScrollState() else null
                        val segModifier = Modifier
                            .fillMaxWidth()
                            .wrapContentHeight()
                            .then(
                                if (scroll != null) Modifier.horizontalScroll(scroll) else Modifier,
                            )
                        AndroidView(
                            modifier = segModifier,
                            factory = { ctx ->
                                ImageView(ctx).apply { adjustViewBounds = true }
                            },
                            update = { iv ->
                                val drawable = runCatching {
                                    JLatexMathDrawable.builder(segment.tex)
                                        .textSize(texPx)
                                        .padding(4)
                                        .build()
                                }.getOrElse {
                                    JLatexMathDrawable.builder(latexUnicodeFallback(segment.tex))
                                        .textSize(texPx)
                                        .padding(4)
                                        .build()
                                }
                                iv.setImageDrawable(drawable)
                            },
                        )
                    }
                }
            }
        }
    }
}

private fun latexUnicodeFallback(tex: String): String {
    return tex
        .replace(Regex("""\\times\b"""), "×")
        .replace(Regex("""\\cdot\b"""), "·")
        .replace(Regex("""\\leq\b"""), "≤")
        .replace(Regex("""\\geq\b"""), "≥")
        .replace(Regex("""\\neq\b"""), "≠")
        .replace(Regex("""\\pm\b"""), "±")
        .replace(Regex("""\\infty\b"""), "∞")
        .replace(Regex("""\\alpha\b"""), "α")
        .replace(Regex("""\\beta\b"""), "β")
        .replace(Regex("""\\gamma\b"""), "γ")
        .replace(Regex("""\\delta\b"""), "δ")
        .replace(Regex("""\\theta\b"""), "θ")
        .replace(Regex("""\\pi\b"""), "π")
        .replace(Regex("""\\sum\b"""), "∑")
        .replace(Regex("""\\int\b"""), "∫")
        .replace(Regex("""\\sqrt\{([^}]*)\}"""), "√($1)")
        .replace(Regex("""\\frac\{([^}]*)\}\{([^}]*)\}"""), "($1)/($2)")
        .replace(Regex("""[{}\\]"""), "")
}