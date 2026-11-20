package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandDeep
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Tw
import kotlinx.coroutines.delay
import java.text.NumberFormat

private val RotatingHooks = listOf(
    "topic-wise MCQs",
    "timed mock tests",
    "YouTube path sync",
    "streaks that stick",
)

private val StreakHeat = listOf(
    0.2f, 0.5f, 0.8f, 0.3f, 1f, 0.6f, 0.9f,
    0.4f, 0.7f, 1f, 0.5f, 0.85f, 0.3f, 0.95f,
)

@Composable
fun GuestHomeHero(
    examCount: Int,
    roadmapCount: Int,
    questionCount: Int,
    onBrowseExams: () -> Unit,
    onExploreTrackers: () -> Unit,
    onSignIn: () -> Unit,
) {
    val animate = rememberGuestMotionEnabled()

    val questionLabel = if (questionCount >= 1000) {
        "${questionCount / 1000}k+"
    } else {
        NumberFormat.getIntegerInstance().format(questionCount)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(GuestSurface, Color(0xFFF1F5F9), GuestPageBg),
                ),
            ),
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(BrandSoft, Color.Transparent),
                        center = Offset(900f, 100f),
                        radius = 500f,
                    ),
                ),
        )
        GuestHeroAmbientOrbs(modifier = Modifier.matchParentSize())

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = GuestGutter)
                .padding(top = Tw.Space.s3, bottom = Tw.Space.s10),
            verticalArrangement = Arrangement.spacedBy(Tw.Space.s3),
        ) {
            GuestEnter(play = animate, delayMillis = 0) {
                Text(
                    text = "EXAM PRACTICE · PATHS · YOUTUBE SYNC",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.5.sp,
                    color = Muted,
                )
            }
            GuestEnter(play = animate, delayMillis = 50) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "10tracker",
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Black,
                        color = Ink,
                    )
                    Spacer(modifier = Modifier.width(Tw.Space.s1_5))
                    Text(
                        text = ".COM",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Brand)
                            .padding(horizontal = Tw.Space.s1_5, vertical = 3.dp),
                    )
                }
            }
            GuestEnter(play = animate, delayMillis = 100) {
                Column {
                    Text(
                        text = "Practice that sticks — with",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Ink,
                    )
                    GuestRotatingHook(hooks = RotatingHooks, animate = animate) { hook ->
                        Text(
                            text = hook,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Brand,
                        )
                    }
                }
            }
            GuestEnter(play = animate, delayMillis = 150) {
                Text(
                    text = "MCQs, timed mocks, OG Tracker paths, and in-app YouTube progress — one app for your prep.",
                    fontSize = 14.sp,
                    color = Muted,
                    lineHeight = 20.sp,
                )
            }
            GuestEnter(play = animate, delayMillis = 200) {
                Column(verticalArrangement = Arrangement.spacedBy(Tw.Space.s2_5)) {
                    Button(
                        onClick = onBrowseExams,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(RadiusXl),
                        colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(Tw.Space.s2))
                        Text("Browse exams", fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.weight(1f))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                    }
                    OutlinedButton(
                        onClick = onExploreTrackers,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(RadiusXl),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                    ) {
                        Icon(Icons.Default.Map, contentDescription = null, tint = Brand, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(Tw.Space.s2))
                        Text("Explore paths", fontWeight = FontWeight.SemiBold, color = Ink)
                    }
                    OutlinedButton(
                        onClick = onSignIn,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(RadiusXl),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                    ) {
                        Text("Sign in with Google", fontWeight = FontWeight.SemiBold, color = Ink)
                    }
                    Text(
                        text = "Save streaks, YouTube progress, and rankings in one tap",
                        fontSize = 12.sp,
                        color = Muted,
                    )
                }
            }
            GuestEnter(play = animate, delayMillis = 280) {
                QuickLinksRow(
                    animate = animate,
                    onBrowseExams = onBrowseExams,
                    onExploreTrackers = onExploreTrackers,
                )
            }
            GuestEnter(play = animate, delayMillis = 320) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Tw.Space.s3),
                ) {
                    if (examCount > 0) {
                        Text(
                            text = buildString {
                                append(NumberFormat.getIntegerInstance().format(examCount))
                                append(if (examCount == 1) " exam" else " exams")
                            },
                            fontSize = 13.sp,
                            color = Muted,
                        )
                    }
                    if (questionCount > 0) {
                        Text(
                            text = "$questionLabel questions",
                            fontSize = 13.sp,
                            color = Muted,
                        )
                    }
                    if (roadmapCount > 0) {
                        Text(
                            text = "${NumberFormat.getIntegerInstance().format(roadmapCount)} paths",
                            fontSize = 13.sp,
                            color = Muted,
                        )
                    } else {
                        Text(text = "Free to start", fontSize = 13.sp, color = Muted)
                    }
                }
            }
            GuestEnter(play = animate, delayMillis = 120) {
                GuestFeatureShowcase(animate = animate, onOpenExams = onBrowseExams)
            }
        }
    }
}

