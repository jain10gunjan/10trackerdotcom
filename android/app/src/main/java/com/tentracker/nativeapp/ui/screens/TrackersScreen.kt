package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.OgExam
import com.tentracker.nativeapp.data.OgPathSummary
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel

private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral900 = Color(0xFF171717)
private val Neutral950 = Color(0xFF0A0A0A)

@Composable
fun TrackersScreen(
    vm: HomeViewModel,
    onOpenPath: (String) -> Unit,
) {
    val state by vm.state.collectAsState()
    val catalog = state.catalog
    val exams = catalog?.exams.orEmpty()
    val paths = catalog?.paths.orEmpty()
    val stats = catalog?.stats

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Neutral50),
        contentPadding = PaddingValues(bottom = 32.dp),
    ) {
        item {
            TrackersHero(
                examCount = exams.size,
                pathCount = paths.size,
                userClears = (stats?.videosCompleted ?: 0) +
                    (stats?.practiceCompleted ?: 0) +
                    (stats?.mocksCompleted ?: 0),
                isPremium = catalog?.isPremium == true,
            )
        }

        catalog?.setupHint?.takeIf { catalog.setupRequired }?.let { hint ->
            item {
                Text(
                    hint,
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 12.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFFFBEB))
                        .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF92400E),
                )
            }
        }

        when {
            state.loading && catalog == null -> {
                item { LoadingState(message = "Loading trackers…") }
            }
            state.error != null && exams.isEmpty() && paths.isEmpty() -> {
                item {
                    ErrorState(
                        message = state.error ?: "Could not load trackers",
                        onRetry = { vm.refresh() },
                    )
                }
            }
            exams.isEmpty() && paths.isEmpty() -> {
                item {
                    EmptyState(
                        message = "No exam tracks published yet.",
                        actionLabel = "Retry",
                        onAction = { vm.refresh() },
                    )
                }
            }
            else -> {
                if (exams.isNotEmpty()) {
                    item { SectionHeading(label = "Exam hub", title = "Choose your exam track") }
                    items(exams, key = { it.slug }) { exam ->
                        OgTrackerExamCard(
                            exam = exam,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                            onClick = { if (exam.slug.isNotBlank()) onOpenPath(exam.slug) },
                        )
                    }
                }

                if (paths.isNotEmpty()) {
                    item {
                        SectionHeading(
                            label = "Learning paths",
                            title = "OG tracker paths",
                            modifier = Modifier.padding(top = if (exams.isNotEmpty()) 16.dp else 0.dp),
                        )
                    }
                    items(paths, key = { it.id }) { path ->
                        OgTrackerPathCard(
                            path = path,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                            onClick = { onOpenPath(path.slug) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TrackersHero(
    examCount: Int,
    pathCount: Int,
    userClears: Int,
    isPremium: Boolean,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(top = 12.dp, bottom = 20.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.linearGradient(
                        listOf(Brand, Color(0xFF5B7AD4)),
                    ),
                )
                .padding(20.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "OG TRACKERS",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.6.sp,
                    color = Color.White.copy(alpha = 0.85f),
                )
                Text(
                    "YouTube lessons, practice, and mocks in one path.",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Text(
                    "Watch progress syncs when you're signed in.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.88f),
                )
                if (isPremium) {
                    Text(
                        "Premium active",
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color.White.copy(alpha = 0.2f))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            HeroMetric("Exams", if (examCount > 0) "$examCount" else "—", Modifier.weight(1f))
            HeroMetric("Paths", if (pathCount > 0) "$pathCount" else "—", Modifier.weight(1f))
            HeroMetric(
                label = if (userClears > 0) "Your clears" else "Progress",
                value = if (userClears > 0) "$userClears" else "—",
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun HeroMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(14.dp))
            .padding(vertical = 10.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(value, fontWeight = FontWeight.Bold, color = Ink, fontSize = 16.sp)
        Text(label, style = MaterialTheme.typography.labelSmall, color = Muted, fontSize = 10.sp)
    }
}

@Composable
private fun SectionHeading(
    label: String,
    title: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        Text(
            label.uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.4.sp,
            color = Brand,
        )
        Text(
            title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Neutral950,
        )
        Text(
            "Structured steps with videos, practice chapters, and mocks.",
            style = MaterialTheme.typography.bodySmall,
            color = Muted,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun OgTrackerExamCard(
    exam: OgExam,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val percent = exam.percent.coerceIn(0, 100)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(18.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(3.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(Brush.horizontalGradient(listOf(Brand, Color(0xFF6B8AE8)))),
        )
        Spacer(modifier = Modifier.height(14.dp))
        Row(verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Brand),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.School, contentDescription = null, tint = Color.White)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "EXAM TRACK",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    color = Muted,
                )
                Text(
                    exam.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Neutral950,
                )
            }
        }
        exam.description?.takeIf { it.isNotBlank() }?.let {
            Text(
                it,
                style = MaterialTheme.typography.bodySmall,
                color = Muted,
                maxLines = 2,
                modifier = Modifier.padding(top = 10.dp),
            )
        }
        Row(
            modifier = Modifier.padding(top = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Pill("${exam.liveChapterCount}/${exam.chapterCount.takeIf { it > 0 } ?: "—"} live")
            if (exam.totalSteps > 0) Pill("${exam.totalSteps} steps")
        }
        if (exam.totalSteps > 0) {
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Progress", style = MaterialTheme.typography.labelSmall, color = Muted)
                Text("$percent%", fontWeight = FontWeight.SemiBold, color = Ink, fontSize = 12.sp)
            }
            LinearProgressIndicator(
                progress = { (percent / 100f).coerceIn(0f, 1f).coerceAtLeast(if (percent == 0) 0.03f else 0f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp)
                    .height(6.dp)
                    .clip(RoundedCornerShape(999.dp)),
                color = Brand,
                trackColor = Color(0xFFF5F5F5),
            )
        }
        Row(
            modifier = Modifier.padding(top = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Open chapters", fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 14.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun OgTrackerPathCard(
    path: OgPathSummary,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val percent = path.percent.coerceIn(0, 100)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PlayCircle, contentDescription = null, tint = Brand, modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                path.category?.takeIf { it.isNotBlank() }?.let {
                    Text(it.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Muted)
                }
                Text(path.title, fontWeight = FontWeight.Bold, color = Ink)
            }
            if (path.locked) {
                Text(
                    "Premium",
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFFFFBEB))
                        .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFFB45309),
                )
            }
        }
        if (!path.description.isNullOrBlank()) {
            Text(path.description, style = MaterialTheme.typography.bodySmall, color = Muted, maxLines = 2)
        }
        Text(
            "${path.completedResources}/${path.totalResources} steps · $percent%",
            style = MaterialTheme.typography.labelSmall,
            color = Muted,
            fontWeight = FontWeight.Medium,
        )
        LinearProgressIndicator(
            progress = { (percent / 100f).coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(99.dp)),
            color = Neutral900,
            trackColor = Color(0xFFE5E5E5),
        )
    }
}

@Composable
private fun Pill(text: String) {
    Text(
        text,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Color(0xFFFAFAFA))
            .border(1.dp, Border, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        color = Muted,
    )
}