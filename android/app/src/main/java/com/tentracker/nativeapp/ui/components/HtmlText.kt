package com.tentracker.nativeapp.ui.components

import android.graphics.Color
import android.util.TypedValue
import android.widget.TextView
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.text.HtmlCompat

@Composable
fun HtmlText(
    html: String,
    modifier: Modifier = Modifier,
    textSizeSp: Float = 15f,
) {
    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            TextView(ctx).apply {
                setTextColor(Color.parseColor("#171717"))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, textSizeSp)
                setLineSpacing(0f, 1.15f)
            }
        },
        update = { tv ->
            tv.text = HtmlCompat.fromHtml(
                html.ifBlank { "—" },
                HtmlCompat.FROM_HTML_MODE_COMPACT,
            )
        },
    )
}
