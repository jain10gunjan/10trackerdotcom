package com.tentracker.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.RoadmapSummary
import com.tentracker.nativeapp.ui.screens.dashboard.StudentSignedHomeScreen
import com.tentracker.nativeapp.ui.screens.guest.GuestHomePage
import com.tentracker.nativeapp.ui.screens.guest.GuestHomeStats
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.viewmodel.DashboardViewModel
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel

private fun activeExamQuestionCount(exam: ActiveExam): Int =
    exam.question_count.takeIf { it > 0 } ?: exam.count

@Composable
fun HomeScreen(
    vm: HomeViewModel,
    dashboardVm: DashboardViewModel,
    onOpenPath: (String) -> Unit,
    onOpenExams: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenArticles: () -> Unit,
    onOpenArticle: (slug: String) -> Unit,
    onOpenMore: () -> Unit,
    onOpenRoadmaps: () -> Unit,
    onOpenExam: (ActiveExam) -> Unit,
    onOpenRoadmap: (String) -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
) {
    val state by vm.state.collectAsState()

    if (state.signedIn) {
        LaunchedEffect(Unit) {
            dashboardVm.setEnabled(true)
        }
        StudentSignedHomeScreen(
            dashboardVm = dashboardVm,
            onSignOut = onSignOut,
            onOpenExams = onOpenExams,
            onOpenExam = { slug, name -> onOpenExam(ActiveExam(slug = slug, name = name)) },
            onOpenTrackers = onOpenTrackers,
            onOpenArticles = onOpenArticles,
            onOpenRoadmaps = onOpenRoadmaps,
            onOpenWeb = onOpenWeb,
            onOpenArticle = onOpenArticle,
        )
        return
    }

    LaunchedEffect(state.signedIn) {
        dashboardVm.setEnabled(false)
        dashboardVm.reset()
    }

    if (state.loading && state.activeExams.isEmpty() && state.catalog == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Bg),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = Brand)
        }
        return
    }

    val active = state.activeExams
    val examCount = active.size.takeIf { it > 0 } ?: state.exams.size
    val roadmapCount = state.roadmaps.size
    val questionCount = active.takeIf { it.isNotEmpty() }?.sumOf { activeExamQuestionCount(it) }
        ?: state.exams.sumOf { it.count }

    GuestHomePage(
        stats = GuestHomeStats(
            examCount = examCount,
            roadmapCount = roadmapCount,
            questionCount = questionCount,
        ),
        featuredExams = active.ifEmpty { state.exams }.take(4),
        featuredRoadmaps = state.roadmaps.take(3),
        onBrowseExams = onOpenExams,
        onExploreTrackers = onOpenTrackers,
        onViewAllPlans = onOpenRoadmaps,
        onOpenExam = onOpenExam,
        onOpenRoadmap = { summary: RoadmapSummary -> onOpenRoadmap(summary.slug) },
        onOpenArticles = onOpenArticles,
        onOpenWeb = onOpenWeb,
        onSignIn = onSignIn,
    )
}
