package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
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
import com.tentracker.nativeapp.ui.components.HtmlText
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.MockAttemptViewModel

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
    val q = state.questions.getOrNull(state.index)
    val selected = q?.let { state.answers[it.id] }

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            state.test?.name ?: "Mock attempt",
                            maxLines = 1,
                            fontWeight = FontWeight.SemiBold,
                        )
                        when {
                            state.submitted -> Text(
                                "Submitted",
                                style = MaterialTheme.typography.labelSmall,
                                color = Muted,
                            )
                            state.started && state.questions.isNotEmpty() -> Text(
                                "Q ${state.index + 1} / ${state.questions.size}" +
                                    (state.secondsRemaining?.let { " · ${formatClock(it)}" } ?: ""),
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
                actions = {
                    if (state.started && !state.submitted && state.secondsRemaining != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(end = 8.dp),
                        ) {
                            Icon(Icons.Default.Timer, contentDescription = null, tint = Brand, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                formatClock(state.secondsRemaining!!),
                                fontWeight = FontWeight.Bold,
                                color = if (state.secondsRemaining!! < 60) Color(0xFFDC2626) else Ink,
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
            )
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
                val r = state.result!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("Your score", style = MaterialTheme.typography.headlineSmall, color = Ink)
                    Text(
                        "${r.percent}% · ${r.correct}/${r.total} correct",
                        fontWeight = FontWeight.Bold,
                        color = Brand,
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text("Attempted ${r.attempted} · Incorrect ${r.incorrect} · Skipped ${r.skipped}")
                    Text("Time used ${formatClock(r.secondsUsed)}", color = Muted)
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
                    ) { Text("Save / sync on web") }
                    OutlinedButton(
                        onClick = onBack,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Done") }
                }
            }
            !state.started -> {
                val test = state.test
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(test?.name ?: "Mock test", fontWeight = FontWeight.Bold, color = Ink)
                    test?.description?.takeIf { it.isNotBlank() }?.let {
                        Text(it, color = Muted)
                    }
                    Text(
                        "${state.questions.size} questions" +
                            (test?.duration?.takeIf { it > 0 }?.let { " · $it min timer" } ?: " · no timed limit"),
                    )
                    Text(
                        "Answers stay on device until you open the web attempt to sync (credits / profile).",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Muted,
                    )
                    Button(
                        onClick = { vm.start() },
                        enabled = state.questions.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = Brand),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Start test") }
                    TextButton(
                        onClick = {
                            openSite(
                                context,
                                "/mock-test/$category/attempt/${test?.id.orEmpty()}",
                            )
                        },
                    ) { Text("Prefer full web attempt") }
                }
            }
            q != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        state.questions.forEachIndexed { i, question ->
                            val answered = state.answers.containsKey(question.id)
                            val active = i == state.index
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when {
                                            active -> Brand
                                            answered -> BrandSoft
                                            else -> Color.White
                                        },
                                    )
                                    .border(1.dp, if (active) Brand else Border, CircleShape)
                                    .clickable { vm.goTo(i) },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    "${i + 1}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (active) Color.White else Ink,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        }
                    }

                    q.difficulty?.takeIf { it.isNotBlank() }?.let { diff ->
                        Text(
                            diff,
                            modifier = Modifier
                                .border(1.dp, Border, RoundedCornerShape(999.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Muted,
                        )
                    }

                    HtmlText(html = q.question, modifier = Modifier.fillMaxWidth())

                    q.options().forEach { (letter, text) ->
                        val isSelected = selected.equals(letter, ignoreCase = true)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) BrandSoft else Color.White)
                                .border(
                                    1.dp,
                                    if (isSelected) Brand else Border,
                                    RoundedCornerShape(12.dp),
                                )
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

                    Spacer(modifier = Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { vm.prev() },
                            enabled = state.index > 0,
                            shape = RoundedCornerShape(12.dp),
                        ) { Text("Prev") }
                        if (state.index < state.questions.lastIndex) {
                            Button(
                                onClick = { vm.next() },
                                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f),
                            ) { Text("Next") }
                        } else {
                            Button(
                                onClick = { confirmSubmit = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.weight(1f),
                            ) { Text("Submit") }
                        }
                    }
                    if (state.index < state.questions.lastIndex) {
                        TextButton(
                            onClick = { confirmSubmit = true },
                            modifier = Modifier.align(Alignment.End),
                        ) { Text("Submit early") }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }

    if (confirmSubmit) {
        AlertDialog(
            onDismissRequest = { confirmSubmit = false },
            title = { Text("Submit mock?") },
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
                ) { Text("Submit") }
            },
            dismissButton = {
                TextButton(onClick = { confirmSubmit = false }) { Text("Cancel") }
            },
        )
    }
}

private fun formatClock(totalSeconds: Int): String {
    val s = totalSeconds.coerceAtLeast(0)
    val h = s / 3600
    val m = (s % 3600) / 60
    val sec = s % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%d:%02d".format(m, sec)
}
