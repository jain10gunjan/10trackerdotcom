package com.tentracker.nativeapp.ui.screens.guest

import android.content.Context
import android.view.accessibility.AccessibilityManager
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import kotlinx.coroutines.delay

/**
 * Port of web `guestMotion.js` + GuestHome* framer-motion values.
 *
 * Web easeOut cubic-bezier(0.22, 1, 0.36, 1).
 * revealProps: opacity 0→1, y 18→0, duration 500ms + delay.
 * staggerItem: opacity 0→1, y 16→0, duration 450ms, delay 60ms * i.
 * enter() (Hero): opacity 0→1, y 16→0, duration 500ms + delay.
 */
val GuestEaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

/** Web `easeInOut` used by ambient orb loops. */
val GuestEaseInOut = FastOutSlowInEasing

@Composable
fun rememberGuestMotionEnabled(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        am?.isEnabled != true || !am.isTouchExplorationEnabled
    }
}

/**
 * Hero enter() — opacity 0→1, y 16→0, duration 0.5s, easeOut.
 */
@Composable
fun GuestEnter(
    play: Boolean = true,
    delayMillis: Int = 0,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val motion = rememberGuestMotionEnabled()
    val density = LocalDensity.current
    val yPx = with(density) { 16.dp.roundToPx() }
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
        enter = fadeIn(animationSpec = tween(500, easing = GuestEaseOut)) +
            slideInVertically(
                animationSpec = tween(500, easing = GuestEaseOut),
                initialOffsetY = { yPx },
            ),
    ) {
        content()
    }
}

/**
 * Section revealProps — opacity 0→1, y 18→0, duration 0.5s, easeOut + delay.
 * LazyColumn items compose near viewport ≈ web useInView(amount).
 */
@Composable
fun GuestReveal(
    play: Boolean = true,
    delayMillis: Int = 0,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val motion = rememberGuestMotionEnabled()
    val density = LocalDensity.current
    val yPx = with(density) { 18.dp.roundToPx() }
    var visible by remember(play, motion) { mutableStateOf(!motion) }
    LaunchedEffect(play, motion) {
        if (!motion) {
            visible = true
            return@LaunchedEffect
        }
        if (play) {
            if (delayMillis > 0) delay(delayMillis.toLong())
            visible = true
        }
    }
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = fadeIn(animationSpec = tween(500, easing = GuestEaseOut)) +
            slideInVertically(
                animationSpec = tween(500, easing = GuestEaseOut),
                initialOffsetY = { yPx },
            ),
    ) {
        content()
    }
}

/**
 * staggerItem — opacity 0→1, y 16→0, duration 0.45s, delay 0.06 * index.
 */
@Composable
fun GuestStaggerItem(
    index: Int,
    play: Boolean = true,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val motion = rememberGuestMotionEnabled()
    val density = LocalDensity.current
    val yPx = with(density) { 16.dp.roundToPx() }
    var visible by remember(play, motion) { mutableStateOf(!motion) }
    LaunchedEffect(play, motion) {
        if (!motion) {
            visible = true
            return@LaunchedEffect
        }
        if (play) {
            delay((60 * index).toLong())
            visible = true
        }
    }
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = fadeIn(animationSpec = tween(450, easing = GuestEaseOut)) +
            slideInVertically(
                animationSpec = tween(450, easing = GuestEaseOut),
                initialOffsetY = { yPx },
            ),
    ) {
        content()
    }
}

/** Web useCountUp — 1100ms, ease-out cubic (1 - (1-t)^3). */
@Composable
fun rememberGuestCountUp(target: Int, play: Boolean, durationMillis: Int = 1100): Int {
    val motion = rememberGuestMotionEnabled()
    if (!motion || !play) return target
    var fromZero by remember(target) { mutableStateOf(true) }
    LaunchedEffect(target, play) {
        if (play) {
            fromZero = true
            delay(16)
            fromZero = false
        }
    }
    val animated by animateIntAsState(
        targetValue = if (fromZero) 0 else target,
        animationSpec = tween(durationMillis = durationMillis, easing = GuestEaseOut),
        label = "guestCountUp",
    )
    return animated
}

