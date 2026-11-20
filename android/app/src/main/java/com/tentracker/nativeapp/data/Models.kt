package com.tentracker.nativeapp.data

data class OgCatalogResponse(
    val success: Boolean = false,
    val exams: List<OgExam> = emptyList(),
    val paths: List<OgPathSummary> = emptyList(),
    val stats: OgStats? = null,
    val isPremium: Boolean = false,
    val error: String? = null,
    val setupRequired: Boolean = false,
    val setupHint: String? = null,
)

data class OgExam(
    val id: String? = null,
    val slug: String = "",
    val title: String = "",
    val description: String? = null,
    val chapterCount: Int = 0,
    val liveChapterCount: Int = 0,
    val totalSteps: Int = 0,
    val completedSteps: Int = 0,
    val percent: Int = 0,
)

data class OgPathSummary(
    val id: String = "",
    val slug: String = "",
    val title: String = "",
    val description: String? = null,
    val category: String? = null,
    val totalResources: Int = 0,
    val completedResources: Int = 0,
    val percent: Int = 0,
    val locked: Boolean = false,
    val isPremium: Boolean = false,
)

data class OgStats(
    val videosCompleted: Int = 0,
    val practiceCompleted: Int = 0,
    val mocksCompleted: Int = 0,
    val isPremium: Boolean = false,
)

data class OgPathDetailResponse(
    val success: Boolean = false,
    val path: OgPathSummary? = null,
    val resources: List<OgResource> = emptyList(),
    val beaconTokens: Map<String, String>? = null,
    val error: String? = null,
    val setupRequired: Boolean = false,
    val setupHint: String? = null,
)

data class OgResource(
    val id: String = "",
    val pathId: String? = null,
    val type: String = "",
    val sortOrder: Int = 0,
    val title: String = "",
    val sectionLabel: String? = null,
    val locked: Boolean = false,
    val youtubeVideoId: String? = null,
    val externalUrl: String? = null,
    val externalSlug: String? = null,
    val meta: Map<String, Any?>? = null,
    val progress: OgProgress? = null,
    val sequenceLocked: Boolean = false,
)

data class OgProgress(
    val status: String? = "NOT_STARTED",
    val percentWatched: Int = 0,
    val updatedAt: String? = null,
)

data class ProgressSaveResponse(
    val success: Boolean = false,
    val error: String? = null,
    val saved: Int = 0,
)

data class ExamCategory(
    val slug: String = "",
    val name: String = "",
    val count: Int = 0,
    val description: String? = null,
    val category: String? = null,
)

data class ExamCategoriesResponse(
    val success: Boolean = false,
    val data: List<ExamCategory> = emptyList(),
)

data class ActiveExamsResponse(
    val success: Boolean = false,
    val exams: List<ActiveExam> = emptyList(),
)

data class ActiveExam(
    val slug: String = "",
    val name: String = "",
    val image: String? = null,
    val icon: String? = null,
    val description: String? = null,
    val category: String? = null,
    val count: Int = 0,
    val question_count: Int = 0,
    val active: Boolean = true,
    val is_active: Boolean = true,
)

data class SubjectsResponse(
    val subjectsData: List<SubjectGroup> = emptyList(),
)

data class SubjectGroup(
    val subject: String = "",
    val subtopics: List<Subtopic> = emptyList(),
)

data class Subtopic(
    val title: String = "",
    val count: Int = 0,
    val category: String? = null,
    val chapter: String? = null,
) {
    val chapterSlug: String get() = (chapter ?: title).ifBlank { title }
}

data class ChapterQuestionsResponse(
    val questions: List<PracticeQuestion> = emptyList(),
    val hasMore: Boolean = false,
    val totalCount: Int = 0,
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val matchedChapter: String? = null,
    val matchedSlug: String? = null,
    val matchedSubject: String? = null,
    val error: String? = null,
)