@Composable
private fun QuickLinksRow(
    animate: Boolean,
    onBrowseExams: () -> Unit,
    onExploreTrackers: () -> Unit,
) {
    val scroll = rememberScrollState()
    val links = listOf(
        Triple("Exams", Icons.AutoMirrored.Filled.MenuBook, onBrowseExams),
        Triple("OG Trackers", Icons.Default.Map, onExploreTrackers),
        Triple("Mocks", Icons.Default.Assignment, onBrowseExams),
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scroll),
        horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2),
    ) {
        links.forEachIndexed { i, (label, icon, onClick) ->
            // web: duration 0.35, delay 0.28 + i * 0.05
            GuestEnter(play = animate, delayMillis = 280 + i * 50) {
                QuickChip(label, icon, onClick)
            }
        }
    }
}

@Composable
private fun QuickChip(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        shape = RoundedCornerShape(999.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        contentPadding = PaddingValues(horizontal = Tw.Space.s3, vertical = Tw.Space.s1_5),
    ) {
        Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.width(Tw.Space.s1))
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = BrandDeep)
    }
}

@Composable
private fun GuestFeatureShowcase(animate: Boolean, onOpenExams: () -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    LaunchedEffect(animate) {
        if (!animate) return@LaunchedEffect
        while (true) {
            delay(3400)
            tab = (tab + 1) % 3
        }
    }
    val titles = listOf("Topic-wise MCQs", "Timed mock tests", "Streaks & heatmaps")
    val eyebrows = listOf("Practice", "Simulate", "Habit")

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(20.dp))
            .background(Color.White)
            .padding(Tw.Space.s4),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(Tw.Space.s1_5)) {
            listOf("MCQs", "Mocks", "Streaks").forEachIndexed { i, label ->
                val active = tab == i
                OutlinedButton(
                    onClick = { tab = i },
                    shape = RoundedCornerShape(Tw.Radius.lg),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (active) Brand.copy(alpha = 0.35f) else Border,
                    ),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (active) Color.White else Color.Transparent,
                    ),
                    contentPadding = PaddingValues(horizontal = Tw.Space.s2_5, vertical = Tw.Space.s1),
                ) {
                    Text(
                        label,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (active) BrandDeep else Muted,
                    )
                }
            }
        }
        Text(
            text = eyebrows[tab].uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Brand,
            modifier = Modifier.padding(top = Tw.Space.s3),
            letterSpacing = 1.2.sp,
        )
        GuestTitleSwap(title = titles[tab], animate = animate) { title ->
            Text(
                text = title,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = Ink,
                modifier = Modifier.padding(top = Tw.Space.s1),
            )
        }
        GuestSceneSwap(key = tab, animate = animate) { current ->
            when (current) {
                0 -> McqPanelPreview(animate = animate)
                1 -> MockPanelPreview(animate = animate)
                else -> StreakPanelPreview(animate = animate)
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Tw.Space.s3),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Tw.Space.s1_5),
        ) {
            repeat(3) { i ->
                val w = rememberGuestTabPillWidth(active = i == tab)
                Box(
                    modifier = Modifier
                        .width(w)
                        .height(4.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(if (i == tab) Brand else Color(0xFFD4D4D8)),
                )
            }
            Spacer(modifier = Modifier.weight(1f))
            TextButtonLink("Open", onOpenExams)
        }
    }
}

@Composable
private fun TextButtonLink(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        border = androidx.compose.foundation.BorderStroke(0.dp, Color.Transparent),
        contentPadding = PaddingValues(0.dp),
    ) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Muted)
        Icon(
            Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            modifier = Modifier.size(12.dp),
            tint = Muted,
        )
    }
}

