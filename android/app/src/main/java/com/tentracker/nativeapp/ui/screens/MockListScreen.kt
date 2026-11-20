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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.OpenInBrowser
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tentracker.nativeapp.data.MockTestSummary
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.MockListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockListScreen(
    title: String,
    category: String,
    vm: MockListViewModel,
    onBack: () -> Unit,
    onStartNative: (test: MockTestSummary) -> Unit,
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current

    Scaffold(
        containerColor = Color.White,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Mock tests", fontWeight = FontWeight.SemiBold, maxLines = 1)
                        Text(title, style = MaterialTheme.typography.labelSmall, color = Muted, maxLines = 1)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { openSite(context, "/mock-test/$category") }) {
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
                    TextButton(onClick = { openSite(context, "/mock-test/$category") }) {
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
                            "${state.tests.size} available",
                            style = MaterialTheme.typography.labelMedium,
                            color = Muted,
                        )
                    }
                    items(state.tests, key = { it.id }) { test ->
                        MockTestCard(
                            test = test,
                            onStart = { onStartNative(test) },
                            onOpenWeb = {
                                openSite(context, "/mock-test/$category/attempt/${test.id}")
                            },
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(
                            onClick = { openSite(context, "/mock-test/$category") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                        ) {
                            Text("Full hub + checkout on web")
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
        border = if (test.isMockOfDay) null else BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (test.isMockOfDay) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Timer, contentDescription = null, tint = Brand)
                    Spacer(modifier = Modifier.padding(4.dp))
                    Text("Mock of the day", fontWeight = FontWeight.Bold, color = Ink)
                }
            }
            Text(test.name, fontWeight = FontWeight.SemiBold, color = Ink)
            Text(
                buildString {
                    append("${test.totalQuestions} Qs")
                    if (test.duration > 0) append(" · ${test.duration} min")
                    test.difficulty?.takeIf { it.isNotBlank() }?.let { append(" · $it") }
                },
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onStart,
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(12.dp),
                ) { Text("Start native") }
                TextButton(onClick = onOpenWeb) { Text("Web") }
            }
        }
    }
}
