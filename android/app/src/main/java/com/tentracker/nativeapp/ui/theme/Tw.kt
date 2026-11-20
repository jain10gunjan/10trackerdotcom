package com.tentracker.nativeapp.ui.theme

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Tailwind-aligned design tokens for Compose (1 spacing unit = 4.dp).
 *
 * Mapping examples from the web app:
 * - `px-4` → [Modifier.px4] or `Modifier.padding(horizontal = Tw.Space.s4)`
 * - `gap-3` → `Arrangement.spacedBy(Tw.Space.s3)` or [Modifier.gap3] on a parent
 * - `rounded-2xl` → `RoundedCornerShape(Tw.Radius.r2xl)` or [Tw.Radius.shape2xl]
 * - `bg-neutral-50` → `Modifier.background(Neutral50)` or [MaterialTheme] surface on [Bg]
 */
object Tw {

  object Space {
    val s0: Dp = 0.dp
    /** Tailwind `0.5` (2px). */
    val s0_5: Dp = 2.dp
    val s1: Dp = 4.dp
    /** Tailwind `1.5`. */
    val s1_5: Dp = 6.dp
    val s2: Dp = 8.dp
    /** Tailwind `2.5`. */
    val s2_5: Dp = 10.dp
    val s3: Dp = 12.dp
    /** Tailwind `3.5`. */
    val s3_5: Dp = 14.dp
    val s4: Dp = 16.dp
    val s5: Dp = 20.dp
    val s6: Dp = 24.dp
    val s7: Dp = 28.dp
    val s8: Dp = 32.dp
    val s9: Dp = 36.dp
    val s10: Dp = 40.dp
    val s11: Dp = 44.dp
    val s12: Dp = 48.dp
    val s14: Dp = 56.dp
    val s16: Dp = 64.dp
  }

  object Radius {
    val sm: Dp = 2.dp
    val md: Dp = 6.dp
    val lg: Dp = 8.dp
    val xl: Dp = 12.dp
    val r2xl: Dp = 16.dp
    val r3xl: Dp = 24.dp
    val full: Dp = 999.dp

    val shapeSm = RoundedCornerShape(sm)
    val shapeMd = RoundedCornerShape(md)
    val shapeLg = RoundedCornerShape(lg)
    val shapeXl = RoundedCornerShape(xl)
    val shape2xl = RoundedCornerShape(r2xl)
    val shape3xl = RoundedCornerShape(r3xl)
    val shapeFull = RoundedCornerShape(full)
  }

  object Type {
    val textXs = 12.sp
    val sm = 14.sp
    val base = 16.sp
    val lg = 18.sp
    val xl = 20.sp
    /** Tailwind `text-2xl`. */
    val text2xl = 24.sp
    /** Tailwind `text-3xl`. */
    val text3xl = 30.sp
    /** Tailwind `text-4xl`. */
    val text4xl = 36.sp

    val normal = FontWeight.Normal
    val medium = FontWeight.Medium
    val semibold = FontWeight.SemiBold
    val bold = FontWeight.Bold

    fun textStyle(
      sizeSp: androidx.compose.ui.unit.TextUnit = base,
      weight: FontWeight = normal,
      color: Color = Ink,
    ): TextStyle =
      TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = weight,
        fontSize = sizeSp,
        color = color,
      )

    val styleXs = textStyle(textXs)
    val styleSm = textStyle(sm)
    val styleBase = textStyle(base)
    val styleLg = textStyle(lg)
    val styleXl = textStyle(xl)
    val style2xl = textStyle(text2xl, bold)
    val style3xl = textStyle(text3xl, bold)
    val style4xl = textStyle(text4xl, bold)
  }
}

/** Convenience [Modifier] helpers mirroring common Tailwind padding utilities. */
object TwModifiers {
  fun Modifier.px1() = padding(horizontal = Tw.Space.s1)
  fun Modifier.px2() = padding(horizontal = Tw.Space.s2)
  fun Modifier.px3() = padding(horizontal = Tw.Space.s3)
  fun Modifier.px4() = padding(horizontal = Tw.Space.s4)
  fun Modifier.py1() = padding(vertical = Tw.Space.s1)
  fun Modifier.py2() = padding(vertical = Tw.Space.s2)
  fun Modifier.py2_5() = padding(vertical = Tw.Space.s2_5)
  fun Modifier.py3() = padding(vertical = Tw.Space.s3)
  fun Modifier.p3() = padding(Tw.Space.s3)
  fun Modifier.p4() = padding(Tw.Space.s4)

  fun paddingPx4(): PaddingValues = PaddingValues(horizontal = Tw.Space.s4)
}

/** Alias for `rounded-2xl` → [Tw.Radius.shape2xl]. */
fun rounded2xl(): Shape = Tw.Radius.shape2xl