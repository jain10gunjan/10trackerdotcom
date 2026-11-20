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
import kotlinx.coroutines.delay

private data class PrepStep(
    val id: String,
    val icon: ImageVector,
    val title: String,
    val description: String,
    val cta: String,
    val onGoogle: Boolean = false,
)

@Composable
fun GuestHomePrepLoop(
    onSignIn: () -> Unit,
    onOpenExams: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenWeb: (path: String, title: String?) -> Unit,
) {
    val steps = remember {
        listOf(
            PrepStep("mcqs", Icons.AutoMirrored.Filled.MenuBook, "Topic-wise MCQs", "Chapter-level practice with solutions across active exams.", "Browse exams"),
            PrepStep("mocks", Icons.Default.Assignment, "Mock tests", "Timed full-length tests with rankings and detailed review.", "Find mocks"),
            PrepStep("plans", Icons.Default.Map, "OG Tracker paths", "YouTube + coding paths with free preview days you can track.", "Explore paths"),
            PrepStep("extension", Icons.Default.PlayArrow, "YouTube sync", "Chrome extension syncs watch % into your path automatically.", "Connect extension"),
        )
    }
    var active by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(2800)
            active = (active + 1) % steps.size
        }
    }

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
                .padding(bottom = 56.dp),
        ) {
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
                    modifier = Modifier.padding(top = 6.dp),
                )
                Text(
                    "Practice, mock, follow a path, sync YouTube — the loop that keeps you coming back.",
                    fontSize = 14.sp,
                    color = Muted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
            Spacer(modifier = Modifier.height(20.dp))
            LinearProgressIndicator(
                progress = { (active + 1) / steps.size.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp),
                color = Brand,
                trackColor = Border,
            )
            Spacer(modifier = Modifier.height(12.dp))
            steps.forEachIndexed { index, step ->
                val isActive = active == index
                val onClick: () -> Unit = when (step.id) {
                    "mcqs", "mocks" -> onOpenExams
                    "plans" -> onOpenTrackers
                    "extension" -> { { onOpenWeb("/extension/connect", "YouTube sync") } }
                    else -> onOpenExams
                }
                if (index > 0) Spacer(modifier = Modifier.height(10.dp))
                PrepStepCard(step = step, index = index, isActive = isActive, onClick = onClick)
            }
        }
    }
}

@Composable
private fun PrepStepCard(step: PrepStep, index: Int, isActive: Boolean, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .then(if (isActive) Modifier.scale(1.01f) else Modifier),
        shape = RoundedCornerShape(Radius2xl),
        colors = CardDefaults.cardColors(containerColor = if (isActive) Color.White else Color.White.copy(alpha = 0.85f)),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isActive) Brand.copy(alpha = 0.4f) else Border.copy(alpha = 0.9f),
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isActive) 4.dp else 0.dp),
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .then(
                            if (isActive) Modifier.background(Brand)
                            else Modifier.background(BrandSoft).border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
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
            Text(step.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.padding(top = 12.dp))
            Text(step.description, fontSize = 14.sp, color = Muted, modifier = Modifier.padding(top = 6.dp))
            Row(modifier = Modifier.padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    step.cta,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isActive) Brand else Ink,
                )
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp), tint = if (isActive) Brand else Ink)
            }
        }
    }
}