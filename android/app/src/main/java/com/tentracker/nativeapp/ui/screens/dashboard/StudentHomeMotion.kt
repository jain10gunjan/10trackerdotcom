package com.tentracker.nativeapp.ui.screens.dashboard

import android.content.Context
import android.view.accessibility.AccessibilityManager
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import kotlinx.coroutines.delay

/**
 * Web `guestMotion` / `studentHomeBrand` tokens mirrored in Compose:
 * - easeOut `[0.22, 1, 0.36, 1]`
 * - enter() / hero: opacity 0→1, y 16→0, duration 500ms, delays 0 / 40 / 80 / 120 / 160 / 200
 * - revealProps: y 18→0, duration 500ms, child delay 60ms
 * - staggerItem: y 16→0, duration 450ms, delay 60ms * index
 * - useCountUp: 1000ms ease-out cubic
 */
val StudentHomeEaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

/** Approximates web count-up `1 - Math.pow(1 - t, 3)`. */
private val StudentCountUpEase = CubicBezierEasing(0.33f, 1f, 0.68f, 1f)

internal val StudentGutter = 16.dp
/** Web `space-y-9` (mobile body sections). */
internal val StudentSectionSpacing = 36.dp
/** Web hero / pulse `pb-8`. */
internal val StudentHeroBottomPad = 32.dp
internal val StudentPulseBottomPad = 32.dp
/** Web body `pb-16`. */
internal val StudentBodyBottomPad = 64.dp

internal const val StudentEnterDurationMs = 500
internal const val StudentStaggerDurationMs = 450
internal const val StudentStaggerStepMs = 60
internal const val StudentRevealChildDelayMs = 60
internal const val StudentCountUpDurationMs = 1000

@Composable
fun rememberStudentMotionEnabled(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        am?.isEnabled != true || !am.isTouchExplorationEnabled
    }
}

/**
 * Hero entrance — web `enter(delay)`: opacity 0→1, y 16→0, 500ms easeOut.
 */
@Composable
fun StudentFadeInUp(
    play: Boolean,
    delayMillis: Int = 0,
    yDp: Dp = 16.dp,
    durationMillis: Int = StudentEnterDurationMs,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val motion = rememberStudentMotionEnabled()
    val density = LocalDensity.current
    val offsetPx = with(density) { yDp.roundToPx() }
    var visible by remember(play, motion) { mutableStateOf(!motion) }
    LaunchedEffect(play, motion) {
        if (!motion) {
            visible = true
            return@LaunchedEffect
        }
        if (play) {
            if (delayMillis > 0) delay(delayMillis.toLong())
            visible = true
        } else {
            visible = false
        }
    }
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = fadeIn(animationSpec = tween(durationMillis, easing = StudentHomeEaseOut)) +
            slideInVertically(
                animationSpec = tween(durationMillis, easing = StudentHomeEaseOut),
                initialOffsetY = { offsetPx },
            ),
    ) {
        content()
    }
}

/**
 * Scroll-section reveal — web `revealProps`: opacity 0→1, y 18→0, 500ms.
 */
@Composable
fun StudentRevealBlock(
    visible: Boolean,
    delayMillis: Int = 0,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val motion = rememberStudentMotionEnabled()
    val density = LocalDensity.current
    val offsetPx = with(density) { 18.dp.roundToPx() }
    var shown by remember(visible, motion) { mutableStateOf(!motion) }
    LaunchedEffect(visible, motion) {
        if (!motion) {
            shown = true
            return@LaunchedEffect
        }
        if (visible) {
            if (delayMillis > 0) delay(delayMillis.toLong())
            shown = true
        }
    }
    AnimatedVisibility(
        visible = shown,
        modifier = modifier,
        enter = fadeIn(animationSpec = tween(StudentEnterDurationMs, easing = StudentHomeEaseOut)) +
            slideInVertically(
                animationSpec = tween(StudentEnterDurationMs, easing = StudentHomeEaseOut),
                initialOffsetY = { offsetPx },
            ),
    ) {
        content()
    }
}

/**
 * Staggered list child — web `staggerItem`: delay 60ms * index, duration 450ms, y 16.
 */
@Composable
fun StudentStaggerItem(
    index: Int,
    play: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    StudentFadeInUp(
        play = play,
        delayMillis = StudentStaggerStepMs * index,
        yDp = 16.dp,
        durationMillis = StudentStaggerDurationMs,
        modifier = modifier,
        content = content,
    )
}

/** Count-up for pulse stats (web `useCountUp`, 1s ease-out cubic). */
@Composable
fun rememberStudentCountUp(target: Int, play: Boolean): Int {
    val motion = rememberStudentMotionEnabled()
    if (!motion || !play) return target
    var fromZero by remember(target) { mutableStateOf(true) }
    LaunchedEffect(target, play) {
        if (play) {
            fromZero = true
            delay(80)
            fromZero = false
        }
    }
    val animated by animateIntAsState(
        targetValue = if (fromZero) 0 else target,
        animationSpec = tween(durationMillis = StudentCountUpDurationMs, easing = StudentCountUpEase),
        label = "studentCountUp",
    )
    return animated
}

/**
 * Hero ambient orbs — web StudentHomeHero motion.div blur blobs
 * (12s / 14s easeInOut drift + opacity pulse).
 */
@Composable
fun BoxScope.StudentHeroAmbientOrbs(modifier: Modifier = Modifier) {
    val motion = rememberStudentMotionEnabled()
    if (!motion) {
        Box(
            modifier = modifier
                .align(Alignment.TopEnd)
                .offset(x = (-36).dp, y = 48.dp)
                .size(220.dp)
                .alpha(0.4f)
                .blur(80.dp)
                .background(BrandSoft, CircleShape),
        )
        return
    }

    val transition = rememberInfiniteTransition(label = "studentHeroOrbs")
    val orbA by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12_000, easing = StudentHomeEaseOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orbA",
    )
    val orbB by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 14_000, easing = StudentHomeEaseOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orbB",
    )

    Box(
        modifier = modifier
            .align(Alignment.TopEnd)
            .offset(x = ((-20).dp + 20.dp * orbA), y = (24.dp + 14.dp * orbA))
            .size(256.dp)
            .alpha(0.3f + 0.2f * orbA)
            .blur(90.dp)
            .background(Brand.copy(alpha = 0.16f), CircleShape),
    )
    Box(
        modifier = Modifier
            .align(Alignment.TopStart)
            .offset(x = ((-8).dp - 16.dp * orbB), y = (120.dp + 18.dp * orbB))
            .size(200.dp)
            .alpha(0.2f + 0.15f * orbB)
            .blur(80.dp)
            .background(Color(0xFFBAE6FD).copy(alpha = 0.35f), CircleShape),
    )
}

/** Soft page wash matching web hero radial + linear gradients. */
@Composable
fun StudentHomeBackdrop(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFF8FAFC),
                            Color(0xFFF1F5F9),
                            Color(0xFFF5F5F5),
                        ),
                    ),
                ),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(BrandSoft.copy(alpha = 0.7f), Color.Transparent),
                        center = Offset(900f, 120f),
                        radius = 520f,
                    ),
                ),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFFF0F4FF).copy(alpha = 0.85f), Color.Transparent),
                        center = Offset(80f, 280f),
                        radius = 420f,
                    ),
                ),
        )
        StudentHeroAmbientOrbs()
    }
}
