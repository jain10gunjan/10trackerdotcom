package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.RoadmapDay
import com.tentracker.nativeapp.data.RoadmapDaySummary
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
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
                title = { Text(roadmap?.title ?: "Roadmap", maxLines = 1) },
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
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(state.error ?: "Error", color = Muted)
                    TextButton(onClick = { vm.refresh() }) { Text("Retry") }
                }
            }
            roadmap != null && detail != null -> {
                LazyColumn(
                    modifier = Modifier.padding(padding).fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                        ) {
                            Column(
                                modifier = Modifier.padding(18.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                if (!roadmap.description.isNullOrBlank()) {
                                    Text(roadmap.description!!, style = MaterialTheme.typography.bodyLarge, color = Muted)
                                }
                                Text(
                                    "${detail.totalDays} days · ${detail.unlockedDayCount} unlocked" +
                                        if (detail.purchased) " · Owned" else " · ₹${roadmap.price_inr}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                )
                                detail.progress?.let { progress ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                    ) {
                                        Text(
                                            "${progress.completedTasks}/${progress.totalTasks} tasks",
                                            fontWeight = FontWeight.SemiBold,
                                            color = Ink,
                                        )
                                        Text("${progress.percent}%", fontWeight = FontWeight.SemiBold, color = EmeraldDark)
                                    }
                                    LinearProgressIndicator(
                                        progress = { (progress.percent / 100f).coerceIn(0f, 1f) },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(99.dp)),
                                        color = Emerald,
                                        trackColor = EmeraldSoft,
                                    )
                                }
                                if (!detail.purchased) {
                                    Button(
                                        onClick = {
                                            openSite(context, "/roadmaps/${roadmap.slug}")
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = Ink),
                                        shape = RoundedCornerShape(12.dp),
                                    ) {
                                        Text("Unlock full roadmap", fontWeight = FontWeight.SemiBold)
                                    }
                                    detail.noRefundsNotice?.takeIf { it.isNotBlank() }?.let { notice ->
                                        Text(notice, style = MaterialTheme.typography.labelSmall, color = Muted)
                                    }
                                }
                            }
                        }
                    }

                    if (detail.days.isNotEmpty()) {
                        item {
                            Text(
                                "PREVIEW DAYS",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = EmeraldDark,
                                letterSpacing = 1.sp,
                            )
                        }
                        items(detail.days, key = { it.id.ifBlank { "day-${it.day_number}" } }) { day ->
                            UnlockedDayCard(day)
                        }
                    }

                    item {
                        Text(
                            "ALL DAYS",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = Muted,
                            letterSpacing = 1.sp,
                        )
                    }
                    items(
                        detail.daySummaries,
                        key = { it.id.ifBlank { "summary-${it.day_number}" } },
                    ) { summary ->
                        DaySummaryRow(summary)
                    }
                }
            }
        }
    }
}

@Composable
private fun UnlockedDayCard(day: RoadmapDay) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldBorder),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (day.locked) Icons.Default.Lock else Icons.Default.LockOpen,
                    contentDescription = null,
                    tint = EmeraldDark,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Day ${day.day_number}", fontWeight = FontWeight.SemiBold, color = Ink)
                Spacer(modifier = Modifier.weight(1f))
                day.time_required?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.labelSmall, color = Muted)
                }
            }
            day.focus_areas.forEach { area ->
                val title = area.focus_area?.takeIf { it.isNotBlank() } ?: "Focus"
                Text(title, fontWeight = FontWeight.Medium, color = EmeraldDark, fontSize = 13.sp)
                area.tasks.take(6).forEach { task ->
                    Text("• ${task.task}", style = MaterialTheme.typography.bodyMedium, color = Ink)
                }
                if (area.tasks.size > 6) {
                    Text("+${area.tasks.size - 6} more tasks", style = MaterialTheme.typography.labelSmall, color = Muted)
                }
            }
        }
    }
}

@Composable
private fun DaySummaryRow(summary: RoadmapDaySummary) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (summary.locked) Color.White else EmeraldSoft.copy(alpha = 0.55f))
            .border(1.dp, if (summary.locked) Border else EmeraldBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            if (summary.locked) Icons.Default.Lock else Icons.Default.LockOpen,
            contentDescription = null,
            tint = if (summary.locked) Muted else EmeraldDark,
            modifier = Modifier.size(16.dp),
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text("Day ${summary.day_number}", fontWeight = FontWeight.SemiBold, color = Ink)
            val labels = summary.focus_area_labels.take(3).joinToString(" · ")
            if (labels.isNotBlank()) {
                Text(labels, style = MaterialTheme.typography.labelSmall, color = Muted)
            }
        }
        Text(
            "${summary.tasks} tasks",
            style = MaterialTheme.typography.labelSmall,
            color = Muted,
        )
    }
}