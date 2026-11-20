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
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.VolumeOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.LifecycleOwner
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.FullscreenListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.YouTubePlayerCallback
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.OgResource
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
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

private val Neutral100 = Color(0xFFF5F5F5)
private val Neutral300 = Color(0xFFD4D4D4)
private val Neutral400 = Color(0xFFA3A3A3)
private val Neutral500 = Color(0xFF737373)
private val Neutral700 = Color(0xFF404040)
private val Neutral800 = Color(0xFF262626)
private val Neutral900 = Color(0xFF171717)
private val Emerald600 = Color(0xFF059669)
private val Amber500 = Color(0xFFF59E0B)
private val CardBorder = Color(0xCCE5E5E5)
private val SequenceMutedBg = Color(0xCCFAFAFA)

private data class UpcomingSection(val label: String, val items: List<IndexedValue<OgResource>>)

private fun groupUpcomingBySection(
    upcoming: List<OgResource>,
    allModules: List<OgResource>,
): List<UpcomingSection> {
    val order = mutableListOf<String>()
    val map = linkedMapOf<String, MutableList<IndexedValue<OgResource>>>()
    upcoming.forEach { resource ->
        val globalIndex = allModules.indexOfFirst { it.id == resource.id }.coerceAtLeast(0)
        val label = resource.sectionLabel?.trim().takeIf { !it.isNullOrBlank() } ?: "Path"
        if (label !in map) order.add(label)
        map.getOrPut(label) { mutableListOf() }.add(IndexedValue(globalIndex, resource))
    }
    return order.map { UpcomingSection(it, map.getValue(it)) }
}

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
    var pathTitle by remember { mutableStateOf<String?>(null) }
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
            pathTitle = detail.path?.title
            detail.resources.firstOrNull { it.id == activeResourceId }?.progress?.percentWatched?.let {
                percent = it.coerceIn(0, 100)
            }
        }
    }

    val globalStepIndex = remember(modules, activeResourceId) {
        modules.indexOfFirst { it.id == activeResourceId }
    }
    val activeSectionLabel = remember(modules, activeResourceId) {
        modules.find { it.id == activeResourceId }?.sectionLabel?.trim()?.takeIf { it.isNotBlank() }
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
    val upcomingSections = remember(upcoming, modules) { groupUpcomingBySection(upcoming, modules) }

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

    val neutral50 = Color(0xFFFAFAFA)

    Scaffold(
        containerColor = neutral50,
        topBar = {
            if (!fullscreen) {
                TopAppBar(
                    title = {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                activeSectionLabel ?: "Video lesson",
                                fontSize = 11.sp,
                                color = Muted,
                                fontWeight = FontWeight.Medium,
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (globalStepIndex >= 0) {
                                    Text(
                                        "%02d".format(globalStepIndex + 1),
                                        fontSize = 12.sp,
                                        color = Muted,
                                        fontWeight = FontWeight.Medium,
                                        modifier = Modifier.padding(end = 8.dp),
                                    )
                                }
                                Text(
                                    activeTitle,
                                    maxLines = 1,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Ink,
                                    fontSize = 16.sp,
                                )
                            }
                            pathTitle?.takeIf { it.isNotBlank() }?.let { tracker ->
                                Text(
                                    tracker,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                    maxLines = 1,
                                    modifier = Modifier.padding(top = 2.dp),
                                )
                            }
                        }
                    },
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
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = neutral50),
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
                        modifier = Modifier
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black),
                        contentAlignment = Alignment.Center,
                    ) { Text("Invalid YouTube video id", color = Color.White) }
                } else {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .border(1.dp, Color(0xFF262626), RoundedCornerShape(16.dp)),
                    ) {
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
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text("Watch progress", fontSize = 12.sp, color = Muted)
                                Text(
                                    "$percent%",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Ink,
                                )
                            }
                            LinearProgressIndicator(
                                progress = { (percent / 100f).coerceIn(0f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 6.dp)
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(999.dp)),
                                color = if (percent >= 90) Emerald600 else Neutral900,
                                trackColor = Neutral100,
                            )
                            if (percent >= 90) {
                                Text(
                                    "Marked complete",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Emerald600,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(top = 6.dp),
                                )
                            } else if (statusLabel.isNotBlank() && statusLabel != "Playing") {
                                Text(
                                    statusLabel,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                    modifier = Modifier.padding(top = 4.dp),
                                )
                            }
                        }
                    }
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

                        Text(
                            if (currentIndex >= 0) "Video ${currentIndex + 1} of ${videoModules.size}" else "Lesson",
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
                                colors = CardDefaults.cardColors(containerColor = Neutral900),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp)) {
                                    Text(
                                        "Up next",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFFA3A3A3),
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Text(
                                        next.title,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        modifier = Modifier.padding(top = 4.dp),
                                    )
                                    Text(
                                        "Tap to play the next video",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFFD4D4D4),
                                        modifier = Modifier.padding(top = 2.dp),
                                    )
                                }
                            }
                        }

                        if (upcoming.isNotEmpty()) {
                            Text(
                                "Later on this path",
                                fontWeight = FontWeight.SemiBold,
                                color = Ink,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                            Text(
                                "${upcoming.size} steps after this lesson",
                                style = MaterialTheme.typography.bodySmall,
                                color = Muted,
                            )
                        } else {
                            Text(
                                "You're at the end of this path.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Muted,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                        }
                    }
                }

                upcomingSections.forEach { section ->
                    val doneCount = section.items.count { (_, r) -> r.progress?.status == "COMPLETED" }
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 8.dp, start = 20.dp, end = 20.dp, top = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(section.label, fontWeight = FontWeight.SemiBold, color = Neutral800, fontSize = 14.sp)
                            Text("$doneCount/${section.items.size} done", fontSize = 11.sp, color = Neutral500)
                        }
                        Column(
                            modifier = Modifier
                                .padding(horizontal = 16.dp)
                                .fillMaxWidth()
                                .shadow(2.dp, RoundedCornerShape(16.dp))
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                        ) {
                            section.items.forEachIndexed { idx, indexed ->
                                val resource = indexed.value
                                ModuleRow(
                                    resource = resource,
                                    index = indexed.index,
                                    mutedBg = resource.sequenceLocked,
                                    onClick = {
                                        when {
                                            resource.type.equals("VIDEO", true) &&
                                                extractYouTubeVideoId(resource.youtubeVideoId) != null &&
                                                !resource.locked &&
                                                !resource.sequenceLocked -> switchToVideo(resource)
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
                                if (idx < section.items.lastIndex) {
                                    HorizontalDivider(color = Neutral100, thickness = 1.dp)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(20.dp))
                    }
                }

            }
        }
    }
}

