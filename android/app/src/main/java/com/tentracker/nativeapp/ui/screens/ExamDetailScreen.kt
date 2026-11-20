package com.tentracker.nativeapp.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.SubjectGroup
import com.tentracker.nativeapp.data.Subtopic
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel

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
    val context = LocalContext.current

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = { Text(title, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
            )
        },
    ) { padding ->
        when {
            state.loading && state.subjects.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator(color = Brand) }
            }
            state.error != null && state.subjects.isEmpty() -> {
                Column(modifier = Modifier.padding(padding).padding(16.dp)) {
                    Text(state.error ?: "Error", color = Muted)
                    TextButton(onClick = { vm.refresh() }) { Text("Retry") }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    state.mock?.let { mock ->
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = BrandSoft),
                                shape = RoundedCornerShape(16.dp),
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Timer, contentDescription = null, tint = Brand)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Mock of the day", fontWeight = FontWeight.Bold, color = Ink)
                                    }
                                    Text(mock.name, fontWeight = FontWeight.SemiBold, color = Ink)
                                    Text(
                                        "${mock.totalQuestions} Qs · ${mock.duration} min · ${mock.difficulty ?: "mixed"}",
                                        style = MaterialTheme.typography.bodyMedium,
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = { onStartMock(mock.id, mock.name, mock.duration) },
                                            colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                            shape = RoundedCornerShape(12.dp),
                                        ) { Text("Start native") }
                                        TextButton(onClick = onOpenMocks) { Text("All mocks") }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Column {
                            Text(
                                "Subjects",
                                fontWeight = FontWeight.Bold,
                                color = Ink,
                                fontSize = 16.sp,
                            )
                            Text(
                                "${state.subjects.size} subjects · tap to expand chapters",
                                style = MaterialTheme.typography.labelSmall,
                                color = Muted,
                            )
                        }
                    }

                    items(state.subjects, key = { it.subject }) { group ->
                        SubjectAccordion(
                            group = group,
                            onOpenChapter = onOpenChapter,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SubjectAccordion(
    group: SubjectGroup,
    onOpenChapter: (subject: String, chapter: String, chapterTitle: String) -> Unit,
) {
    var expanded by rememberSaveable(group.subject) { mutableStateOf(false) }
    val subjectTitle = group.subject.replace('-', ' ').replaceFirstChar { it.uppercase() }
    val topicsCount = group.subtopics.size
    val questionsCount = group.subtopics.sumOf { it.count }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Collapse" else "Expand",
                    tint = Muted,
                    modifier = Modifier.size(22.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        subjectTitle,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "$topicsCount chapters · ${formatCount(questionsCount)} questions",
                        style = MaterialTheme.typography.labelSmall,
                        color = Muted,
                    )
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut(),
            ) {
                Column {
                    HorizontalDivider(color = Border)
                    group.subtopics.forEachIndexed { index, topic ->
                        ChapterRow(
                            topic = topic,
                            onClick = {
                                onOpenChapter(
                                    group.subject,
                                    topic.chapterSlug,
                                    topic.title.replace('-', ' '),
                                )
                            },
                        )
                        if (index < group.subtopics.lastIndex) {
                            HorizontalDivider(
                                color = Border.copy(alpha = 0.6f),
                                modifier = Modifier.padding(start = 14.dp),
                            )
                        }
                    }
                    if (group.subtopics.isEmpty()) {
                        Text(
                            "No chapters yet",
                            modifier = Modifier.padding(14.dp),
                            color = Muted,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ChapterRow(
    topic: Subtopic,
    onClick: () -> Unit,
) {
    val title = topic.title.replace('-', ' ')
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            title.replaceFirstChar { it.uppercase() },
            modifier = Modifier.weight(1f),
            color = Ink,
            fontWeight = FontWeight.Medium,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "${topic.count}",
            color = Brand,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
        )
        Text(
            " Qs",
            color = Muted,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
        )
        Spacer(modifier = Modifier.width(4.dp))
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = Muted,
            modifier = Modifier.size(18.dp),
        )
    }
}

private fun formatCount(n: Int): String =
    when {
        n >= 1_000_000 -> String.format("%.1fM", n / 1_000_000.0)
        n >= 1_000 -> String.format("%,d", n)
        else -> n.toString()
    }