/**
 * RotatingHook — interval 2600ms; enter y 90%→0 opacity 0→1;
 * exit y 0→-90% opacity 1→0; duration 0.32s easeOut.
 */
@Composable
fun GuestRotatingHook(
    hooks: List<String>,
    animate: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable (String) -> Unit,
) {
    var index by remember { mutableStateOf(0) }
    LaunchedEffect(animate, hooks) {
        if (!animate || hooks.isEmpty()) return@LaunchedEffect
        while (true) {
            delay(2600)
            index = (index + 1) % hooks.size
        }
    }
    val current = hooks.getOrElse(index) { hooks.firstOrNull().orEmpty() }
    if (!animate) {
        Box(modifier = modifier) { content(current) }
        return
    }
    AnimatedContent(
        targetState = current,
        modifier = modifier,
        transitionSpec = {
            (
                fadeIn(animationSpec = tween(320, easing = GuestEaseOut)) +
                    slideInVertically(
                        animationSpec = tween(320, easing = GuestEaseOut),
                        initialOffsetY = { (it * 0.9f).toInt() },
                    )
                ) togetherWith (
                fadeOut(animationSpec = tween(320, easing = GuestEaseOut)) +
                    slideOutVertically(
                        animationSpec = tween(320, easing = GuestEaseOut),
                        targetOffsetY = { -(it * 0.9f).toInt() },
                    )
                )
        },
        label = "guestRotatingHook",
    ) { text ->
        content(text)
    }
}

/**
 * Feature showcase scene swap — enter opacity/y 12, exit opacity/y -10, duration 0.32s.
 */
@Composable
fun <T> GuestSceneSwap(
    key: T,
    animate: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable (T) -> Unit,
) {
    if (!animate) {
        Box(modifier = modifier) { content(key) }
        return
    }
    AnimatedContent(
        targetState = key,
        modifier = modifier,
        transitionSpec = {
            (
                fadeIn(animationSpec = tween(320, easing = GuestEaseOut)) +
                    slideInVertically(
                        animationSpec = tween(320, easing = GuestEaseOut),
                        initialOffsetY = { 12 },
                    )
                ) togetherWith (
                fadeOut(animationSpec = tween(320, easing = GuestEaseOut)) +
                    slideOutVertically(
                        animationSpec = tween(320, easing = GuestEaseOut),
                        targetOffsetY = { -10 },
                    )
                )
        },
        label = "guestSceneSwap",
    ) { current ->
        content(current)
    }
}

/**
 * Scene title swap — enter opacity/y 8, exit opacity/y -6, duration 0.28s.
 */
@Composable
fun GuestTitleSwap(
    title: String,
    animate: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable (String) -> Unit,
) {
    if (!animate) {
        Box(modifier = modifier) { content(title) }
        return
    }
    AnimatedContent(
        targetState = title,
        modifier = modifier,
        transitionSpec = {
            (
                fadeIn(animationSpec = tween(280, easing = GuestEaseOut)) +
                    slideInVertically(
                        animationSpec = tween(280, easing = GuestEaseOut),
                        initialOffsetY = { 8 },
                    )
                ) togetherWith (
                fadeOut(animationSpec = tween(280, easing = GuestEaseOut)) +
                    slideOutVertically(
                        animationSpec = tween(280, easing = GuestEaseOut),
                        targetOffsetY = { -6 },
                    )
                )
        },
        label = "guestTitleSwap",
    ) { t ->
        content(t)
    }
}

