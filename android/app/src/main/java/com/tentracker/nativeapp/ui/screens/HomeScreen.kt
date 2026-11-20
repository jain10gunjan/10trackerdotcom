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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.OgPathSummary
import com.tentracker.nativeapp.ui.components.BrandLogo
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandDeep
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel
import java.util.Calendar

private fun greetingForHour(): String {
    val h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    return when {
        h < 12 -> "Good morning"
        h < 17 -> "Good afternoon"
        else -> "Good evening"
    }
}

@Composable
fun HomeScreen(
    vm: HomeViewModel,
    onOpenPath: (String) -> Unit,
    onOpenExams: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenArticles: () -> Unit,
    onOpenMore: () -> Unit,
    onOpenRoadmaps: () -> Unit,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    val state by vm.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg),
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(BrandSoft.copy(alpha = 0.55f), Color.Transparent),
                        center = Offset(280f, 0f),
                        radius = 480f,
                    ),
                ),
        )

        when {
            state.loading && state.catalog == null -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Brand)
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(
                        start = 16.dp,
                        end = 16.dp,
                        top = 16.dp,
                        bottom = 12.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    item {
                        HomeTopChrome(
                            signedIn = state.signedIn,
                            onSignIn = onSignIn,
                            onSignOut = onSignOut,
                        )
                    }

                    item {
                        HomeHeroBlock(
                            signedIn = state.signedIn,
                            onBrowseExams = onOpenExams,
                            onExploreTrackers = onOpenTrackers,
                            onSignIn = onSignIn,
                        )
                    }

                    item {
                        QuickHubGrid(
                            onExams = onOpenExams,
                            onTrackers = onOpenTrackers,
                            onRoadmaps = onOpenRoadmaps,
                            onUpdates = onOpenArticles,
                        )
                    }

                    item {
                        val examCount = state.exams.size.takeIf { it > 0 }
                            ?: state.catalog?.exams?.size
                            ?: 11
                        val pathCount = state.catalog?.paths?.size ?: 1
                        Text(
                            text = "$examCount exams  ·  43k+ questions  ·  $pathCount paths",
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center,
                            color = Muted,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }

                    if (!state.signedIn) {
                        item {
                            SignInPromptCard(onSignIn = onSignIn)
                        }
                    }

                    state.catalog?.stats?.let { stats ->
                        item {
                            StatsRow(
                                videos = stats.videosCompleted,
                                practice = stats.practiceCompleted,
                                mocks = stats.mocksCompleted,
                            )
                        }
                    }

                    val paths = state.catalog?.paths.orEmpty()
                    if (paths.isNotEmpty()) {
                        item {
                            SectionHeading(
                                title = "Continue with OG Trackers",
                                subtitle = "Watch lessons in-app. Progress syncs to your account.",
                            )
                        }
                        items(paths.take(4), key = { it.id }) { path ->
                            PathCard(path = path, onClick = { onOpenPath(path.slug) })
                        }
                        if (paths.size > 4) {
                            item {
                                TextButton(onClick = onOpenTrackers, modifier = Modifier.fillMaxWidth()) {
                                    Text("See all trackers", color = Brand, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        Icons.AutoMirrored.Filled.ArrowForward,
                                        contentDescription = null,
                                        tint = Brand,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                            }
                        }
                    } else if (state.error != null) {
                        item {
                            Text(state.error ?: "Could not load paths", color = Muted)
                            TextButton(onClick = { vm.refresh() }) { Text("Retry", color = Brand) }
                        }
                    }

                    item {
                        TextButton(
                            onClick = onOpenMore,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Explore more", color = Muted, fontSize = 13.sp)
                        }
                    }

                    item { Spacer(modifier = Modifier.height(4.dp)) }
                }
            }
        }
    }
}

