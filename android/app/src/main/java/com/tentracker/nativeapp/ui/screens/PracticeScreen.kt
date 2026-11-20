package com.tentracker.nativeapp.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.OutlinedFlag
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.tentracker.nativeapp.data.PracticeQuestion
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.motion.PracticeSheetSpring
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Tw
import com.tentracker.nativeapp.ui.viewmodel.PracticeUiState
import com.tentracker.nativeapp.ui.viewmodel.PracticeViewModel
import kotlin.math.min

private val CorrectGreen = Color(0xFF10B981)
private val CorrectBg = Color(0xFFECFDF5)
private val CorrectBorder = Color(0xFF10B981)
private val WrongRed = Color(0xFFF43F5E)
private val WrongBg = Color(0xFFFFF1F2)
private val WrongBorder = Color(0xFFF43F5E)
private val SolutionIndigo = Color(0xFF312E81)
private val SolutionBg = Color(0xFFEEF2FF)
private val SolutionBorder = Color(0xFFC7D2FE)
private val Emerald600 = Color(0xFF059669)
private val Emerald500 = Color(0xFF10B981)
private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral100 = Color(0xFFF5F5F5)
private val Neutral200 = Color(0xFFE5E5E5)
private val Neutral300 = Color(0xFFD4D4D4)
private val Neutral400 = Color(0xFFA3A3A3)
private val Neutral500 = Color(0xFF737373)
private val Neutral600 = Color(0xFF525252)
private val Neutral800 = Color(0xFF262626)
private val Neutral900 = Color(0xFF171717)
private val EmeraldSoft = Color(0xFFECFDF5)
private val EmeraldBorder = Color(0xFFA7F3D0)
private val EmeraldText = Color(0xFF065F46)
private val RoseSoft = Color(0xFFFFF1F2)
private val RoseBorder = Color(0xFFFECDD3)
private val RoseText = Color(0xFF9F1239)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun PracticeScreen(
    title: String,
    vm: PracticeViewModel,
    onBack: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val q = state.currentQuestion()
    val totalLabel = if (state.totalCount > 0) state.totalCount else state.questions.size
    val listFilter = state.listFilter
    val visibleCount = state.filteredIndices().size

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = Neutral50,
            bottomBar = {
                if (q != null) {
                    MobilePracticeBottomBar(
                        state = state,
                        onPrev = { vm.prev() },
                        onNext = { if (state.revealed) vm.next() else vm.checkAnswer() },
                        onOpenMap = { vm.togglePalette() },
                    )
                }
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
                state.error != null && state.questions.isEmpty() -> {
                    Column(modifier = Modifier.padding(innerPadding).padding(16.dp)) {
                        Text(state.error ?: "Error", color = Muted)
                        TextButton(onClick = { vm.load(1, reset = true) }) { Text("Retry") }
                    }
                }
                state.filterEmpty -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Text("Nothing in this filter", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Neutral900)
                        Text(
                            "Try All, or clear Wrong / Flagged.",
                            fontSize = 14.sp,
                            color = Neutral500,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
                        )
                        Button(
                            onClick = { vm.setListFilter("all") },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Neutral900),
                        ) {
                            Text("Show all", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                q != null -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(
                            start = 16.dp,
                            end = 16.dp,
                            bottom = 96.dp,
                        ),
                    ) {
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            PracticeSubpageHeader(
                                title = "$title — Practice",
                                description = "$totalLabel questions",
                                breadcrumb = "$title › Practice",
                                onBack = onBack,
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                        stickyHeader {
                            StickyProgressStrip(
                                state = state,
                                listFilter = listFilter,
                                visibleCount = visibleCount,
                                onFilter = vm::setListFilter,
                            )
                        }
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            MobileScoreChips(state = state)
                            Spacer(modifier = Modifier.height(12.dp))
                            // QuestionCard embedded remount: opacity + y 10 → 0 @ 200ms
                            AnimatedContent(
                                targetState = q.id,
                                transitionSpec = {
                                    (
                                        fadeIn(animationSpec = tween(200)) +
                                            slideInVertically(
                                                animationSpec = tween(200),
                                                initialOffsetY = { 10 },
                                            )
                                        ) togetherWith (
                                        fadeOut(animationSpec = tween(160)) +
                                            slideOutVertically(
                                                animationSpec = tween(160),
                                                targetOffsetY = { -6 },
                                            )
                                        )
                                },
                                label = "practice-question",
                            ) { _ ->
                                QuestionCardBody(
                                    question = q,
                                    index = state.index,
                                    state = state,
                                    onSelect = { vm.selectOption(it) },
                                    onToggleSolution = { vm.toggleSolution() },
                                )
                            }
                            state.saveHint?.let { hint ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(hint, style = MaterialTheme.typography.labelSmall, color = Muted)
                            }
                        }
                    }
                }
            }
        }

        // SubjectPractice / ChapterPractice mobile sheet: scrim fade + spring y 100%→0
        AnimatedVisibility(
            visible = state.paletteExpanded && q != null,
            enter = fadeIn(animationSpec = tween(200)),
            exit = fadeOut(animationSpec = tween(160)),
            modifier = Modifier
                .fillMaxSize()
                .zIndex(50f),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f))
                    .clickable { vm.togglePalette() },
            )
        }
        AnimatedVisibility(
            visible = state.paletteExpanded && q != null,
            enter = slideInVertically(
                initialOffsetY = { it },
                animationSpec = PracticeSheetSpring,
            ),
            exit = slideOutVertically(
                targetOffsetY = { it },
                animationSpec = PracticeSheetSpring,
            ),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .zIndex(60f),
        ) {
            ChapterNavSheet(
                state = state,
                listFilter = listFilter,
                onClose = { vm.togglePalette() },
                onJump = { vm.jumpTo(it); vm.togglePalette() },
                onJumpOpen = { vm.jumpToFirstOpen(); vm.togglePalette() },
            )
        }
    }
}

