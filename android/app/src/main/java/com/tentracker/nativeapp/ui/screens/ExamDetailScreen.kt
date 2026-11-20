package com.tentracker.nativeapp.ui.screens

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamDetailScreen(
    title: String,
    category: String,
    vm: ExamDetailViewModel,
    onBack: () -> Unit,
    onOpenChapter: (subject: String, chapter: String, chapterTitle: String) -> Unit,
    onOpenMocks: () -> Unit,
    onStartMock: (testId: String, name: String, durationMinutes: Int) -> Unit,
) {
    val state by vm.state.collectAsState()

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
                                    Spacer(modifier = Modifier.padding(4.dp))
                                    Text(
                                        if (state.mock != null) "Mock of the day" else "Mock tests",
                                        fontWeight = FontWeight.Bold,
                                        color = Ink,
                                    )
                                }
                                state.mock?.let { mock ->
                                    Text(mock.name, fontWeight = FontWeight.SemiBold, color = Ink)
                                    Text(
                                        "${mock.totalQuestions} Qs · ${mock.duration} min · ${mock.difficulty ?: "mixed"}",
                                        style = MaterialTheme.typography.bodyMedium,
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                onStartMock(mock.id, mock.name, mock.duration)
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                            shape = RoundedCornerShape(12.dp),
                                        ) { Text("Start native") }
                                        TextButton(onClick = onOpenMocks) { Text("All mocks") }
                                    }
                                } ?: run {
                                    Text(
                                        "Browse published mocks for this exam in-app.",
                                        style = MaterialTheme.typography.bodyMedium,
                                    )
                                    Button(
                                        onClick = onOpenMocks,
                                        colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                        shape = RoundedCornerShape(12.dp),
                                    ) { Text("Browse mocks") }
                                }
                            }
                        }
                    }

                    items(state.subjects, key = { it.subject }) { group ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(
                                    group.subject.replace('-', ' ').replaceFirstChar { it.uppercase() },
                                    fontWeight = FontWeight.Bold,
                                    color = Ink,
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                group.subtopics.forEach { topic ->
                                    TextButton(
                                        onClick = {
                                            onOpenChapter(
                                                group.subject,
                                                topic.chapterSlug,
                                                topic.title.replace('-', ' '),
                                            )
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text(
                                            topic.title.replace('-', ' '),
                                            modifier = Modifier.weight(1f),
                                            color = Ink,
                                        )
                                        Text("${topic.count}", color = Brand, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
