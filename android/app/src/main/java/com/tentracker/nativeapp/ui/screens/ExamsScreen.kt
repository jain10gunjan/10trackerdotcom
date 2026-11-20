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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Emerald
import com.tentracker.nativeapp.ui.theme.EmeraldBorder
import com.tentracker.nativeapp.ui.theme.EmeraldSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ExamsViewModel

private val Emerald700 = Color(0xFF047857)
private val Emerald800 = Color(0xFF065F46)
private val EmeraldGlow = Color(0x5910B981)
private val Neutral50 = Color(0xFFFAFAFA)
private val Neutral100 = Color(0xFFF5F5F5)
private val Neutral300 = Color(0xFFD4D4D4)
private val Neutral400 = Color(0xFFA3A3A3)
private val Neutral900 = Color(0xFF171717)

@Composable
fun ExamsScreen(
    vm: ExamsViewModel,
    onOpenExam: (ActiveExam) -> Unit,
    onPracticeExam: (ActiveExam) -> Unit = onOpenExam,
    onMockExam: (ActiveExam) -> Unit = onOpenExam,
    onGoHome: () -> Unit = {},
) {
    val state by vm.state.collectAsState()
    val filterBarHasFilters =
        state.searchQuery.isNotBlank() || state.selectedCategory != "All"
    val hasFilters = filterBarHasFilters || state.sortBy != "popular"
    val featured = remember(state.exams) { pickFeaturedExams(state.exams) }

    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.linearGradient(
                        colors = listOf(Neutral100, Neutral50, Bg),
                        start = Offset(0f, 0f),
                        end = Offset(0f, Float.POSITIVE_INFINITY),
                    ),
                ),
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xB2ECFDF5), Color.Transparent),
                        center = Offset(0.5f, 0f),
                        radius = 900f,
                    ),
                ),
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 56.dp),
        ) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(top = 8.dp, bottom = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    CatalogHero(
                        examCount = state.exams.size,
                        totalQuestions = state.totalQuestions,
                    )
                    if (featured.isNotEmpty()) {
                        FeaturedExamsPanel(
                            featured = featured,
                            onPractice = onPracticeExam,
                            onMock = onMockExam,
                        )
                    }
                }
            }

            item {
                FilterPanel(
                    searchQuery = state.searchQuery,
                    onSearchChange = vm::setSearch,
                    sortBy = state.sortBy,
                    onSortChange = vm::setSort,
                    categories = state.categories,
                    selectedCategory = state.selectedCategory,
                    onCategorySelected = vm::setCategory,
                    resultCount = state.filtered.size,
                    hasFilters = filterBarHasFilters,
                    onResetFilters = vm::resetFilters,
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
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp),
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
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp),
                            title = if (hasFilters) "No exams match your filters" else "No active exams",
                            message = if (hasFilters) {
                                "Try clearing search or choosing a different category."
                            } else {
                                "Active exams will appear here when available."
                            },
                            actionLabel = if (hasFilters) "Reset filters" else "Retry",
                            onAction = {
                                if (hasFilters) vm.resetFilters() else vm.refresh()
                            },
                        )
                    }
                }
                else -> {
                    item {
                        BrowseSectionHeader(
                            modifier = Modifier
                                .padding(horizontal = 16.dp)
                                .padding(top = 24.dp, bottom = 14.dp),
                        )
                    }
                    items(state.filtered, key = { it.slug }) { exam ->
                        ExamCatalogCard(
                            exam = exam,
                            onPractice = { onPracticeExam(exam) },
                            onMock = { onMockExam(exam) },
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                        )
                    }
                }
            }

            item {
                NextStepFooter(
                    onGoHome = onGoHome,
                    modifier = Modifier
                        .padding(horizontal = 16.dp)
                        .padding(top = 24.dp, bottom = 56.dp),
                )
            }
        }
    }
}

private fun pickFeaturedExams(exams: List<ActiveExam>, limit: Int = 3): List<ActiveExam> {
    if (exams.isEmpty()) return emptyList()
    return exams.sortedByDescending { ExamsViewModel.questionCount(it) }.take(limit)
}

