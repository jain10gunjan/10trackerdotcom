package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.RoadmapDay
import com.tentracker.nativeapp.data.RoadmapDaySummary
import com.tentracker.nativeapp.ui.motion.OgFadeSlideIn
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Neutral100
import com.tentracker.nativeapp.ui.theme.Neutral50
import com.tentracker.nativeapp.ui.theme.Neutral200
import com.tentracker.nativeapp.ui.theme.Neutral300
import com.tentracker.nativeapp.ui.theme.Neutral400
import com.tentracker.nativeapp.ui.theme.Neutral600
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.theme.Tw
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.RoadmapDetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoadmapDetailScreen(
    vm: RoadmapDetailViewModel,
    onBack: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val detail = state.detail
    val roadmap = detail?.roadmap
    val context = LocalContext.current

    Scaffold(
        containerColor = SurfaceMuted,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        roadmap?.title ?: "Roadmap",
                        maxLines = 1,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = Tw.Type.base,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
            )
        },
    ) { padding ->
        when {
            state.loading && detail == null -> {
                Box(
                    modifier = Modifier.padding(padding).fillMaxSize(),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = Brand)
                }
            }
            state.error != null && detail == null -> {
                Column(
                    modifier = Modifier
                        .padding(padding)
                        .padding(Tw.Space.s6),
                    verticalArrangement = Arrangement.spacedBy(Tw.Space.s2),
                ) {
                    Text(state.error ?: "Error", color = Muted)
                    TextButton(onClick = { vm.refresh() }) { Text("Retry") }
                }
            }
            roadmap != null && detail != null -> {
                val progressPct = detail.progress?.percent ?: 0
                val completedTasks = detail.progress?.completedTasks ?: 0
                val totalTasks = detail.progress?.totalTasks ?: 0
                val lockedCount = (detail.totalDays - detail.unlockedDayCount).coerceAtLeast(0)
                val daysByNumber = remember(detail.days) {
                    detail.days.associateBy { it.day_number }
                }

                LazyColumn(
                    modifier = Modifier.padding(padding).fillMaxSize(),
                    contentPadding = PaddingValues(
                        horizontal = Tw.Space.s4,
                        vertical = Tw.Space.s4,
                    ),
                    verticalArrangement = Arrangement.spacedBy(Tw.Space.s3),
                ) {
                    item {
                        OgFadeSlideIn(delayMillis = 0) {
                            RoadmapViewerHero(
                                title = roadmap.title,
                                description = roadmap.description,
                                progressPct = progressPct,
                                completedTasks = completedTasks,
                                totalTasks = totalTasks,
                                unlockedDayCount = detail.unlockedDayCount,
                                totalDays = detail.totalDays,
                                purchased = detail.purchased,
                                freePreviewDays = roadmap.free_preview_days,
                                priceInr = roadmap.price_inr,
                            )
                        }
                    }

                    if (!detail.purchased && lockedCount > 0) {
                        item {
                            OgFadeSlideIn(delayMillis = 80) {
                                UnlockRoadmapCard(
                                    lockedCount = lockedCount,
                                    priceInr = roadmap.price_inr,
                                    notice = detail.noRefundsNotice,
                                    onUnlock = { openSite(context, "/roadmaps/${roadmap.slug}") },
                                )
                            }
                        }
                    }

                    item {
                        OgFadeSlideIn(delayMillis = 110) {
                            Text(
                                if (detail.purchased) "YOUR ROADMAP" else "DAY PLAN",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = if (detail.purchased) EmeraldDark else Muted,
                                letterSpacing = 1.sp,
                            )
                        }
                    }

                    itemsIndexed(
                        detail.daySummaries,
                        key = { _, it -> it.id.ifBlank { "summary-${it.day_number}" } },
                    ) { index, summary ->
                        OgFadeSlideIn(
                            delayMillis = 130 + (index * 40).coerceAtMost(320),
                        ) {
                            DayListRow(
                                summary = summary,
                                unlockedDay = daysByNumber[summary.day_number],
                                onUnlock = {
                                    if (summary.locked) {
                                        openSite(context, "/roadmaps/${roadmap.slug}")
                                    }
                                },
                            )
                        }
                    }

                    item {
                        Text(
                            "Tap a day to review tasks · unlock for full access",
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = Tw.Space.s2, bottom = Tw.Space.s4),
                            fontSize = 11.sp,
                            color = Neutral400,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RoadmapViewerHero(
    title: String,
    description: String?,
    progressPct: Int,
    completedTasks: Int,
    totalTasks: Int,
    unlockedDayCount: Int,
    totalDays: Int,
    purchased: Boolean,
    freePreviewDays: Int,
    priceInr: Int,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = Tw.Radius.shape2xl,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = androidx.compose.ui.graphics.Brush.linearGradient(
                        colors = listOf(
                            Color.White,
                            Color.White,
                            EmeraldSoft.copy(alpha = 0.4f),
                        ),
                    ),
                )
                .padding(Tw.Space.s4),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(Tw.Space.s4)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Tw.Space.s4),
                    verticalAlignment = Alignment.Top,
                ) {
                    RoadmapProgressRing(percent = progressPct, sizeDp = 72f)
                    Column(
                        modifier = Modifier.weight(1f).padding(top = Tw.Space.s1),
                        verticalArrangement = Arrangement.spacedBy(Tw.Space.s1_5),
                    ) {
                        Text(
                            title,
                            fontWeight = FontWeight.Bold,
                            fontSize = Tw.Type.xl,
                            lineHeight = 26.sp,
                            color = Ink,
                        )
                        Text(
                            "$completedTasks/$totalTasks tasks · $unlockedDayCount/$totalDays days unlocked",
                            fontSize = Tw.Type.textXs,
                            color = Muted,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2)) {
                            if (purchased) {
                                StatusPill(
                                    text = "Full access",
                                    bg = EmeraldSoft,
                                    fg = EmeraldDark,
                                    border = EmeraldBorder,
                                )
                            } else if (freePreviewDays > 0) {
                                StatusPill(
                                    text = "$freePreviewDays free preview day${if (freePreviewDays == 1) "" else "s"}",
                                    bg = EmeraldSoft,
                                    fg = EmeraldDark,
                                    border = EmeraldBorder,
                                    icon = {
                                        Icon(
                                            Icons.Default.CardGiftcard,
                                            contentDescription = null,
                                            tint = EmeraldDark,
                                            modifier = Modifier.size(12.dp),
                                        )
                                    },
                                )
                            }
                            if (!purchased) {
                                StatusPill(
                                    text = "₹$priceInr · one-time",
                                    bg = Neutral100,
                                    fg = Ink,
                                    border = Border,
                                )
                            }
                        }
                    }
                }

                description?.takeIf { it.isNotBlank() }?.let { about ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(Tw.Radius.shapeXl)
                            .background(Color.White.copy(alpha = 0.8f))
                            .border(1.dp, Neutral100, Tw.Radius.shapeXl)
                            .padding(horizontal = Tw.Space.s4, vertical = Tw.Space.s3_5),
                    ) {
                        Text(
                            "ABOUT THIS PLAN",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.6.sp,
                            color = Neutral400,
                        )
                        Spacer(modifier = Modifier.height(Tw.Space.s1_5))
                        Text(
                            about.trim(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = Neutral600,
                            lineHeight = 20.sp,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun UnlockRoadmapCard(
    lockedCount: Int,
    priceInr: Int,
    notice: String?,
    onUnlock: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = Tw.Radius.shape2xl,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(Tw.Space.s4)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Tw.Space.s3),
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(Tw.Radius.shapeXl)
                        .background(Ink),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Unlock $lockedCount more day${if (lockedCount == 1) "" else "s"}",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = Tw.Type.sm,
                        color = Ink,
                    )
                    Text(
                        "One-time ₹$priceInr",
                        fontSize = Tw.Type.textXs,
                        color = Muted,
                    )
                }
                Icon(Icons.Default.Star, contentDescription = null, tint = Emerald, modifier = Modifier.size(16.dp))
            }
            Spacer(modifier = Modifier.height(Tw.Space.s3))
            Button(
                onClick = onUnlock,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Ink),
                shape = Tw.Radius.shapeXl,
            ) {
                Text("Unlock full roadmap", fontWeight = FontWeight.SemiBold)
            }
            notice?.takeIf { it.isNotBlank() }?.let {
                Spacer(modifier = Modifier.height(Tw.Space.s2))
                Text(it, style = MaterialTheme.typography.labelSmall, color = Muted)
            }
        }
    }
}