@Composable
private fun PracticeSubpageHeader(
    title: String,
    description: String,
    breadcrumb: String,
    onBack: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        TextButton(
            onClick = onBack,
            modifier = Modifier.padding(start = 0.dp, bottom = 4.dp),
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = Neutral400,
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text("Back", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Neutral400)
        }
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            shadowElevation = 1.dp,
            border = androidx.compose.foundation.BorderStroke(1.dp, Neutral200),
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    breadcrumb,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = Neutral500,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Neutral900,
                    lineHeight = 26.sp,
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    description,
                    fontSize = 14.sp,
                    color = Neutral500,
                    lineHeight = 20.sp,
                )
            }
        }
    }
}

@Composable
private fun StickyProgressStrip(
    state: PracticeUiState,
    listFilter: String,
    visibleCount: Int,
    onFilter: (String) -> Unit,
) {
    val total = if (state.totalCount > 0) state.totalCount else state.questions.size
    val positionTotal = if (listFilter == "all") total else visibleCount.coerceAtLeast(1)
    val position = if (listFilter == "all") {
        state.index + 1
    } else {
        val visible = state.filteredIndices()
        val pos = visible.indexOf(state.index)
        if (pos >= 0) pos + 1 else 1
    }
    val progressTarget = if (total > 0) state.completedInChapter().toFloat() / total else 0f
    val progressFrac by animateFloatAsState(
        targetValue = progressTarget,
        animationSpec = tween(durationMillis = 500),
        label = "practice-progress",
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Neutral50.copy(alpha = 0.97f))
            .padding(horizontal = 0.dp, vertical = 10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                buildAnnotatedString {
                    append("$position")
                    withStyle(SpanStyle(color = Neutral400, fontWeight = FontWeight.Medium)) {
                        append("/$positionTotal")
                    }
                },
                fontWeight = FontWeight.Bold,
                color = Neutral800,
                fontSize = 12.sp,
            )
            LinearProgressIndicator(
                progress = { progressFrac },
                modifier = Modifier
                    .weight(1f)
                    .widthIn(max = 160.dp)
                    .height(6.dp)
                    .clip(RoundedCornerShape(999.dp)),
                color = Emerald500,
                trackColor = Neutral200,
            )
            Text(
                "${state.progressPct}% done",
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                color = Neutral500,
            )
        }
        Row(
            modifier = Modifier
                .padding(top = 10.dp)
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PracticeFilterChip("All", listFilter == "all") { onFilter("all") }
            PracticeFilterChip("Wrong", listFilter == "wrong") { onFilter("wrong") }
            PracticeFilterChip(
                label = "Flagged",
                active = listFilter == "flagged",
                leading = {
                    Icon(
                        Icons.Default.OutlinedFlag,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                    )
                },
            ) { onFilter("flagged") }
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .height(16.dp)
                    .background(Neutral200),
            )
            Text(
                "Exam mode",
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White)
                    .border(1.dp, Neutral200, RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Neutral600,
            )
        }
        HorizontalDivider(
            modifier = Modifier.padding(top = 10.dp),
            color = Neutral200.copy(alpha = 0.85f),
        )
    }
}

