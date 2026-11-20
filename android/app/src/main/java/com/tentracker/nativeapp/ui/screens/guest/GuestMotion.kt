package com.tentracker.nativeapp.ui.screens.guest

import android.provider.Settings
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.max
import kotlin.math.min

internal val GuestEaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

@Composable
internal fun rememberGuestAnimate(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f,
        ) > 0f
    }
}

@Composable
internal fun rememberGuestSectionRevealed(threshold: Float = 0.25f): Pair<Modifier, Boolean> {
    var visible by remember { mutableStateOf(false) }
    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
    val screenHeightPx = with(density) { configuration.screenHeightDp.dp.toPx() }
    val modifier = Modifier.onGloballyPositioned { coords ->
        if (visible) return@onGloballyPositioned
        val bounds = coords.boundsInWindow()
        if (bounds.height <= 0f) return@onGloballyPositioned
        val visibleTop = max(0f, bounds.top)
        val visibleBottom = min(screenHeightPx, bounds.bottom)
        val visibleHeight = (visibleBottom - visibleTop).coerceAtLeast(0f)
        val ratio = visibleHeight / bounds.height
        if (ratio >= threshold) visible = true
    }
    return modifier to visible
}

@Composable
internal fun GuestRevealFadeSlide(
    show: Boolean,
    animate: Boolean,
    delayMillis: Int = 0,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val visible = show || !animate
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = fadeIn(tween(500, delayMillis, GuestEaseOut)) +
            slideInVertically(
                animationSpec = tween(500, delayMillis, GuestEaseOut),
                initialOffsetY = { it / 5 },
            ),
    ) {
        content()
    }
}

@Composable
internal fun GuestMountFadeSlide(
    animate: Boolean,
    delayMillis: Int,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    var shown by remember { mutableStateOf(!animate) }
    LaunchedEffect(animate, delayMillis) {
        if (!animate) {
            shown = true
            return@LaunchedEffect
        }
        if (delayMillis > 0) kotlinx.coroutines.delay(delayMillis.toLong())
        shown = true
    }
    AnimatedVisibility(
        visible = shown,
        modifier = modifier,
        enter = fadeIn(tween(500, easing = GuestEaseOut)) +
            slideInVertically(tween(500, easing = GuestEaseOut)) { it / 4 },
    ) {
        content()
    }
}

@Composable
internal fun <T> GuestAnimatedSwap(
    target: T,
    animate: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable (T) -> Unit,
) {
    if (!animate) {
        Box(modifier) { content(target) }
        return
    }
    AnimatedContent(
        targetState = target,
        modifier = modifier,
        transitionSpec = {
            (fadeIn(tween(280, easing = GuestEaseOut)) +
                slideInVertically(tween(280, easing = GuestEaseOut)) { it / 6 })
                .togetherWith(
                    fadeOut(tween(220, easing = GuestEaseOut)) +
                        slideOutVertically(tween(220, easing = GuestEaseOut)) { -it / 8 },
                )
        },
        label = "guestSwap",
    ) { state ->
        content(state)
    }
}

@Composable
internal fun GuestStaggeredFadeSlide(
    show: Boolean,
    animate: Boolean,
    index: Int,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val delayMillis = if (animate) (index * 60).coerceAtMost(400) else 0
    GuestRevealFadeSlide(show = show, animate = animate, delayMillis = delayMillis, modifier = modifier, content = content)
}

fun Modifier.guestPressScale(
    enabled: Boolean = true,
    pressedScale: Float = 0.99f,
): Modifier = composed {
    if (!enabled) return@composed this
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) pressedScale else 1f,
        animationSpec = spring(dampingRatio = 0.62f, stiffness = 380f),
        label = "guestPress",
    )
    this.scale(scale)
}

@Composable
internal fun rememberGuestCountUp(
    target: Int,
    active: Boolean,
    durationMillis: Int = 1100,
): Int {
    val animatable = remember { Animatable(0f) }
    LaunchedEffect(target, active) {
        if (!active) {
            animatable.snapTo(target.toFloat())
            return@LaunchedEffect
        }
        animatable.snapTo(0f)
        animatable.animateTo(
            target.toFloat(),
            animationSpec = tween(durationMillis, easing = FastOutSlowInEasing),
        )
    }
    return animatable.value.toInt()
}

@Composable
internal fun GuestFloatOrb(
    modifier: Modifier = Modifier,
    color: Color,
    animate: Boolean,
    durationMillis: Int = 12_000,
    driftXPx: Float = 20f,
    driftYPx: Float = 14f,
    blur: Dp = 80.dp,
) {
    if (!animate) {
        Box(
            modifier = modifier
                .blur(blur)
                .graphicsLayer { alpha = 0.4f },
        )
        return
    }
    val transition = rememberInfiniteTransition(label = "guestOrb")
    val driftX by transition.animateFloat(
        initialValue = 0f,
        targetValue = driftXPx,
        animationSpec = infiniteRepeatable(tween(durationMillis, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "orbX",
    )
    val driftY by transition.animateFloat(
        initialValue = 0f,
        targetValue = driftYPx,
        animationSpec = infiniteRepeatable(
            tween((durationMillis * 1.15f).toInt(), easing = FastOutSlowInEasing),
            RepeatMode.Reverse,
        ),
        label = "orbY",
    )
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(tween(durationMillis, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "orbA",
    )
    Box(
        modifier = modifier
            .graphicsLayer {
                translationX = driftX
                translationY = driftY
                this.alpha = alpha
            }
            .blur(blur),
    )
}

@Composable
internal fun rememberGuestPressInteractionSource(): MutableInteractionSource =
    remember { MutableInteractionSource() }

@Composable
internal fun rememberAnimatedProgress(
    target: Float,
    animate: Boolean,
    durationMillis: Int = 850,
): Float {
    val anim = remember { Animatable(0f) }
    LaunchedEffect(target, animate) {
        if (!animate) {
            anim.snapTo(target)
            return@LaunchedEffect
        }
        anim.snapTo(0f)
        anim.animateTo(target, tween(durationMillis, easing = GuestEaseOut))
    }
    return anim.value
}

@Composable
internal fun Modifier.guestStaggerScaleY(
    show: Boolean,
    animate: Boolean,
    index: Int,
): Modifier {
    if (!animate) return this
    val scaleYAnim = remember { Animatable(if (show) 1f else 0.3f) }
    LaunchedEffect(show, index) {
        if (show) {
            kotlinx.coroutines.delay((index * 40L).coerceAtMost(200))
            scaleYAnim.snapTo(0.3f)
            scaleYAnim.animateTo(1f, tween(350, easing = GuestEaseOut))
        }
    }
    return graphicsLayer {
        transformOrigin = TransformOrigin(0.5f, 1f)
        scaleY = scaleYAnim.value
        alpha = if (show) 1f else 0.4f
    }
}