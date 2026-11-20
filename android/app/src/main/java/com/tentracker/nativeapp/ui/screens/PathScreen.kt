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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.OgResource
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.extractYouTubeVideoId
import com.tentracker.nativeapp.ui.util.resourceOpenUrl
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel

private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral900 = Color(0xFF171717)
private val Emerald600 = Color(0xFF059669)
private val Amber500 = Color(0xFFF59E0B)

private data class PathSection(val label: String, val items: List<IndexedValue<OgResource>>)

private fun groupBySection(resources: List<OgResource>): List<PathSection> {
    val order = mutableListOf<String>()
    val map = linkedMapOf<String, MutableList<IndexedValue<OgResource>>>()
    resources.forEachIndexed { idx, resource ->
        val label = resource.sectionLabel?.trim().takeIf { !it.isNullOrBlank() } ?: "Path"
        if (label !in map) order.add(label)
        map.getOrPut(label) { mutableListOf() }.add(IndexedValue(idx, resource))
    }
    return order.map { PathSection(it, map.getValue(it)) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PathScreen(
    vm: PathViewModel,
    onBack: () -> Unit,
    onPlayVideo: (resourceId: String, youtubeId: String, title: String) -> Unit,
    onOpenWeb: (url: String, title: String?) -> Unit = { _, _ -> },
) {
    val state by vm.state.collectAsState()
    val path = state.detail?.path
    val resources = state.detail?.resources.orEmpty()
    val sections = groupBySection(resources)

    Scaffold(
        containerColor = Neutral50,
        topBar = {
            TopAppBar(
                title = { Text(path?.title ?: "Tracker", maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { vm.refresh(sync = true, silent = true) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Neutral50),
            )
        },
    ) { padding ->
        when {
            state.loading && path == null -> {
                LoadingState(
                    modifier = Modifier.padding(padding),
                    message = "Loading tracker…",
                )
            }
            state.error != null && path == null -> {
                ErrorState(
                    message = state.error ?: "Could not load this tracker",
                    modifier = Modifier.padding(padding),
                    onRetry = { vm.refresh() },
                )
            }
            resources.isEmpty() -> {
                EmptyState(
                    message = "No lessons in this path yet.",
                    modifier = Modifier.padding(padding),
                    actionLabel = "Refresh",
                    onAction = { vm.refresh(sync = true) },
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .padding(padding)
                        .fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp),
                ) {
                    item {
                        TextButton(onClick = onBack, modifier = Modifier.padding(bottom = 4.dp)) {
                            Text("← All trackers", color = Muted, fontSize = 13.sp)
                        }
                        path?.category?.takeIf { it.isNotBlank() }?.let { cat ->
                            Text(
                                cat.uppercase(),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 0.8.sp,
                                color = Muted,
                            )
                        }
                        Text(
                            path?.title.orEmpty(),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = Ink,
                        )
                        path?.description?.takeIf { it.isNotBlank() }?.let { desc ->
                            Text(desc, style = MaterialTheme.typography.bodySmall, color = Muted, modifier = Modifier.padding(top = 6.dp))
                        }
                        val completed = path?.completedResources ?: 0
                        val total = path?.totalResources ?: 0
                        val pct = path?.percent ?: 0
                        Column(modifier = Modifier.padding(top = 16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(
                                    "$completed/$total complete",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                )
                                Text("$pct%", fontWeight = FontWeight.Medium, color = Ink, fontSize = 12.sp)
                            }
                            LinearProgressIndicator(
                                progress = { (pct / 100f).coerceIn(0f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp)
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(999.dp)),
                                color = Neutral900,
                                trackColor = Color(0xFFE5E5E5),
                            )
                        }
                        Spacer(modifier = Modifier.height(20.dp))
                    }

                    sections.forEach { section ->
                        val doneCount = section.items.count { (_, r) -> r.progress?.status == "COMPLETED" }
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp, start = 4.dp, end = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    section.label,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Ink,
                                    fontSize = 14.sp,
                                )
                                Text(
                                    "$doneCount/${section.items.size} done",
                                    fontSize = 11.sp,
                                    color = Muted,
                                )
                            }
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color.White)
                                    .border(1.dp, Border, RoundedCornerShape(16.dp)),
                            ) {
                                section.items.forEachIndexed { sectionIdx, indexed ->
                                    val resource = indexed.value
                                    val globalIndex = indexed.index
                                    ResourceRow(
                                        resource = resource,
                                        index = globalIndex,
                                        mutedBg = resource.sequenceLocked,
                                        onClick = {
                                            val type = resource.type.uppercase()
                                            val ytId = extractYouTubeVideoId(resource.youtubeVideoId)
                                            if (type == "VIDEO" && ytId != null && !resource.locked && !resource.sequenceLocked) {
                                                onPlayVideo(resource.id, ytId, resource.title)
                                            } else {
                                                val url = resourceOpenUrl(resource, path?.slug.orEmpty())
                                                if (url != null) onOpenWeb(url, resource.title)
                                            }
                                        },
                                    )
                                    if (sectionIdx < section.items.lastIndex) {
                                        HorizontalDivider(color = Color(0xFFF5F5F5))
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ResourceRow(
    resource: OgResource,
    index: Int,
    mutedBg: Boolean,
    onClick: () -> Unit,
) {
    val type = resource.type.uppercase()
    val pct = resource.progress?.percentWatched ?: 0
    val status = resource.progress?.status ?: "NOT_STARTED"
    val blocked = resource.locked || resource.sequenceLocked
    val enabled = !blocked
    val showBar = !blocked && (type == "VIDEO" || type == "PRACTICE_CHAPTER" || (type == "MOCK_TEST" && pct > 0))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (mutedBg) Color(0xFFFAFAFA) else Color.White)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        StatusDot(status = status)
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.Top) {
                Text(
                    "%02d".format(index + 1),
                    fontSize = 12.sp,
                    color = Muted,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(end = 8.dp, top = 2.dp),
                )
                Text(
                    resource.title,
                    fontWeight = FontWeight.SemiBold,
                    color = if (enabled) Ink else Muted,
                    fontSize = 14.sp,
                    modifier = Modifier.weight(1f),
                )
            }
            Row(
                modifier = Modifier.padding(top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    TypeIcon(type = type)
                    Text(typeLabel(type), fontSize = 11.sp, color = Muted)
                }
                progressCaption(resource, type, pct, status)?.let { cap ->
                    Text(cap, fontSize = 11.sp, color = Ink, fontWeight = FontWeight.Medium)
                }
                if (resource.locked) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, null, tint = Color(0xFFB45309), modifier = Modifier.size(12.dp))
                        Text("Premium", fontSize = 11.sp, color = Color(0xFFB45309))
                    }
                } else if (resource.sequenceLocked) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, null, tint = Muted, modifier = Modifier.size(12.dp))
                        Text("Finish previous step", fontSize = 11.sp, color = Muted)
                    }
                }
            }
            if (showBar) {
                LinearProgressIndicator(
                    progress = { (pct / 100f).coerceIn(0f, 1f) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .height(4.dp)
                        .clip(RoundedCornerShape(999.dp)),
                    color = if (status == "COMPLETED") Emerald600 else Neutral900,
                    trackColor = Color(0xFFF5F5F5),
                )
            }
        }
    }
}

