package com.tentracker.nativeapp.ui.util

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.tentracker.nativeapp.data.ApiClient

/** MathJax 3 CDN — matches web practice (tex-chtml). */
private const val MATHJAX_SCRIPT = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"

/**
 * Full HTML document with MathJax 3 config aligned to web `mathJaxConfig`
 * (inline $...$ / \\(...\\), display $$...$$ / \\[...\\], processEscapes).
 */
fun buildMathHtmlDocument(
    bodyHtml: String,
    textSizePx: Float,
    textColor: String = "#171717",
    lineHeight: Float = 1.15f,
    bodyExtraCss: String = "",
): String {
    val bodyStyle = """
        margin:0;padding:0;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        color:$textColor;
        font-size:${textSizePx}px;
        line-height:$lineHeight;
        background:transparent;
        overflow:hidden;
        word-wrap:break-word;
        $bodyExtraCss
    """.trimIndent().replace('\n', ' ')

    return """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          img{max-width:100%;height:auto;}
          table{max-width:100%;}
          mjx-container{overflow-x:auto;max-width:100%;}
        </style>
        <script>
        window.MathJax = {
          tex: {
            inlineMath: [['$','$'], ['\\(','\\)']],
            displayMath: [['$$','$$'], ['\\[','\\]']],
            processEscapes: true
          },
          options: {
            enableMenu: false,
            messageStyle: 'none'
          },
          startup: {
            typeset: false,
            ready: function () {
              MathJax.startup.defaultReady();
              MathJax.startup.promise.then(function () {
                return MathJax.typesetPromise();
              }).then(function () {
                var h = Math.max(
                  document.body.scrollHeight,
                  document.documentElement.scrollHeight
                );
                if (window.MathHtmlBridge) {
                  MathHtmlBridge.onTypesetDone(h);
                }
              });
            }
          }
        };
        </script>
        <script id="MathJax-script" async src="$MATHJAX_SCRIPT"></script>
        </head>
        <body style="$bodyStyle">
        $bodyHtml
        </body>
        </html>
    """.trimIndent()
}

private class MathHtmlHeightBridge(
    private val onHeightPx: (Int) -> Unit,
) {
    @JavascriptInterface
    fun onTypesetDone(cssHeight: Double) {
        val px = cssHeight.toInt().coerceAtLeast(1)
        Handler(Looper.getMainLooper()).post { onHeightPx(px) }
    }
}

/**
 * Seek-safe WebView: no internal scroll; height from JS after MathJax typeset.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MathJaxHtmlContent(
    rawHtml: String,
    modifier: Modifier = Modifier,
    textSizeSp: Float = 15f,
    bodyExtraCss: String = "",
    canonicalize: Boolean = true,
) {
    val density = LocalDensity.current
    val textSizePx = with(density) { textSizeSp.dp.toPx() }
    val body = remember(rawHtml, canonicalize) {
        val src = if (canonicalize) canonicalizeQuestionHtml(rawHtml) ?: rawHtml else rawHtml
        src
    }
    val documentHtml = remember(body, textSizePx, bodyExtraCss) {
        buildMathHtmlDocument(body, textSizePx, bodyExtraCss = bodyExtraCss)
    }
    var contentHeightPx by remember { mutableIntStateOf(0) }
    val heightModifier = if (contentHeightPx > 0) {
        with(density) { Modifier.height(contentHeightPx.toDp()) }
    } else {
        Modifier.heightIn(min = 24.dp)
    }

    AndroidView(
        modifier = modifier.then(heightModifier),
        factory = { ctx ->
            WebView(ctx).apply {
                setBackgroundColor(Color.TRANSPARENT)
                background = null
                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false
                isNestedScrollingEnabled = false
                overScrollMode = View.OVER_SCROLL_NEVER
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.loadWithOverviewMode = false
                settings.useWideViewPort = true
                webViewClient = WebViewClient()
                addJavascriptInterface(
                    MathHtmlHeightBridge { px -> contentHeightPx = px },
                    "MathHtmlBridge",
                )
                setOnTouchListener { _, event ->
                    if (event.action == MotionEvent.ACTION_DOWN ||
                        event.action == MotionEvent.ACTION_MOVE
                    ) {
                        parent?.requestDisallowInterceptTouchEvent(false)
                    }
                    false
                }
            }
        },
        update = { webView ->
            contentHeightPx = 0
            webView.loadDataWithBaseURL(
                ApiClient.BASE_URL,
                documentHtml,
                "text/html",
                "UTF-8",
                null,
            )
        },
    )
}