@Composable
private fun PracticeFilterChip(
    label: String,
    active: Boolean,
    leading: (@Composable () -> Unit)? = null,
    onClick: () -> Unit,
) {
    val bg = if (active) Neutral900 else Color.White
    val fg = if (active) Color.White else Neutral600
    val borderColor = if (active) Neutral900 else Neutral200
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (leading != null) {
            Box(modifier = Modifier.size(12.dp)) { leading() }
        }
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = fg)
    }
}

@Composable
private fun MobileScoreChips(state: PracticeUiState) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        MiniStatChip("Correct ${state.correctInChapter()}", EmeraldSoft, EmeraldBorder, EmeraldText, Icons.Default.CheckCircle)
        MiniStatChip("Wrong ${state.wrongInChapter}", RoseSoft, RoseBorder, RoseText, Icons.Default.Warning)
        MiniStatChip(
            "Left ${state.pendingInChapter}",
            Neutral50,
            Neutral200,
            Neutral600,
            Icons.Default.RadioButtonUnchecked,
        )
    }
}

@Composable
private fun MiniStatChip(
    label: String,
    bg: Color,
    border: Color,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}

@Composable
private fun MobilePracticeBottomBar(
    state: PracticeUiState,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onOpenMap: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White.copy(alpha = 0.97f),
        shadowElevation = 0.dp,
        tonalElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, Neutral200),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.navigationBars)
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .border(1.dp, Neutral200, RoundedCornerShape(16.dp))
                    .clickable(enabled = state.index > 0, onClick = onPrev),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                    contentDescription = "Previous",
                    tint = Neutral800,
                    modifier = Modifier.size(20.dp),
                )
            }
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Neutral50)
                    .border(1.dp, Neutral200, RoundedCornerShape(16.dp))
                    .clickable(onClick = onOpenMap)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                QuestionMapDotStrip(state = state, modifier = Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        "${state.index + 1}/${state.questions.size}",
                        fontWeight = FontWeight.Bold,
                        color = Neutral900,
                        fontSize = 12.sp,
                        lineHeight = 14.sp,
                    )
                    Text("Map", color = Neutral500, fontSize = 10.sp)
                }
                Icon(
                    Icons.Default.ExpandLess,
                    contentDescription = null,
                    tint = Neutral400,
                    modifier = Modifier.size(16.dp),
                )
            }
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Emerald600)
                    .clickable(
                        enabled = if (state.revealed) true else state.selected != null,
                        onClick = onNext,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = "Next",
                    tint = Color.White,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
}

@Composable
private fun QuestionMapDotStrip(state: PracticeUiState, modifier: Modifier = Modifier) {
    val start = (state.index - 4).coerceAtLeast(0)
    val end = min(state.questions.size, start + 9)
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        for (i in start until end) {
            val id = state.questions.getOrNull(i)?.id
            val cur = i == state.index
            val ok = id != null && id in state.correctIds
            val bad = id != null && id in state.completedIds && !ok
            QuestionMapDot(current = cur, correct = ok, wrong = bad)
        }
    }
}