/** Hero ambient orbs — 12s / 14s easeInOut loops (web GuestHomeHero). */
@Composable
fun GuestHeroAmbientOrbs(modifier: Modifier = Modifier) {
    val motion = rememberGuestMotionEnabled()
    val transition = rememberInfiniteTransition(label = "guestHeroOrbs")
    val phaseA by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(12_000, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "heroOrbA",
    )
    val phaseB by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(14_000, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "heroOrbB",
    )
    val alphaA by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(12_000, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "heroOrbAlphaA",
    )
    val alphaB by transition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(14_000, delayMillis = 500, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "heroOrbAlphaB",
    )
    Box(modifier = modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .size(220.dp)
                .offset(
                    x = if (motion) (phaseA * 20).dp else 40.dp,
                    y = if (motion) (phaseA * 14).dp else 20.dp,
                )
                .align(Alignment.TopEnd)
                .blur(80.dp)
                .alpha(if (motion) alphaA else 0.4f)
                .clip(CircleShape)
                .background(if (motion) Brand.copy(alpha = 0.16f) else BrandSoft),
        )
        if (motion) {
            Box(
                modifier = Modifier
                    .size(180.dp)
                    .offset(x = (-phaseB * 16).dp, y = (72 + phaseB * 18).dp)
                    .align(Alignment.TopStart)
                    .blur(70.dp)
                    .alpha(alphaB)
                    .clip(CircleShape)
                    .background(Color(0xFFBAE6FD).copy(alpha = 0.4f)),
            )
        }
    }
}

/** Close-band ambient orbs — 10s / 12s easeInOut (web GuestHomeCloseBand). */
@Composable
fun GuestCloseBandOrbs(modifier: Modifier = Modifier) {
    val motion = rememberGuestMotionEnabled()
    val transition = rememberInfiniteTransition(label = "guestCloseOrbs")
    val phaseA by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(10_000, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "closeOrbA",
    )
    val phaseB by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(12_000, delayMillis = 400, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "closeOrbB",
    )
    val alphaA by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(10_000, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "closeOrbAlphaA",
    )
    val alphaB by transition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(12_000, delayMillis = 400, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "closeOrbAlphaB",
    )
    Box(modifier = modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .size(220.dp)
                .offset(
                    x = if (motion) (phaseA * 18).dp else 0.dp,
                    y = if (motion) (phaseA * 12).dp else 0.dp,
                )
                .align(Alignment.TopEnd)
                .blur(80.dp)
                .alpha(if (motion) alphaA else 0.4f)
                .clip(CircleShape)
                .background(Brand.copy(alpha = if (motion) 0.33f else 0.25f)),
        )
        if (motion) {
            Box(
                modifier = Modifier
                    .size(180.dp)
                    .offset(x = (-phaseB * 12).dp, y = (phaseB * 16).dp)
                    .align(Alignment.BottomStart)
                    .blur(70.dp)
                    .alpha(alphaB)
                    .clip(CircleShape)
                    .background(Color(0xFF38BDF8).copy(alpha = 0.2f)),
            )
        }
    }
}

/** Pulse stats glow — opacity [0.35,0.55,0.35] scaleX [0.92,1.05,0.92] 5.5s. */
@Composable
fun GuestPulseGlow(modifier: Modifier = Modifier) {
    val motion = rememberGuestMotionEnabled()
    if (!motion) return
    val transition = rememberInfiniteTransition(label = "guestPulseGlow")
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(5500, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulseGlowAlpha",
    )
    val scaleX by transition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(5500, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulseGlowScale",
    )
    Box(
        modifier = modifier
            .scale(scaleX = scaleX, scaleY = 1f)
            .alpha(alpha)
            .blur(24.dp)
            .clip(CircleShape)
            .background(Brand.copy(alpha = 0.2f)),
    )
}

/** Animated progress fraction with easeOut (web bars / rails). */
@Composable
fun rememberGuestProgress(
    target: Float,
    play: Boolean,
    durationMillis: Int = 700,
    initial: Float = 0f,
): Float {
    val motion = rememberGuestMotionEnabled()
    var armed by remember(target, play) { mutableStateOf(!motion || !play) }
    LaunchedEffect(target, play, motion) {
        if (!motion || !play) {
            armed = true
            return@LaunchedEffect
        }
        armed = false
        delay(16)
        armed = true
    }
    val value by animateFloatAsState(
        targetValue = if (armed) target else initial,
        animationSpec = tween(durationMillis = if (motion && play) durationMillis else 0, easing = GuestEaseOut),
        label = "guestProgress",
    )
    return value
}

