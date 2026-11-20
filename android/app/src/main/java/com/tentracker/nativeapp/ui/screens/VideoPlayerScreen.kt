package com.tentracker.nativeapp.ui.screens

import android.app.Activity
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.LifecycleOwner
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.FullscreenListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.OgResource
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.extractYouTubeVideoId
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.util.resourceOpenUrl
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private data class SpeedOption(val label: String, val rate: PlayerConstants.PlaybackRate)

private val SPEED_OPTIONS = listOf(
    SpeedOption("0.5x", PlayerConstants.PlaybackRate.RATE_0_5),
    SpeedOption("0.75x", PlayerConstants.PlaybackRate.RATE_0_75),
    SpeedOption("1x", PlayerConstants.PlaybackRate.RATE_1),
    SpeedOption("1.25x", PlayerConstants.PlaybackRate.RATE_1_25),
    SpeedOption("1.5x", PlayerConstants.PlaybackRate.RATE_1_5),
    SpeedOption("2x", PlayerConstants.PlaybackRate.RATE_2),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoPlayerScreen(
    api: ApiClient,
    pathSlug: String,
    resourceId: String,
    youtubeVideoId: String,
    title: String,
    onBack: () -> Unit,
    onOpenPractice: (String, String, String, String) -> Unit = { _, _, _, _ -> },
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val rootView = LocalView.current

    var modules by remember { mutableStateOf<List<OgResource>>(emptyList()) }
    var activeResourceId by remember(resourceId) { mutableStateOf(resourceId) }
    var activeTitle by remember(title) { mutableStateOf(title) }
    var activeVideoRaw by remember(youtubeVideoId) { mutableStateOf(youtubeVideoId) }
    val videoId = remember(activeVideoRaw) { extractYouTubeVideoId(activeVideoRaw) }
    val watchUrl = remember(videoId) { videoId?.let { "https://www.youtube.com/watch?v=$it" } }

    var percent by remember { mutableIntStateOf(0) }
    var durationSec by remember { mutableFloatStateOf(0f) }
    var currentSec by remember { mutableFloatStateOf(0f) }
    var statusLabel by remember { mutableStateOf("Loading player…") }
    var playerError by remember { mutableStateOf<String?>(null) }
    var lastPosted by remember { mutableIntStateOf(-1) }
    var syncJob by remember { mutableStateOf<Job?>(null) }

    var youTubePlayer by remember { mutableStateOf<YouTubePlayer?>(null) }
    var isPlaying by remember { mutableStateOf(false) }
    var muted by remember { mutableStateOf(false) }
    var volume by remember { mutableFloatStateOf(100f) }
    var speedIndex by remember { mutableIntStateOf(2) }
    var autoplayNext by remember { mutableStateOf(true) }
    var fullscreen by remember { mutableStateOf(false) }
    var exitFullscreenAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var fullscreenHost by remember { mutableStateOf<FrameLayout?>(null) }

    LaunchedEffect(pathSlug) {
        runCatching { api.getPath(pathSlug) }.onSuccess { detail ->
            modules = detail.resources
            detail.resources.firstOrNull { it.id == activeResourceId }?.progress?.percentWatched?.let {
                percent = it.coerceIn(0, 100)
            }
        }
    }

    val videoModules = remember(modules) {
        modules.filter {
            it.type.equals("VIDEO", true) &&
                !extractYouTubeVideoId(it.youtubeVideoId).isNullOrBlank() &&
                !it.locked
        }
    }
    val currentIndex = videoModules.indexOfFirst { it.id == activeResourceId }
    val nextVideo = videoModules.getOrNull(if (currentIndex >= 0) currentIndex + 1 else -1)
    val prevVideo = videoModules.getOrNull(if (currentIndex > 0) currentIndex - 1 else -1)
    val upcoming = remember(modules, activeResourceId) {
        val idx = modules.indexOfFirst { it.id == activeResourceId }
        if (idx < 0) modules else modules.drop(idx + 1)
    }

    fun openOnYouTube() {
        val url = watchUrl ?: return
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
    }

    fun scheduleProgress(pct: Int, forceStatus: String? = null, rid: String = activeResourceId) {
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
                val res = api.saveVideoProgress(rid, clamped, status)
                if (res.success) lastPosted = clamped
                else if (!res.error.isNullOrBlank()) {
                    Toast.makeText(context, res.error, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, e.message ?: "Sign in to save progress", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun switchToVideo(resource: OgResource) {
        val id = extractYouTubeVideoId(resource.youtubeVideoId) ?: return
        activeResourceId = resource.id
        activeTitle = resource.title
        activeVideoRaw = id
        percent = resource.progress?.percentWatched?.coerceIn(0, 100) ?: 0
        lastPosted = -1
        currentSec = 0f
        durationSec = 0f
        playerError = null
        statusLabel = "Loading…"
        youTubePlayer?.loadVideo(id, 0f)
    }

    fun playNextModule() {
        nextVideo?.let { switchToVideo(it) } ?: run { statusLabel = "End of video modules" }
    }

    fun applyFullscreenSystemUi(enter: Boolean) {
        val window = activity?.window ?: return
        val controller = WindowInsetsControllerCompat(window, rootView)
        if (enter) {
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            WindowCompat.setDecorFitsSystemWindows(window, false)
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            WindowCompat.setDecorFitsSystemWindows(window, true)
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            controller.show(WindowInsetsCompat.Type.systemBars())
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            applyFullscreenSystemUi(false)
            fullscreenHost?.let { (it.parent as? ViewGroup)?.removeView(it) }
        }
    }

    BackHandler(enabled = fullscreen) {
        exitFullscreenAction?.invoke() ?: youTubePlayer?.toggleFullscreen()
    }

    Scaffold(
        topBar = {
            if (!fullscreen) {
                TopAppBar(
                    title = { Text(activeTitle, maxLines = 1) },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    actions = {
                        if (watchUrl != null) {
                            IconButton(onClick = { openOnYouTube() }) {
                                Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = "Open in YouTube")
                            }
                        }
                    },
                )
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxSize(),
            contentPadding = PaddingValues(bottom = 28.dp),
        ) {
            item {
                if (videoId == null) {
                    Box(
                        modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).background(Color.Black),
                        contentAlignment = Alignment.Center,
                    ) { Text("Invalid YouTube video id", color = Color.White) }
                } else {
                    YouTubePlayerBox(
                        videoId = videoId,
                        lifecycleOwner = lifecycleOwner,
                        onPlayerReady = { player ->
                            youTubePlayer = player
                            statusLabel = "Playing"
                            player.setPlaybackRate(SPEED_OPTIONS[speedIndex].rate)
                            if (muted) player.mute() else player.unMute()
                            player.setVolume(volume.toInt().coerceIn(0, 100))
                        },
                        onError = { code ->
                            playerError = "YouTube error $code — open in YouTube app if embed is blocked."
                            statusLabel = "Playback blocked in-app"
                        },
                        onDuration = { durationSec = it },
                        onSecond = { second ->
                            currentSec = second
                            val dur = durationSec
                            if (dur > 1f) {
                                val pct = ((second / dur) * 100f).toInt().coerceIn(0, 100)
                                if (pct >= lastPosted + 5 || pct >= 90) scheduleProgress(pct)
                                else {
                                    percent = maxOf(percent, pct)
                                    if (pct > 0) statusLabel = "Watching · $pct%"
                                }
                            }
                        },
                        onState = { state ->
                            when (state) {
                                PlayerConstants.PlayerState.ENDED -> {
                                    isPlaying = false
                                    scheduleProgress(100, "COMPLETED")
                                    if (autoplayNext) playNextModule()
                                }
                                PlayerConstants.PlayerState.PAUSED -> {
                                    isPlaying = false
                                    if (percent > 0) scheduleProgress(percent, "IN_PROGRESS")
                                }
                                PlayerConstants.PlayerState.PLAYING -> {
                                    isPlaying = true
                                    playerError = null
                                    if (percent == 0) statusLabel = "Playing"
                                }
                                else -> Unit
                            }
                        },
                        onEnterFullscreen = { fullView, exit ->
                            fullscreen = true
                            exitFullscreenAction = exit
                            applyFullscreenSystemUi(true)
                            val decor = activity?.window?.decorView as? ViewGroup
                            val host = FrameLayout(context).apply {
                                setBackgroundColor(android.graphics.Color.BLACK)
                                layoutParams = FrameLayout.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                )
                                addView(
                                    fullView,
                                    FrameLayout.LayoutParams(
                                        ViewGroup.LayoutParams.MATCH_PARENT,
                                        ViewGroup.LayoutParams.MATCH_PARENT,
                                    ),
                                )
                            }
                            fullscreenHost = host
                            decor?.addView(host)
                        },
                        onExitFullscreen = {
                            fullscreen = false
                            exitFullscreenAction = null
                            applyFullscreenSystemUi(false)
                            (fullscreenHost?.parent as? ViewGroup)?.removeView(fullscreenHost)
                            fullscreenHost = null
                        },
                    )
                }
            }

            if (!fullscreen) {
                item {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            IconButton(onClick = { prevVideo?.let(::switchToVideo) }, enabled = prevVideo != null) {
                                Icon(Icons.Default.SkipPrevious, contentDescription = "Previous")
                            }
                            IconButton(onClick = {
                                val p = youTubePlayer ?: return@IconButton
                                if (isPlaying) p.pause() else p.play()
                            }) {
                                Icon(if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow, null)
                            }
                            IconButton(onClick = { youTubePlayer?.seekTo(0f); youTubePlayer?.play() }) {
                                Icon(Icons.Default.Replay, contentDescription = "Restart")
                            }
                            IconButton(onClick = { playNextModule() }, enabled = nextVideo != null) {
                                Icon(Icons.Default.SkipNext, contentDescription = "Next")
                            }
                            IconButton(onClick = { youTubePlayer?.toggleFullscreen() }) {
                                Icon(Icons.Default.Fullscreen, contentDescription = "Fullscreen")
                            }
                        }

                        Slider(
                            value = if (durationSec > 0f) currentSec.coerceIn(0f, durationSec) else 0f,
                            onValueChange = { currentSec = it },
                            onValueChangeFinished = { youTubePlayer?.seekTo(currentSec) },
                            valueRange = 0f..(durationSec.takeIf { it > 0f } ?: 1f),
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween) {
                            Text(formatTime(currentSec), style = MaterialTheme.typography.labelSmall, color = Muted)
                            Text(formatTime(durationSec), style = MaterialTheme.typography.labelSmall, color = Muted)
                        }

                        Text("Player options", fontWeight = FontWeight.SemiBold, color = Ink)
                        Row(
                            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            FilterChip(
                                selected = muted,
                                onClick = {
                                    muted = !muted
                                    if (muted) youTubePlayer?.mute() else youTubePlayer?.unMute()
                                },
                                label = { Text(if (muted) "Muted" else "Sound") },
                                leadingIcon = {
                                    Icon(if (muted) Icons.Default.VolumeOff else Icons.Default.VolumeUp, null, Modifier.size(16.dp))
                                },
                            )
                            FilterChip(
                                selected = autoplayNext,
                                onClick = { autoplayNext = !autoplayNext },
                                label = { Text(if (autoplayNext) "Autoplay next" else "Autoplay off") },
                            )
                            FilterChip(
                                selected = true,
                                onClick = { youTubePlayer?.toggleFullscreen() },
                                label = { Text("Fullscreen") },
                                leadingIcon = { Icon(Icons.Default.Fullscreen, null, Modifier.size(16.dp)) },
                            )
                            FilterChip(
                                selected = false,
                                onClick = { openOnYouTube() },
                                label = { Text("YouTube app") },
                                leadingIcon = { Icon(Icons.AutoMirrored.Filled.OpenInNew, null, Modifier.size(16.dp)) },
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                        ) {
                            Icon(Icons.Default.Speed, null, tint = Brand, modifier = Modifier.size(18.dp))
                            SPEED_OPTIONS.forEachIndexed { index, opt ->
                                FilterChip(
                                    selected = speedIndex == index,
                                    onClick = {
                                        speedIndex = index
                                        youTubePlayer?.setPlaybackRate(opt.rate)
                                    },
                                    label = { Text(opt.label) },
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Vol", style = MaterialTheme.typography.labelSmall, color = Muted, modifier = Modifier.width(28.dp))
                            Slider(
                                value = volume,
                                onValueChange = {
                                    volume = it
                                    muted = false
                                    youTubePlayer?.unMute()
                                    youTubePlayer?.setVolume(it.toInt().coerceIn(0, 100))
                                },
                                valueRange = 0f..100f,
                                modifier = Modifier.weight(1f),
                            )
                            Text("${volume.toInt()}", style = MaterialTheme.typography.labelSmall, color = Muted)
                        }

                        Text("Watch progress", fontWeight = FontWeight.SemiBold)
                        Text(statusLabel, style = MaterialTheme.typography.bodyMedium, color = Muted)
                        LinearProgressIndicator(progress = { percent / 100f }, modifier = Modifier.fillMaxWidth())
                        Text(
                            "$percent% · ${if (currentIndex >= 0) "Video ${currentIndex + 1}/${videoModules.size}" else "Lesson"}",
                            style = MaterialTheme.typography.labelMedium,
                            color = Muted,
                        )

                        playerError?.let { err ->
                            Text(err, style = MaterialTheme.typography.bodyMedium, color = Color(0xFFB45309))
                            Button(
                                onClick = { openOnYouTube() },
                                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) { Text("Play on YouTube") }
                        }

                        nextVideo?.let { next ->
                            Card(
                                onClick = { switchToVideo(next) },
                                colors = CardDefaults.cardColors(containerColor = BrandSoft),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text("UP NEXT", style = MaterialTheme.typography.labelSmall, color = Brand)
                                    Text(next.title, fontWeight = FontWeight.SemiBold, color = Ink)
                                    Text("Tap to play next video module", style = MaterialTheme.typography.bodyMedium, color = Muted)
                                }
                            }
                        }

                        Text("Next modules", fontWeight = FontWeight.Bold, color = Ink)
                        Text(
                            if (upcoming.isEmpty()) "You're at the end of this path."
                            else "${upcoming.size} steps after this lesson",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Muted,
                        )
                    }
                }

                items(upcoming, key = { it.id }) { resource ->
                    ModuleRow(
                        resource = resource,
                        onClick = {
                            when {
                                resource.type.equals("VIDEO", true) &&
                                    extractYouTubeVideoId(resource.youtubeVideoId) != null &&
                                    !resource.locked -> switchToVideo(resource)
                                resource.type.equals("PRACTICE_CHAPTER", true) -> {
                                    val meta = resource.meta.orEmpty()
                                    val area = meta["area"]?.toString() ?: meta["category"]?.toString()
                                    val subject = meta["subject"]?.toString()
                                    val chapter = meta["chapter"]?.toString()
                                    if (!area.isNullOrBlank() && !subject.isNullOrBlank() && !chapter.isNullOrBlank()) {
                                        onOpenPractice(area, subject, chapter, resource.title)
                                    } else {
                                        resourceOpenUrl(resource, pathSlug)?.let { openSite(context, it) }
                                    }
                                }
                                else -> resourceOpenUrl(resource, pathSlug)?.let { openSite(context, it) }
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ModuleRow(resource: OgResource, onClick: () -> Unit) {
    val type = resource.type.uppercase()
    val pct = resource.progress?.percentWatched ?: 0
    val enabled = !resource.locked && !resource.sequenceLocked
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .clickable(enabled = enabled, onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(BrandSoft),
                contentAlignment = Alignment.Center,
            ) { Icon(Icons.Default.PlayArrow, null, tint = Brand) }
            Column(modifier = Modifier.weight(1f)) {
                if (!resource.sectionLabel.isNullOrBlank()) {
                    Text(resource.sectionLabel!!, style = MaterialTheme.typography.labelSmall, color = Brand)
                }
                Text(resource.title, fontWeight = FontWeight.Medium, color = Ink, maxLines = 2)
                Text(
                    when {
                        resource.locked -> "Premium locked"
                        resource.sequenceLocked -> "Complete previous steps first"
                        type == "VIDEO" -> "Video · $pct%"
                        else -> "$type · ${resource.progress?.status ?: "NOT_STARTED"}"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = Muted,
                )
            }
        }
    }
}

@Composable
private fun YouTubePlayerBox(
    videoId: String,
    lifecycleOwner: LifecycleOwner,
    onPlayerReady: (YouTubePlayer) -> Unit,
    onError: (String) -> Unit,
    onDuration: (Float) -> Unit,
    onSecond: (Float) -> Unit,
    onState: (PlayerConstants.PlayerState) -> Unit,
    onEnterFullscreen: (View, () -> Unit) -> Unit,
    onExitFullscreen: () -> Unit,
) {
    val context = LocalContext.current
    val playerView = remember {
        YouTubePlayerView(context).apply { enableAutomaticInitialization = false }
    }
    var loadedId by remember { mutableStateOf<String?>(null) }

    DisposableEffect(lifecycleOwner, playerView) {
        lifecycleOwner.lifecycle.addObserver(playerView)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(playerView)
            playerView.release()
        }
    }

    LaunchedEffect(videoId) {
        if (loadedId != null && loadedId != videoId) {
            playerView.getYouTubePlayerWhenReady {
                it.loadVideo(videoId, 0f)
                loadedId = videoId
            }
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).background(Color.Black),
        factory = {
            playerView.apply {
                if (tag != READY_TAG) {
                    val options = IFramePlayerOptions.Builder()
                        .controls(1)
                        .fullscreen(1)
                        .autoplay(1)
                        .rel(0)
                        .ivLoadPolicy(3)
                        .ccLoadPolicy(1)
                        .modestBranding(1)
                        .origin("https://www.youtube-nocookie.com")
                        .build()

                    addFullscreenListener(object : FullscreenListener {
                        override fun onEnterFullscreen(fullscreenView: View, exitFullscreen: () -> Unit) {
                            matchParent()
                            onEnterFullscreen(fullscreenView, exitFullscreen)
                        }

                        override fun onExitFullscreen() {
                            wrapContent()
                            onExitFullscreen()
                        }
                    })

                    initialize(
                        object : AbstractYouTubePlayerListener() {
                            override fun onReady(youTubePlayer: YouTubePlayer) {
                                loadedId = videoId
                                youTubePlayer.loadVideo(videoId, 0f)
                                onPlayerReady(youTubePlayer)
                            }

                            override fun onError(youTubePlayer: YouTubePlayer, error: PlayerConstants.PlayerError) {
                                onError(error.name)
                            }

                            override fun onVideoDuration(youTubePlayer: YouTubePlayer, duration: Float) {
                                onDuration(duration)
                            }

                            override fun onCurrentSecond(youTubePlayer: YouTubePlayer, second: Float) {
                                onSecond(second)
                            }

                            override fun onStateChange(youTubePlayer: YouTubePlayer, state: PlayerConstants.PlayerState) {
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

private fun formatTime(seconds: Float): String {
    val total = seconds.toInt().coerceAtLeast(0)
    return "%d:%02d".format(total / 60, total % 60)
}

private const val READY_TAG = "yt-initialized-v3"
