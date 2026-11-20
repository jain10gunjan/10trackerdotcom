package com.tentracker.nativeapp.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.LifecycleOwner
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.util.extractYouTubeVideoId
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

    val videoId = remember(youtubeVideoId) { extractYouTubeVideoId(youtubeVideoId) }
    val watchUrl = remember(videoId) {
        videoId?.let { "https://www.youtube.com/watch?v=$it" }
    }

    var percent by remember { mutableIntStateOf(0) }
    var durationSec by remember { mutableFloatStateOf(0f) }
    var statusLabel by remember { mutableStateOf("Loading player…") }
    var playerError by remember { mutableStateOf<String?>(null) }
    var lastPosted by remember { mutableIntStateOf(-1) }
    var syncJob by remember { mutableStateOf<Job?>(null) }

    fun openOnYouTube() {
        val url = watchUrl ?: return
        runCatching {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }.onFailure {
            Toast.makeText(context, "Could not open YouTube", Toast.LENGTH_SHORT).show()
        }
    }

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
                },
                actions = {
                    if (watchUrl != null) {
                        IconButton(onClick = { openOnYouTube() }) {
                            Icon(Icons.Default.OpenInNew, contentDescription = "Open in YouTube")
                        }
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
            when {
                videoId == null -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .background(Color.Black),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("Invalid YouTube video id", color = Color.White)
                    }
                }
                else -> {
                    YouTubePlayerBox(
                        videoId = videoId,
                        lifecycleOwner = lifecycleOwner,
                        onReady = { statusLabel = "Playing" },
                        onError = { code ->
                            playerError = "YouTube error $code — open the video in the YouTube app instead."
                            statusLabel = "Playback blocked in-app"
                        },
                        onDuration = { durationSec = it },
                        onSecond = { second ->
                            val dur = durationSec
                            if (dur > 1f) {
                                val pct = ((second / dur) * 100f).toInt().coerceIn(0, 100)
                                if (pct >= lastPosted + 5 || pct >= 90) {
                                    scheduleProgress(pct)
                                } else {
                                    percent = maxOf(percent, pct)
                                    if (pct > 0) statusLabel = "Watching · $pct%"
                                }
                            }
                        },
                        onState = { state ->
                            when (state) {
                                PlayerConstants.PlayerState.ENDED ->
                                    scheduleProgress(100, "COMPLETED")
                                PlayerConstants.PlayerState.PAUSED ->
                                    if (percent > 0) scheduleProgress(percent, "IN_PROGRESS")
                                PlayerConstants.PlayerState.PLAYING -> {
                                    playerError = null
                                    if (percent == 0) statusLabel = "Playing"
                                }
                                else -> Unit
                            }
                        },
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Column(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("Watch progress", fontWeight = FontWeight.SemiBold)
                Text(statusLabel, style = MaterialTheme.typography.bodyMedium)

                playerError?.let { err ->
                    Text(err, style = MaterialTheme.typography.bodyMedium, color = Color(0xFFB45309))
                    Button(
                        onClick = { openOnYouTube() },
                        colors = ButtonDefaults.buttonColors(containerColor = Brand),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(Icons.Default.OpenInNew, contentDescription = null)
                        Text("  Play on YouTube")
                    }
                }

                LinearProgressIndicator(
                    progress = { percent / 100f },
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    "$percent% · synced via existing OG Tracker progress API",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                )

                if (watchUrl != null && playerError == null) {
                    OutlinedButton(
                        onClick = { openOnYouTube() },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Open in YouTube app")
                    }
                }
            }
        }
    }
}

@Composable
private fun YouTubePlayerBox(
    videoId: String,
    lifecycleOwner: LifecycleOwner,
    onReady: () -> Unit,
    onError: (String) -> Unit,
    onDuration: (Float) -> Unit,
    onSecond: (Float) -> Unit,
    onState: (PlayerConstants.PlayerState) -> Unit,
) {
    val context = LocalContext.current

    val playerView = remember {
        YouTubePlayerView(context).apply {
            enableAutomaticInitialization = false
        }
    }

    DisposableEffect(lifecycleOwner, playerView) {
        lifecycleOwner.lifecycle.addObserver(playerView)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(playerView)
            playerView.release()
        }
    }

    AndroidView(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .background(Color.Black),
        factory = {
            playerView.apply {
                if (tag != READY_TAG) {
                    val options = IFramePlayerOptions.Builder()
                        .controls(1)
                        .rel(0)
                        .ivLoadPolicy(3)
                        .ccLoadPolicy(0)
                        .origin("https://www.youtube-nocookie.com")
                        .build()

                    initialize(
                        object : AbstractYouTubePlayerListener() {
                            override fun onReady(youTubePlayer: YouTubePlayer) {
                                youTubePlayer.loadVideo(videoId, 0f)
                                onReady()
                            }

                            override fun onError(
                                youTubePlayer: YouTubePlayer,
                                error: PlayerConstants.PlayerError
                            ) {
                                onError(error.name)
                            }

                            override fun onVideoDuration(
                                youTubePlayer: YouTubePlayer,
                                duration: Float
                            ) {
                                onDuration(duration)
                            }

                            override fun onCurrentSecond(
                                youTubePlayer: YouTubePlayer,
                                second: Float
                            ) {
                                onSecond(second)
                            }

                            override fun onStateChange(
                                youTubePlayer: YouTubePlayer,
                                state: PlayerConstants.PlayerState
                            ) {
                                onState(state)
                            }
                        },
                        options,
                    )
                    tag = READY_TAG
                }
            }
        },
    )
}

private const val READY_TAG = "yt-initialized"
