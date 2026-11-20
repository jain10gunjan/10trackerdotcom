package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ExamsViewModel

private val Emerald = Color(0xFF059669)
private val EmeraldSoft = Color(0xFFECFDF5)
private val EmeraldInk = Color(0xFF065F46)
private val EmeraldBorder = Color(0xFFD1FAE5)
private val Neutral50 = Color(0xFFFAFAFA)

@Composable
fun ExamsScreen(
    vm: ExamsViewModel,
    onOpenExam: (ActiveExam) -> Unit,
) {
    val state by vm.state.collectAsState()
    val hasFilters = state.searchQuery.isNotBlank() || state.selectedCategory != "All"

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg),
        contentPadding = PaddingValues(bottom = 28.dp),
    ) {
        item {
            CatalogHero(
                examCount = state.exams.size,
                totalQuestions = state.totalQuestions,
            )
        }

        item {
            FilterPanel(
                searchQuery = state.searchQuery,
                onSearchChange = vm::setSearch,
                categories = state.categories,
                selectedCategory = state.selectedCategory,
                onCategorySelected = vm::setCategory,
                resultCount = state.filtered.size,
                hasFilters = hasFilters,
                onResetFilters = {
                    vm.setSearch("")
                    vm.setCategory("All")
                },
            )
        }

        when {
            state.loading && state.exams.isEmpty() -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(240.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator(color = Brand)
                    }
                }
            }
            state.error != null && state.exams.isEmpty() -> {
                item {
                    ExamsEmptyCard(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        title = "Couldn't load exams",
                        message = state.error ?: "Check your connection and try again.",
                        actionLabel = "Retry",
                        onAction = { vm.refresh() },
                    )
                }
            }
            state.filtered.isEmpty() -> {
                item {
                    ExamsEmptyCard(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        title = if (hasFilters) "No exams match your filters" else "No active exams",
                        message = if (hasFilters) {
                            "Try clearing search or choosing a different category."
                        } else {
                            "Active exams will appear here when available."
                        },
                        actionLabel = if (hasFilters) "Reset filters" else "Retry",
                        onAction = {
                            if (hasFilters) {
                                vm.setSearch("")
                                vm.setCategory("All")
                            } else {
                                vm.refresh()
                            }
                        },
                    )
                }
            }
            else -> {
                item {
                    BrowseSectionHeader(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
                items(state.filtered, key = { it.slug }) { exam ->
                    ExamCatalogCard(
                        exam = exam,
                        onClick = { onOpenExam(exam) },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun CatalogHero(examCount: Int, totalQuestions: Int) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(EmeraldSoft.copy(alpha = 0.9f))
                    .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("✦", fontSize = 11.sp, color = Emerald)
                Text(
                    "Exam catalog",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = EmeraldInk,
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                "Every active exam. One place to start.",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Ink,
                lineHeight = 28.sp,
            )
            Text(
                "Filter by category, then jump into chapter practice or mock tests.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
                modifier = Modifier.padding(top = 8.dp),
            )
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatPill(label = "$examCount active")
                StatPill(label = "%,d questions".format(totalQuestions))
            }
        }
    }
}

@Composable
private fun StatPill(label: String) {
    Text(
        text = label,
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Neutral50)
            .border(1.dp, Border, RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        color = Ink,
    )
}

@Composable
private fun FilterPanel(
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    categories: List<String>,
    selectedCategory: String,
    onCategorySelected: (String) -> Unit,
    resultCount: Int,
    hasFilters: Boolean,
    onResetFilters: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.92f))
            .border(1.dp, Border.copy(alpha = 0.6f))
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        ExamSearchField(value = searchQuery, onValueChange = onSearchChange)
        if (categories.size > 1) {
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                categories.forEach { category ->
                    val selected = category == selectedCategory
                    Text(
                        text = category,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(if (selected) Ink else Color.White)
                            .border(
                                1.dp,
                                if (selected) Ink else Border,
                                RoundedCornerShape(999.dp),
                            )
                            .clickable { onCategorySelected(category) }
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        color = if (selected) Color.White else Muted,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp,
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "$resultCount exam${if (resultCount == 1) "" else "s"}",
                fontSize = 12.sp,
                color = Muted,
            )
            if (hasFilters) {
                Text(" · ", fontSize = 12.sp, color = Muted)
                TextButton(
                    onClick = onResetFilters,
                    contentPadding = PaddingValues(0.dp),
                ) {
                    Text("Reset filters", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Emerald)
                }
            }
        }
    }
}

@Composable
private fun ExamSearchField(value: String, onValueChange: (String) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
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
                cursorBrush = SolidColor(Brand),
                decorationBox = { inner ->
                    Box {
                        if (value.isEmpty()) {
                            Text("Search exams…", fontSize = 14.sp, color = Muted.copy(alpha = 0.8f))
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
private fun BrowseSectionHeader(modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(EmeraldSoft)
                .border(1.dp, EmeraldBorder, RoundedCornerShape(6.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text("01", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = EmeraldInk)
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(
                "BROWSE",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Emerald,
                letterSpacing = 0.8.sp,
            )
            Text("All exams", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Ink)
        }
    }
}

@Composable
private fun ExamCatalogCard(
    exam: ActiveExam,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val qCount = ExamsViewModel.questionCount(exam)
  Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
        ) {
            ExamThumb(exam = exam)
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        exam.name,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        fontSize = 15.sp,
                        modifier = Modifier.weight(1f),
                    )
                    exam.category?.takeIf { it.isNotBlank() }?.let { cat ->
                        Text(
                            cat,
                            modifier = Modifier
                                .padding(start = 8.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(EmeraldSoft)
                                .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = EmeraldInk,
                        )
                    }
                }
                if (!exam.description.isNullOrBlank()) {
                    Text(
                        exam.description!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Muted,
                        maxLines = 2,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(
                        Icons.Default.Description,
                        contentDescription = null,
                        tint = Muted.copy(alpha = 0.7f),
                        modifier = Modifier.size(14.dp),
                    )
                    Text(
                        "%,d questions".format(qCount),
                        fontSize = 11.sp,
                        color = Muted,
                        fontWeight = FontWeight.Medium,
                    )
                }
                Row(
                    modifier = Modifier.padding(top = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        "Open hub",
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Ink)
                            .clickable(onClick = onClick)
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
private fun ExamThumb(exam: ActiveExam) {
    val shape = RoundedCornerShape(14.dp)
    Box(
        modifier = Modifier
            .size(56.dp)
            .clip(shape)
            .background(EmeraldSoft)
            .border(1.dp, EmeraldBorder, shape),
        contentAlignment = Alignment.Center,
    ) {
        if (!exam.image.isNullOrBlank()) {
            AsyncImage(
                model = exam.image,
                contentDescription = exam.name,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Text(exam.icon?.takeIf { it.isNotBlank() } ?: "📚", fontSize = 22.sp)
        }
    }
}

@Composable
private fun ExamsEmptyCard(
    modifier: Modifier = Modifier,
    title: String,
    message: String,
    actionLabel: String,
    onAction: () -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(20.dp))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Neutral50)
                .border(1.dp, Border, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.Search, contentDescription = null, tint = Muted, modifier = Modifier.size(22.dp))
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(title, fontWeight = FontWeight.Bold, color = Ink, fontSize = 16.sp)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = Muted, modifier = Modifier.padding(top = 6.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            actionLabel,
            modifier = Modifier
                .clip(RoundedCornerShape(14.dp))
                .background(Ink)
                .clickable(onClick = onAction)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp,
        )
    }
}