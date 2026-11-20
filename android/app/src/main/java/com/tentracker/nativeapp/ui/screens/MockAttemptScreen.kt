package com.tentracker.nativeapp.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.motion.OgEaseOut
import com.tentracker.nativeapp.ui.motion.OgFadeSlideIn
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldDark
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.MockAttemptViewModel

private val TimerRose = Color(0xFFE11D48)
private val Emerald700 = Color(0xFF047857)
private val Emerald300 = Color(0xFF6EE7B7)
private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral100 = Color(0xFFF5F5F5)
private val AttemptPageBg = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFECFDF5).copy(alpha = 0.55f),
        Color(0xFFFAFAFA),
        Color(0xFFF5F5F5),
    ),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockAttemptScreen(
    category: String,
    vm: MockAttemptViewModel,
    onBack: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    var confirmSubmit by remember { mutableStateOf(false) }
    var showGrid by remember { mutableStateOf(false) }
    val q = state.questions.getOrNull(state.index)
    val selected = q?.let { state.answers[it.id] }
    val inAttempt = state.started && !state.submitted && q != null

    Scaffold(
        containerColor = if (inAttempt) Color.Transparent else Color.White,
        topBar = {
            if (!inAttempt) {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                state.test?.name ?: "Mock attempt",
                                maxLines = 1,
                                fontWeight = FontWeight.Bold,
                                color = Ink,
                            )
                            when {
                                state.submitted -> Text(
                                    "Submitted",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                )
                                state.started && state.questions.isNotEmpty() -> Text(
                                    "Question ${state.index + 1} of ${state.questions.size}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
                )
            } else {
                TopAppBar(
                    title = {},
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
                )
            }
        },
        bottomBar = {
            if (inAttempt) {
                MockAttemptBottomBar(
                    current = state.index + 1,
                    total = state.questions.size,
                    canPrev = state.index > 0,
                    canNext = state.index < state.questions.lastIndex,
                    hasAnswer = selected != null,
                    onPrev = { vm.prev() },
                    onNext = { vm.next() },
                    onGrid = { showGrid = true },
                    onSaveNext = {
                        if (state.index < state.questions.lastIndex) vm.next() else confirmSubmit = true
                    },
                    onClear = { vm.clearCurrentAnswer() },
                    onSkip = { vm.next() },
                )
            }
        },
    ) { padding ->
        val pageModifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .then(
                if (inAttempt) Modifier.background(AttemptPageBg) else Modifier,
            )

        when {
            state.loading -> {
                Box(
                    modifier = pageModifier,
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator(color = Emerald) }
            }
            state.error != null && state.questions.isEmpty() -> {
                Column(modifier = pageModifier.padding(16.dp)) {
                    Text(state.error ?: "Error", color = Muted)
                    TextButton(onClick = { vm.load() }) { Text("Retry") }
                    TextButton(
                        onClick = {
                            openSite(context, "/mock-test/$category/attempt/${state.test?.id ?: ""}")
                        },
                    ) { Text("Open on web") }
                }
            }
            state.submitted && state.result != null -> {
                MockScoreContent(
                    modifier = pageModifier,
                    state = state,
                    category = category,
                    context = context,
                    onBack = onBack,
                )
            }
            !state.started -> {
                MockPreflightContent(
                    modifier = pageModifier,
                    state = state,
                    category = category,
                    context = context,
                    onStart = { vm.start() },
                )
            }
            q != null -> {
                Column(modifier = pageModifier) {
                    OgFadeSlideIn(delayMillis = 0, durationMillis = 300, fromOffsetY = 10.dp) {
                        MockAttemptHeaderCard(
                            testName = state.test?.name.orEmpty(),
                            current = state.index + 1,
                            total = state.questions.size,
                            answered = state.answers.size,
                            secondsRemaining = state.secondsRemaining,
                            onSubmit = { confirmSubmit = true },
                            onOpenGrid = { showGrid = true },
                        )
                    }
                    AnimatedContent(
                        targetState = state.index,
                        transitionSpec = {
                            fadeIn(animationSpec = tween(220, easing = OgEaseOut)) togetherWith
                                fadeOut(animationSpec = tween(160, easing = OgEaseOut))
                        },
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 16.dp)
                            .padding(bottom = 8.dp)
                            .fillMaxWidth(),
                        label = "mockQuestion",
                    ) { idx ->
                        val question = state.questions.getOrNull(idx) ?: return@AnimatedContent
                        val sel = state.answers[question.id]
                        Card(
                            modifier = Modifier.fillMaxSize(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
                            elevation = CardDefaults.cardElevation(1.dp),
                        ) {
                            Column(
                                modifier = Modifier
                                    .verticalScroll(rememberScrollState())
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                val chips = buildList {
                                    question.subject?.takeIf { it.isNotBlank() }?.let { add(it to true) }
                                    question.difficulty?.takeIf { it.isNotBlank() }?.let {
                                        add(it.replaceFirstChar { c -> c.uppercase() } to false)
                                    }
                                }
                                if (chips.isNotEmpty()) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        chips.forEach { (label, primary) ->
                                            QuestionMetaChip(label, primary)
                                        }
                                    }
                                }

                                HtmlText(
                                    html = question.question,
                                    modifier = Modifier.fillMaxWidth(),
                                    textSizeSp = 16f,
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                question.options().forEach { (letter, text) ->
                                    val isSelected = sel.equals(letter, ignoreCase = true)
                                    MockOptionRow(
                                        letter = letter,
                                        html = text,
                                        selected = isSelected,
                                        onClick = { vm.selectOption(letter) },
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showGrid && state.questions.isNotEmpty()) {
        MockQuestionGridDialog(
            currentIndex = state.index,
            answeredIds = state.answers.keys.toSet(),
            questionIds = state.questions.map { it.id },
            onNavigate = { vm.goTo(it) },
            onDismiss = { showGrid = false },
        )
    }

    if (confirmSubmit) {
        AlertDialog(
            onDismissRequest = { confirmSubmit = false },
            title = { Text("Submit mock?", fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "You answered ${state.answers.size} of ${state.questions.size}. " +
                        "Score is calculated on device; open web to persist with credits.",
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmSubmit = false
                        vm.submit()
                    },
                ) { Text("Submit", color = Emerald, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { confirmSubmit = false }) { Text("Cancel") }
            },
        )
    }
}

@Composable
private fun QuestionMetaChip(label: String, primary: Boolean) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = if (primary) EmeraldSoft else Neutral50,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (primary) EmeraldBorder else Border,
        ),
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = if (primary) EmeraldDark else Color(0xFF525252),
            fontWeight = FontWeight.SemiBold,
            fontSize = 12.sp,
        )
    }
}

@Composable
private fun MockAttemptHeaderCard(
    testName: String,
    current: Int,
    total: Int,
    answered: Int,
    secondsRemaining: Int?,
    onSubmit: () -> Unit,
    onOpenGrid: () -> Unit,
) {
    val progress = if (total > 0) current.toFloat() / total else 0f
    val progressPct = if (total > 0) (progress * 100).toInt() else 0
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.95f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(1.dp),
    ) {
        Box {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                EmeraldSoft.copy(alpha = 0.35f),
                                Color.Transparent,
                            ),
                        ),
                    ),
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "IN PROGRESS",
                            style = MaterialTheme.typography.labelSmall,
                            color = EmeraldDark,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            letterSpacing = 0.8.sp,
                        )
                        Text(
                            testName,
                            fontWeight = FontWeight.Bold,
                            color = Ink,
                            maxLines = 1,
                            style = MaterialTheme.typography.titleSmall,
                        )
                        Text(
                            "Question $current of $total · $answered answered",
                            style = MaterialTheme.typography.labelSmall,
                            color = Muted,
                            fontSize = 12.sp,
                        )
                    }
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (secondsRemaining != null) {
                            val warn = secondsRemaining <= 300
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Neutral50,
                                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Icon(
                                        Icons.Default.Timer,
                                        contentDescription = null,
                                        tint = if (warn) TimerRose else Emerald,
                                        modifier = Modifier.size(16.dp),
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        formatClock(secondsRemaining),
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (warn) TimerRose else Ink,
                                        fontSize = 14.sp,
                                    )
                                }
                            }
                        }
                        IconButton(onClick = onOpenGrid) {
                            Icon(Icons.Default.GridView, contentDescription = "Questions", tint = Ink)
                        }
                        Button(
                            onClick = onSubmit,
                            colors = ButtonDefaults.buttonColors(containerColor = Ink),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("End", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "$progressPct%",
                        style = MaterialTheme.typography.labelSmall,
                        color = Muted,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                    )
                    Text(
                        "Q $current / $total",
                        style = MaterialTheme.typography.labelSmall,
                        color = Muted,
                        fontFamily = FontFamily.Monospace,
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(999.dp)),
                    color = Emerald,
                    trackColor = Neutral100,
                )
            }
        }
    }
}

