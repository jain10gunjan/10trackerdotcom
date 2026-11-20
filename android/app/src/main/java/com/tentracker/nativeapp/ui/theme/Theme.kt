package com.tentracker.nativeapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Brand = Color(0xFF3F5EB9)
val BrandDark = Color(0xFF2F4A96)
val Bg = Color(0xFFF8FAFC)
val TextMuted = Color(0xFF737373)

private val colors = lightColorScheme(
    primary = Brand,
    onPrimary = Color.White,
    secondary = BrandDark,
    background = Bg,
    surface = Color.White,
    onBackground = Color(0xFF171717),
    onSurface = Color(0xFF171717),
)

@Composable
fun TenTrackerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, content = content)
}
