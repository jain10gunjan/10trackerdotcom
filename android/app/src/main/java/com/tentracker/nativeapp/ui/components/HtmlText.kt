package com.tentracker.nativeapp.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.tentracker.nativeapp.ui.util.MathJaxHtmlContent

@Composable
fun HtmlText(
    html: String,
    modifier: Modifier = Modifier,
    textSizeSp: Float = 15f,
) {
    MathJaxHtmlContent(
        rawHtml = html.ifBlank { "—" },
        modifier = modifier,
        textSizeSp = textSizeSp,
    )
}