@Composable
private fun QuestionMapDot(current: Boolean, correct: Boolean, wrong: Boolean) {
    val animatedW by androidx.compose.animation.core.animateDpAsState(
        targetValue = if (current) 16.dp else 6.dp,
        animationSpec = tween(200),
        label = "mapDotW",
    )
    val color = when {
        current -> Emerald500
        correct -> Color(0xFF34D399)
        wrong -> Color(0xFFFB7185)
        else -> Neutral300
    }
    Box(
        modifier = Modifier
            .width(animatedW)
            .height(6.dp)
            .clip(RoundedCornerShape(999.dp))
            .background(color),
    )
}

@Composable
private fun ChapterNavSheet(
    state: PracticeUiState,
    listFilter: String,
    onClose: () -> Unit,
    onJump: (Int) -> Unit,
    onJumpOpen: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(520.dp)
            .clip(RoundedCornerShape(topStart = Tw.Radius.r3xl, topEnd = Tw.Radius.r3xl))
            .background(Color.White)
            .border(1.dp, Neutral200, RoundedCornerShape(topStart = Tw.Radius.r3xl, topEnd = Tw.Radius.r3xl))
            .windowInsetsPadding(WindowInsets.navigationBars),
    ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp, bottom = 4.dp),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(4.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Neutral200),
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Question map", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Neutral900)
                    Text(
                        "${state.questions.size}${if (state.hasMore) "+" else ""} loaded · tap to jump",
                        fontSize = 12.sp,
                        color = Neutral500,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
                IconButton(onClick = onClose) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Neutral600)
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 12.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Neutral50)
                    .border(1.dp, Neutral200, RoundedCornerShape(16.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    ProgressRing(pct = state.progressPct, sizeDp = 46f, strokeDp = 4.5f)
                    Text(
                        "${state.progressPct}%",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Neutral800,
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        buildAnnotatedString {
                            append("${state.completedInChapter()}")
                            withStyle(SpanStyle(color = Neutral400, fontWeight = FontWeight.Medium)) {
                                append("/${if (state.totalCount > 0) state.totalCount else state.questions.size}")
                            }
                            append(" done")
                        },
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Neutral900,
                    )
                    Text(
                        "${state.accuracyPct}% accuracy · ${state.points} pts",
                        fontSize = 12.sp,
                        color = Neutral500,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                LegendDot(Color(0xFF10B981), "Correct: ${state.correctInChapter()}")
                LegendDot(Color(0xFFF43F5E), "Wrong: ${state.wrongInChapter}")
                LegendDot(Neutral300, "Pending: ${state.pendingInChapter}")
            }
            HorizontalDivider(color = Neutral100)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 16.dp),
            ) {
                ChapterQuestionMapGrid(
                    state = state,
                    listFilter = listFilter,
                    onJump = onJump,
                )
                if (state.firstPendingIndex >= 0) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "First unattempted: Q${state.firstPendingIndex + 1}",
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFFFFBEB))
                            .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(12.dp))
                            .clickable(onClick = onJumpOpen)
                            .padding(12.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF92400E),
                    )
                }
            }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color),
        )
        Text(label, fontSize = 11.sp, color = Neutral500, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun ProgressRing(pct: Int, sizeDp: Float, strokeDp: Float) {
    val pctF by animateFloatAsState(
        targetValue = pct.coerceIn(0, 100) / 100f,
        animationSpec = tween(durationMillis = 500),
        label = "progress-ring",
    )
    Canvas(modifier = Modifier.size(sizeDp.dp)) {
        val stroke = strokeDp.dp.toPx()
        val radius = (size.minDimension - stroke) / 2f
        val topLeft = Offset((size.width - radius * 2) / 2f, (size.height - radius * 2) / 2f)
        val arcSize = Size(radius * 2, radius * 2)
        drawArc(
            color = Neutral100,
            startAngle = 0f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = stroke),
        )
        drawArc(
            color = Emerald500,
            startAngle = -90f,
            sweepAngle = 360f * pctF,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = stroke, cap = StrokeCap.Round),
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChapterQuestionMapGrid(
    state: PracticeUiState,
    listFilter: String,
    onJump: (Int) -> Unit,
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        maxItemsInEachRow = 8,
    ) {
        state.questions.forEachIndexed { i, question ->
            val id = question.id
            val ok = id in state.correctIds
            val bad = id in state.completedIds && !ok
            if (listFilter == "wrong" && !bad) return@forEachIndexed
            if (listFilter == "flagged") return@forEachIndexed
            val cur = i == state.index
            val (bg, borderColor, textColor) = when {
                cur -> Triple(Emerald600, Emerald500, Color.White)
                ok -> Triple(EmeraldSoft, Color(0xFF6EE7B7), EmeraldText)
                bad -> Triple(RoseSoft, Color(0xFFFDA4AF), RoseText)
                else -> Triple(Color.White, Neutral200, Neutral600)
            }
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(bg)
                    .border(
                        width = if (cur) 2.dp else 1.dp,
                        color = borderColor,
                        shape = RoundedCornerShape(12.dp),
                    )
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
    val completed = question.id in state.completedIds
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(1.dp, RoundedCornerShape(24.dp), clip = false)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .border(1.dp, Neutral200, RoundedCornerShape(24.dp)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Neutral50)
                .padding(horizontal = 16.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Neutral900),
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
                        color = Neutral500,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    DifficultyDots(question.difficulty)
                }
            }
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                question.year?.takeIf { it.isNotBlank() }?.let { year -> YearBadge(year) }
                StatusBadge(done = completed)
            }
        }
        HorizontalDivider(color = Neutral200)

        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            HtmlText(html = question.question, modifier = Modifier.fillMaxWidth())

            val correctLetter = question.correct_option?.trim()?.uppercase()?.take(1)
            // QuestionCard embedded options: opacity 0, y 6 → 0, delay index*40ms, 200ms
            question.options().forEachIndexed { optIndex, (letter, text) ->
                OptionRow(
                    letter = letter,
                    text = text,
                    selected = state.selected.equals(letter, ignoreCase = true),
                    revealed = state.revealed,
                    isCorrectOpt = letter.equals(correctLetter, ignoreCase = true),
                    enabled = !state.revealed,
                    enterDelayMillis = optIndex * 40,
                    onSelect = { onSelect(letter) },
                )
            }

            AnimatedVisibility(
                visible = state.revealed && state.lastCorrect != null,
                enter = fadeIn(animationSpec = tween(200)) +
                    scaleIn(initialScale = 0.9f, animationSpec = tween(200)),
                exit = fadeOut(animationSpec = tween(120)) +
                    scaleOut(targetScale = 0.9f, animationSpec = tween(120)),
            ) {
                FeedbackBanner(
                    correct = state.lastCorrect == true,
                    correctOption = correctLetter,
                )
            }

            AnimatedVisibility(
                visible = state.revealed,
                enter = fadeIn(animationSpec = tween(200)) + expandVertically(animationSpec = tween(200)),
                exit = fadeOut(animationSpec = tween(120)),
            ) {
                OutlinedButton(
                    onClick = onToggleSolution,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SolutionBorder),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = SolutionBg),
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
                        fontSize = 14.sp,
                    )
                }
            }

            AnimatedVisibility(
                visible = state.revealed && state.showSolution,
                enter = fadeIn(animationSpec = tween(200)) +
                    expandVertically(animationSpec = tween(200)) +
                    scaleIn(initialScale = 0.96f, animationSpec = tween(200)),
                exit = fadeOut(animationSpec = tween(120)),
            ) {
                SolutionPanel(question = question, correctLetter = correctLetter)
            }
        }
    }
}

