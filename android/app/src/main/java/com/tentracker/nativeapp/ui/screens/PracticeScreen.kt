package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.PracticeQuestion
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.PracticeUiState
import com.tentracker.nativeapp.ui.viewmodel.PracticeViewModel

private val CorrectGreen = Color(0xFF16A34A)
private val CorrectBg = Color(0xFFDCFCE7)
private val CorrectBorder = Color(0xFFBBF7D0)
private val WrongRed = Color(0xFFDC2626)
private val WrongBg = Color(0xFFFEE2E2)
private val WrongBorder = Color(0xFFFECACA)
private val SolutionIndigo = Color(0xFF3730A3)
private val SolutionBg = Color(0xFFEEF2FF)
private val SolutionBorder = Color(0xFFC7D2FE)
private val Emerald = Color(0xFF059669)
private val EmeraldSoft = Color(0xFFECFDF5)
private val EmeraldBorder = Color(0xFFA7F3D0)
private val RoseSoft = Color(0xFFFFF1F2)
private val RoseBorder = Color(0xFFFECDD3)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PracticeScreen(
    title: String,
    vm: PracticeViewModel,
    onBack: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val q = state.questions.getOrNull(state.index)
    val totalLabel = if (state.totalCount > 0) state.totalCount else state.questions.size

    Scaffold(
        containerColor = Color(0xFFFAFAFA),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(title, maxLines = 1, fontWeight = FontWeight.SemiBold)
                        if (state.totalCount > 0 || state.questions.isNotEmpty()) {
                            val plus = if (state.hasMore) "+" else ""
                            Text(
                                "Q ${state.index + 1} of ${state.questions.size}$plus · $totalLabel total",
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
    ) { innerPadding ->
        when {
            state.loading && state.questions.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(innerPadding),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = Brand)
                }
            }
            state.error != null && q == null -> {
                Column(modifier = Modifier.padding(innerPadding).padding(16.dp)) {
                    Text(state.error ?: "Error", color = Muted)
                    TextButton(onClick = { vm.load(1, reset = true) }) { Text("Retry") }
                }
            }
            q != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Spacer(modifier = Modifier.height(4.dp))
                    ScoreStrip(state = state, onJumpOpen = { vm.jumpToFirstOpen() })
                    QuestionPalette(
                        state = state,
                        onToggle = { vm.togglePalette() },
                        onJump = { vm.jumpTo(it) },
                        onJumpOpen = { vm.jumpToFirstOpen() },
                    )
                    QuestionCardBody(
                        question = q,
                        index = state.index,
                        state = state,
                        onSelect = { vm.selectOption(it) },
                        onToggleSolution = { vm.toggleSolution() },
                    )
                    state.saveHint?.let {
                        Text(it, style = MaterialTheme.typography.labelSmall, color = Muted)
                    }
                    NavRow(
                        state = state,
                        onPrev = { vm.prev() },
                        onCheck = { vm.checkAnswer() },
                        onNext = { vm.next() },
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun ScoreStrip(state: PracticeUiState, onJumpOpen: () -> Unit) {
    val total = if (state.totalCount > 0) state.totalCount else state.questions.size
    val completed = state.completedInChapter()
    val correct = state.correctInChapter()
    val wrong = state.wrongInChapter
    val pending = state.pendingInChapter

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                "${state.index + 1}",
                fontWeight = FontWeight.Bold,
                color = Ink,
                fontSize = 14.sp,
            )
            Text(
                "/$total",
                color = Muted,
                fontSize = 13.sp,
            )
            LinearProgressIndicator(
                progress = { state.progressPct / 100f },
                modifier = Modifier
                    .weight(1f)
                    .height(6.dp)
                    .clip(RoundedCornerShape(999.dp)),
                color = Emerald,
                trackColor = Color(0xFFE5E5E5),
            )
            Text(
                "${state.progressPct}%",
                style = MaterialTheme.typography.labelSmall,
                color = Muted,
                fontWeight = FontWeight.SemiBold,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            StatChip(
                modifier = Modifier.weight(1f),
                value = "$correct",
                label = "Correct",
                bg = EmeraldSoft,
                border = EmeraldBorder,
                valueColor = Color(0xFF065F46),
            )
            StatChip(
                modifier = Modifier.weight(1f),
                value = "$wrong",
                label = "Wrong",
                bg = RoseSoft,
                border = RoseBorder,
                valueColor = Color(0xFF9F1239),
            )
            StatChip(
                modifier = Modifier.weight(1f),
                value = "$pending",
                label = "Left",
                bg = Color(0xFFFAFAFA),
                border = Border,
                valueColor = Ink,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Star,
                    contentDescription = null,
                    tint = Color(0xFFCA8A04),
                    modifier = Modifier.size(16.dp),
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    "${state.points} pts",
                    fontWeight = FontWeight.SemiBold,
                    color = Ink,
                    fontSize = 13.sp,
                )
                if (completed > 0) {
                    Text(
                        " · ${state.accuracyPct}% accuracy",
                        color = Muted,
                        fontSize = 12.sp,
                    )
                }
            }
            if (state.firstPendingIndex >= 0 && state.firstPendingIndex != state.index) {
                TextButton(onClick = onJumpOpen) {
                    Text("Jump to open", color = Emerald, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun StatChip(
    modifier: Modifier = Modifier,
    value: String,
    label: String,
    bg: Color,
    border: Color,
    valueColor: Color,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(value, fontWeight = FontWeight.Bold, color = valueColor, fontSize = 15.sp)
        Text(label, color = valueColor.copy(alpha = 0.75f), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun QuestionPalette(
    state: PracticeUiState,
    onToggle: () -> Unit,
    onJump: (Int) -> Unit,
    onJumpOpen: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggle),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                "QUESTION MAP",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Muted,
                letterSpacing = 0.8.sp,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (state.firstPendingIndex >= 0) {
                    TextButton(onClick = onJumpOpen) {
                        Text("Jump to open", color = Emerald, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
                Icon(
                    if (state.paletteExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (state.paletteExpanded) "Collapse" else "Expand",
                    tint = Muted,
                )
            }
        }

        if (state.paletteExpanded) {
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                state.questions.forEachIndexed { i, question ->
                    val id = question.id
                    val ok = id in state.correctIds
                    val bad = id in state.completedIds && !ok
                    val cur = i == state.index
                    val bg = when {
                        cur -> Emerald
                        ok -> EmeraldSoft
                        bad -> RoseSoft
                        else -> Color.White
                    }
                    val borderColor = when {
                        cur -> Emerald
                        ok -> EmeraldBorder
                        bad -> RoseBorder
                        else -> Border
                    }
                    val textColor = when {
                        cur -> Color.White
                        ok -> Color(0xFF065F46)
                        bad -> Color(0xFF9F1239)
                        else -> Muted
                    }
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(bg)
                            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                            .clickable { onJump(i) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            "${i + 1}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = textColor,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
                if (state.hasMore) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFFAFAFA))
                            .border(1.dp, Border, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("…", color = Muted, fontWeight = FontWeight.Bold)
                    }
                }
            }
            if (state.loadingMore) {
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().height(3.dp),
                    color = Brand,
                    trackColor = BrandSoft,
                )
            }
        }
    }
}

@Composable
private fun QuestionCardBody(
    question: PracticeQuestion,
    index: Int,
    state: PracticeUiState,
    onSelect: (String) -> Unit,
    onToggleSolution: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(20.dp)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF8FAFC))
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Ink),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "${index + 1}",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                    )
                }
                Column {
                    Text(
                        "DIFFICULTY",
                        style = MaterialTheme.typography.labelSmall,
                        color = Muted,
                        fontSize = 10.sp,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    DifficultyDots(question.difficulty)
                }
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                question.year?.takeIf { it.isNotBlank() }?.let { year ->
                    YearBadge(year)
                }
                StatusBadge(done = question.id in state.completedIds)
            }
        }

        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            HtmlText(html = question.question, modifier = Modifier.fillMaxWidth())

            val correctLetter = question.correct_option?.trim()?.uppercase()?.take(1)
            question.options().forEach { (letter, text) ->
                val selected = state.selected.equals(letter, ignoreCase = true)
                val isCorrectOpt = letter.equals(correctLetter, ignoreCase = true)
                val borderColor = when {
                    state.revealed && isCorrectOpt -> CorrectGreen
                    state.revealed && selected -> WrongRed
                    selected -> Brand
                    else -> Border
                }
                val bg = when {
                    state.revealed && isCorrectOpt -> CorrectBg
                    state.revealed && selected -> WrongBg
                    selected -> BrandSoft
                    else -> Color.White
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(bg)
                        .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                        .clickable(enabled = !state.revealed) { onSelect(letter) }
                        .padding(12.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        "$letter.",
                        fontWeight = FontWeight.Bold,
                        color = Brand,
                        modifier = Modifier.padding(end = 8.dp),
                    )
                    HtmlText(html = text, modifier = Modifier.weight(1f), textSizeSp = 14f)
                    if (state.revealed && isCorrectOpt) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = "Correct",
                            tint = CorrectGreen,
                            modifier = Modifier.size(18.dp),
                        )
                    } else if (state.revealed && selected && !isCorrectOpt) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Incorrect",
                            tint = WrongRed,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }

            if (state.revealed && state.lastCorrect != null) {
                FeedbackBanner(
                    correct = state.lastCorrect == true,
                    correctOption = correctLetter,
                )
            }

            if (state.revealed) {
                OutlinedButton(
                    onClick = onToggleSolution,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.MenuBook,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = SolutionIndigo,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        if (state.showSolution) "Hide Solution" else "Show Solution",
                        color = SolutionIndigo,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }

            if (state.revealed && state.showSolution) {
                SolutionPanel(question = question, correctLetter = correctLetter)
            }
        }
    }
}

