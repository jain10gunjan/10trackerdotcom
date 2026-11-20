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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Tw
import kotlinx.coroutines.delay

private val WatchScenes = listOf(
    "Arrays — Two pointers" to 34,
    "Graphs — BFS deep dive" to 72,
    "DP — Knapsack intuition" to 91,
)

@Composable
fun GuestHomeRetentionKit(
    onSignIn: () -> Unit,
    onOpenExams: () -> Unit,
    onOpenArticles: () -> Unit,
    onOpenWeb: (path: String, title: String?) -> Unit,
    onOpenTrackers: () -> Unit,
) {
    val animate = rememberGuestMotionEnabled()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = GuestGutter)
            .padding(bottom = Tw.Space.s14),
    ) {
        GuestReveal(play = animate) {
            GuestSectionHeader(
                eyebrow = "Built to stick",
                title = "More than practice — habits that pull you back",
                subtitle = "Extension sync, daily sets, streaks, rankings, and cheap unlimited days — everything that turns one session into a streak.",
            )
        }
        Spacer(modifier = Modifier.height(Tw.Space.s4))
        GuestReveal(play = animate) {
            ExtensionShowcase(animate = animate, onOpenTrackers = onOpenTrackers, onOpenWeb = onOpenWeb)
        }
        Spacer(modifier = Modifier.height(Tw.Space.s3))
        GuestReveal(play = animate, delayMillis = 50) {
            FeatureTile(
                title = "Streaks that stick",
                eyebrow = "Habit",
                description = "Sign in once — keep a flame going with daily practice and heatmaps.",
                cta = "Sign in with Google",
                icon = Icons.Default.LocalFireDepartment,
                accent = true,
                onClick = onSignIn,
            )
        }
        Spacer(modifier = Modifier.height(Tw.Space.s2_5))
        GuestReveal(play = animate, delayMillis = 100) {
            FeatureTile(
                title = "Mock of the day & DPP",
                eyebrow = "Daily",
                description = "Rotating daily mocks and practice sets so there's always a next set.",
                cta = "Start practicing",
                icon = Icons.Default.GpsFixed,
                accent = false,
                onClick = onOpenExams,
            )
        }
        Spacer(modifier = Modifier.height(Tw.Space.s2_5))
        GuestReveal(play = animate, delayMillis = 150) {
            FeatureTile(
                title = "Free start, cheap unlocks",
                eyebrow = "Credits",
                description = "Signup bonus credits, then day passes and unlimited plans — no auto-renew.",
                cta = "See pricing",
                icon = Icons.Default.AutoAwesome,
                accent = false,
                onClick = { onOpenWeb("/pricing", "Pricing") },
            )
        }
        Spacer(modifier = Modifier.height(Tw.Space.s2_5))
        GuestReveal(play = animate, delayMillis = 200) {
            FeatureTile(
                title = "Progress & rankings",
                eyebrow = "Insight",
                description = "Subject trends, difficulty charts, and mock leaderboards after every attempt.",
                cta = "Open analysis",
                icon = Icons.Default.ShowChart,
                accent = false,
                onClick = { onOpenWeb("/analysis", "Analysis") },
            )
        }
        Spacer(modifier = Modifier.height(Tw.Space.s3))
        GuestReveal(play = animate, delayMillis = 180) {
            Column {
                QuickLinkRow("Exam updates", "News, strategies, current affairs", Icons.Default.Campaign, onOpenArticles)
                Spacer(modifier = Modifier.height(Tw.Space.s2))
                QuickLinkRow("Jobs feed", "Latest openings while you prep", Icons.Default.AutoAwesome) {
                    onOpenWeb("/article/latest-jobs", "Jobs feed")
                }
                Spacer(modifier = Modifier.height(Tw.Space.s2))
                QuickLinkRow("Aptitude practice", "Dedicated topic drills", Icons.Default.GpsFixed) {
                    onOpenWeb("/aptitude", "Aptitude")
                }
            }
        }
    }
}