@Composable
private fun StatusDot(status: String?) {
    when (status) {
        "COMPLETED" -> Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald600, modifier = Modifier.size(18.dp))
        "IN_PROGRESS" -> Box(
            modifier = Modifier
                .size(18.dp)
                .clip(CircleShape)
                .background(Color(0xFFFFFBEB))
                .border(1.dp, Amber500, CircleShape),
        )
        else -> Icon(Icons.Outlined.Circle, contentDescription = null, tint = Color(0xFFD4D4D4), modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun TypeIcon(type: String) {
    val icon = when (type) {
        "VIDEO" -> Icons.Default.PlayArrow
        "MOCK_TEST" -> Icons.Default.Quiz
        else -> Icons.Default.School
    }
    Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
}

private fun typeLabel(type: String): String = when (type) {
    "VIDEO" -> "Video"
    "PRACTICE_CHAPTER" -> "Practice"
    "MOCK_TEST" -> "Mock test"
    "LEETCODE_PROBLEM" -> "LeetCode"
    "CODESTUDIO_PROBLEM" -> "CodeStudio"
    "HACKERRANK_PROBLEM" -> "HackerRank"
    else -> type
}

private fun progressCaption(resource: OgResource, type: String, pct: Int, status: String): String? {
    val done = status == "COMPLETED"
    return when (type) {
        "VIDEO" -> "$pct%${if (done) " · Done" else ""}"
        "PRACTICE_CHAPTER" -> when {
            done -> "Done"
            status == "IN_PROGRESS" -> "In progress"
            else -> null
        }
        "MOCK_TEST" -> when {
            done -> "Completed"
            status == "IN_PROGRESS" -> "In progress"
            else -> "Not started"
        }
        else -> if (done) "Solved" else if (status == "IN_PROGRESS") "In progress" else null
    }
}