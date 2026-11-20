package com.tentracker.nativeapp.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.SubjectGroup
import com.tentracker.nativeapp.data.Subtopic
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel
import kotlinx.coroutines.launch

private val Emerald = Color(0xFF059669)
private val Emerald500 = Color(0xFF10B981)
private val EmeraldSoft = Color(0xFFECFDF5)
private val EmeraldInk = Color(0xFF065F46)
private val EmeraldBorder = Color(0xFFD1FAE5)
private val Emerald700 = Color(0xFF047857)
private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral100 = Color(0xFFF5F5F5)
private val Neutral200 = Color(0xFFE5E5E5)
private val Neutral300 = Color(0xFFD4D4D4)
private val Neutral400 = Color(0xFFA3A3A3)
private val Neutral600 = Color(0xFF525252)
private val Neutral800 = Color(0xFF262626)
private val Neutral900 = Color(0xFF171717)

private val PracticeScrollKey = "practice-content"

private data class WorkflowStep(val icon: ImageVector, val text: String)

private val WorkflowSteps = listOf(
    WorkflowStep(Icons.Default.MenuBook, "Pick a subject and practice MCQs topic-wise."),
    WorkflowStep(Icons.Default.CalendarMonth, "Use daily practice sets for quick revision."),
    WorkflowStep(Icons.Default.Assignment, "Take full mock tests when you are exam-ready."),
)

private data class PathCardSpec(
    val id: String,
    val title: String,
    val description: String,
    val badge: String,
    val live: Boolean,
    val icon: ImageVector,
    val onClick: (() -> Unit)?,
)

@Suppress("UNUSED_PARAMETER")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamDetailScreen(
    title: String,
    category: String,
    vm: ExamDetailViewModel,
    onBack: () -> Unit,
    onOpenChapter: (subject: String, chapter: String, chapterTitle: String) -> Unit,
    onOpenMocks: () -> Unit = {},
    onStartMock: (testId: String, name: String, durationMinutes: Int) -> Unit = { _, _, _ -> },
) {
    val state by vm.state.collectAsState()
    var searchQuery by rememberSaveable { mutableStateOf("") }
    val filteredSubjects = remember(state.subjects, searchQuery) {
        filterSubjects(state.subjects, searchQuery)
    }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val showFab by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 1 }
    }

    fun scrollToPractice() {
        scope.launch {
            val idx = listState.layoutInfo.visibleItemsInfo
                .firstOrNull { it.key == PracticeScrollKey }
                ?.index
            if (idx != null) {
                listState.animateScrollToItem(idx)
            } else {
                listState.animateScrollToItem(3)
            }
        }
    }

    fun quickStart() {
        val first = filteredSubjects.firstOrNull()?.subtopics?.firstOrNull()
        if (first != null) {
            val group = filteredSubjects.first()
            onOpenChapter(group.subject, first.chapterSlug, first.title.replace('-', ' '))
        } else {
            scrollToPractice()
        }
    }

    val pathCards = remember(state.mockTestCount) {
        buildPathCards(
            mockTestCount = state.mockTestCount,
            onScrollPractice = { scrollToPractice() },
            onOpenMocks = onOpenMocks,
        )
    }

    Scaffold(
        containerColor = Neutral50,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Neutral50),
            )
        },
        floatingActionButton = {
            AnimatedVisibility(visible = showFab && state.subjects.isNotEmpty()) {
                ExamHubFab(
                    onBackToTop = { scope.launch { listState.animateScrollToItem(0) } },
                    onQuickStart = ::quickStart,
                )
            }
        },
    ) { padding ->
        when {
            state.loading && state.subjects.isEmpty() && state.exam == null -> {
                LoadingState(
                    modifier = Modifier.padding(padding),
                    message = "Loading exam hub…",
                )
            }
            state.error != null && state.subjects.isEmpty() && state.exam == null -> {
                ErrorState(
                    message = state.error ?: "Could not load exam",
                    modifier = Modifier.padding(padding),
                    onRetry = { vm.refresh() },
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    state = listState,
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                ) {
                    item(key = "hero") {
                        ExamHubHeroCard(
                            title = title,
                            exam = state.exam,
                            subjects = state.subjects,
                            mockTestCount = state.mockTestCount,
                            onScrollToPractice = ::scrollToPractice,
                            onOpenMocks = onOpenMocks,
                            onBrowseExams = onBack,
                        )
                    }

                    item(key = "workflow") {
                        ExamHubWorkflowCard()
                    }

                    item(key = "paths") {
                        ExamHubPathCards(cards = pathCards)
                    }

                    if (state.subjects.isEmpty()) {
                        item(key = PracticeScrollKey) {
                            EmptyPracticeContent(onBrowseExams = onBack)
                        }
                    } else {
                        item(key = PracticeScrollKey) {
                            PracticeSectionHeader(
                                filteredCount = filteredSubjects.size,
                                totalCount = state.subjects.size,
                            )
                        }
                        item(key = "search") {
                            SubjectSearchBar(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                            )
                        }

                        if (filteredSubjects.isEmpty()) {
                            item(key = "no-matches") {
                                NoSearchMatches(onClear = { searchQuery = "" })
                            }
                        } else {
                            items(filteredSubjects, key = { it.subject }) { group ->
                                HubSubjectCard(
                                    group = group,
                                    onOpenChapter = onOpenChapter,
                                )
                            }
                        }
                    }

                    item(key = "bottom-cta") {
                        ExamHubBottomCta(isSignedIn = state.isSignedIn)
                    }

                    item { Spacer(modifier = Modifier.height(72.dp)) }
                }
            }
        }
    }
}

