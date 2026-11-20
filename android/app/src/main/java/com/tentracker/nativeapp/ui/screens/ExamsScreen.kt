package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.ui.components.EmptyState
import com.tentracker.nativeapp.ui.components.ErrorState
import com.tentracker.nativeapp.ui.components.LoadingState
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ExamsViewModel

@Composable
fun ExamsScreen(
    vm: ExamsViewModel,
    onOpenExam: (ActiveExam) -> Unit,
) {
    val state by vm.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Spacer(modifier = Modifier.height(12.dp))
        Text("Exams", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
        Text(
            "Pick an exam, drill chapters, or open mock of the day.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
        )
        Spacer(modifier = Modifier.height(12.dp))

        when {
            state.loading && state.exams.isEmpty() -> {
                LoadingState(message = "Loading exams…")
            }
            state.error != null && state.exams.isEmpty() -> {
                ErrorState(
                    message = state.error ?: "Could not load exams",
                    onRetry = { vm.refresh() },
                )
            }
            state.exams.isEmpty() -> {
                EmptyState(
                    message = "No exams available right now.",
                    actionLabel = "Retry",
                    onAction = { vm.refresh() },
                )
            }
            else -> {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 24.dp),
                ) {
                    items(state.exams, key = { it.slug }) { exam ->
                        ExamCard(exam = exam, onClick = { onOpenExam(exam) })
                    }
                }
            }
        }
    }
}

@Composable
private fun ExamCard(exam: ActiveExam, onClick: () -> Unit) {
    val qCount = exam.question_count.takeIf { it > 0 } ?: exam.count
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (!exam.image.isNullOrBlank()) {
                AsyncImage(
                    model = exam.image,
                    contentDescription = exam.name,
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Crop,
                )
                Spacer(modifier = Modifier.width(12.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(exam.name, fontWeight = FontWeight.SemiBold, color = Ink)
                if (!exam.category.isNullOrBlank()) {
                    Text(exam.category!!, style = MaterialTheme.typography.labelSmall, color = Muted)
                }
                if (!exam.description.isNullOrBlank()) {
                    Text(exam.description!!, style = MaterialTheme.typography.bodyMedium, maxLines = 2)
                }
                Text(
                    "$qCount questions",
                    style = MaterialTheme.typography.labelSmall,
                    color = Brand,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Brand)
        }
    }
}