@Composable
private fun McqPanelPreview(animate: Boolean) {
    var phase by remember { mutableIntStateOf(if (animate) 0 else 2) }
    LaunchedEffect(animate) {
        if (!animate) {
            phase = 2
            return@LaunchedEffect
        }
        phase = 0
        delay(700)
        phase = 1
        delay(700)
        phase = 2
    }
    Column(modifier = Modifier.padding(top = Tw.Space.s3)) {
        Text(
            text = "Q. If 3x + 5 = 20, what is x?",
            fontSize = 13.sp,
            color = Ink,
            modifier = Modifier.padding(bottom = Tw.Space.s2),
        )
        listOf("3", "5", "7", "15").forEachIndexed { i, opt ->
            val isCorrect = i == 1
            val selected = phase >= 1 && isCorrect
            val confirmed = phase >= 2 && isCorrect
            val scale = rememberGuestConfirmScale(confirmed)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = Tw.Space.s1)
                    .scale(scale)
                    .clip(RoundedCornerShape(Tw.Radius.xl))
                    .background(if (selected) BrandSoft.copy(alpha = 0.7f) else Color(0xFFFAFAFA))
                    .border(
                        1.dp,
                        if (selected) Brand.copy(alpha = 0.35f) else Border,
                        RoundedCornerShape(Tw.Radius.xl),
                    )
                    .padding(horizontal = Tw.Space.s3, vertical = Tw.Space.s2_5),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = if (confirmed) "✓" else ('A' + i).toString(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (confirmed || selected) Color.White else Muted,
                    modifier = Modifier
                        .size(24.dp)
                        .clip(RoundedCornerShape(Tw.Radius.md))
                        .background(if (confirmed || selected) Brand else Color.White)
                        .border(1.dp, Border, RoundedCornerShape(Tw.Radius.md))
                        .padding(Tw.Space.s1),
                )
                Spacer(modifier = Modifier.width(Tw.Space.s2))
                Text(opt, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Ink)
            }
        }
    }
}

@Composable
private fun MockPanelPreview(animate: Boolean) {
    val progress = rememberGuestProgress(
        target = 0.74f,
        play = animate,
        durationMillis = 850,
        initial = 0f,
    )
    Column(modifier = Modifier.padding(top = Tw.Space.s3)) {
        Row(horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2)) {
            listOf("Score" to "68%", "Rank" to "#214", "Done" to "48/65").forEachIndexed { i, (label, value) ->
                Box(modifier = Modifier.weight(1f)) {
                    // web MockPanel cells: opacity/y 10, duration 0.4, delay 0.08*i
                    GuestEnter(play = animate, delayMillis = 80 * i) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(Tw.Radius.xl))
                                .border(1.dp, Border, RoundedCornerShape(Tw.Radius.xl))
                                .background(Color.White)
                                .padding(Tw.Space.s3),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(label.uppercase(), fontSize = 9.sp, color = Muted, fontWeight = FontWeight.SemiBold)
                            Text(
                                value,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Black,
                                color = if (label == "Score") Brand else Ink,
                            )
                        }
                    }
                }
            }
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Tw.Space.s4)
                .height(6.dp)
                .clip(RoundedCornerShape(99.dp)),
            color = Brand,
            trackColor = BrandSoft,
        )
    }
}

@Composable
private fun StreakPanelPreview(animate: Boolean) {
    val (flameScale, flameRotate) = rememberGuestFlamePulse()
    Column(modifier = Modifier.padding(top = Tw.Space.s3)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Tw.Space.s3),
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .scale(if (animate) flameScale else 1f)
                    .rotate(if (animate) flameRotate else 0f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFFFF7ED))
                    .border(1.dp, Color(0xFFFED7AA), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.LocalFireDepartment, contentDescription = null, tint = Color(0xFFEA580C))
            }
            Column {
                Text("12", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Ink)
                Text("day streak", fontSize = 12.sp, color = Muted)
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Tw.Space.s4),
            horizontalArrangement = Arrangement.spacedBy(Tw.Space.s1_5),
        ) {
            StreakHeat.take(7).forEachIndexed { i, v ->
                val (alpha, scale) = rememberGuestHeatCell(play = animate, index = i)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(28.dp)
                        .scale(scale)
                        .clip(RoundedCornerShape(Tw.Radius.md))
                        .background(Brand.copy(alpha = (0.12f + v * 0.88f) * alpha)),
                )
            }
        }
        Text(
            "Heatmap fills as you practice — sign in to keep it.",
            fontSize = 12.sp,
            color = Muted,
            modifier = Modifier.padding(top = Tw.Space.s3),
        )
    }
}