@Composable
private fun CatalogHero(examCount: Int, totalQuestions: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.95f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Box {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color(0x1410B981),
                                Color.Transparent,
                                Color(0x0A8B5CF6),
                            ),
                            start = Offset(0f, 0f),
                            end = Offset(800f, 600f),
                        ),
                    ),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 48.dp, y = (-64).dp)
                    .size(160.dp)
                    .blur(48.dp)
                    .clip(CircleShape)
                    .background(Color(0x59A7F3D0)),
            )
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(EmeraldSoft.copy(alpha = 0.9f))
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(999.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text("✦", fontSize = 11.sp, color = Emerald)
                    Text(
                        "Exam catalog",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Emerald800,
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "Every active exam. One place to start.",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                    lineHeight = 30.sp,
                    letterSpacing = (-0.3).sp,
                )
                Text(
                    "Filter by category, then jump into chapter practice or mock tests — only exams you can use today.",
                    fontSize = 14.sp,
                    color = Muted,
                    lineHeight = 22.sp,
                    modifier = Modifier.padding(top = 8.dp),
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatPill(label = "$examCount active")
                    StatPill(label = "%,d questions".format(totalQuestions))
                }
            }
        }
    }
}

@Composable
private fun StatPill(label: String) {
    Text(
        text = label,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Neutral50)
            .border(1.dp, Border, RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        color = Ink,
    )
}

@Composable
private fun FeaturedExamsPanel(
    featured: List<ActiveExam>,
    onPractice: (ActiveExam) -> Unit,
    onMock: (ActiveExam) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(elevation = 1.dp, shape = RoundedCornerShape(16.dp), clip = false),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Neutral50)
                    .padding(horizontal = 16.dp)
                    .padding(top = 16.dp, bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(EmeraldSoft)
                        .border(1.dp, EmeraldBorder, RoundedCornerShape(6.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("✦", fontSize = 12.sp, color = Emerald800)
                }
                Column {
                    Text(
                        "START HERE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Emerald700,
                        letterSpacing = 0.8.sp,
                    )
                    Text(
                        "Popular exams",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                    )
                    Text(
                        "Most practiced exams on the platform",
                        fontSize = 12.sp,
                        color = Muted,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }
            featured.forEachIndexed { index, exam ->
                if (index > 0) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(Neutral50),
                    )
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onPractice(exam) }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(EmeraldSoft)
                            .border(1.dp, EmeraldBorder, RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            "%02d".format(index + 1),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Emerald800,
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            exam.name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Ink,
                            maxLines = 1,
                        )
                        val q = ExamsViewModel.questionCount(exam)
                        val cat = exam.category?.takeIf { it.isNotBlank() }
                        Text(
                            buildAnnotatedString {
                                append("%,d questions".format(q))
                                if (cat != null) append(" · $cat")
                            },
                            fontSize = 12.sp,
                            color = Muted,
                            modifier = Modifier.padding(top = 2.dp),
                        )
                        Row(
                            modifier = Modifier.padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Text(
                                "Practice →",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Ink,
                                modifier = Modifier.clickable { onPractice(exam) },
                            )
                            Text(
                                "Mock tests →",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Muted,
                                modifier = Modifier.clickable { onMock(exam) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FilterPanel(
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    sortBy: String,
    onSortChange: (String) -> Unit,
    categories: List<String>,
    selectedCategory: String,
    onCategorySelected: (String) -> Unit,
    resultCount: Int,
    hasFilters: Boolean,
    onResetFilters: () -> Unit,
) {
    var showMobileSort by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.9f))
            .border(1.dp, Border.copy(alpha = 0.8f))
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            ExamSearchField(
                value = searchQuery,
                onValueChange = onSearchChange,
                modifier = Modifier.weight(1f),
            )
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, Border, RoundedCornerShape(12.dp))
                    .background(Color.White)
                    .clickable { showMobileSort = !showMobileSort }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Default.FilterList, contentDescription = null, tint = Muted, modifier = Modifier.size(16.dp))
                Text("Sort", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Ink.copy(alpha = 0.85f))
            }
        }

        if (categories.isNotEmpty()) {
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
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        color = if (selected) Color.White else Muted,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp,
                    )
                }
            }
        }

        AnimatedVisibility(
            visible = showMobileSort,
            enter = expandVertically(animationSpec = tween(200)) + fadeIn(animationSpec = tween(200)),
            exit = shrinkVertically(animationSpec = tween(160)) + fadeOut(animationSpec = tween(120)),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Neutral50)
                    .border(1.dp, Border, RoundedCornerShape(12.dp))
                    .padding(12.dp),
            ) {
                Text("Sort by", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Muted)
                Spacer(modifier = Modifier.height(4.dp))
                SortOption("popular", "Most popular", sortBy, onSortChange) { showMobileSort = false }
                SortOption("questions", "Most questions", sortBy, onSortChange) { showMobileSort = false }
                SortOption("name", "Name (A–Z)", sortBy, onSortChange) { showMobileSort = false }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                buildAnnotatedString {
                    withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = Ink)) {
                        append("$resultCount")
                    }
                    append(" exam")
                    if (resultCount != 1) append("s")
                },
                fontSize = 12.sp,
                color = Muted,
            )
            if (hasFilters) {
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Reset filters",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Emerald,
                    modifier = Modifier.clickable { onResetFilters() },
                )
            }
        }
    }
}