@Composable
private fun MockOptionRow(
    letter: String,
    html: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) EmeraldSoft.copy(alpha = 0.8f) else Color.White)
            .border(
                1.dp,
                if (selected) Emerald300 else Border,
                RoundedCornerShape(12.dp),
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(if (selected) Emerald700 else Neutral100)
                .border(
                    1.dp,
                    if (selected) Emerald700 else Border,
                    RoundedCornerShape(8.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                letter.uppercase(),
                fontWeight = FontWeight.Bold,
                color = if (selected) Color.White else Color(0xFF525252),
                fontSize = 12.sp,
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        HtmlText(html = html, modifier = Modifier.weight(1f), textSizeSp = 14f)
    }
}

@Composable
private fun MockAttemptBottomBar(
    current: Int,
    total: Int,
    canPrev: Boolean,
    canNext: Boolean,
    hasAnswer: Boolean,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onGrid: () -> Unit,
    onSaveNext: () -> Unit,
    onClear: () -> Unit,
    onSkip: () -> Unit,
) {
    Surface(
        color = Color.White,
        shadowElevation = 8.dp,
        tonalElevation = 0.dp,
        modifier = Modifier.border(
            width = androidx.compose.ui.unit.Dp.Hairline,
            color = Border,
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedButton(
                    onClick = onPrev,
                    enabled = canPrev,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = null)
                    Text("Prev", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                }
                OutlinedButton(
                    onClick = onGrid,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(Icons.Default.GridView, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("$current/$total", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                }
                OutlinedButton(
                    onClick = onNext,
                    enabled = canNext,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Next", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null)
                }
            }
            if (hasAnswer) {
                Button(
                    onClick = onSaveNext,
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald700),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        if (canNext) "Save & next" else "Save & finish",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                    )
                }
            }
            if (hasAnswer || canNext) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    if (hasAnswer) {
                        OutlinedButton(
                            onClick = onClear,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f),
                        ) {
                            Text("Clear", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        }
                    }
                    if (canNext) {
                        Button(
                            onClick = onSkip,
                            colors = ButtonDefaults.buttonColors(containerColor = Ink),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f),
                        ) {
                            Icon(Icons.Default.SkipNext, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Skip", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MockQuestionGridDialog(
    currentIndex: Int,
    answeredIds: Set<String>,
    questionIds: List<String>,
    onNavigate: (Int) -> Unit,
    onDismiss: () -> Unit,
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.4f))
                .clickable(onClick = onDismiss),
            contentAlignment = Alignment.Center,
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .clickable(enabled = false) {},
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                            .border(
                                width = androidx.compose.ui.unit.Dp.Hairline,
                                color = Border,
                                shape = RoundedCornerShape(0.dp),
                            ),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column {
                            Text(
                                "NAVIGATE",
                                style = MaterialTheme.typography.labelSmall,
                                color = EmeraldDark,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                letterSpacing = 0.6.sp,
                            )
                            Text("Questions", fontWeight = FontWeight.Bold, color = Ink, fontSize = 14.sp)
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(5),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.heightIn(max = 360.dp),
                    ) {
                        itemsIndexed(questionIds) { index, qId ->
                            val answered = answeredIds.contains(qId)
                            val active = index == currentIndex
                            val bg = when {
                                active -> Ink
                                answered -> Emerald
                                else -> Neutral100
                            }
                            val fg = if (active || answered) Color.White else Color(0xFF525252)
                            val cellBorder = when {
                                active -> Emerald300
                                answered -> Emerald
                                else -> Border
                            }
                            val ring = if (active) Modifier.border(2.dp, Emerald300, RoundedCornerShape(12.dp)) else Modifier
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .then(ring)
                                    .background(bg)
                                    .border(1.dp, cellBorder, RoundedCornerShape(12.dp))
                                    .clickable {
                                        onNavigate(index)
                                        onDismiss()
                                    }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    "${index + 1}",
                                    fontWeight = FontWeight.Bold,
                                    color = fg,
                                    fontSize = 13.sp,
                                )
                            }
                        }
                    }
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = Neutral50,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                "LEGEND",
                                style = MaterialTheme.typography.labelSmall,
                                color = Muted,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                letterSpacing = 0.6.sp,
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    LegendDot("Current", Ink)
                                    LegendDot("Marked", Color(0xFFF59E0B))
                                }
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    LegendDot("Answered", Emerald)
                                    LegendDot("Pending", Neutral100)
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
private fun LegendDot(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(color)
                .border(1.dp, Border, RoundedCornerShape(4.dp)),
        )
        Text(label, fontSize = 11.sp, color = Muted)
    }
}

