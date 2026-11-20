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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.RoadmapSummary
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.SurfaceMuted
import com.tentracker.nativeapp.ui.viewmodel.RoadmapsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoadmapsScreen(
    vm: RoadmapsViewModel,
    onBack: () -> Unit,
    onOpenRoadmap: (RoadmapSummary) -> Unit,
) {
    val state by vm.state.collectAsState()

    Scaffold(
        containerColor = SurfaceMuted,
        topBar = {
            TopAppBar(
                title = { Text("Roadmaps") },
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
            contentPadding = PaddingValues(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
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
                                                Color(0xFFFAFAFA).copy(alpha = 0.85f),
                                            ),
                                        ),
                                    ),
                            )
                            Column(modifier = Modifier.padding(20.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(EmeraldSoft)
                                        .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                                        .padding(horizontal = 12.dp, vertical = 6.dp),
                                ) {
                                    Icon(
                                        Icons.Default.Verified,
                                        contentDescription = null,
                                        tint = Emerald,
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Text(
                                        "10Tracker roadmap marketplace",
                                        fontSize = 12.sp,
                                        color = EmeraldDark,
                                        fontWeight = FontWeight.Medium,
                                    )
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    "Structured plans. One-time purchase.",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = Ink,
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Day-by-day study roadmaps with tasks, resources, and progress tracking. " +
                                        "Preview free days, then unlock the full plan when you are ready.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Muted,
                                )
                            }
                        }
                    }
                    state.disclaimer?.takeIf { it.isNotBlank() }?.let { disclaimer ->
                        Spacer(modifier = Modifier.height(12.dp))
                        RoadmapsDisclaimerBanner(text = disclaimer)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = state.searchQuery,
                        onValueChange = vm::setSearch,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = { Text("Search roadmaps") },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = Muted)
                        },
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Emerald,
                            unfocusedBorderColor = Border,
                        ),
                    )
                }
            }

            if (state.categories.size > 1) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        state.categories.forEach { category ->
                            val selected = category == state.selectedCategory
                            val shape = RoundedCornerShape(12.dp)
                            Box(
                                modifier = Modifier
                                    .clip(shape)
                                    .clickable { vm.setCategory(category) }
                                    .background(if (selected) Ink else Color.White)
                                    .border(1.dp, if (selected) Ink else Border, shape)
                                    .padding(horizontal = 14.dp, vertical = 8.dp),
                            ) {
                                Text(
                                    category,
                                    color = if (selected) Color.White else Ink,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp,
                                )
                            }
                        }
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
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
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
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            EmptyOrErrorPanel(
                                title = "No roadmaps match",
                                message = if (state.searchQuery.isNotBlank() || state.selectedCategory != "All") {
                                    "Try another search or category."
                                } else {
                                    "Roadmaps will show up here when published."
                                },
                                actionLabel = if (state.searchQuery.isNotBlank() || state.selectedCategory != "All") {
                                    "Clear filters"
                                } else {
                                    "Retry"
                                },
                                onAction = {
                                    if (state.searchQuery.isNotBlank() || state.selectedCategory != "All") {
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
                    item {
                        Text(
                            "${state.filtered.size} roadmap${if (state.filtered.size == 1) "" else "s"}",
                            modifier = Modifier.padding(horizontal = 20.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Muted,
                        )
                    }
                    items(state.filtered, key = { it.id.ifBlank { it.slug } }) { roadmap ->
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            RoadmapCatalogCard(roadmap = roadmap, onClick = { onOpenRoadmap(roadmap) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RoadmapCatalogCard(roadmap: RoadmapSummary, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(EmeraldSoft, Color(0xFFD1FAE5).copy(alpha = 0.8f)),
                            ),
                        )
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Map, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(24.dp))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            roadmap.title,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 17.sp,
                            color = Ink,
                            modifier = Modifier.weight(1f),
                        )
                        roadmap.examLabel?.takeIf { it.isNotBlank() }?.let { label ->
                            Text(
                                label,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Muted,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(Color(0xFFF5F5F5))
                                    .border(1.dp, Border, RoundedCornerShape(999.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                    }
                    if (!roadmap.description.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            roadmap.description!!,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Muted,
                            maxLines = 2,
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        NeutralMetaChip("₹${roadmap.priceInr} · one-time")
                        if (roadmap.totalDays > 0) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(Color(0xFFF5F5F5))
                                    .padding(horizontal = 10.dp, vertical = 5.dp),
                            ) {
                                Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Muted, modifier = Modifier.size(12.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("${roadmap.totalDays} days", fontSize = 12.sp, color = Muted, fontWeight = FontWeight.Medium)
                            }
                        }
                        if (roadmap.freePreviewDays > 0) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(EmeraldSoft)
                                    .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                                    .padding(horizontal = 10.dp, vertical = 5.dp),
                            ) {
                                Icon(Icons.Default.CardGiftcard, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(12.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    previewDaysLabel(roadmap.freePreviewDays),
                                    fontSize = 12.sp,
                                    color = EmeraldDark,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            androidx.compose.material3.HorizontalDivider(color = Color(0xFFF5F5F5))
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Ink)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    if (roadmap.freePreviewDays > 0) "Preview free days" else "View roadmap",
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                    fontSize = 14.sp,
                )
                Icon(
                    Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp),
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
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFFFFBEB))
            .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(16.dp))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFFB45309), modifier = Modifier.size(16.dp))
        Text(text, style = MaterialTheme.typography.bodySmall, color = Color(0xFF78350F), lineHeight = 18.sp)
    }
}

@Composable
private fun NeutralMetaChip(text: String) {
    Text(
        text = text,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Color(0xFFF5F5F5))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        color = Ink,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
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
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .background(Color.White, RoundedCornerShape(16.dp))
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(title, fontWeight = FontWeight.Bold, color = Ink)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = Muted)
        androidx.compose.material3.TextButton(onClick = onAction) { Text(actionLabel) }
    }
}