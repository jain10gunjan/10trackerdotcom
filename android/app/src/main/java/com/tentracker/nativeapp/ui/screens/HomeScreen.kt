package com.tentracker.nativeapp.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.OgPathSummary
import com.tentracker.nativeapp.ui.components.BrandLogo
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    vm: HomeViewModel,
    onOpenPath: (String) -> Unit,
    onOpenPathsTab: () -> Unit = {},
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    var tab by remember { mutableIntStateOf(0) }

    fun openSite(path: String) {
        context.startActivity(
            Intent(Intent.ACTION_VIEW, Uri.parse("${ApiClient.BASE_URL}$path"))
        )
    }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                BrandLogo(nameSize = 20.sp)
                if (state.signedIn) {
                    TextButton(onClick = onSignOut) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Sign out")
                    }
                } else {
                    OutlinedButton(
                        onClick = onSignIn,
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                        Icon(Icons.Default.AccountCircle, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Sign in", color = Ink, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White.copy(alpha = 0.95f),
                tonalElevation = 0.dp,
            ) {
                val items = listOf(
                    Triple("Home", Icons.Default.Home, 0),
                    Triple("Exams", Icons.AutoMirrored.Filled.MenuBook, 1),
                    Triple("Pricing", Icons.Default.CurrencyRupee, 2),
                    Triple("Updates", Icons.Default.Campaign, 3),
                    Triple("More", Icons.Default.GridView, 4),
                )
                items.forEach { (label, icon, index) ->
                    NavigationBarItem(
                        selected = tab == index,
                        onClick = {
                            tab = index
                            when (index) {
                                0 -> Unit
                                1 -> openSite("/exams")
                                2 -> openSite("/pricing")
                                3 -> openSite("/articles")
                                4 -> openSite("/")
                            }
                        },
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label, fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Brand,
                            selectedTextColor = Brand,
                            indicatorColor = BrandSoft,
                            unselectedIconColor = Muted,
                            unselectedTextColor = Muted,
                        )
                    )
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(BrandSoft.copy(alpha = 0.85f), Color.White),
                        radius = 900f,
                    )
                )
        ) {
            when {
                state.loading && state.catalog == null -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Brand)
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        item { HeroSection(onBrowseExams = { openSite("/exams") }, onExplorePaths = {
                            // scroll to paths — for now open first path list below / focus
                            onOpenPathsTab()
                        }, onSignIn = onSignIn, signedIn = state.signedIn) }

                        item { FeatureChips(onOpenSite = { openSite(it) }, onPaths = onOpenPathsTab) }

                        item {
                            val examCount = state.exams.size.takeIf { it > 0 }
                                ?: state.catalog?.exams?.size
                                ?: 11
                            val pathCount = state.catalog?.paths?.size ?: 1
                            Text(
                                text = "$examCount exams   ·   43k+ questions   ·   $pathCount paths",
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Center,
                                color = Muted,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }

                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "OG Trackers · YouTube progress",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                "Watch lessons in-app. Progress syncs to your account — same API as the Chrome extension.",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }

                        if (!state.signedIn) {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = BrandSoft),
                                    shape = RoundedCornerShape(16.dp),
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("Sign in to save YouTube watch %", fontWeight = FontWeight.SemiBold, color = Ink)
                                        Text(
                                            "Browse paths as a guest. Sign in once so progress sticks across devices.",
                                            style = MaterialTheme.typography.bodyMedium,
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Button(
                                            onClick = onSignIn,
                                            colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                            shape = RoundedCornerShape(12.dp),
                                        ) { Text("Sign in with Google") }
                                    }
                                }
                            }
                        }

                        state.catalog?.stats?.let { stats ->
                            item {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color.White)
                                        .border(1.dp, Border, RoundedCornerShape(16.dp))
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceEvenly,
                                ) {
                                    MiniStat("Videos", stats.videosCompleted)
                                    MiniStat("Practice", stats.practiceCompleted)
                                    MiniStat("Mocks", stats.mocksCompleted)
                                }
                            }
                        }

                        items(state.catalog?.paths.orEmpty(), key = { it.id }) { path ->
                            PathCard(path = path, onClick = { onOpenPath(path.slug) })
                        }

                        if (state.catalog?.paths.isNullOrEmpty() && state.error != null) {
                            item {
                                Text(state.error ?: "Could not load paths", color = Muted)
                                TextButton(onClick = { vm.refresh() }) { Text("Retry") }
                            }
                        }

                        item { Spacer(modifier = Modifier.height(24.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroSection(
    onBrowseExams: () -> Unit,
    onExplorePaths: () -> Unit,
    onSignIn: () -> Unit,
    signedIn: Boolean,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "EXAM PRACTICE · PATHS · YOUTUBE SYNC",
            style = MaterialTheme.typography.labelSmall,
            color = Muted,
            letterSpacing = 1.sp,
        )
        Spacer(modifier = Modifier.height(14.dp))
        BrandLogo(nameSize = 36.sp, badgeSize = 9.sp)
        Spacer(modifier = Modifier.height(14.dp))
        Text(
            buildAnnotatedString {
                append("Practice that sticks — with ")
                withStyle(SpanStyle(color = Brand, fontWeight = FontWeight.Bold)) {
                    append("streaks that stick")
                }
            },
            style = MaterialTheme.typography.headlineSmall.copy(fontSize = 26.sp, lineHeight = 32.sp),
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.Bold,
            color = Ink,
        )
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            "MCQs, timed mocks, OG Tracker paths, and in-app YouTube progress — one place that keeps your prep moving.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 8.dp),
        )
        Spacer(modifier = Modifier.height(18.dp))

        PrimaryCta(
            label = "Browse exams",
            icon = Icons.AutoMirrored.Filled.MenuBook,
            filled = true,
            onClick = onBrowseExams,
        )
        Spacer(modifier = Modifier.height(10.dp))
        PrimaryCta(
            label = "Explore paths",
            icon = Icons.Default.Hub,
            filled = false,
            onClick = onExplorePaths,
        )
        if (!signedIn) {
            Spacer(modifier = Modifier.height(10.dp))
            PrimaryCta(
                label = "Sign in with Google",
                icon = Icons.Default.AccountCircle,
                filled = false,
                onClick = onSignIn,
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "Save streaks, YouTube progress, and rankings in one tap",
            style = MaterialTheme.typography.labelSmall,
            color = Muted,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun PrimaryCta(
    label: String,
    icon: ImageVector,
    filled: Boolean,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(14.dp)
    if (filled) {
        Button(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = shape,
            colors = ButtonDefaults.buttonColors(containerColor = Brand, contentColor = Color.White),
        ) {
            Icon(icon, contentDescription = null)
            Spacer(modifier = Modifier.width(10.dp))
            Text(label, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
        }
    } else {
        OutlinedButton(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = shape,
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Ink),
        ) {
            Icon(icon, contentDescription = null, tint = Brand)
            Spacer(modifier = Modifier.width(10.dp))
            Text(label, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun FeatureChips(onOpenSite: (String) -> Unit, onPaths: () -> Unit) {
    val chips = listOf(
        Chip("Exams", Icons.AutoMirrored.Filled.MenuBook) { onOpenSite("/exams") },
        Chip("OG Trackers", Icons.Default.Hub, onPaths),
        Chip("YouTube sync", Icons.Default.PlayCircle, onPaths),
        Chip("Mocks", Icons.Default.Description) { onOpenSite("/mock-test") },
        Chip("Pricing", Icons.Default.CurrencyRupee) { onOpenSite("/pricing") },
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        chips.forEach { chip ->
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White)
                    .border(1.dp, Border, RoundedCornerShape(999.dp))
                    .clickable(onClick = chip.onClick)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(chip.icon, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(chip.label, fontWeight = FontWeight.Medium, fontSize = 13.sp, color = Ink)
            }
        }
    }
}

private data class Chip(val label: String, val icon: ImageVector, val onClick: () -> Unit)

@Composable
private fun MiniStat(label: String, value: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$value", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Ink)
        Text(label, style = MaterialTheme.typography.labelSmall, color = Muted)
    }
}

@Composable
private fun PathCard(path: OgPathSummary, onClick: () -> Unit) {
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
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(99.dp)),
                color = Brand,
                trackColor = BrandSoft,
            )
        }
    }
}