@Composable
private fun MockPreflightContent(
    modifier: Modifier,
    state: com.tentracker.nativeapp.ui.viewmodel.MockAttemptUiState,
    category: String,
    context: android.content.Context,
    onStart: () -> Unit,
) {
    val test = state.test
    val questionCount = state.questions.size
    val durationMin = test?.duration ?: 0
    val categoryLabel = category.uppercase().replace('-', ' ')
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AttemptPageBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        OgFadeSlideIn(delayMillis = 0, durationMillis = 350) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
            ) {
                Box {
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(EmeraldSoft.copy(alpha = 0.25f), Color.Transparent),
                                ),
                            ),
                    )
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "BEFORE YOU START",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = EmeraldDark,
                            letterSpacing = 0.6.sp,
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            test?.name ?: "Mock test",
                            fontWeight = FontWeight.Bold,
                            color = Ink,
                            style = MaterialTheme.typography.titleLarge,
                        )
                        val subtitle = buildList {
                            add(categoryLabel)
                            add("$questionCount questions")
                            if (durationMin > 0) add(formatMockDurationList(durationMin)) else add("Untimed")
                        }.joinToString(" · ")
                        Text(subtitle, color = Muted, fontSize = 14.sp)
                    }
                }
            }
        }

        OgFadeSlideIn(delayMillis = 60, durationMillis = 350, fromOffsetY = 10.dp) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
            ) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                            .border(
                                width = androidx.compose.ui.unit.Dp.Hairline,
                                color = Border,
                                shape = RoundedCornerShape(0.dp),
                            ),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = EmeraldSoft,
                            border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldBorder),
                            modifier = Modifier.size(24.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("01", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EmeraldDark)
                            }
                        }
                        Column {
                            Text("OVERVIEW", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = EmeraldDark, letterSpacing = 0.6.sp)
                            Text("Test details", fontWeight = FontWeight.Bold, color = Ink, fontSize = 14.sp)
                        }
                    }
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            PreflightStatTile(
                                icon = Icons.Default.TrackChanges,
                                label = "Questions",
                                value = "$questionCount",
                                modifier = Modifier.weight(1f),
                            )
                            PreflightStatTile(
                                icon = Icons.Default.Timer,
                                label = "Duration",
                                value = if (durationMin > 0) formatMockDurationList(durationMin) else "—",
                                modifier = Modifier.weight(1f),
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            PreflightStatTile(
                                icon = Icons.Default.Warning,
                                label = "Difficulty",
                                value = test?.difficulty?.replaceFirstChar { it.uppercase() } ?: "Mixed",
                                modifier = Modifier.weight(1f),
                            )
                            PreflightStatTile(
                                icon = Icons.Default.CheckCircle,
                                label = "Type",
                                value = "MCQ",
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }
            }
        }

        OgFadeSlideIn(delayMillis = 120, durationMillis = 350, fromOffsetY = 10.dp) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
            ) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                            .border(
                                width = androidx.compose.ui.unit.Dp.Hairline,
                                color = Border,
                                shape = RoundedCornerShape(0.dp),
                            ),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = EmeraldSoft,
                            border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldBorder),
                            modifier = Modifier.size(24.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text("02", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EmeraldDark)
                            }
                        }
                        Column {
                            Text("BEFORE YOU BEGIN", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = EmeraldDark, letterSpacing = 0.6.sp)
                            Text("Instructions", fontWeight = FontWeight.Bold, color = Ink, fontSize = 14.sp)
                        }
                    }
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        listOf(
                            "Timer starts when you begin the first question",
                            "Use nav or grid to move between questions",
                            "Answers auto-saved on this device",
                            "Submit before time runs out to save your score",
                            "Open web after submit to sync credits & rank",
                        ).forEach { line ->
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald, modifier = Modifier.size(16.dp))
                                Text(line, style = MaterialTheme.typography.bodyMedium, color = Muted, fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }

        OgFadeSlideIn(delayMillis = 180, durationMillis = 350, fromOffsetY = 10.dp) {
            Surface(
                color = Color.White.copy(alpha = 0.95f),
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onStart,
                        enabled = state.questions.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald700),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Start $questionCount question test", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                    TextButton(
                        onClick = {
                            openSite(context, "/mock-test/$category/attempt/${test?.id.orEmpty()}")
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                    ) { Text("Prefer full web attempt", fontSize = 13.sp) }
                }
            }
        }
    }
}

