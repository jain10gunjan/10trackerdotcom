package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
) {
    var hookIndex by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
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
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = GuestGutter)
                .padding(top = 12.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "EXAM PRACTICE · PATHS · YOUTUBE SYNC",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.5.sp,
                color = Muted,
            )
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
            Column {
                Text(
                    text = "Practice that sticks — with",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                )
                Text(
                    text = RotatingHooks[hookIndex],
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Brand,
                )
            }
            Text(
                text = "MCQs, timed mocks, OG Tracker paths, and in-app YouTube progress — one app for your prep.",
                fontSize = 14.sp,
                color = Muted,
                lineHeight = 20.sp,
            )
            Button(
                onClick = onBrowseExams,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(RadiusXl),
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
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
            QuickLinksRow(onBrowseExams = onBrowseExams, onExploreTrackers = onExploreTrackers)
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
            GuestFeatureShowcase(onOpenExams = onBrowseExams)
        }
    }
}

@Composable
private fun QuickLinksRow(onBrowseExams: () -> Unit, onExploreTrackers: () -> Unit) {
    val scroll = rememberScrollState()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scroll),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        QuickChip("Exams", Icons.AutoMirrored.Filled.MenuBook, onBrowseExams)
        QuickChip("OG Trackers", Icons.Default.Map, onExploreTrackers)
        QuickChip("Mocks", Icons.Default.Assignment, onBrowseExams)
    }
}

@Composable
private fun QuickChip(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
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
private fun GuestFeatureShowcase(onOpenExams: () -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
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
        Text(
            text = titles[tab],
            fontSize = 17.sp,
            fontWeight = FontWeight.Bold,
            color = Ink,
            modifier = Modifier.padding(top = 4.dp),
        )
        when (tab) {
            0 -> McqPanelPreview()
            1 -> MockPanelPreview()
            else -> StreakPanelPreview()
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
private fun McqPanelPreview() {
    Column(modifier = Modifier.padding(top = 12.dp)) {
        Text(
            text = "Q. If 3x + 5 = 20, what is x?",
            fontSize = 13.sp,
            color = Ink,
            modifier = Modifier.padding(bottom = 8.dp),
        )
        listOf("3", "5", "7", "15").forEachIndexed { i, opt ->
            val selected = i == 1
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
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
private fun MockPanelPreview() {
    Column(modifier = Modifier.padding(top = 12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Score" to "68%", "Rank" to "#214", "Done" to "48/65").forEach { (label, value) ->
                Column(
                    modifier = Modifier
                        .weight(1f)
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
            progress = { 0.74f },
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
private fun StreakPanelPreview() {
    Row(
        modifier = Modifier.padding(top = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
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
}