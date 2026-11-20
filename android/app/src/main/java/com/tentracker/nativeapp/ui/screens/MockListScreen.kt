package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.MockTestSummary
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.MockListViewModel

private val DiffEasyBg = Color(0xFFECFDF5)
private val DiffEasyText = Color(0xFF065F46)
private val DiffEasyBorder = Color(0xFFA7F3D0)
private val DiffMediumBg = Color(0xFFFFFBEB)
private val DiffMediumText = Color(0xFF92400E)
private val DiffMediumBorder = Color(0xFFFDE68A)
private val DiffHardBg = Color(0xFFFFF1F2)
private val DiffHardText = Color(0xFF9F1239)
private val DiffHardBorder = Color(0xFFFECDD3)
private val DiffMixedBg = Color(0xFFF5F5F5)
private val DiffMixedText = Color(0xFF404040)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockListScreen(
    title: String,
    category: String,
    vm: MockListViewModel,
    onBack: () -> Unit,
    onStartNative: (test: MockTestSummary) -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit = { _, _ -> },
) {
    val state by vm.state.collectAsState()

    Scaffold(
        containerColor = Color(0xFFFAFAFA),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Mock tests", fontWeight = FontWeight.Bold, maxLines = 1, color = Ink)
                        Text(
                            title,
                            style = MaterialTheme.typography.labelSmall,
                            color = Muted,
                            maxLines = 1,
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { onOpenWeb("/mock-test/$category", "Mock tests") }) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = "Open on web")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
            )
        },
    ) { padding ->
        when {
            state.loading && state.tests.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator(color = Brand) }
            }
            state.error != null && state.tests.isEmpty() -> {
                Column(modifier = Modifier.padding(padding).padding(16.dp)) {
                    Text(state.error ?: "Error", color = Muted)
                    TextButton(onClick = { vm.refresh() }) { Text("Retry") }
                    TextButton(onClick = { onOpenWeb("/mock-test/$category", "Mock tests") }) {
                        Text("Browse on web")
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item {
                        Text(
                            "${state.tests.size} tests available",
                            style = MaterialTheme.typography.labelMedium,
                            color = Muted,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    items(state.tests, key = { it.id }) { test ->
                        MockTestCard(
                            test = test,
                            onStart = { onStartNative(test) },
                            onOpenWeb = {
                                onOpenWeb("/mock-test/$category/attempt/${test.id}", test.name)
                            },
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedButton(
                            onClick = { onOpenWeb("/mock-test/$category", "Mock tests") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Border),
                        ) {
                            Text("Full hub + checkout on web", color = Ink)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MockTestCard(
    test: MockTestSummary,
    onStart: () -> Unit,
    onOpenWeb: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (test.isMockOfDay) BrandSoft else Color.White,
        ),
        border = BorderStroke(1.dp, if (test.isMockOfDay) Brand.copy(alpha = 0.25f) else Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = BrandSoft,
                    border = BorderStroke(1.dp, Brand.copy(alpha = 0.15f)),
                    modifier = Modifier.size(44.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.MenuBook,
                            contentDescription = null,
                            tint = Brand,
                            modifier = Modifier.size(22.dp),
                        )
                    }
                }
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (test.isMockOfDay) {
                            MotChip("Mock of day", BrandSoft, Brand, Brand.copy(alpha = 0.3f))
                        } else {
                            MotChip("Full mock", BrandSoft, Brand, Brand.copy(alpha = 0.15f))
                        }
                        test.difficulty?.takeIf { it.isNotBlank() }?.let { diff ->
                            DifficultyChip(diff)
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        test.name,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    test.description?.takeIf { it.isNotBlank() }?.let { desc ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = Muted,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        MetaLine(Icons.Default.Quiz, "${test.totalQuestions} questions")
                        MetaLine(Icons.Default.Timer, formatMockDuration(test.duration))
                    }
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Button(
                onClick = onStart,
                colors = ButtonDefaults.buttonColors(containerColor = Ink),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.size(6.dp))
                Text("Start test", fontWeight = FontWeight.SemiBold)
            }
            TextButton(
                onClick = onOpenWeb,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            ) {
                Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.size(4.dp))
                Text("Open on web", fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun MetaLine(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
        Text(label, style = MaterialTheme.typography.labelSmall, color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun MotChip(text: String, bg: Color, fg: Color, borderColor: Color) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = bg,
        border = BorderStroke(1.dp, borderColor),
    ) {
        Text(
            text.uppercase(),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = fg,
            letterSpacing = 0.5.sp,
        )
    }
}

@Composable
private fun DifficultyChip(difficulty: String) {
    val key = difficulty.lowercase()
    val (bg, fg, border) = when (key) {
        "easy" -> Triple(DiffEasyBg, DiffEasyText, DiffEasyBorder)
        "medium" -> Triple(DiffMediumBg, DiffMediumText, DiffMediumBorder)
        "hard" -> Triple(DiffHardBg, DiffHardText, DiffHardBorder)
        else -> Triple(DiffMixedBg, DiffMixedText, Border)
    }
    Surface(shape = RoundedCornerShape(6.dp), color = bg, border = BorderStroke(1.dp, border)) {
        Text(
            difficulty.replaceFirstChar { it.uppercase() },
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = fg,
        )
    }
}

private fun formatMockDuration(minutes: Int): String {
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