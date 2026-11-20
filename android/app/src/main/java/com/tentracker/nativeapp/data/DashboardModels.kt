package com.tentracker.nativeapp.data

/** GET /api/user/dashboard — same payload as web StudentHomeDashboard. */
data class UserDashboardResponse(
    val success: Boolean = false,
    val error: String? = null,
    val profile: DashboardProfile? = null,
    val examsPreparing: List<DashboardExamRef> = emptyList(),
    val primaryExam: DashboardExamRef? = null,
    val focusedExam: DashboardExamRef? = null,
    val examFeed: DashboardExamFeed? = null,
    val practice: List<DashboardPracticeArea> = emptyList(),
    val continueOptions: DashboardContinueOptions? = null,
    val wallet: CreditsWalletResponse? = null,
    val heatmap: DashboardHeatmap? = null,
    val heatmapsByRange: Map<String, DashboardHeatmap>? = null,
    val streak: DashboardStreak? = null,
    val recentActivity: DashboardRecentActivity? = null,
    val myRoadmaps: List<DashboardRoadmapSummary> = emptyList(),
    val partialErrors: List<String> = emptyList(),
    val summary: DashboardSummary? = null,
)

data class DashboardProfile(
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val bio: String? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String? = null,
    val target_exam: String? = null,
    val target_exams: List<String>? = null,
)

data class DashboardExamRef(
    val slug: String = "",
    val name: String = "",
    val isPrimary: Boolean = false,
)

data class DashboardExamFeed(
    val exam: DashboardExamRef? = null,
    val links: DashboardExamLinks? = null,
    val countdown: DashboardCountdown? = null,
    val catalogStats: DashboardCatalogStats? = null,
    val mockOfTheDay: DashboardMockOfDay? = null,
    val updates: List<DashboardUpdateItem> = emptyList(),
    val updatesHref: String? = null,
    val fullMocks: List<DashboardMockCard> = emptyList(),
    val topicMocks: List<DashboardMockCard> = emptyList(),
)

data class DashboardExamLinks(
    val practiceHref: String? = null,
    val mockHref: String? = null,
    val dailyHref: String? = null,
)

data class DashboardCountdown(
    val visible: Boolean = false,
    val status: String? = null,
    val examDate: String? = null,
    val label: String? = null,
    val daysLeft: Int? = null,
)

data class DashboardCatalogStats(
    val questionCount: Int = 0,
    val mockCount: Int = 0,
    val topicCount: Int = 0,
    val chapterCount: Int = 0,
    val subjectCount: Int = 0,
)

data class DashboardMockOfDay(
    val status: String? = null,
    val title: String? = null,
    val description: String? = null,
    val mock: DashboardMockCard? = null,
)

data class DashboardMockCard(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val duration: Int = 0,
    val totalQuestions: Int = 0,
    val difficulty: String? = null,
    val creationMode: String? = null,
    val href: String? = null,
)

data class DashboardContinueOptions(
    val practice: DashboardContinueItem? = null,
    val mock: DashboardContinueItem? = null,
    val fallback: DashboardContinueItem? = null,
)

data class DashboardContinueItem(
    val subject: String? = null,
    val topic: String? = null,
    val href: String? = null,
    val description: String? = null,
    val title: String? = null,
)

data class DashboardPracticeArea(
    val area: String = "",
    val totalCompleted: Int = 0,
    val totalCorrect: Int = 0,
    val totalPoints: Int = 0,
    val topicsCount: Int = 0,
    val overallAccuracy: Int = 0,
    val topics: List<DashboardPracticeTopic> = emptyList(),
)

data class DashboardPracticeTopic(
    val topic: String = "",
    val completedQuestions: Int = 0,
    val correctAnswers: Int = 0,
    val points: Int = 0,
    val accuracy: Int = 0,
)

data class DashboardHeatmap(
    val range: String? = null,
    val weeks: List<List<Int>>? = null,
    val cells: List<DashboardHeatmapCell>? = null,
    val total: Int? = null,
)

data class DashboardHeatmapCell(
    val date: String? = null,
    val count: Int = 0,
)

data class DashboardStreak(
    val currentStreak: Int = 0,
    val longestStreak: Int = 0,
)

data class DashboardRecentActivity(
    val practice: List<DashboardActivityPractice> = emptyList(),
    val mocks: List<DashboardActivityMock> = emptyList(),
)

data class DashboardActivityPractice(
    val area: String? = null,
    val topic: String? = null,
    val title: String? = null,
    val href: String? = null,
)

data class DashboardActivityMock(
    val testId: String? = null,
    val name: String? = null,
    val href: String? = null,
)

data class DashboardRoadmapSummary(
    val id: String = "",
    val slug: String = "",
    val title: String = "",
    val exam_slug: String? = null,
    val examSlug: String? = null,
)

data class DashboardSummary(
    val practiceExams: Int = 0,
    val practiceQuestions: Int = 0,
    val practiceAccuracy: Int = 0,
    val practicePoints: Int = 0,
    val topicsPracticed: Int = 0,
    val mockTestsCompleted: Int = 0,
)

data class DashboardUpdateItem(
    val id: String? = null,
    val slug: String = "",
    val title: String = "",
    val excerpt: String? = null,
    val featured_image_url: String? = null,
)