@Composable
private fun ExamHubHeroCard(
    title: String,
    exam: ActiveExam?,
    subjects: List<SubjectGroup>,
    mockTestCount: Int,
    onScrollToPractice: () -> Unit,
    onOpenMocks: () -> Unit,
    onBrowseExams: () -> Unit,
) {
    val stats = hubAggregateStats(subjects)
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Neutral200),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 48.dp, y = (-48).dp)
                    .size(160.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFA7F3D0).copy(alpha = 0.35f)),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = (-48).dp, y = 64.dp)
                    .size(140.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFBAE6FD).copy(alpha = 0.2f)),
            )
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White,
                                Color.White,
                                EmeraldSoft.copy(alpha = 0.2f),
                            ),
                        ),
                    ),
            )
            Column(modifier = Modifier.padding(20.dp)) {
                HubPill(text = "${exam?.category?.takeIf { it.isNotBlank() } ?: "Exam"} · Practice hub")
                Spacer(modifier = Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ExamHubThumb(exam = exam, fallbackTitle = title)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        exam?.name?.takeIf { it.isNotBlank() } ?: title,
                        fontWeight = FontWeight.Bold,
                        color = Neutral900,
                        fontSize = 24.sp,
                        lineHeight = 28.sp,
                        letterSpacing = (-0.25).sp,
                        modifier = Modifier.weight(1f),
                    )
                }
                exam?.description?.takeIf { it.isNotBlank() }?.let { desc ->
                    Text(
                        desc,
                        fontSize = 14.sp,
                        color = Neutral600,
                        lineHeight = 20.sp,
                        modifier = Modifier.padding(top = 12.dp),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Neutral900)
                            .clickable(onClick = onScrollToPractice)
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.MenuBook, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Start practicing", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                    if (mockTestCount > 0) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White)
                                .border(1.dp, Neutral200, RoundedCornerShape(12.dp))
                                .clickable(onClick = onOpenMocks)
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Default.Assignment, contentDescription = null, tint = Neutral800, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Mock tests", color = Neutral800, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        }
                    }
                }
                Row(
                    modifier = Modifier
                        .padding(top = 8.dp)
                        .clickable(onClick = onBrowseExams),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Browse all exams", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Neutral400)
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = Neutral400,
                        modifier = Modifier.size(12.dp),
                    )
                }
                Spacer(modifier = Modifier.height(20.dp))
                androidx.compose.material3.HorizontalDivider(color = Neutral100)
                Spacer(modifier = Modifier.height(20.dp))
                QuickStatsGrid(
                    subjects = stats.subjects,
                    topics = stats.topics,
                    questions = stats.questions,
                )
            }
        }
    }
}

