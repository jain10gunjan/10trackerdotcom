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
