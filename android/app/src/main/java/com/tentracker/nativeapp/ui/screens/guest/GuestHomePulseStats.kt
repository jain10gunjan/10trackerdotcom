package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import java.text.NumberFormat

@Composable
fun GuestHomePulseStats(
    examCount: Int,
    roadmapCount: Int,
    questionCount: Int,
    modifier: Modifier = Modifier,
) {
    val animate = rememberGuestAnimate()
    val (revealModifier, show) = rememberGuestSectionRevealed(threshold = 0.4f)
    val questionTarget = if (questionCount >= 1000) questionCount / 1000 else questionCount
    val questionSuffix = if (questionCount >= 1000) "k+" else ""
    val roadmapLabel = if (roadmapCount > 0) roadmapCount.toString() else "Soon"

    val countedExams = rememberGuestCountUp(examCount, show && animate)
    val countedRoadmaps = rememberGuestCountUp(
        if (roadmapCount > 0) roadmapCount else 0,
        show && animate && roadmapCount > 0,
    )
    val countedQuestions = rememberGuestCountUp(questionTarget, show && animate)

    Box(
        modifier = modifier
            .then(revealModifier)
            .fillMaxWidth()
            .padding(horizontal = GuestGutter)
            .padding(bottom = 40.dp),
    ) {
        GuestRevealFadeSlide(show = show, animate = animate) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(Radius2xl))
                    .background(Color.White.copy(alpha = 0.92f))
                    .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(Radius2xl)),
            ) {
                if (animate && show) {
                    PulseStatsGlow(modifier = Modifier.align(Alignment.BottomCenter))
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    GuestStaggeredFadeSlide(show = show, animate = animate, index = 0) {
                        StatCell(
                            value = NumberFormat.getIntegerInstance().format(countedExams),
                            label = "Active exams",
                            accent = true,
                        )
                    }
                    GuestStaggeredFadeSlide(show = show, animate = animate, index = 1) {
                        StatCell(
                            value = if (roadmapCount > 0) {
                                NumberFormat.getIntegerInstance().format(countedRoadmaps)
                            } else {
                                roadmapLabel
                            },
                            label = "Study plans",
                            accent = false,
                        )
                    }
                    GuestStaggeredFadeSlide(show = show, animate = animate, index = 2) {
                        StatCell(
                            value = NumberFormat.getIntegerInstance().format(countedQuestions) + questionSuffix,
                            label = "Practice questions",
                            accent = false,
                        )
                    }
                    GuestStaggeredFadeSlide(show = show, animate = animate, index = 3) {
                        StatCell(value = "₹0", label = "Free to start", accent = false)
                    }
                }
            }
        }
    }
}

@Composable
private fun PulseStatsGlow(modifier: Modifier = Modifier) {
    val infinite = rememberInfiniteTransition(label = "pulseGlow")
    val alpha by infinite.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(tween(5500), RepeatMode.Reverse),
        label = "glowA",
    )
    val scaleX by infinite.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(tween(5500), RepeatMode.Reverse),
        label = "glowX",
    )
    Box(
        modifier = modifier
            .offset(y = 32.dp)
            .width(200.dp)
            .height(64.dp)
            .graphicsLayer {
                this.alpha = alpha
                this.scaleX = scaleX
            }
            .clip(RoundedCornerShape(50))
            .background(Brand.copy(alpha = 0.2f)),
    )
}

@Composable
private fun StatCell(value: String, label: String, accent: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(horizontal = 4.dp, vertical = 12.dp),
    ) {
        Text(
            text = value,
            fontSize = 22.sp,
            fontWeight = FontWeight.Black,
            color = if (accent) Brand else Ink,
        )
        Text(
            text = label.uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 1.sp,
            color = Muted,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}