package com.tentracker.nativeapp.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Modifier
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.OgPathSummary
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    vm: HomeViewModel,
    onOpenPath: (String) -> Unit,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("10Tracker", fontWeight = FontWeight.Black)
                        Text(
                            if (state.signedIn) "Signed in · native OG Trackers"
                            else "Browsing as guest — sign in to sync progress",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Brand,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary,
                ),
                actions = {
                    IconButton(onClick = { vm.refresh(silent = true) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(
                        onClick = {
                            CustomTabsIntent.Builder().build()
                                .launchUrl(context, Uri.parse(ApiClient.BASE_URL))
                        }
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = "Open site")
                    }
                    if (state.signedIn) {
                        IconButton(onClick = onSignOut) {
                            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Sign out")
                        }
                    } else {
                        IconButton(onClick = onSignIn) {
                            Icon(Icons.Default.Login, contentDescription = "Sign in")
                        }
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.loading -> BoxLoading(modifier = Modifier.padding(padding))
            state.error != null && state.catalog == null -> {
                Column(
                    modifier = Modifier
                        .padding(padding)
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(state.error ?: "Error")
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(onClick = { vm.refresh() }) { Text("Retry") }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .padding(padding)
                        .fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            "OG Trackers",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Watch lessons in-app — progress posts to the same /api/og-trackers/progress endpoint as the site & extension.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }

                    state.catalog?.stats?.let { stats ->
                        item {
                            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                                Row(
                                    Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    StatChip("Videos", stats.videosCompleted)
                                    StatChip("Practice", stats.practiceCompleted)
                                    StatChip("Mocks", stats.mocksCompleted)
                                }
                            }
                        }
                    }

                    if (!state.signedIn) {
                        item {
                            Card {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("Sign in to save YouTube watch %", fontWeight = FontWeight.SemiBold)
                                    Text(
                                        "Guest mode can browse paths. Sign in so progress writes to your account (no DB migration).",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    TextButton(onClick = onSignIn) { Text("Sign in with Google") }
                                }
                            }
                        }
                    }

                    items(state.catalog?.paths.orEmpty(), key = { it.id }) { path ->
                        PathCard(path = path, onClick = { onOpenPath(path.slug) })
                    }

                    if (state.exams.isNotEmpty()) {
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Practice exams on site",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        items(state.exams, key = { it.slug }) { exam ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        val url = "${ApiClient.BASE_URL}/${exam.slug}"
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                    }
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(exam.name, fontWeight = FontWeight.SemiBold)
                                    Text(
                                        "${exam.count} questions · ${exam.category ?: ""}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatChip(label: String, value: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$value", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
        Text(label, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
private fun PathCard(path: OgPathSummary, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(path.title, fontWeight = FontWeight.SemiBold)
            if (!path.description.isNullOrBlank()) {
                Text(
                    path.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    maxLines = 3
                )
            }
            Text(
                "${path.completedResources}/${path.totalResources} steps · ${path.percent}%",
                style = MaterialTheme.typography.labelMedium
            )
            LinearProgressIndicator(
                progress = { (path.percent / 100f).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun BoxLoading(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
    }
}
