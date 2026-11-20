package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandDeep
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import java.text.NumberFormat

@Composable
fun GuestHomeExamSpotlight(
    exams: List<ActiveExam>,
    onViewAllExams: () -> Unit,
    onPracticeExam: (ActiveExam) -> Unit,
    onMockExam: (ActiveExam) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = GuestGutter)
            .padding(bottom = 56.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom,
        ) {
            GuestSectionHeader(
                eyebrow = "Practice",
                title = "Popular exams to start with",
                subtitle = "Jump into topic-wise MCQs or timed mocks — featured by activity across the platform.",
                modifier = Modifier.weight(1f),
            )
            OutlinedButton(
                onClick = onViewAllExams,
                shape = RoundedCornerShape(RadiusXl),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Text("View all", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        if (exams.isEmpty()) {
            BoxLoadingPlaceholder("Exams loading — check back shortly.")
        } else {
            FeaturedExamCard(
                exam = exams.first(),
                onPractice = { onPracticeExam(exams.first()) },
                onMock = { onMockExam(exams.first()) },
            )
            exams.drop(1).forEachIndexed { index, exam ->
                Spacer(modifier = Modifier.height(10.dp))
                RankedExamRow(exam = exam, index = index, onPractice = { onPracticeExam(exam) }, onMock = { onMockExam(exam) })
            }
        }
    }
}

@Composable
private fun BoxLoadingPlaceholder(message: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Radius2xl))
            .border(1.dp, Border, RoundedCornerShape(Radius2xl))
            .background(Color.White)
            .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(message, fontSize = 14.sp, color = Muted)
    }
}

@Composable
private fun FeaturedExamCard(exam: ActiveExam, onPractice: () -> Unit, onMock: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ExamThumb(exam = exam, large = true)
                Column(modifier = Modifier.weight(1f)) {
                    Text("SPOTLIGHT", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Brand, letterSpacing = 1.2.sp)
                    Text(
                        exam.name,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    exam.category?.let {
                        Text(
                            text = it,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BrandDeep,
                            modifier = Modifier
                                .padding(top = 8.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(BrandSoft.copy(alpha = 0.7f))
                                .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(999.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp),
                        )
                    }
                }
            }
            exam.description?.takeIf { it.isNotBlank() }?.let {
                Text(
                    text = it,
                    fontSize = 14.sp,
                    color = Muted,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 12.dp),
                )
            }
            Row(
                modifier = Modifier.padding(top = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Description, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    "${NumberFormat.getIntegerInstance().format(activeExamQuestionCount(exam))} questions",
                    fontSize = 12.sp,
                    color = Muted,
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Button(
                    onClick = onPractice,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(RadiusXl),
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                ) {
                    Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Practice", fontWeight = FontWeight.SemiBold)
                }
                OutlinedButton(
                    onClick = onMock,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(RadiusXl),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Icon(Icons.Default.Assignment, contentDescription = null, tint = Brand, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Mocks", fontWeight = FontWeight.SemiBold, color = Ink)
                }
            }
        }
    }
}

@Composable
private fun RankedExamRow(
    exam: ActiveExam,
    index: Int,
    onPractice: () -> Unit,
    onMock: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(RadiusXl),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Text(
                text = String.format("%02d", index + 2),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Brand)
                    .padding(8.dp),
            )
            ExamThumb(exam = exam, large = false)
            Column(modifier = Modifier.weight(1f)) {
                Text(exam.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    "${NumberFormat.getIntegerInstance().format(activeExamQuestionCount(exam))} questions" +
                        (exam.category?.let { " · $it" } ?: ""),
                    fontSize = 12.sp,
                    color = Muted,
                    modifier = Modifier.padding(top = 2.dp),
                )
                Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "Practice →",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Ink,
                        modifier = Modifier.clickable(onClick = onPractice),
                    )
                    Text(
                        "Mocks →",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Muted,
                        modifier = Modifier.clickable(onClick = onMock),
                    )
                }
            }
        }
    }
}

@Composable
private fun ExamThumb(exam: ActiveExam, large: Boolean) {
    val size = if (large) 80.dp else 44.dp
    val shape = if (large) RoundedCornerShape(16.dp) else RoundedCornerShape(12.dp)
    Box(
        modifier = Modifier
            .size(size)
            .clip(shape)
            .background(BrandSoft)
            .border(1.dp, Brand.copy(alpha = 0.15f), shape),
        contentAlignment = Alignment.Center,
    ) {
        if (!exam.image.isNullOrBlank()) {
            AsyncImage(
                model = exam.image,
                contentDescription = null,
                modifier = Modifier.size(size),
                contentScale = ContentScale.Crop,
            )
        } else {
            Text(exam.icon ?: "📚", fontSize = if (large) 28.sp else 20.sp)
        }
    }
}