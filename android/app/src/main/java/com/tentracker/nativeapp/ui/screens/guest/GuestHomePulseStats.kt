package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
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
    val questionDisplay = if (questionCount >= 1000) {
        "${questionCount / 1000}k+"
    } else {
        NumberFormat.getIntegerInstance().format(questionCount)
    }
    val roadmapLabel = if (roadmapCount > 0) roadmapCount.toString() else "Soon"

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = GuestGutter)
            .padding(bottom = 40.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Radius2xl))
                .background(Color.White.copy(alpha = 0.92f))
                .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(Radius2xl))
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            StatCell(value = examCount.toString(), label = "Active exams", accent = true)
            StatCell(value = roadmapLabel, label = "Study plans", accent = false)
            StatCell(value = questionDisplay, label = "Practice questions", accent = false)
            StatCell(value = "₹0", label = "Free to start", accent = false)
        }
    }
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