package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.graphicsLayer
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
import kotlinx.coroutines.delay
import java.text.NumberFormat

private val RotatingHooks = listOf(
    "topic-wise MCQs",
    "timed mock tests",
    "YouTube path sync",
    "streaks that stick",
)

@Composable
fun GuestHomeHero(
    examCount: Int,
    roadmapCount: Int,
    questionCount: Int,
    onBrowseExams: () -> Unit,
    onExploreTrackers: () -> Unit,
    onSignIn: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val animate = rememberGuestAnimate()
    var hookIndex by remember { mutableIntStateOf(0) }
    LaunchedEffect(animate) {
        if (!animate) return@LaunchedEffect
        while (true) {
            delay(2600)
            hookIndex = (hookIndex + 1) % RotatingHooks.size
        }
    }

    val questionLabel = if (questionCount >= 1000) {
        "${questionCount / 1000}k+"
    } else {
        NumberFormat.getIntegerInstance().format(questionCount)
    }

    Box(
        modifier = modifier
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
        GuestFloatOrb(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 24.dp, end = 48.dp)
                .size(200.dp)
                .background(Brand.copy(alpha = 0.16f), CircleShape),
            color = Brand,
            animate = animate,
            durationMillis = 12_000,
            driftXPx = 20f,
            driftYPx = 14f,
        )
        GuestFloatOrb(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(start = 16.dp, top = 80.dp)
                .size(160.dp)
                .background(Color(0xFFBAE6FD).copy(alpha = 0.4f), CircleShape),
            color = Color(0xFFBAE6FD),
            animate = animate,
            durationMillis = 14_000,
            driftXPx = -16f,
            driftYPx = 18f,
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = GuestGutter)
                .padding(top = 12.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            GuestMountFadeSlide(animate = animate, delayMillis = 0) {
            Text(
                text = "EXAM PRACTICE · PATHS · YOUTUBE SYNC",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.5.sp,
                color = Muted,
            )
            }
            GuestMountFadeSlide(animate = animate, delayMillis = 50) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "10tracker",
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Black,
                    color = Ink,
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = ".COM",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Brand)
                        .padding(horizontal = 6.dp, vertical = 3.dp),
                )
            }
            }
            GuestMountFadeSlide(animate = animate, delayMillis = 100) {
            Column {
                Text(
                    text = "Practice that sticks — with",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                )
                GuestAnimatedSwap(target = RotatingHooks[hookIndex], animate = animate) { hook ->
                    Text(
                        text = hook,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Brand,
                    )
                }
            }
            }
            GuestMountFadeSlide(animate = animate, delayMillis = 150) {
            Text(
                text = "MCQs, timed mocks, OG Tracker paths, and in-app YouTube progress — one app for your prep.",
                fontSize = 14.sp,
                color = Muted,
                lineHeight = 20.sp,
            )
            }
            GuestMountFadeSlide(animate = animate, delayMillis = 200) {
            val browseInteraction = rememberGuestPressInteractionSource()
            val browsePressed by browseInteraction.collectIsPressedAsState()
            val browseScale by animateFloatAsState(
                if (browsePressed) 0.99f else 1f,
                spring(dampingRatio = 0.62f, stiffness = 380f),
                label = "browseScale",
            )
            Button(
                onClick = onBrowseExams,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .scale(browseScale),
                shape = RoundedCornerShape(RadiusXl),
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                interactionSource = browseInteraction,
            ) {
                Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
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
                Spacer(modifier = Modifier.width(8.dp))
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
            GuestMountFadeSlide(animate = animate, delayMillis = 280) {
            QuickLinksRow(onBrowseExams = onBrowseExams, onExploreTrackers = onExploreTrackers, animate = animate)
            }
            GuestMountFadeSlide(animate = animate, delayMillis = 320) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
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
            GuestMountFadeSlide(animate = animate, delayMillis = 120) {
            GuestFeatureShowcase(onOpenExams = onBrowseExams, animate = animate)
            }
        }
    }
}

@Composable
private fun QuickLinksRow(onBrowseExams: () -> Unit, onExploreTrackers: () -> Unit, animate: Boolean) {
    val scroll = rememberScrollState()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scroll),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        QuickChip("Exams", Icons.AutoMirrored.Filled.MenuBook, onBrowseExams, animate)
        QuickChip("OG Trackers", Icons.Default.Map, onExploreTrackers, animate)
        QuickChip("Mocks", Icons.Default.Assignment, onBrowseExams, animate)
    }
}

@Composable
private fun QuickChip(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    animate: Boolean,
) {
    val interaction = rememberGuestPressInteractionSource()
    val pressed by interaction.collectIsPressedAsState()
    val chipScale by animateFloatAsState(
        if (pressed) 0.98f else if (animate) 1.03f else 1f,
        spring(dampingRatio = 0.65f, stiffness = 340f),
        label = "chipScale",
    )
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.scale(chipScale),
        interactionSource = interaction,
        shape = RoundedCornerShape(999.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = BrandDeep)
    }
}

