package com.tentracker.nativeapp.ui.screens

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Modifier
import com.tentracker.nativeapp.data.OgResource
import com.tentracker.nativeapp.ui.util.extractYouTubeVideoId
import com.tentracker.nativeapp.ui.util.resourceOpenUrl
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PathScreen(
    vm: PathViewModel,
    onBack: () -> Unit,
    onPlayVideo: (resourceId: String, youtubeId: String, title: String) -> Unit,
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val path = state.detail?.path
    val resources = state.detail?.resources.orEmpty()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(path?.title ?: "Tracker", maxLines = 1)
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { vm.refresh(sync = true, silent = true) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Sync")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.loading -> {
                Column(
                    modifier = Modifier
                        .padding(padding)
                        .fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) { CircularProgressIndicator() }
            }
            state.error != null && path == null -> {
                Column(
                    modifier = Modifier
                        .padding(padding)
                        .padding(24.dp)
                ) {
                    Text(state.error ?: "Error")
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .padding(padding)
                        .fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(
                            "${path?.completedResources ?: 0}/${path?.totalResources ?: 0} complete · ${path?.percent ?: 0}%",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        LinearProgressIndicator(
                            progress = { ((path?.percent ?: 0) / 100f).coerceIn(0f, 1f) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp)
                        )
                    }

                    items(resources, key = { it.id }) { resource ->
                        ResourceRow(
                            resource = resource,
                            onClick = {
                                val type = resource.type.uppercase()
                                val ytId = extractYouTubeVideoId(resource.youtubeVideoId)
                                if (type == "VIDEO" && ytId != null && !resource.locked) {
                                    onPlayVideo(resource.id, ytId, resource.title)
                                } else {
                                    val url = resourceOpenUrl(resource, path?.slug.orEmpty())
                                    if (url != null) {
                                        CustomTabsIntent.Builder().build()
                                            .launchUrl(context, Uri.parse(url))
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ResourceRow(resource: OgResource, onClick: () -> Unit) {
    val type = resource.type.uppercase()
    val pct = resource.progress?.percentWatched ?: 0
    val status = resource.progress?.status ?: "NOT_STARTED"
    val icon = when (type) {
        "VIDEO" -> Icons.Default.PlayArrow
        "MOCK_TEST" -> Icons.Default.Quiz
        else -> Icons.Default.School
    }
    val enabled = !resource.locked && !resource.sequenceLocked

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled, onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Column(modifier = Modifier.weight(1f)) {
                if (!resource.sectionLabel.isNullOrBlank()) {
                    Text(
                        resource.sectionLabel,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Text(resource.title, fontWeight = FontWeight.Medium)
                val subtitle = when {
                    resource.locked -> "Premium locked"
                    resource.sequenceLocked -> "Complete previous steps first"
                    type == "VIDEO" -> "YouTube · $pct% · $status"
                    else -> "$type · $status"
                }
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
                )
                if (type == "VIDEO") {
                    LinearProgressIndicator(
                        progress = { (pct / 100f).coerceIn(0f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp)
                    )
                }
            }
        }
    }
}
