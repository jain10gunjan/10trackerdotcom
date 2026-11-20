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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
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
private val Neutral100 = Color(0xFFF5F5F5)
private val Neutral400 = Color(0xFFA3A3A3)
private val Neutral500 = Color(0xFF737373)
private val Neutral600 = Color(0xFF525252)
private val Neutral800 = Color(0xFF262626)
private val Neutral900 = Color(0xFF171717)
private val Neutral950 = Color(0xFF0A0A0A)
private val BrandBright = Color(0xFF4B6BC7)
private val CardBorder = Color(0xE6E5E5E5)

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

    val totalSteps = remember(exams, paths) {
        exams.sumOf { it.totalSteps }.takeIf { it > 0 }
            ?: paths.sumOf { it.totalResources }.takeIf { it > 0 }
            ?: 0
    }
    val liveChapters = remember(exams) { exams.sumOf { it.liveChapterCount } }
    val userCompleted = remember(stats) {
        (stats?.videosCompleted ?: 0) +
            (stats?.practiceCompleted ?: 0) +
            (stats?.mocksCompleted ?: 0)
    }
    val showInlineError = state.error != null && (exams.isNotEmpty() || paths.isNotEmpty())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Neutral50),
        contentPadding = PaddingValues(bottom = 64.dp),
    ) {
        item {
            TrackersHero(
                loading = state.loading && catalog == null,
                examCount = exams.size,
                liveChapters = liveChapters,
                totalSteps = totalSteps,
                userClears = userCompleted,
                isPremium = catalog?.isPremium == true,
            )
        }

        if (showInlineError) {
            item {
                Text(
                    state.error.orEmpty(),
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 12.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFEF2F2))
                        .border(1.dp, Color(0xFFFECACA), RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFB91C1C),
                    lineHeight = 20.sp,
                )
            }
        }

        catalog?.setupHint?.takeIf { catalog.setupRequired }?.let { hint ->
            item {
                Text(
                    hint,
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 20.dp)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFFFFBEB))
                        .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF92400E),
                    lineHeight = 20.sp,
                )
            }
        }

        when {
            state.loading && catalog == null -> {
                item { LoadingState(message = "Loading exams…") }
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
                        message = "No exams published yet. Run the hierarchy migration to seed GATE CSE chapters.",
                        actionLabel = "Retry",
                        onAction = { vm.refresh() },
                    )
                }
            }
            else -> {
                if (exams.isNotEmpty()) {
                    item { ExamHubHeading() }
                    items(exams, key = { it.slug }) { exam ->
                        OgTrackerExamCard(
                            exam = exam,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            onClick = { if (exam.slug.isNotBlank()) onOpenPath(exam.slug) },
                        )
                    }
                }

                if (paths.isNotEmpty()) {
                    item {
                        SectionHeading(
                            label = "Learning paths",
                            title = "OG tracker paths",
                            subtitle = "Direct chapter checklists when you skip the exam hub.",
                            modifier = Modifier.padding(top = if (exams.isNotEmpty()) 12.dp else 0.dp),
                        )
                    }
                    items(paths, key = { it.id }) { path ->
                        OgTrackerPathCard(
                            path = path,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
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
    loading: Boolean,
    examCount: Int,
    liveChapters: Int,
    totalSteps: Int,
    userClears: Int,
    isPremium: Boolean,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFFF8FAFC),
                        Color(0xFFF1F5F9),
                        Neutral50,
                    ),
                ),
            ),
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(BrandSoft, Color.Transparent),
                        radius = 900f,
                    ),
                ),
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(top = 20.dp, bottom = 40.dp),
        ) {
            Text(
                "Structured study paths",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 2.sp,
                color = Neutral500,
            )
            Text(
                "Finish every chapter — watch, practice, mock.",
                modifier = Modifier.padding(top = 12.dp),
                fontSize = 34.sp,
                fontWeight = FontWeight.Black,
                lineHeight = 36.sp,
                letterSpacing = (-0.5).sp,
                color = Neutral950,
            )
            Text(
                "OG Trackers turn each exam into chapters with one checklist. Lessons sync from " +
                    "YouTube through our Chrome extension; practice and mocks use what's already on 10Tracker.",
                modifier = Modifier.padding(top = 16.dp),
                fontSize = 14.sp,
                lineHeight = 22.sp,
                color = Neutral600,
            )
            if (isPremium) {
                Text(
                    "Premium active",
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color.White.copy(alpha = 0.9f))
                        .border(1.dp, Brand.copy(alpha = 0.25f), RoundedCornerShape(999.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Brand,
                )
            } else {
                Text(
                    "Sign in to keep checklist progress across devices.",
                    modifier = Modifier.padding(top = 12.dp),
                    fontSize = 12.sp,
                    color = Neutral500,
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                HeroMetricChip(
                    value = if (loading) "—" else if (examCount > 0) "$examCount" else "—",
                    label = "exams",
                )
                HeroMetricChip(
                    value = if (loading) "—" else if (liveChapters > 0) "$liveChapters" else "—",
                    label = "live chapters",
                )
                HeroMetricChip(
                    value = if (loading) "—" else if (totalSteps > 0) "$totalSteps" else "—",
                    label = "total steps",
                )
            }
            if (userClears > 0) {
                Text(
                    modifier = Modifier.padding(top = 8.dp),
                    text = buildAnnotatedString {
                        withStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.SemiBold, color = Neutral900)) {
                            append("$userClears")
                        }
                        append(" your clears")
                    },
                    fontSize = 14.sp,
                    color = Neutral500,
                )
            }
        }
    }
}

