package com.tentracker.nativeapp.ui.motion

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/** Matches web `easeOut` — [0.22, 1, 0.36, 1]. */
val OgEaseOut = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

/**
 * Framer-style entrance: opacity 0→1 + y slide.
 * Defaults match OG Trackers hero (`duration: 0.5`, `y: 16`, easeOut).
 * Mock hub header uses [durationMillis]=350; tab panels use 250 + [fromOffsetY]=8.dp.
 */
@Composable
fun OgFadeSlideIn(
    delayMillis: Int = 0,
    durationMillis: Int = 500,
    fromOffsetY: Dp = 16.dp,
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    var armed by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        if (delayMillis > 0) delay(delayMillis.toLong())
        armed = true
    }
    val alpha by animateFloatAsState(
        targetValue = if (armed) 1f else 0f,
        animationSpec = tween(durationMillis = durationMillis, easing = OgEaseOut),
        label = "ogAlpha",
    )
    val offsetY by animateDpAsState(
        targetValue = if (armed) 0.dp else fromOffsetY,
        animationSpec = tween(durationMillis = durationMillis, easing = OgEaseOut),
        label = "ogOffset",
    )
    Box(modifier = modifier.alpha(alpha).offset(y = offsetY), content = content)
}

@Composable
fun OgHeroAmbientOrbs(brandBlue: Color, modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "ogHeroOrbs")
    val driftX by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12_000, easing = OgEaseOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orbX",
    )
    val driftY by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 14_000, easing = OgEaseOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orbY",
    )
    val orbAlpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12_000, easing = OgEaseOut),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orbAlpha",
    )

    Box(modifier = modifier) {
        Box(
            modifier = Modifier
                .size(220.dp)
                .offset(x = (12 + driftX * 20).dp, y = (4 + driftY * 14).dp)
                .align(androidx.compose.ui.Alignment.TopEnd)
                .blur(80.dp)
                .alpha(orbAlpha)
                .clip(CircleShape)
                .background(brandBlue.copy(alpha = 0.16f)),
        )
        Box(
            modifier = Modifier
                .size(180.dp)
                .offset(x = (4 - driftY * 16).dp, y = (72 + driftX * 18).dp)
                .align(androidx.compose.ui.Alignment.TopStart)
                .blur(70.dp)
                .alpha(orbAlpha * 0.85f)
                .clip(CircleShape)
                .background(Color(0xFFBAE6FD).copy(alpha = 0.4f)),
        )
    }
}

@Composable
fun OgShimmerBlock(
    modifier: Modifier = Modifier,
    height: Dp = 16.dp,
    corner: Dp = 12.dp,
) {
    val transition = rememberInfiniteTransition(label = "ogShimmer")
    val phase by transition.animateFloat(
        initialValue = -1f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1400, easing = OgEaseOut),
            repeatMode = RepeatMode.Restart,
        ),
        label = "shimmerPhase",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(corner))
            .background(Color(0xB3E5E5E5)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.45f)
                .fillMaxHeight()
                .offset(x = (phase * 280).dp)
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.White.copy(alpha = 0.55f),
                            Color.Transparent,
                        ),
                    ),
                ),
        )
    }
}