@Composable
private fun DayListRow(
    summary: RoadmapDaySummary,
    unlockedDay: RoadmapDay?,
    onUnlock: () -> Unit,
) {
    var expanded by remember(summary.day_number) { mutableStateOf(false) }
    val locked = summary.locked
    val done = summary.progress >= 100
    val taskCount = summary.tasks
    val labels = summary.focus_area_labels.take(3)
    val subtitle = when {
        locked -> buildString {
            append(labels.joinToString(" · "))
            if (taskCount > 0) {
                if (isNotEmpty()) append(" · ")
                append("$taskCount tasks")
            }
        }
        else -> buildString {
            append("${summary.completedCount}/$taskCount tasks")
            if (labels.isNotEmpty()) append(" · ${labels.joinToString(" · ")}")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(Tw.Radius.shape2xl)
            .background(if (locked) Neutral50 else Color.White)
            .border(
                1.dp,
                if (locked) Border.copy(alpha = 0.6f) else Border.copy(alpha = 0.8f),
                Tw.Radius.shape2xl,
            )
            .clickable {
                if (locked) onUnlock() else expanded = !expanded
            }
            .padding(Tw.Space.s4),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(Tw.Radius.shapeXl)
                    .background(
                        when {
                            locked -> Neutral200.copy(alpha = 0.6f)
                            done -> Color(0xFFD1FAE5)
                            else -> Ink
                        },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                if (locked) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Muted, modifier = Modifier.size(16.dp))
                } else {
                    Text(
                        "${summary.day_number}",
                        fontWeight = FontWeight.Bold,
                        fontSize = Tw.Type.sm,
                        color = if (done) EmeraldDark else Color.White,
                    )
                }
            }
            Spacer(modifier = Modifier.width(Tw.Space.s3))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "Day ${summary.day_number}",
                        fontWeight = FontWeight.SemiBold,
                        color = if (locked) Muted else Ink,
                    )
                    if (locked) {
                        Text(
                            "LOCKED",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 0.4.sp,
                            color = Neutral400,
                        )
                    } else {
                        Text(
                            "${summary.progress}%",
                            fontSize = Tw.Type.sm,
                            fontWeight = FontWeight.SemiBold,
                            color = Neutral600,
                        )
                    }
                }
                if (subtitle.isNotBlank()) {
                    Text(
                        subtitle,
                        fontSize = Tw.Type.textXs,
                        color = Muted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(top = Tw.Space.s0_5),
                    )
                }
                summary.time_required?.takeIf { it.isNotBlank() }?.let { time ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = Tw.Space.s1),
                    ) {
                        Icon(
                            Icons.Default.Schedule,
                            contentDescription = null,
                            tint = Neutral400,
                            modifier = Modifier.size(12.dp),
                        )
                        Spacer(modifier = Modifier.width(Tw.Space.s1))
                        Text(time, fontSize = 11.sp, color = Neutral400)
                    }
                }
                if (!locked) {
                    Box(
                        modifier = Modifier
                            .padding(top = Tw.Space.s2_5)
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(Tw.Radius.shapeFull)
                            .background(Neutral100),
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(summary.progress.coerceIn(0, 100) / 100f)
                                .height(4.dp)
                                .clip(Tw.Radius.shapeFull)
                                .background(Emerald),
                        )
                    }
                }
            }
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = if (locked) Neutral300 else Neutral400,
                modifier = Modifier
                    .padding(top = Tw.Space.s2)
                    .size(20.dp),
            )
        }

        if (expanded && !locked && unlockedDay != null) {
            Spacer(modifier = Modifier.height(Tw.Space.s3))
            unlockedDay.focus_areas.forEach { area ->
                val areaTitle = area.focus_area?.takeIf { it.isNotBlank() } ?: "Focus"
                Text(
                    areaTitle,
                    fontWeight = FontWeight.Medium,
                    color = EmeraldDark,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(bottom = Tw.Space.s1),
                )
                area.tasks.take(8).forEach { task ->
                    Text(
                        "• ${task.task}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Ink,
                        modifier = Modifier.padding(bottom = Tw.Space.s0_5),
                    )
                }
                if (area.tasks.size > 8) {
                    Text(
                        "+${area.tasks.size - 8} more tasks",
                        style = MaterialTheme.typography.labelSmall,
                        color = Muted,
                    )
                }
                Spacer(modifier = Modifier.height(Tw.Space.s2))
            }
            unlockedDay.notes?.takeIf { it.isNotBlank() }?.let { notes ->
                Text(
                    notes.trim(),
                    fontSize = Tw.Type.textXs,
                    color = Neutral600,
                    lineHeight = 18.sp,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun StatusPill(
    text: String,
    bg: Color,
    fg: Color,
    border: Color,
    icon: (@Composable () -> Unit)? = null,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Tw.Space.s1),
        modifier = Modifier
            .clip(Tw.Radius.shapeFull)
            .background(bg)
            .border(1.dp, border, Tw.Radius.shapeFull)
            .padding(horizontal = Tw.Space.s2, vertical = Tw.Space.s0_5),
    ) {
        icon?.invoke()
        Text(text, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = fg)
    }
}

@Composable
private fun RoadmapProgressRing(percent: Int, sizeDp: Float) {
    val pctF = percent.coerceIn(0, 100) / 100f
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(sizeDp.dp)) {
        Canvas(modifier = Modifier.size(sizeDp.dp)) {
            val stroke = 6.dp.toPx()
            val radius = (size.minDimension - stroke) / 2f
            val topLeft = Offset((size.width - radius * 2) / 2f, (size.height - radius * 2) / 2f)
            val arcSize = Size(radius * 2, radius * 2)
            drawArc(
                color = Neutral100,
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = stroke),
            )
            drawArc(
                color = Emerald,
                startAngle = -90f,
                sweepAngle = 360f * pctF,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "$percent%",
                fontWeight = FontWeight.Bold,
                fontSize = Tw.Type.sm,
                color = Ink,
            )
            Text("done", fontSize = 10.sp, color = Muted)
        }
    }
}