@Composable
private fun HeroMetricChip(value: String, label: String) {
    Text(
        text = buildAnnotatedString {
            withStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.SemiBold, color = Neutral900)) {
                append(value)
            }
            append(" ")
            append(label)
        },
        fontSize = 14.sp,
        color = Neutral500,
    )
}

@Composable
private fun ExamHubHeading() {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        Text(
            "Exam hub",
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.6.sp,
            color = Brand,
        )
        Text(
            "Choose your exam track",
            modifier = Modifier.padding(top = 4.dp),
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = (-0.25).sp,
            color = Neutral950,
        )
        Text(
            "Each exam opens into chapters. Live chapters launch a full tracker; the rest are ready " +
                "for content when you add YouTube and practice later.",
            modifier = Modifier.padding(top = 8.dp),
            fontSize = 14.sp,
            lineHeight = 20.sp,
            color = Neutral600,
        )
    }
}

@Composable
private fun SectionHeading(
    label: String,
    title: String,
    subtitle: String,
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
            modifier = Modifier.padding(top = 4.dp),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Neutral950,
        )
        Text(
            subtitle,
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
    val totalChapters = exam.chapterCount
    val live = exam.liveChapterCount

    Column(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 12.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = Color(0x47171F2E),
                spotColor = Color(0x47171F2E),
            )
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .background(Brush.horizontalGradient(listOf(Brand, BrandBright))),
        )
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Brand),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.School, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "EXAM TRACK",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.4.sp,
                        color = Neutral400,
                    )
                    Text(
                        exam.title,
                        modifier = Modifier.padding(top = 2.dp),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.25).sp,
                        color = Neutral950,
                    )
                }
            }
            exam.description?.takeIf { it.isNotBlank() }?.let {
                Text(
                    it,
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                    color = Neutral600,
                    maxLines = 2,
                    modifier = Modifier.padding(top = 12.dp),
                )
            }
            Row(
                modifier = Modifier.padding(top = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Pill("${live}/${if (totalChapters > 0) totalChapters else "—"} chapters live")
                if (exam.totalSteps > 0) Pill("${exam.totalSteps} steps")
            }
            if (exam.totalSteps > 0) {
                Spacer(modifier = Modifier.height(20.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Progress", fontSize = 12.sp, color = Neutral500)
                    Text("$percent%", fontWeight = FontWeight.SemiBold, color = Neutral800, fontSize = 12.sp)
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp)
                        .height(6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Neutral100),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(
                                (percent.coerceAtLeast(if (percent == 0) 3 else percent) / 100f)
                                    .coerceIn(0.03f, 1f),
                            )
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(Brand),
                    )
                }
            } else {
                Text(
                    "Chapters opening soon — structure is ready.",
                    modifier = Modifier.padding(top = 20.dp),
                    fontSize = 12.sp,
                    color = Neutral500,
                )
            }
            Row(
                modifier = Modifier.padding(top = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Open chapters", fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 14.sp)
                Spacer(modifier = Modifier.width(6.dp))
                Icon(
                    Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = Brand,
                    modifier = Modifier.size(16.dp),
                )
            }
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
            .shadow(8.dp, RoundedCornerShape(16.dp), ambientColor = Color(0x47171F2E), spotColor = Color(0x47171F2E))
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PlayCircle, contentDescription = null, tint = Brand, modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                path.category?.takeIf { it.isNotBlank() }?.let {
                    Text(it.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Muted)
                }
                Text(path.title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Ink)
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
            Text(path.description, fontSize = 14.sp, color = Neutral600, maxLines = 2, lineHeight = 20.sp)
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                "${path.completedResources}/${path.totalResources} complete",
                fontSize = 12.sp,
                color = Neutral500,
            )
            Text("$percent%", fontWeight = FontWeight.Medium, color = Neutral800, fontSize = 12.sp)
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(Color(0xCCE5E5E5)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth((percent / 100f).coerceIn(0f, 1f))
                    .height(6.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Neutral900),
            )
        }
    }
}

@Composable
private fun Pill(text: String) {
    Text(
        text,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Neutral50)
            .border(1.dp, Border, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        color = Neutral600,
    )
}