@Composable
private fun DifficultyDots(difficulty: String?) {
    val level = when (difficulty?.trim()?.lowercase()) {
        "easy" -> 1
        "medium" -> 2
        "hard" -> 3
        else -> 0
    }
    val active = when (level) {
        1 -> Color(0xFF22C55E)
        2 -> Color(0xFFF59E0B)
        3 -> Color(0xFFEF4444)
        else -> Muted
    }
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        (1..3).forEach { i ->
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (i <= level) active else Color(0xFFE5E5E5)),
            )
        }
        if (!difficulty.isNullOrBlank()) {
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                difficulty.replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.labelSmall,
                color = Muted,
                fontSize = 11.sp,
            )
        }
    }
}

@Composable
private fun YearBadge(year: String) {
    Text(
        text = year,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        style = MaterialTheme.typography.labelSmall,
        color = Ink,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
    )
}

@Composable
private fun StatusBadge(done: Boolean) {
    val bg = if (done) EmeraldSoft else Color(0xFFFFFBEB)
    val border = if (done) EmeraldBorder else Color(0xFFFDE68A)
    val color = if (done) Color(0xFF047857) else Color(0xFFB45309)
    Text(
        text = if (done) "Done" else "Open",
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        style = MaterialTheme.typography.labelSmall,
        color = color,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
    )
}