@Composable
private fun OptionRow(
    letter: String,
    text: String,
    selected: Boolean,
    revealed: Boolean,
    isCorrectOpt: Boolean,
    enabled: Boolean,
    enterDelayMillis: Int = 0,
    onSelect: () -> Unit,
) {
    var armed by remember { mutableStateOf(false) }
    LaunchedEffect(letter) {
        armed = false
        if (enterDelayMillis > 0) kotlinx.coroutines.delay(enterDelayMillis.toLong())
        armed = true
    }
    val alpha by animateFloatAsState(
        targetValue = if (armed) 1f else 0f,
        animationSpec = tween(durationMillis = 200),
        label = "optAlpha",
    )
    val offsetY by androidx.compose.animation.core.animateDpAsState(
        targetValue = if (armed) 0.dp else 6.dp,
        animationSpec = tween(durationMillis = 200),
        label = "optY",
    )
    val borderWidth = when {
        revealed && (isCorrectOpt || (selected && !isCorrectOpt)) -> 2.dp
        selected && !revealed -> 2.dp
        else -> 1.dp
    }
    val borderColor = when {
        revealed && isCorrectOpt -> CorrectBorder
        revealed && selected && !isCorrectOpt -> WrongBorder
        selected && !revealed -> Neutral900
        else -> Neutral200
    }
    val bg = when {
        revealed && isCorrectOpt -> CorrectBg
        revealed && selected && !isCorrectOpt -> WrongBg
        selected && !revealed -> Neutral100
        else -> Color.White
    }
    val letterBg = when {
        selected && !revealed -> Neutral900
        revealed && isCorrectOpt -> Emerald600
        revealed && selected && !isCorrectOpt -> WrongRed
        else -> Neutral100
    }
    val letterFg = when {
        (selected && !revealed) || (revealed && (isCorrectOpt || selected)) -> Color.White
        else -> Neutral600
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(alpha)
            .offset(y = offsetY)
            .clip(RoundedCornerShape(Tw.Radius.xl))
            .background(bg)
            .border(borderWidth, borderColor, RoundedCornerShape(Tw.Radius.xl))
            .clickable(enabled = enabled, onClick = onSelect)
            .padding(horizontal = Tw.Space.s3_5, vertical = Tw.Space.s3_5),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(Tw.Space.s3),
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(letterBg)
                .border(1.dp, if (letterBg == Neutral100) Neutral200 else letterBg, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(letter, fontWeight = FontWeight.Bold, color = letterFg, fontSize = 12.sp)
        }
        HtmlText(
            html = text,
            modifier = Modifier.weight(1f),
            textSizeSp = 14f,
        )
        if (revealed && isCorrectOpt) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = CorrectGreen, modifier = Modifier.size(18.dp))
        } else if (revealed && selected && !isCorrectOpt) {
            Icon(Icons.Default.Warning, contentDescription = null, tint = WrongRed, modifier = Modifier.size(18.dp))
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
                    .background(if (i <= level) active else Neutral200),
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
            .border(1.dp, Neutral200, RoundedCornerShape(8.dp))
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
    val border = if (correct) Color(0xFFBBF7D0) else Color(0xFFFECACA)
    val titleColor = if (correct) Color(0xFF166534) else Color(0xFF991B1B)
    val bodyColor = if (correct) Color(0xFF15803D) else Color(0xFFB91C1C)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(12.dp))
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
            .clip(RoundedCornerShape(12.dp))
            .background(SolutionBg.copy(alpha = 0.8f))
            .border(1.dp, SolutionBorder, RoundedCornerShape(12.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.AutoMirrored.Filled.MenuBook,
                contentDescription = null,
                tint = SolutionIndigo,
                modifier = Modifier.size(14.dp),
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text("Solution", fontWeight = FontWeight.Bold, color = SolutionIndigo, fontSize = 14.sp)
        }
        if (!correctLetter.isNullOrBlank()) {
            Text(
                "Correct Answer: $correctLetter",
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.White.copy(alpha = 0.8f))
                    .padding(10.dp),
                fontWeight = FontWeight.SemiBold,
                color = SolutionIndigo,
                fontSize = 14.sp,
            )
        }
        val body = question.solutiontext?.takeIf { it.isNotBlank() }
            ?: question.solution?.takeIf { it.isNotBlank() }
        if (body != null) {
            HtmlText(html = body, modifier = Modifier.fillMaxWidth(), textSizeSp = 14f)
        } else {
            Text("No written solution yet.", color = Neutral500, fontSize = 14.sp)
        }
    }
}