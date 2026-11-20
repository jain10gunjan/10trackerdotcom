package com.tentracker.nativeapp.ui.screens.dashboard

import android.content.Context
import android.view.accessibility.AccessibilityManager
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/** Web guestMotion / studentHomeBrand easeOut — [0.22, 1, 0.36, 1] */
val StudentHomeEaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

internal val StudentGutter = 16.dp
internal val StudentSectionSpacing = 36.dp
internal val StudentHeroBottomPad = 32.dp
internal val StudentPulseBottomPad = 32.dp

@Composable
fun rememberStudentMotionEnabled(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        am?.isEnabled != true || !am.isTouchExplorationEnabled
    }
}

/**
 * Hero / section entrance — opacity 0→1, y 16→0 (web enter() / revealProps).
 */
@Composable
fun StudentFadeInUp(
    play: Boolean,
    delayMillis: Int = 0,
    yPx: Int = 16,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val motion = rememberStudentMotionEnabled()
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
        enter = fadeIn(animationSpec = tween(500, easing = StudentHomeEaseOut)) +
            slideInVertically(
                animationSpec = tween(500, easing = StudentHomeEaseOut),
                initialOffsetY = { yPx },
            ),
    ) {
        content()
    }
}

/**
 * Scroll-section reveal — opacity 0→1, y 18→0 (web revealProps).
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
        enter = fadeIn(animationSpec = tween(500, easing = StudentHomeEaseOut)) +
            slideInVertically(
                animationSpec = tween(500, easing = StudentHomeEaseOut),
                initialOffsetY = { offsetPx },
            ),
    ) {
        content()
    }
}

/**
 * Staggered list child — delay 60ms * index (web staggerItem).
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
        delayMillis = 60 * index,
        yPx = 16,
        modifier = modifier,
        content = content,
    )
}

/** Count-up for pulse stats (web useCountUp, 1s ease-out cubic). */
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
        animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
        label = "studentCountUp",
    )
    return animated
}