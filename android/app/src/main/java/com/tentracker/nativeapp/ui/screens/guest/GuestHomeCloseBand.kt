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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.Brand

@Composable
fun GuestHomeCloseBand(
    onBrowseExams: () -> Unit,
    onExplorePlans: () -> Unit,
    onSignIn: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val animate = rememberGuestAnimate()
    val (revealModifier, show) = rememberGuestSectionRevealed(threshold = 0.3f)
    Column(
        modifier = modifier
            .then(revealModifier)
            .fillMaxWidth()
            .padding(horizontal = GuestGutter)
            .padding(bottom = 64.dp),
    ) {
        GuestRevealFadeSlide(show = show, animate = animate) {
        Box(
            modifier = Modifier.fillMaxWidth(),
        ) {
        if (animate) {
            GuestFloatOrb(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(180.dp)
                    .background(Brand.copy(alpha = 0.33f), CircleShape),
                color = Brand,
                animate = true,
                durationMillis = 10_000,
                driftXPx = 18f,
                driftYPx = 12f,
            )
            GuestFloatOrb(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .size(140.dp)
                    .background(Color(0xFF38BDF8).copy(alpha = 0.2f), CircleShape),
                color = Color(0xFF38BDF8),
                animate = true,
                durationMillis = 12_000,
                driftXPx = -12f,
                driftYPx = 16f,
            )
        }
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Radius3xl))
                .background(
                    Brush.linearGradient(
                        colors = listOf(Color(0xFF0A0A0A), Color(0xFF121826), Color(0xFF1A2440)),
                    ),
                )
                .border(1.dp, Color(0x1A000000), RoundedCornerShape(Radius3xl))
                .padding(28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.06f))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(999.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.GpsFixed, contentDescription = null, tint = Color(0xFF8BA3E8), modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Start today", fontSize = 12.sp, color = Color(0xFFE5E5E5))
            }
            Text(
                "Pick an exam or roadmap and begin your prep",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
            Text(
                "Free practice, preview tracker days, sync YouTube from Chrome, then sign in with Google for streaks, heatmaps, and rankings.",
                fontSize = 14.sp,
                color = Color(0xFFD4D4D4),
                lineHeight = 20.sp,
            )
            Button(
                onClick = onBrowseExams,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(RadiusXl),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF171717)),
            ) {
                Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Browse exams", fontWeight = FontWeight.SemiBold)
            }
            OutlinedButton(
                onClick = onExplorePlans,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(RadiusXl),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
            ) {
                Icon(Icons.Default.Map, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Explore plans", color = Color.White, fontWeight = FontWeight.SemiBold)
            }
            OutlinedButton(
                onClick = onSignIn,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(RadiusXl),
                colors = ButtonDefaults.outlinedButtonColors(containerColor = Brand),
                border = androidx.compose.foundation.BorderStroke(0.dp, Color.Transparent),
            ) {
                Text("Sign in with Google", color = Color.White, fontWeight = FontWeight.SemiBold)
            }
        }
        }
        }
    }
}