data class PracticeQuestion(
    val _id: String = "",
    val question: String = "",
    val options_A: String? = null,
    val options_B: String? = null,
    val options_C: String? = null,
    val options_D: String? = null,
    val correct_option: String? = null,
    val solution: String? = null,
    val solutiontext: String? = null,
    val difficulty: String? = null,
    val year: String? = null,
    val subject: String? = null,
    val chapter: String? = null,
    val topic: String? = null,
) {
    val id: String get() = _id
    fun options(): List<Pair<String, String>> = listOfNotNull(
        options_A?.takeIf { it.isNotBlank() }?.let { "A" to it },
        options_B?.takeIf { it.isNotBlank() }?.let { "B" to it },
        options_C?.takeIf { it.isNotBlank() }?.let { "C" to it },
        options_D?.takeIf { it.isNotBlank() }?.let { "D" to it },
    )
}

data class PracticeProgressResponse(
    val success: Boolean = false,
    val completed: List<String> = emptyList(),
    val correct: List<String> = emptyList(),
    val points: Int = 0,
    val error: String? = null,
)

data class ArticlesResponse(
    val success: Boolean = false,
    val data: List<ArticleSummary> = emptyList(),
    val pagination: ArticlesPagination? = null,
)

data class ArticlesPagination(
    val page: Int = 1,
    val pageSize: Int = 10,
    val totalCount: Int = 0,
    val totalPages: Int = 1,
    val hasMore: Boolean = false,
)

data class ArticleSummary(
    val id: Long = 0,
    val slug: String = "",
    val title: String = "",
    val excerpt: String? = null,
    val category: String? = null,
    val created_at: String? = null,
    val is_featured: Boolean = false,
    val featured_image_url: String? = null,
)

data class ArticleDetailResponse(
    val success: Boolean = false,
    val data: ArticleDetail? = null,
)

data class ArticleDetail(
    val id: String = "",
    val slug: String = "",
    val title: String = "",
    val content: String? = null,
    val excerpt: String? = null,
    val category: String? = null,
    val category_name: String? = null,
    val featured_image_url: String? = null,
    val created_at: String? = null,
)

data class MockOfDayResponse(
    val success: Boolean = false,
    val examCategory: String? = null,
    val mockOfTheDay: MockOfDayPayload? = null,
)

data class MockOfDayPayload(
    val status: String? = null,
    val title: String? = null,
    val description: String? = null,
    val date: String? = null,
    val mock: MockOfDayMock? = null,
)

data class MockOfDayMock(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val duration: Int = 0,
    val totalQuestions: Int = 0,
    val difficulty: String? = null,
    val href: String? = null,
    val isActive: Boolean = true,
)

/** Auth.js GET /api/auth/session — empty / null when signed out. */
data class AuthSessionResponse(
    val user: AuthSessionUser? = null,
    val expires: String? = null,
)

data class AuthSessionUser(
    val name: String? = null,
    val email: String? = null,
    val image: String? = null,
    val id: String? = null,
)

/** GET /api/mock-test/profile (alias /api/user/profile). */
data class UserProfileResponse(
    val success: Boolean = false,
    val profile: UserProfile? = null,
    val suggested: UserProfileSuggested? = null,
    val needsProfile: Boolean = false,
    val needsProfileCompletion: Boolean = false,
    val needsTermsReacceptance: Boolean = false,
    val error: String? = null,
    val dbSetupRequired: Boolean = false,
    val setupHint: String? = null,
)

data class UserProfile(
    val user_email: String? = null,
    val email: String? = null,
    val first_name: String? = null,
    val last_name: String? = null,
    val display_name: String? = null,
    val country: String? = null,
    val avatar_url: String? = null,
    val target_exam: String? = null,
    val profile_completed: Boolean = false,
)

data class UserProfileSuggested(
    val first_name: String? = null,
    val last_name: String? = null,
    val email: String? = null,
    val avatar_url: String? = null,
)

/** GET /api/credits/wallet */
data class CreditsWalletResponse(
    val success: Boolean = false,
    val email: String? = null,
    val credits: Int? = null,
    val unlimited: Boolean = false,
    val signupBonusGranted: Boolean = false,
    val subscription: CreditsSubscription? = null,
    val signupBonus: Int? = null,
    val error: String? = null,
)

data class CreditsSubscription(
    val planId: String? = null,
    val planName: String? = null,
    val expiresAt: String? = null,
)