@Composable
private fun ExtensionShowcase(
    animate: Boolean,
    onOpenTrackers: () -> Unit,
    onOpenWeb: (String, String?) -> Unit,
) {
    var scene by remember { mutableIntStateOf(0) }
    LaunchedEffect(animate) {
        if (!animate) return@LaunchedEffect
        while (true) {
            delay(2600)
            scene = (scene + 1) % WatchScenes.size
        }
    }
    val (title, pct) = WatchScenes[scene]
    // web bar: initial 8%, duration 0.7 easeOut
    val progress = rememberGuestProgress(
        target = pct / 100f,
        play = animate,
        durationMillis = 700,
        initial = 0.08f,
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF0A0A0A), Color(0xFF121826), Color(0xFF1A2440)),
                ),
            )
            .border(1.dp, Border.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
            .padding(Tw.Space.s5),
    ) {
        Text(
            "CHROME EXTENSION",
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFFE5E5E5),
            letterSpacing = 1.2.sp,
        )
        Text(
            "Watch YouTube. Progress syncs to your path.",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(top = Tw.Space.s2),
        )
        Text(
            "Catalogued OG Tracker lessons update automatically — badge shows %, and your tracker marks videos complete at 90%+.",
            fontSize = 14.sp,
            color = Color(0xFFD4D4D4),
            modifier = Modifier.padding(top = Tw.Space.s2),
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Tw.Space.s4)
                .clip(RoundedCornerShape(Tw.Radius.xl))
                .background(Color.White.copy(alpha = 0.06f))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(Tw.Radius.xl))
                .padding(Tw.Space.s3_5),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = BrandBright, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(Tw.Space.s1_5))
                Text("Live on YouTube", fontSize = 11.sp, color = Color(0xFFA3A3A3))
            }
            // web title swap: opacity/y 8, duration 0.28
            GuestTitleSwap(title = title, animate = animate) { t ->
                Text(
                    t,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                    modifier = Modifier.padding(top = Tw.Space.s2),
                )
            }
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = Tw.Space.s2_5)
                    .height(8.dp)
                    .clip(RoundedCornerShape(99.dp)),
                color = BrandBright,
                trackColor = Color.White.copy(alpha = 0.12f),
            )
            Text(
                "$pct% watched",
                fontSize = 12.sp,
                color = Color(0xFFE5E5E5),
                modifier = Modifier.padding(top = Tw.Space.s1_5),
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Tw.Space.s3_5),
            horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2_5),
        ) {
            Button(
                onClick = { onOpenWeb("/extension/connect", "Connect extension") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(RadiusXl),
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
            ) {
                Text("Connect", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
            OutlinedButton(
                onClick = onOpenTrackers,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(RadiusXl),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
            ) {
                Text("Browse paths", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun FeatureTile(
    title: String,
    eyebrow: String,
    description: String,
    cta: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accent: Boolean,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(Radius2xl),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
    ) {
        Column(modifier = Modifier.padding(Tw.Space.s5)) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(Tw.Radius.xl))
                    .then(
                        if (accent) {
                            Modifier.background(Brand)
                        } else {
                            Modifier
                                .background(BrandSoft)
                                .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(Tw.Radius.xl))
                        },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = if (accent) Color.White else Brand, modifier = Modifier.size(18.dp))
            }
            Text(
                eyebrow.uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                color = Muted,
                modifier = Modifier.padding(top = Tw.Space.s2_5),
            )
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.padding(top = Tw.Space.s1))
            Text(description, fontSize = 14.sp, color = Muted, modifier = Modifier.padding(top = Tw.Space.s1_5))
            Row(modifier = Modifier.padding(top = Tw.Space.s2_5), verticalAlignment = Alignment.CenterVertically) {
                Text(cta, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp), tint = Ink)
            }
        }
    }
}

@Composable
private fun QuickLinkRow(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(RadiusXl),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
    ) {
        Row(
            modifier = Modifier.padding(Tw.Space.s3_5),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(BrandSoft),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(18.dp))
            }
            Column(modifier = Modifier.weight(1f).padding(horizontal = Tw.Space.s3)) {
                Text(title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                Text(subtitle, fontSize = 12.sp, color = Muted, maxLines = 1)
            }
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Muted, modifier = Modifier.size(18.dp))
        }
    }
}