@Composable
private fun ExamHubWorkflowCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Neutral200),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            EmeraldSoft.copy(alpha = 0.5f),
                            Color.White,
                            Color.White,
                        ),
                    ),
                )
                .padding(20.dp),
        ) {
            Text("How to use this hub", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Neutral900)
            Text(
                "A simple workflow for exam prep",
                fontSize = 12.sp,
                color = Neutral400,
                modifier = Modifier.padding(top = 2.dp, bottom = 16.dp),
            )
            WorkflowSteps.forEachIndexed { index, step ->
                Row(
                    modifier = Modifier.padding(bottom = if (index < WorkflowSteps.lastIndex) 12.dp else 0.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .border(1.dp, EmeraldBorder, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(step.icon, contentDescription = null, tint = Emerald700, modifier = Modifier.size(14.dp))
                    }
                    Text(
                        step.text,
                        fontSize = 14.sp,
                        color = Neutral600,
                        lineHeight = 20.sp,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.8f))
                    .border(1.dp, EmeraldBorder.copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                text = androidx.compose.ui.text.buildAnnotatedString {
                    pushStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.SemiBold, color = Neutral800))
                    append("Tip: ")
                    pop()
                    append("Use search below to jump to any subject or topic.")
                },
                fontSize = 12.sp,
                color = Neutral600,
                lineHeight = 18.sp,
            )
        }
    }
}

@Composable
private fun ExamHubPathCards(cards: List<PathCardSpec>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        cards.forEach { card ->
            PathCardRow(card = card)
        }
    }
}

