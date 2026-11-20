package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.RoadmapSummary
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted

internal val GuestPageBg = Color(0xFFFAFAFA)
internal val GuestSurface = Color(0xFFF8FAFC)
internal val GuestGutter = 16.dp
internal val RadiusXl = 16.dp
internal val Radius2xl = 16.dp
internal val Radius3xl = 24.dp
internal val BrandBright = Color(0xFF4B6BC7)

internal fun activeExamQuestionCount(exam: ActiveExam): Int =
    exam.count.takeIf { it > 0 } ?: exam.question_count

internal fun pickFeaturedExams(exams: List<ActiveExam>, limit: Int = 4): List<ActiveExam> {
    if (exams.isEmpty()) return emptyList()
    return exams.sortedByDescending { activeExamQuestionCount(it) }.take(limit)
}

internal fun pickFeaturedRoadmaps(roadmaps: List<RoadmapSummary>, limit: Int = 3): List<RoadmapSummary> {
    if (roadmaps.isEmpty()) return emptyList()
    return roadmaps.sortedBy { it.sortOrder }.take(limit)
}

@Composable
internal fun GuestSectionEyebrow(text: String) {
    Text(
        text = text.uppercase(),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 1.5.sp,
        color = Brand,
    )
}

@Composable
internal fun GuestSectionHeader(
    eyebrow: String,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        GuestSectionEyebrow(eyebrow)
        Text(
            text = title,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Ink,
            modifier = Modifier.padding(top = 6.dp),
            lineHeight = 28.sp,
        )
        Text(
            text = subtitle,
            fontSize = 14.sp,
            color = Muted,
            modifier = Modifier.padding(top = 8.dp),
            lineHeight = 20.sp,
        )
    }
}