@Composable
private fun GuestFeatureShowcase(onOpenExams: () -> Unit, animate: Boolean) {
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
            .padding(16.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("MCQs", "Mocks", "Streaks").forEachIndexed { i, label ->
                val active = tab == i
                OutlinedButton(
                    onClick = { tab = i },
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (active) Brand.copy(alpha = 0.35f) else Border,
                    ),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (active) Color.White else Color.Transparent,
                    ),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 4.dp),
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
            modifier = Modifier.padding(top = 12.dp),
            letterSpacing = 1.2.sp,
        )
        GuestAnimatedSwap(target = titles[tab], animate = animate, modifier = Modifier.padding(top = 4.dp)) { title ->
            Text(
                text = title,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = Ink,
            )
        }
        GuestAnimatedSwap(target = tab, animate = animate) { activeTab ->
            when (activeTab) {
                0 -> McqPanelPreview(animate = animate)
                1 -> MockPanelPreview(animate = animate)
                else -> StreakPanelPreview(animate = animate)
            }
        }
        TextButtonLink("Open", onOpenExams, modifier = Modifier.align(Alignment.End))
    }
}

@Composable
private fun TextButtonLink(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        border = androidx.compose.foundation.BorderStroke(0.dp, Color.Transparent),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
    ) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Muted)
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(12.dp), tint = Muted)
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
        while (true) {
            phase = 0
            delay(700)
            phase = 1
            delay(700)
            phase = 2
            delay(2000)
        }
    }
    Column(modifier = Modifier.padding(top = 12.dp)) {
        Text(
            text = "Q. If 3x + 5 = 20, what is x?",
            fontSize = 13.sp,
            color = Ink,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        listOf("3", "5", "7", "15").forEachIndexed { i, opt ->
            val selected = phase > 0 && i == 1
            val confirmed = phase == 2 && i == 1
            val scale by animateFloatAsState(
                if (confirmed && animate) 1.02f else 1f,
                tween(250, easing = GuestEaseOut),
                label = "mcqOpt",
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .scale(scale)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (selected) BrandSoft.copy(alpha = 0.7f) else Color(0xFFFAFAFA))
                    .border(
                        1.dp,
                        if (selected) Brand.copy(alpha = 0.35f) else Border,
                        RoundedCornerShape(12.dp),
                    )
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = ('A' + i).toString(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (selected) Color.White else Muted,
                    modifier = Modifier
                        .size(24.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (selected) Brand else Color.White)
                        .border(1.dp, Border, RoundedCornerShape(6.dp))
                        .padding(4.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(opt, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Ink)
            }
        }
    }
}

@Composable
private fun MockPanelPreview(animate: Boolean) {
    val progress = rememberAnimatedProgress(0.74f, animate)
    Column(modifier = Modifier.padding(top = 12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Score" to "68%", "Rank" to "#214", "Done" to "48/65").forEachIndexed { i, (label, value) ->
                val cellAlpha = remember(i) { Animatable(if (animate) 0f else 1f) }
                val cellOffset = remember(i) { Animatable(if (animate) 12f else 0f) }
                LaunchedEffect(animate) {
                    if (!animate) return@LaunchedEffect
                    kotlinx.coroutines.delay((i * 80).toLong())
                    cellOffset.animateTo(0f, tween(400, easing = GuestEaseOut))
                    cellAlpha.animateTo(1f, tween(400, easing = GuestEaseOut))
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .graphicsLayer {
                            alpha = cellAlpha.value
                            translationY = cellOffset.value
                        }
                        .clip(RoundedCornerShape(12.dp))
                        .border(1.dp, Border, RoundedCornerShape(12.dp))
                        .background(Color.White)
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(label.uppercase(), fontSize = 9.sp, color = Muted, fontWeight = FontWeight.SemiBold)
                    Text(value, fontSize = 17.sp, fontWeight = FontWeight.Black, color = if (label == "Score") Brand else Ink)
                }
            }
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp)
                .height(6.dp)
                .clip(RoundedCornerShape(99.dp)),
            color = Brand,
            trackColor = BrandSoft,
        )
    }
}

@Composable
private fun StreakPanelPreview(animate: Boolean) {
    val infinite = rememberInfiniteTransition(label = "streakFlame")
    val flameScale by infinite.animateFloat(
        1f,
        1.06f,
        infiniteRepeatable(tween(2200), RepeatMode.Reverse),
        label = "flame",
    )
    val heat = remember { listOf(0.2f, 0.5f, 0.8f, 0.3f, 1f, 0.6f, 0.9f, 0.4f, 0.7f, 1f, 0.5f, 0.85f, 0.3f, 0.95f) }
    Column(modifier = Modifier.padding(top = 12.dp)) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .scale(if (animate) flameScale else 1f)
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
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        heat.chunked(7).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                row.forEachIndexed { colIndex, v ->
                    val i = rowIndex * 7 + colIndex
                    val cellAlpha = remember(i) { Animatable(if (animate) 0f else 1f) }
                    LaunchedEffect(animate) {
                        if (!animate) return@LaunchedEffect
                        kotlinx.coroutines.delay((i * 30).toLong())
                        cellAlpha.animateTo(1f, tween(280, easing = GuestEaseOut))
                    }
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .graphicsLayer { alpha = cellAlpha.value }
                            .clip(RoundedCornerShape(6.dp))
                            .background(Brand.copy(alpha = 0.12f + v * 0.88f)),
                    )
                }
            }
        }
    }
    }
}