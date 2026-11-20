package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.PracticeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PracticeScreen(
    title: String,
    vm: PracticeViewModel,
    onBack: () -> Unit,
) {
    val state by vm.state.collectAsState()
    val q = state.questions.getOrNull(state.index)

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(title, maxLines = 1, fontWeight = FontWeight.SemiBold)
                        if (state.totalCount > 0) {
                            val plus = if (state.hasMore) "+" else ""
                            Text(
                                "Q ${state.index + 1} of ${state.questions.size}$plus · ${state.totalCount} total",
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
                Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
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
                        .padding(horizontal = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        q.difficulty?.let { Badge(it) }
                        q.year?.let { Badge(it) }
                    }

                    HtmlText(html = q.question, modifier = Modifier.fillMaxWidth())

                    q.options().forEach { (letter, text) ->
                        val correct = q.correct_option?.trim()?.uppercase()?.take(1)
                        val selected = state.selected.equals(letter, ignoreCase = true)
                        val borderColor = when {
                            state.revealed && letter.equals(correct, true) -> Color(0xFF16A34A)
                            state.revealed && selected -> Color(0xFFDC2626)
                            selected -> Brand
                            else -> Border
                        }
                        val bg = when {
                            state.revealed && letter.equals(correct, true) -> Color(0xFFDCFCE7)
                            state.revealed && selected -> Color(0xFFFEE2E2)
                            selected -> BrandSoft
                            else -> Color.White
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(bg)
                                .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                                .clickable { vm.selectOption(letter) }
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
                        }
                    }

                    if (state.revealed && !q.solutiontext.isNullOrBlank()) {
                        Text("Solution", fontWeight = FontWeight.Bold, color = Ink)
                        HtmlText(html = q.solutiontext!!, modifier = Modifier.fillMaxWidth())
                    }

                    state.saveHint?.let {
                        Text(it, style = MaterialTheme.typography.labelSmall, color = Muted)
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { vm.prev() },
                            enabled = state.index > 0,
                            shape = RoundedCornerShape(12.dp),
                        ) { Text("Prev") }

                        if (!state.revealed) {
                            Button(
                                onClick = { vm.checkAnswer() },
                                enabled = state.selected != null,
                                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f),
                            ) { Text("Check") }
                        } else {
                            Button(
                                onClick = { vm.next() },
                                colors = ButtonDefaults.buttonColors(containerColor = Brand),
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
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun Badge(text: String) {
    Text(
        text = text,
        modifier = Modifier
            .border(1.dp, Border, RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        style = MaterialTheme.typography.labelSmall,
        color = Muted,
    )
}