@Composable
private fun ModuleRow(
    resource: OgResource,
    index: Int,
    mutedBg: Boolean,
    onClick: () -> Unit,
) {
    val type = resource.type.uppercase()
    val pct = resource.progress?.percentWatched ?: 0
    val status = resource.progress?.status ?: "NOT_STARTED"
    val blocked = resource.locked || resource.sequenceLocked
    val enabled = !blocked
    val done = status == "COMPLETED"
    val showBar =
        !blocked &&
            (type == "VIDEO" || type == "PRACTICE_CHAPTER" || (type == "MOCK_TEST" && pct > 0))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (mutedBg) SequenceMutedBg else Color.White)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ModuleStatusDot(status = status)
        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    "%02d".format(index + 1),
                    fontSize = 12.sp,
                    color = Neutral400,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    resource.title,
                    fontWeight = FontWeight.SemiBold,
                    color = if (enabled) Neutral900 else Neutral500,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    modifier = Modifier.weight(1f),
                )
            }
            Row(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    ModuleTypeIcon(type = type)
                    Text(moduleTypeLabel(type), fontSize = 11.sp, color = Neutral500)
                }
                moduleProgressCaption(resource, type, pct, status)?.let { cap ->
                    Text(cap, fontSize = 11.sp, color = Neutral700, fontWeight = FontWeight.Medium)
                }
                if (resource.locked) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, null, tint = Color(0xFFB45309), modifier = Modifier.size(12.dp))
                        Text("Premium", fontSize = 11.sp, color = Color(0xFFB45309))
                    }
                } else if (resource.sequenceLocked) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, null, tint = Neutral500, modifier = Modifier.size(12.dp))
                        Text("Finish previous step", fontSize = 11.sp, color = Neutral500)
                    }
                }
            }
            if (showBar) {
                if (type == "VIDEO") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("Progress", fontSize = 12.sp, color = Neutral500)
                        Text("$pct%", fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 12.sp)
                    }
                }
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = if (type == "VIDEO") 4.dp else 10.dp)
                        .height(6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Neutral100),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth((pct / 100f).coerceIn(0f, 1f))
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(if (done || pct >= 90) Emerald600 else Neutral900),
                    )
                }
            }
        }
    }
}

@Composable
private fun ModuleStatusDot(status: String?) {
    when (status) {
        "COMPLETED" -> Icon(
            Icons.Default.CheckCircle,
            contentDescription = null,
            tint = Emerald600,
            modifier = Modifier.size(16.dp),
        )
        "IN_PROGRESS" -> Box(
            modifier = Modifier
                .size(16.dp)
                .clip(CircleShape)
                .background(Color(0xFFFFFBEB))
                .border(1.dp, Amber500, CircleShape),
        )
        else -> Icon(Icons.Outlined.Circle, contentDescription = null, tint = Neutral300, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun ModuleTypeIcon(type: String) {
    val icon = when (type) {
        "VIDEO" -> Icons.Default.PlayArrow
        "MOCK_TEST" -> Icons.Default.Quiz
        else -> Icons.Default.School
    }
    Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(12.dp))
}

private fun moduleTypeLabel(type: String): String = when (type) {
    "VIDEO" -> "Video"
    "PRACTICE_CHAPTER" -> "Practice"
    "MOCK_TEST" -> "Mock test"
    "LEETCODE_PROBLEM" -> "LeetCode"
    "CODESTUDIO_PROBLEM" -> "CodeStudio"
    "HACKERRANK_PROBLEM" -> "HackerRank"
    else -> type
}

private fun moduleProgressCaption(
    _resource: OgResource,
    type: String,
    pct: Int,
    status: String,
): String? {
    val done = status == "COMPLETED"
    return when (type) {
        "VIDEO" -> "$pct%${if (done) " · Done" else ""}"
        "PRACTICE_CHAPTER" -> when {
            done -> "Done"
            status == "IN_PROGRESS" -> "In progress"
            else -> null
        }
        "MOCK_TEST" -> when {
            done -> "Completed"
            status == "IN_PROGRESS" -> "In progress"
            else -> "Not started"
        }
        else -> if (done) "Solved" else if (status == "IN_PROGRESS") "In progress" else null
    }
}

@Composable
// android-youtube-player embeds android.webkit.WebView internally (third-party; not app-owned).
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
            playerView.getYouTubePlayerWhenReady(object : YouTubePlayerCallback {
                override fun onYouTubePlayer(youTubePlayer: YouTubePlayer) {
                    youTubePlayer.loadVideo(videoId, 0f)
                    loadedId = videoId
                }
            })
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
