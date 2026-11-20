package com.tentracker.nativeapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Brand = Color(0xFF3F5EB9)
val BrandSoft = Color(0xFFE8EDF8)
val SheetActiveText = Color(0xFF1E2F6B)
val Bg = Color(0xFFF8FAFC)
val SurfaceMuted = Color(0xFFFAFAFA)
val Ink = Color(0xFF171717)
val Muted = Color(0xFF737373)
val Border = Color(0xFFE5E5E5)
val Emerald = Color(0xFF059669)
val EmeraldDark = Color(0xFF065F46)
val EmeraldSoft = Color(0xFFECFDF5)
val EmeraldBorder = Color(0xFFD1FAE5)
val AmberCoin = Color(0xFFD97706)

private val colors = lightColorScheme(
    primary = Brand,
    onPrimary = Color.White,
    secondary = Brand,
    background = Bg,
    surface = Color.White,
    onBackground = Ink,
    onSurface = Ink,
    outline = Border,
)

private val typography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 34.sp,
        lineHeight = 40.sp,
        color = Ink,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        color = Ink,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        color = Ink,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = Ink,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = Muted,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        color = Muted,
        letterSpacing = 0.6.sp,
    ),
)

@Composable
fun TenTrackerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, typography = typography, content = content)
}
