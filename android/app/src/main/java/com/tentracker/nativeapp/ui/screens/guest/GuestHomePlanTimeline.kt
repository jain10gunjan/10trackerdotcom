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
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.RoadmapSummary
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandDeep
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted

@Composable
fun GuestHomePlanTimeline(
    roadmaps: List<RoadmapSummary>,
    onViewAllPlans: () -> Unit,
    onOpenRoadmap: (RoadmapSummary) -> Unit,
    onBrowseExams: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val animate = rememberGuestAnimate()
    val (revealModifier, show) = rememberGuestSectionRevealed(threshold = 0.2f)
    Column(
        modifier = modifier
            .then(revealModifier)
            .fillMaxWidth()
            .padding(horizontal = GuestGutter)
            .padding(bottom = 56.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom,
        ) {
            GuestRevealFadeSlide(show = show, animate = animate, modifier = Modifier.weight(1f)) {
            GuestSectionHeader(
                eyebrow = "Study plans",
                title = if (roadmaps.isNotEmpty()) "Structured roadmaps for serious prep"
                else "Study plans — coming soon",
                subtitle = if (roadmaps.isNotEmpty()) {
                    "YouTube lessons + coding practice on a day path. Preview free days, then unlock."
                } else {
                    "Day-by-day learning paths with videos and coding practice are on the way. Practice exams are live today."
                },
            )
            }
            if (roadmaps.isNotEmpty()) {
                OutlinedButton(
                    onClick = onViewAllPlans,
                    shape = RoundedCornerShape(RadiusXl),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Text("View all", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        when {
            roadmaps.isEmpty() -> ComingSoonCard(onBrowseExams = onBrowseExams)
            else -> roadmaps.forEachIndexed { index, roadmap ->
                if (index > 0) Spacer(modifier = Modifier.height(12.dp))
                GuestStaggeredFadeSlide(show = show, animate = animate, index = index) {
                PlanCard(
                    roadmap = roadmap,
                    index = index,
                    onClick = { onOpenRoadmap(roadmap) },
                    show = show,
                    animate = animate,
                )
                }
            }
        }
    }
}

@Composable
private fun ComingSoonCard(onBrowseExams: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Radius2xl))
            .border(1.dp, Border, RoundedCornerShape(Radius2xl))
            .background(Color.White)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(BrandSoft)
                .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Map, contentDescription = null, tint = Brand)
        }
        Text("Coming soon", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Muted, modifier = Modifier.padding(top = 16.dp))
        Text("OG Trackers", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.padding(top = 8.dp))
        Text(
            "Structured paths with YouTube lessons and coding practice will launch here.",
            fontSize = 14.sp,
            color = Muted,
            modifier = Modifier.padding(top = 8.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        Button(
            onClick = onBrowseExams,
            modifier = Modifier.padding(top = 20.dp),
            shape = RoundedCornerShape(RadiusXl),
            colors = ButtonDefaults.buttonColors(containerColor = Brand),
        ) {
            Text("Browse exams", color = Color.White, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun PlanCard(roadmap: RoadmapSummary, index: Int, onClick: () -> Unit, show: Boolean, animate: Boolean) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(Radius2xl),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .clip(RoundedCornerShape(99.dp))
                    .background(Brush.horizontalGradient(listOf(Brand, BrandBright))),
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Brand),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Map, contentDescription = null, tint = Color.White)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "PLAN ${String.format("%02d", index + 1)}",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Muted,
                        letterSpacing = 1.2.sp,
                    )
                    Text(
                        roadmap.title,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
            }
            roadmap.description?.takeIf { it.isNotBlank() }?.let {
                Text(
                    it,
                    fontSize = 14.sp,
                    color = Muted,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 10.dp),
                )
            }
            DayPathBar(
                totalDays = roadmap.totalDays,
                freePreviewDays = roadmap.freePreviewDays,
                show = show,
                animate = animate,
            )
            Row(
                modifier = Modifier.padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    "₹${roadmap.priceInr} · one-time",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .border(1.dp, Border, RoundedCornerShape(999.dp))
                        .background(Color(0xFFFAFAFA))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                )
                if (roadmap.totalDays > 0) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .border(1.dp, Border, RoundedCornerShape(999.dp))
                            .background(Color.White)
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                    ) {
                        Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Brand, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("${roadmap.totalDays} days", fontSize = 12.sp, color = Muted)
                    }
                }
                if (roadmap.freePreviewDays > 0) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(999.dp))
                            .background(BrandSoft)
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                    ) {
                        Icon(Icons.Default.CardGiftcard, contentDescription = null, tint = BrandDeep, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("${roadmap.freePreviewDays} free", fontSize = 12.sp, color = BrandDeep)
                    }
                }
            }
            TextButton(onClick = onClick, modifier = Modifier.padding(top = 8.dp)) {
                Text("View roadmap", fontWeight = FontWeight.SemiBold, color = Ink)
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Ink, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun DayPathBar(totalDays: Int, freePreviewDays: Int, show: Boolean, animate: Boolean) {
    val days = (totalDays.coerceIn(5, 12)).takeIf { totalDays > 0 } ?: 7
    val free = freePreviewDays.coerceAtMost(days)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        repeat(days) { i ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(8.dp)
                    .guestStaggerScaleY(show = show, animate = animate, index = i)
                    .clip(RoundedCornerShape(99.dp))
                    .background(
                        when {
                            i < free -> Brand
                            i == free && free > 0 -> Brand.copy(alpha = 0.55f)
                            else -> Color(0xFFE5E7EB)
                        },
                    ),
            )
        }
    }
}