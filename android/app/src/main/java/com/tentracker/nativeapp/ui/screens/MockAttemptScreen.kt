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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Timer
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.MockAttemptViewModel

private val TimerRed = Color(0xFFDC2626)
private val AttemptBg = Color(0xFFF5F5F5)

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
        containerColor = if (inAttempt) AttemptBg else Color.White,
        topBar = {
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
                    onFinish = { confirmSubmit = true },
                )
            }
        },
    ) { padding ->
        when {
            state.loading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator(color = Brand) }
            }
            state.error != null && state.questions.isEmpty() -> {
                Column(modifier = Modifier.padding(padding).padding(16.dp)) {
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
                    modifier = Modifier.padding(padding),
                    state = state,
                    category = category,
                    context = context,
                    onBack = onBack,
                )
            }
            !state.started -> {
                MockPreflightContent(
                    modifier = Modifier.padding(padding),
                    state = state,
                    category = category,
                    context = context,
                    onStart = { vm.start() },
                )
            }
            q != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                ) {
                    MockAttemptHeaderCard(
                        testName = state.test?.name.orEmpty(),
                        current = state.index + 1,
                        total = state.questions.size,
                        answered = state.answers.size,
                        secondsRemaining = state.secondsRemaining,
                        onSubmit = { confirmSubmit = true },
                        onOpenGrid = { showGrid = true },
                    )
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        q.difficulty?.takeIf { it.isNotBlank() }?.let { diff ->
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = Color.White,
                                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                            ) {
                                Text(
                                    diff.replaceFirstChar { it.uppercase() },
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Muted,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }

                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                            elevation = CardDefaults.cardElevation(1.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                HtmlText(html = q.question, modifier = Modifier.fillMaxWidth())
                            }
                        }

                        q.options().forEach { (letter, text) ->
                            val isSelected = selected.equals(letter, ignoreCase = true)
                            MockOptionRow(
                                letter = letter,
                                html = text,
                                selected = isSelected,
                                onClick = { vm.selectOption(letter) },
                            )
                        }
                        Spacer(modifier = Modifier.height(72.dp))
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
                ) { Text("Submit", color = Brand, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { confirmSubmit = false }) { Text("Cancel") }
            },
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
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(1.dp),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "IN PROGRESS",
                        style = MaterialTheme.typography.labelSmall,
                        color = Brand,
                        fontWeight = FontWeight.Bold,
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
                        "$answered answered",
                        style = MaterialTheme.typography.labelSmall,
                        color = Muted,
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    if (secondsRemaining != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFFAFAFA),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(Icons.Default.Timer, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    formatClock(secondsRemaining),
                                    fontWeight = FontWeight.Bold,
                                    color = if (secondsRemaining < 60) TimerRed else Ink,
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
                    "${(progress * 100).toInt()}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = Muted,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    "Q $current / $total",
                    style = MaterialTheme.typography.labelSmall,
                    color = Muted,
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(999.dp)),
                color = Brand,
                trackColor = Color(0xFFE5E5E5),
            )
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
            .background(if (selected) BrandSoft else Color.White)
            .border(
                1.dp,
                if (selected) Brand.copy(alpha = 0.5f) else Border,
                RoundedCornerShape(12.dp),
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(if (selected) Brand else Color(0xFFF5F5F5))
                .border(
                    1.dp,
                    if (selected) Brand else Border,
                    RoundedCornerShape(8.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                letter.uppercase(),
                fontWeight = FontWeight.Bold,
                color = if (selected) Color.White else Muted,
                fontSize = 13.sp,
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
    onFinish: () -> Unit,
) {
    Surface(
        color = Color.White,
        shadowElevation = 8.dp,
        tonalElevation = 0.dp,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
        ) {
            if (hasAnswer) {
                Button(
                    onClick = { if (canNext) onNext() else onFinish() },
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                ) {
                    Text(
                        if (canNext) "Save & next" else "Save & finish",
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
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
                    Text("Prev", fontWeight = FontWeight.SemiBold)
                }
                OutlinedButton(
                    onClick = onGrid,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Icon(Icons.Default.GridView, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("$current/$total", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = onNext,
                    enabled = canNext,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Next", fontWeight = FontWeight.SemiBold)
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null)
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
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            "NAVIGATE",
                            style = MaterialTheme.typography.labelSmall,
                            color = Brand,
                            fontWeight = FontWeight.Bold,
                        )
                        Text("Questions", fontWeight = FontWeight.Bold, color = Ink)
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
                    modifier = Modifier.heightIn(max = 320.dp),
                ) {
                    itemsIndexed(questionIds) { index, qId ->
                        val answered = answeredIds.contains(qId)
                        val active = index == currentIndex
                        val bg = when {
                            active -> Ink
                            answered -> Brand
                            else -> Color(0xFFF5F5F5)
                        }
                        val fg = if (active || answered) Color.White else Muted
                        val borderColor = when {
                            active -> Brand
                            answered -> Brand
                            else -> Border
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(bg)
                                .border(1.dp, borderColor, RoundedCornerShape(12.dp))
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
                    color = Color(0xFFFAFAFA),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            "LEGEND",
                            style = MaterialTheme.typography.labelSmall,
                            color = Muted,
                            fontWeight = FontWeight.Bold,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            LegendDot("Current", Ink)
                            LegendDot("Answered", Brand)
                            LegendDot("Pending", Color(0xFFE5E5E5))
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
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(test?.name ?: "Mock test", fontWeight = FontWeight.Bold, color = Ink, style = MaterialTheme.typography.titleLarge)
                test?.description?.takeIf { it.isNotBlank() }?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(it, color = Muted)
                }
                Spacer(modifier = Modifier.height(12.dp))
                val durationLabel = test?.duration?.takeIf { d -> d > 0 }?.let { d ->
                    formatMockDurationPreflight(d)
                } ?: "Untimed"
                Text("${state.questions.size} questions · $durationLabel", fontWeight = FontWeight.Medium, color = Ink)
            }
        }
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Before you begin", color = Brand, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                Text("Instructions", fontWeight = FontWeight.Bold, color = Ink)
                Spacer(modifier = Modifier.height(8.dp))
                listOf(
                    "Use the grid or footer to jump between questions",
                    "Answers are saved on this device",
                    "Open the web attempt after submit to sync credits",
                ).forEach { line ->
                    Text("• $line", style = MaterialTheme.typography.bodyMedium, color = Muted)
                }
            }
        }
        Button(
            onClick = onStart,
            enabled = state.questions.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(containerColor = Brand),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Start ${state.questions.size} question test", fontWeight = FontWeight.SemiBold)
        }
        TextButton(
            onClick = {
                openSite(context, "/mock-test/$category/attempt/${test?.id.orEmpty()}")
            },
        ) { Text("Prefer full web attempt") }
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
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Your score", style = MaterialTheme.typography.headlineSmall, color = Ink, fontWeight = FontWeight.Bold)
        Text(
            "${r.percent}%",
            fontWeight = FontWeight.Black,
            color = Brand,
            style = MaterialTheme.typography.displaySmall,
        )
        Text("${r.correct} of ${r.total} correct", fontWeight = FontWeight.SemiBold, color = Ink)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            ScoreStat("${r.attempted}", "Attempted", Modifier.weight(1f))
            ScoreStat("${r.incorrect}", "Incorrect", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            ScoreStat("${r.skipped}", "Skipped", Modifier.weight(1f))
            ScoreStat(formatClock(r.secondsUsed), "Time", Modifier.weight(1f))
        }
        state.submitHint?.let {
            Text(it, style = MaterialTheme.typography.bodyMedium, color = Muted)
        }
        Button(
            onClick = {
                val id = state.test?.id.orEmpty()
                openSite(context, "/mock-test/$category/attempt/$id")
            },
            colors = ButtonDefaults.buttonColors(containerColor = Brand),
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

@Composable
private fun ScoreStat(value: String, label: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFFFAFAFA),
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

private fun formatMockDurationPreflight(minutes: Int): String {
    val m = minutes.coerceAtLeast(0)
    return if (m > 0) "$m min timer" else "Untimed"
}

private fun formatClock(totalSeconds: Int): String {
    val s = totalSeconds.coerceAtLeast(0)
    val h = s / 3600
    val m = (s % 3600) / 60
    val sec = s % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%d:%02d".format(m, sec)
}