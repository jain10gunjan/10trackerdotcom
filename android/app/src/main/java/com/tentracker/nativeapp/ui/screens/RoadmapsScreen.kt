package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.RoadmapSummary
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
import com.tentracker.nativeapp.ui.theme.Neutral600
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.theme.Tw
import com.tentracker.nativeapp.ui.viewmodel.RoadmapsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoadmapsScreen(
    vm: RoadmapsViewModel,
    onBack: () -> Unit,
    onOpenRoadmap: (RoadmapSummary) -> Unit,
) {
    val state by vm.state.collectAsState()
    val hasFilters = state.searchQuery.isNotBlank() || state.selectedCategory != "All"

    Scaffold(
        containerColor = SurfaceMuted,
        topBar = {
            TopAppBar(
                title = {
                    Text("Roadmaps", fontWeight = FontWeight.SemiBold, fontSize = Tw.Type.base)
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
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(bottom = Tw.Space.s8),
            verticalArrangement = Arrangement.spacedBy(Tw.Space.s3),
        ) {
            item {
                OgFadeSlideIn(delayMillis = 0) {
                    Column(modifier = Modifier.padding(horizontal = Tw.Space.s4)) {
                        Spacer(modifier = Modifier.height(Tw.Space.s1))
                        RoadmapsHeroCard()
                        state.disclaimer?.takeIf { it.isNotBlank() }?.let { disclaimer ->
                            Spacer(modifier = Modifier.height(Tw.Space.s3))
                            RoadmapsDisclaimerBanner(text = disclaimer)
                        }
                    }
                }
            }

            item {
                OgFadeSlideIn(delayMillis = 70) {
                    Column(modifier = Modifier.padding(horizontal = Tw.Space.s4)) {
                        OutlinedTextField(
                            value = state.searchQuery,
                            onValueChange = vm::setSearch,
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            placeholder = { Text("Search roadmaps…", color = Muted) },
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = null, tint = Muted)
                            },
                            shape = Tw.Radius.shapeXl,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald,
                                unfocusedBorderColor = Border,
                                focusedContainerColor = Neutral50,
                                unfocusedContainerColor = Neutral50,
                            ),
                        )
                        if (state.categories.size > 1) {
                            Spacer(modifier = Modifier.height(Tw.Space.s3))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2),
                            ) {
                                state.categories.forEach { category ->
                                    val selected = category == state.selectedCategory
                                    Box(
                                        modifier = Modifier
                                            .clip(Tw.Radius.shapeFull)
                                            .clickable { vm.setCategory(category) }
                                            .background(if (selected) Ink else Color.White)
                                            .border(1.dp, if (selected) Ink else Border, Tw.Radius.shapeFull)
                                            .padding(
                                                horizontal = Tw.Space.s3,
                                                vertical = Tw.Space.s1_5,
                                            ),
                                    ) {
                                        Text(
                                            category,
                                            color = if (selected) Color.White else Ink,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = Tw.Type.textXs,
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(Tw.Space.s2))
                        Text(
                            "${state.filtered.size} roadmap${if (state.filtered.size == 1) "" else "s"}" +
                                if (hasFilters) " matching filters" else "",
                            fontSize = Tw.Type.textXs,
                            color = Muted,
                        )
                    }
                }
            }

            when {
                state.loading && state.roadmaps.isEmpty() -> {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().height(200.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            CircularProgressIndicator(color = Brand)
                        }
                    }
                }
                state.error != null && state.roadmaps.isEmpty() -> {
                    item {
                        Box(modifier = Modifier.padding(horizontal = Tw.Space.s4)) {
                            EmptyOrErrorPanel(
                                title = "Couldn't load roadmaps",
                                message = state.error ?: "Something went wrong.",
                                actionLabel = "Retry",
                                onAction = { vm.refresh() },
                            )
                        }
                    }
                }
                state.filtered.isEmpty() -> {
                    item {
                        Box(modifier = Modifier.padding(horizontal = Tw.Space.s4)) {
                            EmptyOrErrorPanel(
                                title = if (hasFilters) {
                                    "No roadmaps match your filters"
                                } else {
                                    "Roadmaps are on the way"
                                },
                                message = if (hasFilters) {
                                    "Try clearing search or choosing a different exam category."
                                } else {
                                    "We are preparing structured study plans for your exams."
                                },
                                actionLabel = if (hasFilters) "Reset filters" else "Retry",
                                onAction = {
                                    if (hasFilters) {
                                        vm.setSearch("")
                                        vm.setCategory("All")
                                    } else {
                                        vm.refresh()
                                    }
                                },
                            )
                        }
                    }
                }
                else -> {
                    itemsIndexed(
                        state.filtered,
                        key = { _, it -> it.id.ifBlank { it.slug } },
                    ) { index, roadmap ->
                        OgFadeSlideIn(
                            delayMillis = 110 + (index * 45).coerceAtMost(360),
                            modifier = Modifier.padding(horizontal = Tw.Space.s4),
                        ) {
                            RoadmapCatalogCard(
                                roadmap = roadmap,
                                onClick = { onOpenRoadmap(roadmap) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RoadmapsHeroCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = Tw.Radius.shape3xl,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 32.dp, y = (-40).dp)
                    .size(180.dp)
                    .blur(64.dp)
                    .background(Color(0xFFA7F3D0).copy(alpha = 0.4f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = (-32).dp, y = 40.dp)
                    .size(180.dp)
                    .blur(64.dp)
                    .background(Color(0xFFC4B5FD).copy(alpha = 0.25f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White,
                                Color.White,
                                Neutral50.copy(alpha = 0.85f),
                            ),
                        ),
                    ),
            )
            Column(modifier = Modifier.padding(Tw.Space.s6)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2),
                    modifier = Modifier
                        .clip(Tw.Radius.shapeFull)
                        .background(EmeraldSoft.copy(alpha = 0.8f))
                        .border(1.dp, EmeraldBorder, Tw.Radius.shapeFull)
                        .padding(horizontal = Tw.Space.s3, vertical = Tw.Space.s1_5),
                ) {
                    Icon(
                        Icons.Default.Verified,
                        contentDescription = null,
                        tint = Emerald,
                        modifier = Modifier.size(14.dp),
                    )
                    Text(
                        "10Tracker roadmap marketplace",
                        fontSize = Tw.Type.textXs,
                        color = EmeraldDark,
                        fontWeight = FontWeight.Medium,
                    )
                }
                Spacer(modifier = Modifier.height(Tw.Space.s4))
                Text(
                    "Structured plans. One-time purchase.",
                    fontSize = Tw.Type.text3xl,
                    lineHeight = 34.sp,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                )
                Spacer(modifier = Modifier.height(Tw.Space.s3))
                Text(
                    "Day-by-day study roadmaps with tasks, resources, and progress tracking. " +
                        "Preview free days, then unlock the full plan when you are ready.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Neutral600,
                    lineHeight = 22.sp,
                )
            }
        }
    }
}

@Composable
private fun RoadmapCatalogCard(roadmap: RoadmapSummary, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = Tw.Radius.shape3xl,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(Tw.Space.s5)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(Tw.Space.s4),
                verticalAlignment = Alignment.Top,
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(Tw.Radius.shape2xl)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(EmeraldSoft, Color(0xFFD1FAE5).copy(alpha = 0.8f)),
                            ),
                        )
                        .border(1.dp, EmeraldBorder, Tw.Radius.shape2xl),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Default.Map,
                        contentDescription = null,
                        tint = EmeraldDark,
                        modifier = Modifier.size(24.dp),
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            roadmap.title,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = Tw.Type.base,
                            lineHeight = 22.sp,
                            color = Ink,
                            modifier = Modifier.weight(1f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        roadmap.examLabel?.takeIf { it.isNotBlank() }?.let { label ->
                            Text(
                                label,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Muted,
                                modifier = Modifier
                                    .padding(start = Tw.Space.s2)
                                    .clip(Tw.Radius.shapeFull)
                                    .background(Neutral100)
                                    .border(1.dp, Border, Tw.Radius.shapeFull)
                                    .padding(horizontal = Tw.Space.s2, vertical = Tw.Space.s1),
                            )
                        }
                    }
                    if (!roadmap.description.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(Tw.Space.s1_5))
                        Text(
                            roadmap.description!!,
                            style = MaterialTheme.typography.bodySmall,
                            fontSize = Tw.Type.sm,
                            color = Muted,
                            lineHeight = 20.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Spacer(modifier = Modifier.height(Tw.Space.s3))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        NeutralMetaChip("₹${roadmap.priceInr} · one-time")
                        if (roadmap.totalDays > 0) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(Tw.Radius.shapeFull)
                                    .background(Neutral50)
                                    .border(1.dp, Border, Tw.Radius.shapeFull)
                                    .padding(horizontal = Tw.Space.s2_5, vertical = Tw.Space.s1),
                            ) {
                                Icon(
                                    Icons.Default.CalendarToday,
                                    contentDescription = null,
                                    tint = Muted,
                                    modifier = Modifier.size(12.dp),
                                )
                                Spacer(modifier = Modifier.width(Tw.Space.s1))
                                Text(
                                    "${roadmap.totalDays} days",
                                    fontSize = Tw.Type.textXs,
                                    color = Muted,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                    if (roadmap.freePreviewDays > 0) {
                        Spacer(modifier = Modifier.height(Tw.Space.s2))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(Tw.Radius.shapeFull)
                                .background(EmeraldSoft)
                                .border(1.dp, EmeraldBorder, Tw.Radius.shapeFull)
                                .padding(horizontal = Tw.Space.s2_5, vertical = Tw.Space.s1),
                        ) {
                            Icon(
                                Icons.Default.CardGiftcard,
                                contentDescription = null,
                                tint = EmeraldDark,
                                modifier = Modifier.size(12.dp),
                            )
                            Spacer(modifier = Modifier.width(Tw.Space.s1))
                            Text(
                                previewDaysLabel(roadmap.freePreviewDays),
                                fontSize = Tw.Type.textXs,
                                color = EmeraldDark,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(Tw.Space.s5))
            HorizontalDivider(color = Neutral100)
            Spacer(modifier = Modifier.height(Tw.Space.s4))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(Tw.Radius.shapeXl)
                    .background(Ink)
                    .padding(horizontal = Tw.Space.s4, vertical = Tw.Space.s2_5),
                horizontalArrangement = Arrangement.spacedBy(Tw.Space.s2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    if (roadmap.freePreviewDays > 0) "Preview free days" else "View roadmap",
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                    fontSize = Tw.Type.sm,
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
}

private fun previewDaysLabel(days: Int): String =
    "$days free preview day${if (days == 1) "" else "s"}"

@Composable
private fun RoadmapsDisclaimerBanner(text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(Tw.Radius.shape2xl)
            .background(Color(0xFFFFFBEB).copy(alpha = 0.9f))
            .border(1.dp, Color(0xFFFDE68A).copy(alpha = 0.8f), Tw.Radius.shape2xl)
            .padding(horizontal = Tw.Space.s4, vertical = Tw.Space.s3),
        horizontalArrangement = Arrangement.spacedBy(Tw.Space.s3),
    ) {
        Icon(
            Icons.Default.Info,
            contentDescription = null,
            tint = Color(0xFFB45309),
            modifier = Modifier.size(16.dp).padding(top = 2.dp),
        )
        Text(
            text,
            style = MaterialTheme.typography.bodySmall,
            color = Color(0xFF78350F),
            lineHeight = 18.sp,
        )
    }
}

@Composable
private fun NeutralMetaChip(text: String) {
    Text(
        text = text,
        modifier = Modifier
            .clip(Tw.Radius.shapeFull)
            .background(Neutral100)
            .padding(horizontal = Tw.Space.s2_5, vertical = Tw.Space.s1),
        color = Ink,
        fontWeight = FontWeight.Medium,
        fontSize = Tw.Type.textXs,
    )
}

@Composable
fun EmptyOrErrorPanel(
    title: String,
    message: String,
    actionLabel: String,
    onAction: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, Border, Tw.Radius.shape3xl)
            .background(Color.White, Tw.Radius.shape3xl)
            .padding(Tw.Space.s8),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Tw.Space.s2),
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(Tw.Radius.shape2xl)
                .background(EmeraldSoft)
                .border(1.dp, EmeraldBorder, Tw.Radius.shape2xl),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Map, contentDescription = null, tint = Emerald, modifier = Modifier.size(22.dp))
        }
        Spacer(modifier = Modifier.height(Tw.Space.s2))
        Text(title, fontWeight = FontWeight.Bold, color = Ink, fontSize = Tw.Type.lg)
        Text(
            message,
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
            lineHeight = 20.sp,
        )
        Spacer(modifier = Modifier.height(Tw.Space.s2))
        Button(
            onClick = onAction,
            shape = Tw.Radius.shapeXl,
            colors = ButtonDefaults.buttonColors(containerColor = Ink),
        ) {
            Text(actionLabel, fontWeight = FontWeight.SemiBold)
        }
    }
}