@Composable
private fun PreflightStatTile(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = Neutral50.copy(alpha = 0.8f),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.6f)),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = Emerald700, modifier = Modifier.size(20.dp))
            Column {
                Text(label, fontSize = 11.sp, color = Muted)
                Text(value, fontWeight = FontWeight.Bold, color = Ink, fontSize = 18.sp)
            }
        }
    }
}

@Composable
private fun MockScoreContent(
    modifier: Modifier,
    state: com.tentracker.nativeapp.ui.viewmodel.MockAttemptUiState,
    category: String,
    context: android.content.Context,
    onBack: () -> Unit,
) {
    val r = state.result!!
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AttemptPageBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        OgFadeSlideIn(delayMillis = 0, durationMillis = 350) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Your score", style = MaterialTheme.typography.titleLarge, color = Ink, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "${r.percent}%",
                        fontWeight = FontWeight.Black,
                        color = Emerald,
                        style = MaterialTheme.typography.displaySmall,
                    )
                    Text("${r.correct} of ${r.total} correct", fontWeight = FontWeight.SemiBold, color = Ink)
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        ScoreStat("${r.percent}%", "Percentage", Modifier.weight(1f))
                        ScoreStat("${r.attempted}", "Attempted", Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        ScoreStat("${r.incorrect}", "Incorrect", Modifier.weight(1f))
                        ScoreStat(formatClock(r.secondsUsed), "Time", Modifier.weight(1f))
                    }
                }
            }
        }
        OgFadeSlideIn(delayMillis = 80, durationMillis = 300, fromOffsetY = 8.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                state.submitHint?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = Muted)
                }
                Button(
                    onClick = {
                        val id = state.test?.id.orEmpty()
                        openSite(context, "/mock-test/$category/attempt/$id")
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Ink),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Save / sync on web", fontWeight = FontWeight.SemiBold) }
                OutlinedButton(
                    onClick = onBack,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Done") }
            }
        }
    }
}

@Composable
private fun ScoreStat(value: String, label: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = Neutral50,
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, fontWeight = FontWeight.Bold, color = Ink, style = MaterialTheme.typography.titleLarge)
            Text(label, fontSize = 11.sp, color = Muted)
        }
    }
}

private fun formatMockDurationList(minutes: Int): String {
    val m = minutes.coerceAtLeast(0)
    val hours = m / 60
    val mins = m % 60
    return when {
        hours > 0 && mins > 0 -> "${hours}h ${mins}m"
        hours > 0 -> "${hours}h"
        m > 0 -> "${mins}m"
        else -> "Untimed"
    }
}

private fun formatClock(totalSeconds: Int): String {
    val s = totalSeconds.coerceAtLeast(0)
    val h = s / 3600
    val m = (s % 3600) / 60
    val sec = s % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%d:%02d".format(m, sec)
}