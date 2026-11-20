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
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.core.tween
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.OgResource
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.motion.OgEaseOut
import com.tentracker.nativeapp.ui.motion.OgFadeSlideIn
import com.tentracker.nativeapp.ui.motion.OgShimmerBlock
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.util.extractYouTubeVideoId
import com.tentracker.nativeapp.ui.util.resourceOpenUrl
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel

private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral100 = Color(0xFFF5F5F5)
private val Neutral200 = Color(0xFFE5E5E5)
private val Neutral300 = Color(0xFFD4D4D4)
private val Neutral400 = Color(0xFFA3A3A3)
private val Neutral500 = Color(0xFF737373)
private val Neutral600 = Color(0xFF525252)
private val Neutral700 = Color(0xFF404040)
private val Neutral800 = Color(0xFF262626)
private val Neutral900 = Color(0xFF171717)
private val Emerald600 = Color(0xFF059669)
private val Amber500 = Color(0xFFF59E0B)
private val CardBorder = Color(0xCCE5E5E5)
private val SequenceMutedBg = Color(0xCCFAFAFA)

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
    val continueResource = remember(resources, path?.locked) {
        if (path?.locked == true) null
        else resources.firstOrNull { r ->
            !r.locked && !r.sequenceLocked && r.progress?.status != "COMPLETED"
        }
    }

    Scaffold(
        containerColor = Neutral50,
        bottomBar = {
            AnimatedVisibility(
                visible = continueResource != null,
                enter = slideInVertically(
                    initialOffsetY = { it / 3 },
                    animationSpec = tween(400, easing = OgEaseOut),
                ) + fadeIn(tween(400, easing = OgEaseOut, delayMillis = 80)),
            ) {
                val resource = continueResource ?: return@AnimatedVisibility
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White.copy(alpha = 0.92f))
                        .border(1.dp, Color(0xE6E5E5E5))
                        .clickable {
                            val type = resource.type.uppercase()
                            val ytId = extractYouTubeVideoId(resource.youtubeVideoId)
                            if (type == "VIDEO" && ytId != null) {
                                onPlayVideo(resource.id, ytId, resource.title)
                            } else {
                                val url = resourceOpenUrl(resource, path?.slug.orEmpty())
                                if (url != null) onOpenWeb(url, resource.title)
                            }
                        }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "CONTINUE",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.4.sp,
                            color = Brand,
                        )
                        Text(
                            resource.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Neutral900,
                            maxLines = 1,
                        )
                    }
                    Row(
                        modifier = Modifier
                            .shadow(12.dp, RoundedCornerShape(12.dp), ambientColor = Brand.copy(0.35f), spotColor = Brand.copy(0.45f))
                            .clip(RoundedCornerShape(12.dp))
                            .background(Brand)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            continueCtaLabel(resource.type, resource.progress?.status),
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }
            }
        },
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { vm.refresh(sync = true, silent = true) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Neutral50),
            )
        },
    ) { padding ->
        when {
            state.loading && path == null -> {
                PathViewerSkeleton(modifier = Modifier.padding(padding))
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
                    message = "No steps in this path yet.",
                    modifier = Modifier.padding(padding),
                    actionLabel = "Refresh",
                    onAction = { vm.refresh(sync = true) },
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .padding(padding)
                        .fillMaxSize()
                        .background(Neutral50),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 112.dp),
                ) {
                    item {
                        OgFadeSlideIn(delayMillis = 0) {
                            Row(
                                modifier = Modifier
                                    .clickable(onClick = onBack)
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Icon(
                                    Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = null,
                                    tint = Neutral500,
                                    modifier = Modifier.size(16.dp),
                                )
                                Text("All trackers", fontSize = 14.sp, color = Neutral500)
                            }

                            val category = path?.category?.trim().takeIf { !it.isNullOrBlank() } ?: "General"
                            Text(
                                category.uppercase(),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 0.4.sp,
                                color = Neutral500,
                            )
                            Text(
                                path?.title.orEmpty(),
                                modifier = Modifier.padding(top = 4.dp),
                                fontSize = 30.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = (-0.25).sp,
                                color = Neutral900,
                            )
                            path?.description?.takeIf { it.isNotBlank() }?.let { desc ->
                                Text(
                                    desc,
                                    fontSize = 14.sp,
                                    lineHeight = 20.sp,
                                    color = Neutral600,
                                    modifier = Modifier.padding(top = 8.dp),
                                )
                            }
                            val completed = path?.completedResources ?: 0
                            val total = path?.totalResources ?: 0
                            val pct = path?.percent ?: 0
                            Column(
                                modifier = Modifier
                                    .padding(top = 16.dp)
                                    .fillMaxWidth(0.92f),
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Text(
                                        buildString {
                                            append("$completed/$total complete")
                                            if (state.refreshing) append(" · syncing…")
                                        },
                                        fontSize = 12.sp,
                                        color = Neutral500,
                                    )
                                    Text("$pct%", fontWeight = FontWeight.Medium, color = Neutral800, fontSize = 12.sp)
                                }
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 4.dp)
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(Color(0xCCE5E5E5)),
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth((pct / 100f).coerceIn(0f, 1f))
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(999.dp))
                                            .background(Neutral900),
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(28.dp))
                    }

                    sections.forEachIndexed { sectionIndex, section ->
                        val doneCount = section.items.count { (_, r) -> r.progress?.status == "COMPLETED" }
                        item {
                            OgFadeSlideIn(delayMillis = 60 + sectionIndex * 50) {
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
                                        color = Neutral800,
                                        fontSize = 14.sp,
                                    )
                                    Text(
                                        "$doneCount/${section.items.size} done",
                                        fontSize = 11.sp,
                                        color = Neutral500,
                                    )
                                }
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .shadow(2.dp, RoundedCornerShape(16.dp))
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color.White)
                                        .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
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
                                            HorizontalDivider(color = Neutral100, thickness = 1.dp)
                                        }
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(20.dp))
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
    val done = status == "COMPLETED"
    val showBar =
        !blocked &&
            (type == "VIDEO" || type == "PRACTICE_CHAPTER" || (type == "MOCK_TEST" && pct > 0))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (mutedBg) SequenceMutedBg else Color.White)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        StatusIcon(status = status)
        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    "%02d".format(index + 1),
                    fontSize = 12.sp,
                    color = Neutral400,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    resource.title,
                    fontWeight = FontWeight.SemiBold,
                    color = if (enabled) Neutral900 else Neutral500,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    modifier = Modifier.weight(1f),
                )
            }
            Row(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    TypeIcon(type = type)
                    Text(typeLabel(type), fontSize = 11.sp, color = Neutral500)
                }
                progressCaption(resource, type, pct, status)?.let { cap ->
                    Text(cap, fontSize = 11.sp, color = Neutral700, fontWeight = FontWeight.Medium)
                }
                if (resource.locked) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, null, tint = Color(0xFFB45309), modifier = Modifier.size(12.dp))
                        Text("Premium", fontSize = 11.sp, color = Color(0xFFB45309))
                    }
                } else if (resource.sequenceLocked) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, null, tint = Neutral500, modifier = Modifier.size(12.dp))
                        Text("Finish previous step", fontSize = 11.sp, color = Neutral500)
                    }
                }
            }
            if (showBar) {
                if (type == "VIDEO") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("Progress", fontSize = 12.sp, color = Neutral500)
                        Text("$pct%", fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 12.sp)
                    }
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = if (type == "VIDEO") 4.dp else 10.dp)
                        .height(6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Neutral100),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth((pct / 100f).coerceIn(0f, 1f))
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(if (done || pct >= 90) Emerald600 else Neutral900),
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusIcon(status: String?) {
    when (status) {
        "COMPLETED" -> Icon(
            Icons.Default.CheckCircle,
            contentDescription = null,
            tint = Emerald600,
            modifier = Modifier.size(16.dp),
        )
        "IN_PROGRESS" -> Box(
            modifier = Modifier
                .size(16.dp)
                .clip(CircleShape)
                .background(Color(0xFFFFFBEB))
                .border(1.dp, Amber500, CircleShape),
        )
        else -> Icon(Icons.Outlined.Circle, contentDescription = null, tint = Neutral300, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun TypeIcon(type: String) {
    val icon = when (type) {
        "VIDEO" -> Icons.Default.PlayArrow
        "MOCK_TEST" -> Icons.Default.Quiz
        else -> Icons.Default.School
    }
    Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(12.dp))
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

private fun continueCtaLabel(type: String, status: String?): String {
    val s = status ?: "NOT_STARTED"
    return when (type.uppercase()) {
        "VIDEO" -> if (s == "IN_PROGRESS") "Resume" else "Watch"
        "PRACTICE_CHAPTER" -> if (s == "IN_PROGRESS") "Continue" else "Practice"
        "MOCK_TEST" -> when (s) {
            "COMPLETED" -> "Retake"
            "IN_PROGRESS" -> "Resume"
            else -> "Start mock"
        }
        else -> "Open"
    }
}

@Composable
private fun PathViewerSkeleton(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Neutral50)
            .padding(horizontal = 16.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        OgShimmerBlock(modifier = Modifier.fillMaxWidth(0.35f), height = 14.dp)
        OgShimmerBlock(modifier = Modifier.fillMaxWidth(0.72f), height = 32.dp)
        OgShimmerBlock(modifier = Modifier.fillMaxWidth(), height = 14.dp)
        OgShimmerBlock(modifier = Modifier.fillMaxWidth(0.55f), height = 8.dp)
        Spacer(modifier = Modifier.height(8.dp))
        repeat(5) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OgShimmerBlock(modifier = Modifier.size(40.dp), corner = 12.dp)
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OgShimmerBlock(modifier = Modifier.fillMaxWidth(0.8f))
                    OgShimmerBlock(modifier = Modifier.fillMaxWidth(0.5f), height = 12.dp)
                }
            }
        }
    }
}

private fun progressCaption(_resource: OgResource, type: String, pct: Int, status: String): String? {
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