@Composable
private fun HomeTopChrome(
    signedIn: Boolean,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        BrandLogo(nameSize = 20.sp)
        if (signedIn) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .border(1.dp, Border, RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .clickable(onClick = onSignOut)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Ink),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("U", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text("Account", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Ink)
                    Text("Signed in", fontSize = 11.sp, color = Muted)
                }
                Spacer(modifier = Modifier.width(6.dp))
                Icon(
                    Icons.AutoMirrored.Filled.Logout,
                    contentDescription = "Sign out",
                    tint = Muted,
                    modifier = Modifier.size(16.dp),
                )
            }
        } else {
            OutlinedButton(
                onClick = onSignIn,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Icon(Icons.Default.AccountCircle, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Sign in", color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun HomeHeroBlock(
    signedIn: Boolean,
    onBrowseExams: () -> Unit,
    onExploreTrackers: () -> Unit,
    onSignIn: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 4.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(999.dp))
                .background(BrandSoft.copy(alpha = 0.92f))
                .padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(Icons.Default.Star, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
            Text(
                text = if (signedIn) "10Tracker · Your study home" else "MCQs · Mocks · Paths · YouTube sync",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = BrandDeep,
            )
        }

        if (signedIn) {
            Text(
                text = "${greetingForHour()}, there",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontSize = 28.sp,
                    lineHeight = 32.sp,
                    fontWeight = FontWeight.Black,
                ),
                color = Ink,
            )
            Text(
                text = "One clear next step — continue a path or explore exams and updates.",
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp, lineHeight = 20.sp),
                color = Muted,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Button(
                    onClick = onBrowseExams,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                ) {
                    Text("Practice", fontWeight = FontWeight.SemiBold)
                }
                OutlinedButton(
                    onClick = onExploreTrackers,
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Text("OG Trackers", fontWeight = FontWeight.SemiBold, color = Ink)
                }
            }
        } else {
            Text(
                text = "Practice that sticks",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontSize = 28.sp,
                    lineHeight = 34.sp,
                    fontWeight = FontWeight.Black,
                ),
                color = Ink,
            )
            Text(
                text = "MCQs, timed mocks, OG Tracker paths, and in-app YouTube progress — one app for your prep.",
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp, lineHeight = 20.sp),
                color = Muted,
            )
            Button(
                onClick = onBrowseExams,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
            ) {
                Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Browse exams", fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.weight(1f))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
            }
            OutlinedButton(
                onClick = onSignIn,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Icon(Icons.Default.AccountCircle, contentDescription = null, tint = Brand)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign in with Google", fontWeight = FontWeight.SemiBold, color = Ink)
            }
        }
    }
}

private data class Hub(val label: String, val icon: ImageVector, val onClick: () -> Unit)

@Composable
private fun QuickHubGrid(
    onExams: () -> Unit,
    onTrackers: () -> Unit,
    onRoadmaps: () -> Unit,
    onUpdates: () -> Unit,
) {
    val hubs = listOf(
        Hub("Exams", Icons.AutoMirrored.Filled.MenuBook, onExams),
        Hub("OG Trackers", Icons.Default.Hub, onTrackers),
        Hub("Roadmaps", Icons.Default.Map, onRoadmaps),
        Hub("Updates", Icons.Default.Campaign, onUpdates),
    )
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            "Quick links",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = Muted,
            letterSpacing = 1.sp,
        )
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            hubs.chunked(2).forEach { rowHubs ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    rowHubs.forEach { hub ->
                        QuickHubTile(
                            hub = hub,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    if (rowHubs.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickHubTile(hub: Hub, modifier: Modifier = Modifier) {
    Card(
        onClick = hub.onClick,
        modifier = modifier.height(88.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(BrandSoft),
                contentAlignment = Alignment.Center,
            ) {
                Icon(hub.icon, contentDescription = null, tint = Brand, modifier = Modifier.size(20.dp))
            }
            Text(hub.label, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Ink)
        }
    }
}

@Composable
private fun SignInPromptCard(onSignIn: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = BrandSoft),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Brand.copy(alpha = 0.15f)),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Sign in to save progress", fontWeight = FontWeight.SemiBold, color = Ink)
            Text(
                "YouTube watch % and practice answers sync across devices.",
                style = MaterialTheme.typography.bodyMedium,
            )
            Button(
                onClick = onSignIn,
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text("Sign in with Google")
            }
        }
    }
}

@Composable
private fun StatsRow(videos: Int, practice: Int, mocks: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        MiniStat("Videos", videos)
        MiniStat("Practice", practice)
        MiniStat("Mocks", mocks)
    }
}

@Composable
private fun SectionHeading(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Ink)
        Text(subtitle, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun MiniStat(label: String, value: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$value", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Ink)
        Text(label, style = MaterialTheme.typography.labelSmall, color = Muted)
    }
}

@Composable
fun PathCard(path: OgPathSummary, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.PlayCircle, contentDescription = null, tint = Brand)
                Spacer(modifier = Modifier.width(8.dp))
                Text(path.title, fontWeight = FontWeight.SemiBold, color = Ink, modifier = Modifier.weight(1f))
            }
            if (!path.description.isNullOrBlank()) {
                Text(path.description, style = MaterialTheme.typography.bodyMedium, maxLines = 2)
            }
            Text(
                "${path.completedResources}/${path.totalResources} steps · ${path.percent}%",
                style = MaterialTheme.typography.labelSmall,
                color = Muted,
            )
            LinearProgressIndicator(
                progress = { (path.percent / 100f).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(99.dp)),
                color = Brand,
                trackColor = BrandSoft,
            )
        }
    }
}