@Composable
private fun PathCardRow(card: PathCardSpec) {
    val shape = RoundedCornerShape(24.dp)
    val bg = if (card.live) Color.White else Neutral50.copy(alpha = 0.9f)
    val borderColor = if (card.live) Neutral200 else Neutral200.copy(alpha = 0.9f)
    val clickMod = if (card.onClick != null) {
        Modifier.clickable(onClick = card.onClick)
    } else {
        Modifier
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp)
            .clip(shape)
            .background(bg)
            .border(1.dp, borderColor, shape)
            .then(clickMod)
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(if (card.live) EmeraldSoft else Neutral100)
                .border(1.dp, if (card.live) EmeraldBorder else Neutral200, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                card.icon,
                contentDescription = null,
                tint = if (card.live) Emerald700 else Neutral400,
                modifier = Modifier.size(20.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(card.title, fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 14.sp)
                Text(
                    card.badge,
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(if (card.live) EmeraldSoft else Neutral100)
                        .border(1.dp, if (card.live) EmeraldBorder else Neutral200, RoundedCornerShape(999.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (card.live) EmeraldInk else Neutral400,
                )
            }
            Text(
                card.description,
                fontSize = 12.sp,
                color = Neutral400,
                lineHeight = 18.sp,
                modifier = Modifier.padding(top = 6.dp),
            )
            if (card.live) {
                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Open", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Emerald700)
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = Emerald700,
                        modifier = Modifier.size(14.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyPracticeContent(onBrowseExams: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .border(1.dp, Neutral200, RoundedCornerShape(24.dp))
            .padding(vertical = 64.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Default.MenuBook, contentDescription = null, tint = Neutral300, modifier = Modifier.size(40.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("No practice content yet", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Neutral900)
        Text(
            "Questions for this exam are being added. Browse other active exams in the catalog.",
            fontSize = 14.sp,
            color = Neutral400,
            lineHeight = 20.sp,
            modifier = Modifier.padding(top = 8.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        Row(
            modifier = Modifier
                .padding(top = 24.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Neutral900)
                .clickable(onClick = onBrowseExams)
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Browse exams", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun ExamHubBottomCta(isSignedIn: Boolean) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Neutral900)
            .border(1.dp, Neutral900.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
            .padding(32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 40.dp, y = (-40).dp)
                .size(160.dp)
                .clip(CircleShape)
                .background(Emerald500.copy(alpha = 0.1f)),
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (isSignedIn) {
                Text(
                    "Track everything on your dashboard",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                Text(
                    "Streaks, mock rankings, and cross-exam progress live on your home page.",
                    fontSize = 14.sp,
                    color = Color(0xFFD4D4D4),
                    modifier = Modifier.padding(top = 8.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
            } else {
                Text(
                    "Save progress across devices",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                Text(
                    "Sign in to sync completed questions, streaks, and mock test history.",
                    fontSize = 14.sp,
                    color = Color(0xFFD4D4D4),
                    modifier = Modifier.padding(top = 8.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun ExamHubFab(onBackToTop: () -> Unit, onQuickStart: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        SmallFloatingActionButton(
            onClick = onBackToTop,
            containerColor = Color.White,
            elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 4.dp),
            shape = CircleShape,
        ) {
            Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Back to top", tint = Neutral600, modifier = Modifier.size(20.dp))
        }
        FloatingActionButton(
            onClick = onQuickStart,
            containerColor = Emerald,
            elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 6.dp),
            shape = CircleShape,
            modifier = Modifier.size(56.dp),
        ) {
            Icon(Icons.Default.Bolt, contentDescription = "Quick start practice", tint = Color.White, modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
private fun HubPill(text: String) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(EmeraldSoft.copy(alpha = 0.92f))
            .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald, modifier = Modifier.size(14.dp))
        Text(text, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = EmeraldInk)
    }
}

@Composable
private fun ExamHubThumb(exam: ActiveExam?, fallbackTitle: String) {
    val shape = RoundedCornerShape(16.dp)
    Box(
        modifier = Modifier
            .size(56.dp)
            .clip(shape)
            .then(
                if (!exam?.image.isNullOrBlank()) {
                    Modifier.background(Neutral100).border(1.dp, Neutral200, shape)
                } else {
                    Modifier.background(EmeraldSoft).border(1.dp, EmeraldBorder, shape)
                },
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (!exam?.image.isNullOrBlank()) {
            AsyncImage(
                model = exam!!.image,
                contentDescription = fallbackTitle,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Text(exam?.icon?.takeIf { it.isNotBlank() } ?: "📚", fontSize = 24.sp)
        }
    }
}

@Composable
private fun QuickStatsGrid(subjects: Int, topics: Int, questions: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        QuickStatTile(modifier = Modifier.weight(1f), value = subjects, label = "Subjects", icon = Icons.Default.MenuBook)
        QuickStatTile(modifier = Modifier.weight(1f), value = topics, label = "Topics", icon = Icons.Default.TrackChanges)
        QuickStatTile(modifier = Modifier.weight(1f), value = questions, label = "Questions", icon = Icons.Default.Bolt)
    }
}

@Composable
private fun QuickStatTile(
    modifier: Modifier = Modifier,
    value: Int,
    label: String,
    icon: ImageVector,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
            .border(1.dp, Neutral200.copy(alpha = 0.8f), RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "%,d".format(value),
                    fontWeight = FontWeight.Bold,
                    color = Neutral900,
                    fontSize = 18.sp,
                    maxLines = 1,
                )
                Text(label, fontSize = 10.sp, fontWeight = FontWeight.Medium, color = Neutral400, modifier = Modifier.padding(top = 2.dp))
            }
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(EmeraldSoft)
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = Emerald700, modifier = Modifier.size(14.dp))
            }
        }
    }
}

@Composable
private fun PracticeSectionHeader(filteredCount: Int, totalCount: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text("Practice topic-wise", fontWeight = FontWeight.Bold, color = Neutral900, fontSize = 20.sp)
            Text(
                "Search subjects and jump into any topic.",
                fontSize = 12.sp,
                color = Neutral400,
                modifier = Modifier.padding(top = 2.dp),
            )
        }
        Text(
            text = if (filteredCount != totalCount) "$filteredCount of $totalCount subjects" else "$totalCount subject${if (totalCount == 1) "" else "s"}",
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(Color.White)
                .border(1.dp, Neutral200, RoundedCornerShape(999.dp))
                .padding(horizontal = 12.dp, vertical = 4.dp),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = Neutral600,
        )
    }
}

@Composable
private fun SubjectSearchBar(value: String, onValueChange: (String) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.95f))
            .border(1.dp, Neutral200, RoundedCornerShape(16.dp))
            .padding(12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Neutral50)
                .border(1.dp, Neutral200, RoundedCornerShape(12.dp))
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.Search, contentDescription = null, tint = Neutral400, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                singleLine = true,
                textStyle = TextStyle(fontSize = 14.sp, color = Neutral900),
                cursorBrush = SolidColor(Emerald),
                decorationBox = { inner ->
                    Box {
                        if (value.isEmpty()) {
                            Text("Search subjects or topics…", fontSize = 14.sp, color = Neutral400)
                        }
                        inner()
                    }
                },
            )
            if (value.isNotEmpty()) {
                IconButton(onClick = { onValueChange("") }, modifier = Modifier.size(24.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Clear search", tint = Neutral400, modifier = Modifier.size(14.dp))
                }
            }
        }
    }
}

@Composable
private fun NoSearchMatches(onClear: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White)
            .border(1.dp, Neutral200, RoundedCornerShape(24.dp))
            .padding(vertical = 48.dp, horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Default.Search, contentDescription = null, tint = Neutral300, modifier = Modifier.size(32.dp))
        Spacer(modifier = Modifier.height(12.dp))
        Text("No subjects match your search", fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 14.sp)
        Text(
            "Clear search",
            modifier = Modifier
                .padding(top = 16.dp)
                .clip(RoundedCornerShape(12.dp))
                .border(1.dp, Neutral200, RoundedCornerShape(12.dp))
                .clickable(onClick = onClear)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Neutral900,
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun HubSubjectCard(
    group: SubjectGroup,
    onOpenChapter: (subject: String, chapter: String, chapterTitle: String) -> Unit,
) {
    var expanded by rememberSaveable(group.subject) { mutableStateOf(false) }
    val rotation by animateFloatAsState(if (expanded) 180f else 0f, label = "chevron")
    val subjectTitle = displaySubjectName(group.subject)
    val topicsCount = group.subtopics.size
    val questionsCount = group.subtopics.sumOf { it.count }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Neutral200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Box(
                    modifier = Modifier
                        .padding(top = 2.dp)
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Neutral100)
                        .clickable { expanded = !expanded },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Default.KeyboardArrowDown,
                        contentDescription = if (expanded) "Collapse" else "Expand",
                        tint = Neutral600,
                        modifier = Modifier
                            .size(14.dp)
                            .rotate(rotation),
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(subjectTitle, fontWeight = FontWeight.SemiBold, color = Neutral900, fontSize = 14.sp)
                    Row(
                        modifier = Modifier.padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        MetaCount(icon = Icons.Default.TrackChanges, label = "$topicsCount topics")
                        MetaCount(icon = Icons.Default.Bolt, label = "${formatCount(questionsCount)} Qs")
                    }
                }
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Neutral900)
                        .clickable {
                            val first = group.subtopics.firstOrNull()
                            if (first != null) {
                                onOpenChapter(group.subject, first.chapterSlug, first.title.replace('-', ' '))
                            } else {
                                expanded = true
                            }
                        }
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text("Open", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(12.dp),
                    )
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut(),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Neutral50.copy(alpha = 0.6f))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                ) {
                    if (group.subtopics.isEmpty()) {
                        Text("No chapters yet", color = Neutral400, fontSize = 13.sp)
                    } else {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            group.subtopics.forEach { topic ->
                                TopicChip(
                                    topic = topic,
                                    onClick = {
                                        onOpenChapter(
                                            group.subject,
                                            topic.chapterSlug,
                                            topic.title.replace('-', ' '),
                                        )
                                    },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetaCount(icon: ImageVector, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, contentDescription = null, tint = Neutral400, modifier = Modifier.size(12.dp))
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Neutral400)
    }
}

@Composable
private fun TopicChip(topic: Subtopic, onClick: () -> Unit) {
    val title = topic.title.replace('-', ' ').replaceFirstChar { it.uppercase() }
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
            .border(1.dp, Neutral200, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Neutral400, modifier = Modifier.size(12.dp))
        Text(title, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Neutral600, maxLines = 2)
        Text(
            "${topic.count}",
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(Neutral100)
                .padding(horizontal = 6.dp, vertical = 2.dp),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = Neutral600,
        )
    }
}

private fun buildPathCards(
    mockTestCount: Int,
    onScrollPractice: () -> Unit,
    onOpenMocks: () -> Unit,
): List<PathCardSpec> {
    val mockBadge = when {
        mockTestCount > 0 -> "$mockTestCount live"
        else -> "Coming soon"
    }
    return listOf(
        PathCardSpec(
            id = "practice",
            title = "Practice MCQs",
            description = "Topic-wise PYQs with solutions and progress tracking.",
            badge = "Start here",
            live = true,
            icon = Icons.Default.MenuBook,
            onClick = onScrollPractice,
        ),
        PathCardSpec(
            id = "mock-tests",
            title = "Full mock tests",
            description = "Full-length mocks with scores and leaderboard.",
            badge = mockBadge,
            live = mockTestCount > 0,
            icon = Icons.Default.Assignment,
            onClick = if (mockTestCount > 0) onOpenMocks else null,
        ),
        PathCardSpec(
            id = "daily",
            title = "Daily practice",
            description = "Short daily MCQ sets with explanations — no timer.",
            badge = "Explore",
            live = true,
            icon = Icons.Default.CalendarMonth,
            onClick = onScrollPractice,
        ),
        PathCardSpec(
            id = "topic-tests",
            title = "Topic-wise tests",
            description = "Timed mini-tests for weak areas.",
            badge = "Browse",
            live = true,
            icon = Icons.Default.GridView,
            onClick = onOpenMocks,
        ),
    )
}

private data class HubStats(val subjects: Int, val topics: Int, val questions: Int)

private fun hubAggregateStats(subjects: List<SubjectGroup>): HubStats {
    val topics = subjects.sumOf { it.subtopics.size }
    val questions = subjects.sumOf { group -> group.subtopics.sumOf { it.count } }
    return HubStats(subjects = subjects.size, topics = topics, questions = questions)
}

private fun filterSubjects(subjects: List<SubjectGroup>, query: String): List<SubjectGroup> {
    val q = query.trim().lowercase()
    if (q.isEmpty()) return subjects
    return subjects.mapNotNull { group ->
        val subjectHit = group.subject.lowercase().contains(q) ||
            displaySubjectName(group.subject).lowercase().contains(q)
        val matching = group.subtopics.filter {
            it.title.lowercase().contains(q) || it.title.replace('-', ' ').lowercase().contains(q)
        }
        when {
            subjectHit -> group
            matching.isNotEmpty() -> group.copy(subtopics = matching)
            else -> null
        }
    }
}

private fun displaySubjectName(raw: String): String =
    raw.replace('-', ' ').replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }

private fun formatCount(n: Int): String =
    when {
        n >= 1_000_000 -> String.format("%.1fM", n / 1_000_000.0)
        n >= 1_000 -> String.format("%,d", n)
        else -> n.toString()
    }