/** scaleY bar grow — web DayPath / PathPanel (duration 0.35, delay 0.04*i). */
@Composable
fun rememberGuestBarScale(
    play: Boolean,
    index: Int,
    durationMillis: Int = 350,
    delayPerIndexMillis: Int = 40,
    initialScale: Float = 0.3f,
): Float {
    val motion = rememberGuestMotionEnabled()
    var armed by remember(play, motion) { mutableStateOf(!motion) }
    LaunchedEffect(play, motion) {
        if (!motion) {
            armed = true
            return@LaunchedEffect
        }
        if (play) {
            delay((delayPerIndexMillis * index).toLong())
            armed = true
        }
    }
    val scale by animateFloatAsState(
        targetValue = if (armed) 1f else initialScale,
        animationSpec = tween(durationMillis = if (motion) durationMillis else 0, easing = GuestEaseOut),
        label = "guestBarScale",
    )
    return scale
}

/** Streak flame pulse — scale [1,1.06,1] rotate [0,-4,0] duration 2.2s infinite. */
@Composable
fun rememberGuestFlamePulse(): Pair<Float, Float> {
    val motion = rememberGuestMotionEnabled()
    if (!motion) return 1f to 0f
    val transition = rememberInfiniteTransition(label = "guestFlame")
    val scale by transition.animateFloat(
        initialValue = 1f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1100, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "flameScale",
    )
    val rotate by transition.animateFloat(
        initialValue = 0f,
        targetValue = -4f,
        animationSpec = infiniteRepeatable(
            animation = tween(1100, easing = GuestEaseInOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "flameRotate",
    )
    return scale to rotate
}

/** Heatmap cell — opacity/scale 0.6→1, duration 0.28, delay 0.03*i. */
@Composable
fun rememberGuestHeatCell(play: Boolean, index: Int): Pair<Float, Float> {
    val motion = rememberGuestMotionEnabled()
    var armed by remember(play, motion) { mutableStateOf(!motion) }
    LaunchedEffect(play, motion) {
        if (!motion) {
            armed = true
            return@LaunchedEffect
        }
        if (play) {
            delay((30 * index).toLong())
            armed = true
        }
    }
    val alpha by animateFloatAsState(
        targetValue = if (armed) 1f else 0f,
        animationSpec = tween(durationMillis = if (motion) 280 else 0, easing = GuestEaseOut),
        label = "heatAlpha",
    )
    val scale by animateFloatAsState(
        targetValue = if (armed) 1f else 0.6f,
        animationSpec = tween(durationMillis = if (motion) 280 else 0, easing = GuestEaseOut),
        label = "heatScale",
    )
    return alpha to scale
}

/** Active prep card scale — web scale-[1.02], duration ~300ms. */
@Composable
fun rememberGuestActiveScale(active: Boolean): Float {
    val scale by animateFloatAsState(
        targetValue = if (active) 1.02f else 1f,
        animationSpec = tween(300, easing = GuestEaseOut),
        label = "prepActiveScale",
    )
    return scale
}

/** Tab pill indicator spring — stiffness 380, damping 32 (web layoutId hero-feature-pill). */
@Composable
fun rememberGuestTabPillWidth(active: Boolean, activeWidth: Dp = 22.dp, idleWidth: Dp = 6.dp): Dp {
    val width by animateDpAsState(
        targetValue = if (active) activeWidth else idleWidth,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = 380f,
        ),
        label = "tabPillWidth",
    )
    return width
}

/** MCQ confirm scale pulse — scale 1.02, duration 0.25s. */
@Composable
fun rememberGuestConfirmScale(confirmed: Boolean): Float {
    val scale by animateFloatAsState(
        targetValue = if (confirmed) 1.02f else 1f,
        animationSpec = tween(250, easing = GuestEaseOut),
        label = "mcqConfirmScale",
    )
    return scale
}
