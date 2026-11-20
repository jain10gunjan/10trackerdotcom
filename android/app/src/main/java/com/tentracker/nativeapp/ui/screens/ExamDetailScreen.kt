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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.MockOfDayMock
import com.tentracker.nativeapp.data.SubjectGroup
import com.tentracker.nativeapp.data.Subtopic
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel

private val Emerald = Color(0xFF059669)
private val EmeraldSoft = Color(0xFFECFDF5)
private val EmeraldInk = Color(0xFF065F46)
private val EmeraldBorder = Color(0xFFD1FAE5)
private val BrandNavy = Color(0xFF1E2F6B)
private val Neutral50 = Color(0xFFFAFAFA)

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

    Scaffold(
        containerColor = Bg,
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Bg),
            )
        },
    ) { padding ->
        when {
            state.loading && state.subjects.isEmpty() && state.mock == null -> {
                LoadingState(
                    modifier = Modifier.padding(padding),
                    message = "Loading exam hub…",
                )
            }
            state.error != null && state.subjects.isEmpty() && state.mock == null -> {
                ErrorState(
                    message = state.error ?: "Could not load exam",
                    modifier = Modifier.padding(padding),
                    onRetry = { vm.refresh() },
                )
            }
            state.subjects.isEmpty() && state.mock == null -> {
                EmptyState(
                    message = "No practice content yet for this exam.",
                    modifier = Modifier.padding(padding),
                    actionLabel = "Retry",
                    onAction = { vm.refresh() },
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    item {
                        ExamHubHeroCard(
                            title = title,
                            exam = state.exam,
                            subjects = state.subjects,
                            onOpenMocks = onOpenMocks,
                        )
                    }

                    state.mock?.let { mock ->
                        item {
                            MockOfDayCard(
                                mock = mock,
                                onStartMock = onStartMock,
                                onOpenMocks = onOpenMocks,
                            )
                        }
                    }

                    if (state.subjects.isNotEmpty()) {
                        item {
                            PracticeSectionHeader(
                                filteredCount = filteredSubjects.size,
                                totalCount = state.subjects.size,
                            )
                        }
                        item {
                            SubjectSearchCard(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                            )
                        }
                    }

                    if (state.subjects.isNotEmpty() && filteredSubjects.isEmpty()) {
                        item {
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

                    item { Spacer(modifier = Modifier.height(24.dp)) }
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
    onOpenMocks: () -> Unit,
) {
    val stats = hubAggregateStats(subjects)
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            HubPill(text = "${exam?.category?.takeIf { it.isNotBlank() } ?: "Exam"} · Practice hub")
            Spacer(modifier = Modifier.height(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                ExamHubThumb(exam = exam, fallbackTitle = title)
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    exam?.name?.takeIf { it.isNotBlank() } ?: title,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                    fontSize = 22.sp,
                    lineHeight = 26.sp,
                    modifier = Modifier.weight(1f),
                )
            }
            exam?.description?.takeIf { it.isNotBlank() }?.let { desc ->
                Text(
                    desc,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                    modifier = Modifier.padding(top = 10.dp),
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Start practicing",
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Ink)
                        .padding(horizontal = 14.dp, vertical = 11.dp),
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                )
                Text(
                    "Mock tests",
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color.White)
                        .border(1.dp, Border, RoundedCornerShape(14.dp))
                        .clickable(onClick = onOpenMocks)
                        .padding(horizontal = 14.dp, vertical = 11.dp),
                    color = Ink,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                )
            }
            Spacer(modifier = Modifier.height(18.dp))
            androidx.compose.material3.HorizontalDivider(color = Border.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(14.dp))
            QuickStatsGrid(
                subjects = stats.subjects,
                topics = stats.topics,
                questions = stats.questions,
            )
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
            .size(60.dp)
            .clip(shape)
            .background(EmeraldSoft)
            .border(1.dp, EmeraldBorder, shape),
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
            Text(exam?.icon?.takeIf { it.isNotBlank() } ?: "📚", fontSize = 26.sp)
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
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border.copy(alpha = 0.8f), RoundedCornerShape(16.dp))
            .padding(horizontal = 10.dp, vertical = 12.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column {
                Text(
                    "%,d".format(value),
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                    fontSize = 20.sp,
                    maxLines = 1,
                )
                Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Muted)
            }
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(EmeraldSoft)
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = Emerald, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun MockOfDayCard(
    mock: MockOfDayMock,
    onStartMock: (testId: String, name: String, durationMinutes: Int) -> Unit,
    onOpenMocks: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSoft.copy(alpha = 0.95f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Brand.copy(alpha = 0.25f)),
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                "MOCK OF THE DAY",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = BrandNavy,
                letterSpacing = 0.6.sp,
            )
            Text(
                mock.name,
                fontWeight = FontWeight.Bold,
                color = Ink,
                fontSize = 17.sp,
                modifier = Modifier.padding(top = 6.dp),
            )
            Text(
                "${mock.totalQuestions} Qs · ${mock.duration} min · ${mock.difficulty ?: "mixed"}",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 4.dp),
            )
            Row(
                modifier = Modifier.padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(
                    onClick = { onStartMock(mock.id, mock.name, mock.duration) },
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Text("Start native", fontWeight = FontWeight.SemiBold)
                }
                TextButton(onClick = onOpenMocks) {
                    Text("All mocks", color = Brand, fontWeight = FontWeight.SemiBold)
                }
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
            Text(
                "Practice topic-wise",
                fontWeight = FontWeight.Bold,
                color = Ink,
                fontSize = 20.sp,
            )
            Text(
                "Search subjects and jump into any topic.",
                fontSize = 13.sp,
                color = Muted,
                modifier = Modifier.padding(top = 2.dp),
            )
        }
        Text(
            text = if (filteredCount != totalCount) "$filteredCount of $totalCount subjects" else "$totalCount subjects",
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(Color.White)
                .border(1.dp, Border, RoundedCornerShape(999.dp))
                .padding(horizontal = 10.dp, vertical = 6.dp),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = Muted,
        )
    }
}

