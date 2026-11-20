package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Tw
import kotlinx.coroutines.delay

private data class PrepStep(
    val id: String,
    val icon: ImageVector,
    val title: String,
    val description: String,
    val cta: String,
)

@Composable
fun GuestHomePrepLoop(
    onSignIn: () -> Unit,
    onOpenExams: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenWeb: (path: String, title: String?) -> Unit,
) {
    val animate = rememberGuestMotionEnabled()
    val steps = remember {
        listOf(
            PrepStep("mcqs", Icons.AutoMirrored.Filled.MenuBook, "Topic-wise MCQs", "Chapter-level practice with solutions across active exams.", "Browse exams"),
            PrepStep("mocks", Icons.Default.Assignment, "Mock tests", "Timed full-length tests with rankings and detailed review.", "Find mocks"),
            PrepStep("plans", Icons.Default.Map, "OG Tracker paths", "YouTube + coding paths with free preview days you can track.", "Explore paths"),
            PrepStep("extension", Icons.Default.PlayArrow, "YouTube sync", "Chrome extension syncs watch % into your path automatically.", "Connect extension"),
        )
    }
    var active by remember { mutableIntStateOf(0) }
    LaunchedEffect(animate) {
        if (!animate) return@LaunchedEffect
        while (true) {
            delay(2800)
            active = (active + 1) % steps.size
        }
    }
    // web progress rail: duration 0.45 easeOut
    val railProgress = rememberGuestProgress(
        target = (active + 1) / steps.size.toFloat(),
        play = animate,
        durationMillis = 450,
        initial = 0f,
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.radialGradient(
                    colors = listOf(BrandSoft, Color.Transparent),
                    radius = 600f,
                ),
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = GuestGutter)
                .padding(bottom = Tw.Space.s14),
        ) {
            GuestReveal(play = animate) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    GuestSectionEyebrow("How it works")
                    Text(
                        "Your prep loop on 10tracker",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = Tw.Space.s1_5),
                    )
                    Text(
                        "Practice, mock, follow a path, sync YouTube — the loop that keeps you coming back.",
                        fontSize = 14.sp,
                        color = Muted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = Tw.Space.s2),
                    )
                }
            }
            Spacer(modifier = Modifier.height(Tw.Space.s5))
            LinearProgressIndicator(
                progress = { railProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp),
                color = Brand,
                trackColor = Border,
            )
            Spacer(modifier = Modifier.height(Tw.Space.s3))
            steps.forEachIndexed { index, step ->
                val isActive = active == index
                val onClick: () -> Unit = when (step.id) {
                    "mcqs", "mocks" -> onOpenExams
                    "plans" -> onOpenTrackers
                    "extension" -> { { onOpenWeb("/extension/connect", "YouTube sync") } }
                    else -> onOpenExams
                }
                if (index > 0) Spacer(modifier = Modifier.height(Tw.Space.s2_5))
                // web revealProps delay 0.06 * i
                GuestReveal(play = animate, delayMillis = 60 * index) {
                    PrepStepCard(step = step, index = index, isActive = isActive, onClick = onClick)
                }
            }
        }
    }
}

@Composable
private fun PrepStepCard(step: PrepStep, index: Int, isActive: Boolean, onClick: () -> Unit) {
    val scale = rememberGuestActiveScale(isActive)
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale),
        shape = RoundedCornerShape(Radius2xl),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) Color.White else Color.White.copy(alpha = 0.85f),
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isActive) Brand.copy(alpha = 0.4f) else Border.copy(alpha = 0.9f),
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isActive) 4.dp else 0.dp),
    ) {
        Column(modifier = Modifier.padding(Tw.Space.s5)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2_5),
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(Tw.Radius.xl))
                        .then(
                            if (isActive) Modifier.background(Brand)
                            else Modifier
                                .background(BrandSoft)
                                .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(Tw.Radius.xl)),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(step.icon, contentDescription = null, tint = if (isActive) Color.White else Brand)
                }
                Text(
                    String.format("%02d", index + 1),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Muted,
                )
            }
            Text(
                step.title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Ink,
                modifier = Modifier.padding(top = Tw.Space.s3),
            )
            Text(
                step.description,
                fontSize = 14.sp,
                color = Muted,
                modifier = Modifier.padding(top = Tw.Space.s1_5),
            )
            Row(
                modifier = Modifier.padding(top = Tw.Space.s3),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    step.cta,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isActive) Brand else Ink,
                )
                Icon(
                    Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = if (isActive) Brand else Ink,
                )
            }
        }
    }
}