@Composable
private fun FeedbackBanner(correct: Boolean, correctOption: String?) {
    val bg = if (correct) CorrectBg else WrongBg
    val border = if (correct) CorrectBorder else WrongBorder
    val titleColor = if (correct) Color(0xFF166534) else Color(0xFF991B1B)
    val bodyColor = if (correct) Color(0xFF15803D) else Color(0xFFB91C1C)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(2.dp, border, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(
            if (correct) Icons.Default.CheckCircle else Icons.Default.Warning,
            contentDescription = null,
            tint = if (correct) CorrectGreen else WrongRed,
            modifier = Modifier.size(20.dp),
        )
        Column {
            Text(
                if (correct) "Correct!" else "Incorrect",
                fontWeight = FontWeight.Bold,
                color = titleColor,
                fontSize = 14.sp,
            )
            Text(
                if (correct) "You earned 100 points."
                else "Correct answer: ${correctOption ?: "—"}",
                color = bodyColor,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun SolutionPanel(question: PracticeQuestion, correctLetter: String?) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(SolutionBg)
            .border(1.dp, SolutionBorder, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.AutoMirrored.Filled.MenuBook,
                contentDescription = null,
                tint = SolutionIndigo,
                modifier = Modifier.size(16.dp),
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                "Solution",
                fontWeight = FontWeight.Bold,
                color = SolutionIndigo,
                fontSize = 13.sp,
            )
        }
        if (!correctLetter.isNullOrBlank()) {
            Text(
                "Correct Answer: $correctLetter",
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .padding(10.dp),
                fontWeight = FontWeight.SemiBold,
                color = SolutionIndigo,
                fontSize = 13.sp,
            )
        }
        val body = question.solutiontext?.takeIf { it.isNotBlank() }
            ?: question.solution?.takeIf { it.isNotBlank() }
        if (body != null) {
            HtmlText(html = body, modifier = Modifier.fillMaxWidth(), textSizeSp = 14f)
        } else {
            Text("No written solution yet.", color = Muted, fontSize = 13.sp)
        }
    }
}

@Composable
private fun NavRow(
    state: PracticeUiState,
    onPrev: () -> Unit,
    onCheck: () -> Unit,
    onNext: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        OutlinedButton(
            onClick = onPrev,
            enabled = state.index > 0,
            shape = RoundedCornerShape(12.dp),
        ) { Text("Prev") }

        if (!state.revealed) {
            Button(
                onClick = onCheck,
                enabled = state.selected != null,
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f),
            ) { Text("Check") }
        } else {
            Button(
                onClick = onNext,
                colors = ButtonDefaults.buttonColors(containerColor = Emerald),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    when {
                        state.index < state.questions.lastIndex -> "Next"
                        state.hasMore -> if (state.loadingMore) "Loading…" else "Load more"
                        else -> "Done"
                    }
                )
            }
        }
    }
}