@Composable
private fun SubjectSearchCard(value: String, onValueChange: (String) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Color.White.copy(alpha = 0.95f))
            .border(1.dp, Border, RoundedCornerShape(18.dp))
            .padding(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Default.Search, contentDescription = null, tint = Muted, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                singleLine = true,
                textStyle = TextStyle(fontSize = 14.sp, color = Ink),
                cursorBrush = SolidColor(Emerald),
                decorationBox = { inner ->
                    Box {
                        if (value.isEmpty()) {
                            Text("Search subjects or topics…", fontSize = 14.sp, color = Muted.copy(alpha = 0.85f))
                        }
                        inner()
                    }
                },
            )
            if (value.isNotEmpty()) {
                IconButton(onClick = { onValueChange("") }, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Clear search", tint = Muted, modifier = Modifier.size(16.dp))
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
            .border(1.dp, Border, RoundedCornerShape(24.dp))
            .padding(vertical = 40.dp, horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Default.Search, contentDescription = null, tint = Muted.copy(alpha = 0.4f), modifier = Modifier.size(32.dp))
        Spacer(modifier = Modifier.height(10.dp))
        Text("No subjects match your search", fontWeight = FontWeight.SemiBold, color = Ink, fontSize = 14.sp)
        Text(
            "Clear search",
            modifier = Modifier
                .padding(top = 14.dp)
                .clip(RoundedCornerShape(14.dp))
                .border(1.dp, Border, RoundedCornerShape(14.dp))
                .clickable(onClick = onClear)
                .padding(horizontal = 16.dp, vertical = 9.dp),
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = Ink,
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
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
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
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Neutral50)
                        .clickable { expanded = !expanded },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Default.KeyboardArrowDown,
                        contentDescription = if (expanded) "Collapse" else "Expand",
                        tint = Muted,
                        modifier = Modifier
                            .size(18.dp)
                            .rotate(rotation),
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(subjectTitle, fontWeight = FontWeight.SemiBold, color = Ink, fontSize = 14.sp)
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
                        .background(Ink)
                        .clickable {
                            val first = group.subtopics.firstOrNull()
                            if (first != null) {
                                onOpenChapter(group.subject, first.chapterSlug, first.title.replace('-', ' '))
                            } else {
                                expanded = true
                            }
                        }
                        .padding(horizontal = 10.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        "Open",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
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
                        .background(Neutral50.copy(alpha = 0.65f))
                        .border(0.dp, Color.Transparent)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                ) {
                    if (group.subtopics.isEmpty()) {
                        Text("No chapters yet", color = Muted, fontSize = 13.sp)
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
private fun MetaCount(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, contentDescription = null, tint = Muted, modifier = Modifier.size(12.dp))
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Muted)
    }
}

@Composable
private fun TopicChip(topic: Subtopic, onClick: () -> Unit) {
    val title = topic.title.replace('-', ' ').replaceFirstChar { it.uppercase() }
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Muted.copy(alpha = 0.7f), modifier = Modifier.size(12.dp))
        Text(title, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Ink, maxLines = 2)
        Text(
            "${topic.count}",
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(Neutral50)
                .padding(horizontal = 6.dp, vertical = 2.dp),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = Muted,
        )
    }
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