@Composable
private fun SortOption(
    value: String,
    label: String,
    current: String,
    onSortChange: (String) -> Unit,
    onPicked: () -> Unit,
) {
    val selected = current == value
    Text(
        label,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) EmeraldSoft else Color.White)
            .border(1.dp, if (selected) EmeraldBorder else Border, RoundedCornerShape(8.dp))
            .clickable {
                onSortChange(value)
                onPicked()
            }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        fontSize = 14.sp,
        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        color = if (selected) Emerald800 else Ink,
    )
    Spacer(modifier = Modifier.height(4.dp))
}

@Composable
private fun ExamSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(12.dp))
            .padding(start = 12.dp, end = 12.dp, top = 8.dp, bottom = 8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Default.Search, contentDescription = null, tint = Neutral400, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(10.dp))
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
            Text("01", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Emerald800)
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(
                "BROWSE",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Emerald700,
                letterSpacing = 0.8.sp,
            )
            Text(
                "All exams",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Ink,
                modifier = Modifier.padding(top = 2.dp),
            )
        }
    }
}

@Composable
private fun ExamCatalogCard(
    exam: ActiveExam,
    onPractice: () -> Unit,
    onMock: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val qCount = ExamsViewModel.questionCount(exam)
    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(elevation = 1.dp, shape = RoundedCornerShape(16.dp), clip = false),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            ExamThumb(exam = exam, size = 48.dp)
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    exam.name,
                    fontWeight = FontWeight.Bold,
                    color = Ink,
                    fontSize = 14.sp,
                    maxLines = 1,
                )
                if (!exam.description.isNullOrBlank()) {
                    Text(
                        exam.description!!,
                        fontSize = 12.sp,
                        color = Muted,
                        maxLines = 2,
                        lineHeight = 18.sp,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
                Row(
                    modifier = Modifier.padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        Icons.Default.Description,
                        contentDescription = null,
                        tint = Muted.copy(alpha = 0.75f),
                        modifier = Modifier.size(14.dp),
                    )
                    Text(
                        "%,d questions".format(qCount),
                        fontSize = 11.sp,
                        color = Neutral400,
                    )
                }
                Row(
                    modifier = Modifier.padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Ink)
                            .clickable(onClick = onPractice)
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Icon(Icons.Default.MenuBook, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Text("Practice", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp),
                        )
                    }
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White)
                            .border(1.dp, Border, RoundedCornerShape(12.dp))
                            .clickable(onClick = onMock)
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Icon(Icons.Default.Assignment, contentDescription = null, tint = Ink, modifier = Modifier.size(14.dp))
                        Text("Mock tests", color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ExamThumb(exam: ActiveExam, size: androidx.compose.ui.unit.Dp) {
    val shape = RoundedCornerShape(12.dp)
    Box(
        modifier = Modifier
            .size(size)
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
            Text(exam.icon?.takeIf { it.isNotBlank() } ?: "📚", fontSize = 20.sp)
        }
    }
}

@Composable
private fun NextStepFooter(
    onGoHome: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Neutral900)
            .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp)),
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 48.dp, y = (-64).dp)
                .size(192.dp)
                .blur(48.dp)
                .clip(CircleShape)
                .background(EmeraldGlow),
        )
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                "NEXT STEP",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF6EE7B7),
                letterSpacing = 0.8.sp,
            )
            Text(
                "Track progress across exams",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                lineHeight = 26.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
            Text(
                "Create a free account to save practice history, streaks, and mock rankings.",
                fontSize = 14.sp,
                color = Neutral300,
                lineHeight = 20.sp,
                modifier = Modifier.padding(top = 6.dp),
            )
            Spacer(modifier = Modifier.height(16.dp))
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White)
                        .clickable(onClick = onGoHome)
                        .padding(horizontal = 20.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "Get started free",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Ink,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = Ink,
                        modifier = Modifier.size(16.dp),
                    )
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        .clickable(onClick = onGoHome)
                        .padding(horizontal = 20.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "Back to home",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                    )
                }
            }
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
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(horizontal = 24.dp, vertical = 48.dp),
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
            Icon(Icons.Default.Search, contentDescription = null, tint = Muted, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(title, fontWeight = FontWeight.Bold, color = Ink, fontSize = 16.sp)
        Text(
            message,
            fontSize = 14.sp,
            color = Muted,
            modifier = Modifier.padding(top = 6.dp),
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            actionLabel,
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .background(Ink)
                .clickable(onClick = onAction)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp,
        )
    }
}