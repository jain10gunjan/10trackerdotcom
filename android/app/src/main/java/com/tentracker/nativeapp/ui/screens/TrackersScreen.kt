package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel

@Composable
fun TrackersScreen(
    vm: HomeViewModel,
    onOpenPath: (String) -> Unit,
) {
    val state by vm.state.collectAsState()
    val paths = state.catalog?.paths.orEmpty()

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Spacer(modifier = Modifier.height(12.dp))
        Text("OG Trackers", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
        Text(
            "YouTube lessons with watch-% synced to your account.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
        )
        Spacer(modifier = Modifier.height(12.dp))

        when {
            state.loading && state.catalog == null -> {
                LoadingState(message = "Loading trackers…")
            }
            state.error != null && paths.isEmpty() -> {
                ErrorState(
                    message = state.error ?: "Could not load trackers",
                    onRetry = { vm.refresh() },
                )
            }
            paths.isEmpty() -> {
                EmptyState(
                    message = "No paths yet.",
                    actionLabel = "Retry",
                    onAction = { vm.refresh() },
                )
            }
            else -> {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 24.dp),
                ) {
                    items(paths, key = { it.id }) { path ->
                        PathCard(path = path, onClick = { onOpenPath(path.slug) })
                    }
                }
            }
        }
    }
}
