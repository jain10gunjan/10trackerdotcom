package com.tentracker.nativeapp.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.RoadmapSummary

data class GuestHomeStats(
    val examCount: Int,
    val roadmapCount: Int,
    val questionCount: Int,
)

@Composable
fun GuestHomePage(
    stats: GuestHomeStats,
    featuredExams: List<ActiveExam>,
    featuredRoadmaps: List<RoadmapSummary>,
    onBrowseExams: () -> Unit,
    onExploreTrackers: () -> Unit,
    onViewAllPlans: () -> Unit,
    onOpenExam: (ActiveExam) -> Unit,
    onOpenRoadmap: (RoadmapSummary) -> Unit,
    onOpenArticles: () -> Unit,
    onOpenWeb: (path: String, title: String?) -> Unit,
    onSignIn: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(GuestPageBg),
    ) {
        item(key = "hero") {
            GuestHomeHero(
                examCount = stats.examCount,
                roadmapCount = stats.roadmapCount,
                questionCount = stats.questionCount,
                onBrowseExams = onBrowseExams,
                onExploreTrackers = onExploreTrackers,
                onSignIn = onSignIn,
            )
        }
        item(key = "pulse") {
            GuestHomePulseStats(
                examCount = stats.examCount,
                roadmapCount = stats.roadmapCount,
                questionCount = stats.questionCount,
            )
        }
        item(key = "exams") {
            GuestHomeExamSpotlight(
                exams = featuredExams,
                onViewAllExams = onBrowseExams,
                onPracticeExam = onOpenExam,
                onMockExam = onOpenExam,
            )
        }
        item(key = "plans") {
            GuestHomePlanTimeline(
                roadmaps = featuredRoadmaps,
                onViewAllPlans = onViewAllPlans,
                onOpenRoadmap = onOpenRoadmap,
                onBrowseExams = onBrowseExams,
            )
        }
        item(key = "retention") {
            GuestHomeRetentionKit(
                onSignIn = onSignIn,
                onOpenExams = onBrowseExams,
                onOpenArticles = onOpenArticles,
                onOpenWeb = onOpenWeb,
                onOpenTrackers = onExploreTrackers,
            )
        }
        item(key = "prep") {
            GuestHomePrepLoop(
                onSignIn = onSignIn,
                onOpenExams = onBrowseExams,
                onOpenTrackers = onExploreTrackers,
                onOpenWeb = onOpenWeb,
            )
        }
        item(key = "close") {
            GuestHomeCloseBand(
                onBrowseExams = onBrowseExams,
                onExplorePlans = onViewAllPlans,
                onSignIn = onSignIn,
            )
        }
    }
}