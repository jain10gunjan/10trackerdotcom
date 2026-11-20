package com.tentracker.nativeapp.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.Modifier
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.tentracker.nativeapp.data.ApiClient
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * In-app YouTube player. Watch % → existing POST /api/og-trackers/progress
 * (same upsert as the Chrome extension / website). No DB changes.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoPlayerScreen(
    api: ApiClient,
    resourceId: String,
    youtubeVideoId: String,
    title: String,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    var percent by remember { mutableIntStateOf(0) }
    var durationSec by remember { mutableFloatStateOf(0f) }
    var statusLabel by remember { mutableStateOf("Loading player…") }
    var lastPosted by remember { mutableIntStateOf(-1) }
    var syncJob by remember { mutableStateOf<Job?>(null) }

    fun scheduleProgress(pct: Int, forceStatus: String? = null) {
        val clamped = pct.coerceIn(0, 100)
        percent = maxOf(percent, clamped)
        val status = forceStatus ?: when {
            clamped >= 90 -> "COMPLETED"
            clamped > 0 -> "IN_PROGRESS"
            else -> null
        }
        statusLabel = when {
            status == "COMPLETED" || clamped >= 90 -> "Completed · synced"
            clamped > 0 -> "Watching · $clamped%"
            else -> statusLabel
        }

        if (clamped <= lastPosted && forceStatus == null) return

        syncJob?.cancel()
        syncJob = scope.launch {
            delay(700)
            try {
                val res = api.saveVideoProgress(resourceId, clamped, status)
                if (res.success) {
                    lastPosted = clamped
                } else if (!res.error.isNullOrBlank()) {
                    Toast.makeText(context, res.error, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    context,
                    e.message ?: "Could not save progress — sign in first",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            AndroidView(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp),
                factory = { ctx ->
                    YouTubePlayerView(ctx).also { view ->
                        lifecycleOwner.lifecycle.addObserver(view)
                        view.addYouTubePlayerListener(object : AbstractYouTubePlayerListener() {
                            override fun onReady(youTubePlayer: YouTubePlayer) {
                                youTubePlayer.loadVideo(youtubeVideoId, 0f)
                                statusLabel = "Playing"
                            }

                            override fun onVideoDuration(
                                youTubePlayer: YouTubePlayer,
                                duration: Float
                            ) {
                                durationSec = duration
                            }

                            override fun onCurrentSecond(
                                youTubePlayer: YouTubePlayer,
                                second: Float
                            ) {
                                val dur = durationSec
                                if (dur > 1f) {
                                    val pct = ((second / dur) * 100f).toInt().coerceIn(0, 100)
                                    // Post on ~5% steps to stay under rate limits.
                                    if (pct >= lastPosted + 5 || pct >= 90) {
                                        scheduleProgress(pct)
                                    } else {
                                        percent = maxOf(percent, pct)
                                        if (pct > 0) statusLabel = "Watching · $pct%"
                                    }
                                }
                            }

                            override fun onStateChange(
                                youTubePlayer: YouTubePlayer,
                                state: PlayerConstants.PlayerState
                            ) {
                                when (state) {
                                    PlayerConstants.PlayerState.ENDED ->
                                        scheduleProgress(100, "COMPLETED")
                                    PlayerConstants.PlayerState.PAUSED ->
                                        if (percent > 0) scheduleProgress(percent, "IN_PROGRESS")
                                    else -> Unit
                                }
                            }
                        })
                    }
                }
            )

            Spacer(modifier = Modifier.height(16.dp))
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text("Watch progress", fontWeight = FontWeight.SemiBold)
                Text(statusLabel, style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { percent / 100f },
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    "$percent% · synced via existing OG Tracker progress API",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                    modifier = Modifier.padding(top = 6.dp)
                )
            }
        }
    }
}
