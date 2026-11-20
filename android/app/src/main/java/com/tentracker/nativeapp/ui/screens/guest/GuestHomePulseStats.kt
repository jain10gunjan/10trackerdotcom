package com.tentracker.nativeapp.ui.screens.guest

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Tw

@Composable
fun GuestHomePulseStats(
    examCount: Int,
    roadmapCount: Int,
    questionCount: Int,
    modifier: Modifier = Modifier,
) {
    val animate = rememberGuestMotionEnabled()
    val questionNumeric = if (questionCount >= 1000) questionCount / 1000 else questionCount
    val questionSuffix = if (questionCount >= 1000) "k+" else ""
    val countedExams = rememberGuestCountUp(examCount, play = animate)
    val countedQuestions = rememberGuestCountUp(questionNumeric, play = animate)
    val countedRoadmaps = rememberGuestCountUp(roadmapCount, play = animate)

    GuestReveal(play = animate) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = GuestGutter)
                .padding(bottom = Tw.Space.s10),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(Radius2xl))
                    .background(Color.White.copy(alpha = 0.92f))
                    .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(Radius2xl)),
            ) {
                GuestPulseGlow(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .offset(y = 20.dp)
                        .fillMaxWidth(0.66f)
                        .height(48.dp),
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = Tw.Space.s2),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    GuestStaggerItem(index = 0, play = animate) {
                        StatCell(
                            value = countedExams.toString(),
                            label = "Active exams",
                            accent = true,
                        )
                    }
                    GuestStaggerItem(index = 1, play = animate) {
                        StatCell(
                            value = if (roadmapCount > 0) countedRoadmaps.toString() else "Soon",
                            label = "Study plans",
                            accent = false,
                        )
                    }
                    GuestStaggerItem(index = 2, play = animate) {
                        StatCell(
                            value = "$countedQuestions$questionSuffix",
                            label = "Practice questions",
                            accent = false,
                        )
                    }
                    GuestStaggerItem(index = 3, play = animate) {
                        StatCell(value = "₹0", label = "Free to start", accent = false)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCell(value: String, label: String, accent: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(horizontal = Tw.Space.s1, vertical = Tw.Space.s3),
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
            modifier = Modifier.padding(top = Tw.Space.s2),
        )
    }
}
