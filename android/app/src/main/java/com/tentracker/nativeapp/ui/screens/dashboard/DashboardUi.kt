package com.tentracker.nativeapp.ui.screens.dashboard

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.filled.AllInclusive
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tentracker.nativeapp.data.CreditsWalletResponse
import com.tentracker.nativeapp.data.DashboardCatalogStats
import com.tentracker.nativeapp.data.DashboardContinueOptions
import com.tentracker.nativeapp.data.DashboardCountdown
import com.tentracker.nativeapp.data.DashboardExamRef
import com.tentracker.nativeapp.data.DashboardMockCard
import com.tentracker.nativeapp.data.DashboardMockOfDay
import com.tentracker.nativeapp.data.DashboardPracticeArea
import com.tentracker.nativeapp.data.DashboardStreak
import com.tentracker.nativeapp.data.DashboardSummary
import com.tentracker.nativeapp.data.DashboardUpdateItem
import com.tentracker.nativeapp.ui.components.BrandLogo
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandDeep
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.theme.Neutral100
import com.tentracker.nativeapp.ui.theme.Neutral300
import com.tentracker.nativeapp.ui.theme.Neutral600
import com.tentracker.nativeapp.ui.theme.Neutral800
import com.tentracker.nativeapp.ui.viewmodel.DashboardViewModel
import java.util.Calendar
import java.util.Locale

internal fun greetingForHour(): String {
    val h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    return when {
        h < 12 -> "Good morning"
        h < 17 -> "Good afternoon"
        else -> "Good evening"
    }
}

internal fun formatExamSlug(slug: String): String =
    slug.split("-", "_")
        .filter { it.isNotBlank() }
        .joinToString(" ") { w -> w.replaceFirstChar { c -> c.titlecase(Locale.getDefault()) } }

@Composable
fun StudentSignedHomeScreen(
    dashboardVm: DashboardViewModel,
    onSignOut: () -> Unit,
    onOpenExams: () -> Unit,
    onOpenExam: (slug: String, name: String) -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenArticles: () -> Unit,
    onOpenRoadmaps: () -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onOpenArticle: (slug: String) -> Unit,
) {
    val dashState by dashboardVm.state.collectAsState()
    val dashboard = dashState.dashboard

    LaunchedEffect(dashboard?.focusedExam?.slug) {
        if (!dashState.initialLoading) {
            dashboardVm.syncFocusFromDashboard()
        }
    }

    val limitedMode = dashboard?.examsPreparing.isNullOrEmpty() &&
        dashboard?.focusedExam?.slug.isNullOrBlank()

    val examsPreparing = dashboardVm.filteredExamsPreparing()
    val focused = dashboard?.focusedExam ?: dashboard?.primaryExam
    val examSlug = focused?.slug ?: dashboard?.examFeed?.exam?.slug ?: dashState.focusExam
    val examName = focused?.name
        ?: dashboard?.examFeed?.exam?.name
        ?: examSlug.takeIf { it.isNotBlank() }?.let(::formatExamSlug)
    val feed = dashboard?.examFeed
    val practiceHref = feed?.links?.practiceHref
    val mockHref = feed?.links?.mockHref
    val dailyHref = feed?.links?.dailyHref
    val articlesHref = feed?.updatesHref ?: examSlug.takeIf { it.isNotBlank() }?.let { "/article/$it" }

    val profile = dashboard?.profile
    val displayName = profile?.displayName ?: "Student"
    val firstName = displayName.split(Regex("\\s+")).firstOrNull() ?: "there"

    val continueOptions = dashboard?.continueOptions
    val hasContinue = listOfNotNull(
        continueOptions?.practice?.href,
        continueOptions?.mock?.href,
        continueOptions?.fallback?.href,
    ).any { it.isNotBlank() }

    val catalog = feed?.catalogStats ?: DashboardCatalogStats()
    val topicMocks = feed?.topicMocks.orEmpty()
    val fullMocks = feed?.fullMocks.orEmpty()
    val updates = feed?.updates.orEmpty()
    val practiceAreas = dashboard?.practice?.filter { area ->
        examSlug.isBlank() || area.area.equals(examSlug, ignoreCase = true)
    }.orEmpty()
    val syllabusTopics = catalog.topicCount.takeIf { it > 0 }
        ?: catalog.chapterCount.takeIf { it > 0 }
        ?: practiceAreas.firstOrNull()?.topicsCount
        ?: topicMocks.size
    val streak = dashboard?.streak ?: DashboardStreak()
    val summary = dashboard?.summary
    val wallet = dashboard?.wallet

    val showExamSwitcher = !limitedMode && examsPreparing.size > 1
    val showFullDashboard = dashState.error == null || dashState.partialError
    val heroContentReady = showFullDashboard && !dashState.initialLoading
    val walletUnlimited = wallet?.unlimited == true
    val walletCredits = wallet?.credits

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg),
    ) {
        StudentHomeBackdrop(modifier = Modifier.matchParentSize())

        when {
            dashState.error != null && dashboard == null -> {
                DashboardErrorState(message = dashState.error.orEmpty(), onRetry = dashboardVm::reload)
            }
            showFullDashboard -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(
                        start = StudentGutter,
                        top = 0.dp,
                        end = StudentGutter,
                        bottom = StudentBodyBottomPad,
                    ),
                ) {
                    item {
                        Column(
                            modifier = Modifier.padding(top = 12.dp),
                            verticalArrangement = Arrangement.spacedBy(20.dp),
                        ) {
                            SignedHomeTopChrome(
                                displayName = displayName,
                                streak = streak.currentStreak,
                                credits = walletCredits,
                                unlimited = walletUnlimited,
                                loading = dashState.initialLoading,
                                onSignOut = onSignOut,
                            )

                            if (dashState.partialError) {
                                DashboardPartialErrorBanner(
                                    message = dashState.error.orEmpty(),
                                    partialErrors = dashboard?.partialErrors.orEmpty(),
                                    onRetry = dashboardVm::reload,
                                )
                            }

                            DashboardHeroSection(
                                firstName = firstName,
                                examName = examName,
                                examSlug = examSlug,
                                examsPreparing = examsPreparing,
                                showExamSwitcher = showExamSwitcher,
                                switchingExam = dashState.switchingExam,
                                initialLoading = dashState.initialLoading,
                                limitedMode = limitedMode,
                                hasContinue = hasContinue,
                                continueOptions = continueOptions,
                                practiceHref = practiceHref,
                                mockHref = mockHref,
                                topicMockCount = topicMocks.size,
                                onExamChange = dashboardVm::changeFocusExam,
                                onOpenPath = { href, title ->
                                    openDashboardHref(href, title, onOpenExams, onOpenExam, onOpenWeb)
                                },
                                onBrowseExams = onOpenExams,
                                animateEntrance = heroContentReady,
                            )
                        }
                    }

                    if (!limitedMode) {
                        item {
                            DashboardPulseRow(
                                streak = streak.currentStreak,
                                questions = catalog.questionCount,
                                mocks = catalog.mockCount,
                                topics = syllabusTopics,
                                loading = dashState.initialLoading,
                                animateEntrance = heroContentReady,
                            )
                        }
                    }

                    if (!limitedMode && !dashState.initialLoading) {
                        item {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(StudentSectionSpacing),
                            ) {
                                DashboardSection(
                                    eyebrow = "This exam",
                                    title = examName?.let { "$it at a glance" } ?: "At a glance",
                                    description = "Stats and shortcuts for the exam you selected.",
                                ) {
                                    DashboardActivityInsight(
                                        summary = summary,
                                        streak = streak,
                                        examName = examName,
                                        onPractice = {
                                            if (!practiceHref.isNullOrBlank()) {
                                                openDashboardHref(
                                                    practiceHref,
                                                    "Practice",
                                                    onOpenExams,
                                                    onOpenExam,
                                                    onOpenWeb,
                                                )
                                            } else if (examSlug.isNotBlank()) {
                                                onOpenExam(examSlug, examName ?: formatExamSlug(examSlug))
                                            } else {
                                                onOpenExams()
                                            }
                                        },
                                        onDaily = {
                                            if (!dailyHref.isNullOrBlank()) {
                                                openDashboardHref(
                                                    dailyHref,
                                                    "Daily practice",
                                                    onOpenExams,
                                                    onOpenExam,
                                                    onOpenWeb,
                                                )
                                            } else {
                                                onOpenExams()
                                            }
                                        },
                                    )
                                }

                                DashboardSection(
                                    eyebrow = "Plan",
                                    title = "Access & exam date",
                                    description = examName?.let { "Credits and countdown for $it." }
                                        ?: "Credits and countdown for your exam.",
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    ) {
                                        DashboardPlanCard(
                                            wallet = wallet,
                                            modifier = Modifier.weight(1f),
                                            onUpgrade = { onOpenWeb("/pricing", "Pricing") },
                                        )
                                        DashboardCountdownCard(
                                            countdown = feed?.countdown,
                                            examName = examName,
                                            modifier = Modifier.weight(1f),
                                        )
                                    }
                                }

                                DashboardSection(
                                    eyebrow = "Mocks",
                                    title = examName?.let { "$it mocks" } ?: "Mocks",
                                    description = "Daily, full-length, and topic-wise — this exam only.",
                                    linkLabel = "All mocks",
                                    onLink = mockHref?.let { href ->
                                        { openDashboardHref(href, "Mocks", onOpenExams, onOpenExam, onOpenWeb) }
                                    },
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                        val motd = feed?.mockOfTheDay
                                        if (motd?.status == "ready" && !motd.mock?.href.isNullOrBlank()) {
                                            DashboardMotdCard(motd) { href, title ->
                                                openDashboardHref(href, title, onOpenExams, onOpenExam, onOpenWeb)
                                            }
                                        } else {
                                            DashboardComingSoonCard(
                                                title = motd?.title ?: "Mock of the day",
                                                description = motd?.description
                                                    ?: "A fresh daily mock for this exam is coming soon.",
                                            )
                                        }

                                        if (fullMocks.isNotEmpty()) {
                                            MockCardGrid(
                                                mocks = fullMocks,
                                                animateEntrance = true,
                                                onOpen = { m ->
                                                    m.href?.let {
                                                        openDashboardHref(it, m.name, onOpenExams, onOpenExam, onOpenWeb)
                                                    }
                                                },
                                            )
                                        }

                                        if (topicMocks.isNotEmpty()) {
                                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically,
                                                ) {
                                                    Text(
                                                        "Topic mocks",
                                                        fontWeight = FontWeight.SemiBold,
                                                        fontSize = 14.sp,
                                                        color = Neutral800,
                                                    )
                                                    TextButton(onClick = {
                                                        val href = examSlug.takeIf { it.isNotBlank() }
                                                            ?.let { "/mock-test/$it?type=topic" }
                                                            ?: mockHref
                                                        href?.let {
                                                            openDashboardHref(
                                                                it,
                                                                "Topic mocks",
                                                                onOpenExams,
                                                                onOpenExam,
                                                                onOpenWeb,
                                                            )
                                                        }
                                                    }) {
                                                        Text("Browse all", fontSize = 12.sp, color = Muted)
                                                    }
                                                }
                                                MockCardGrid(
                                                    mocks = topicMocks,
                                                    animateEntrance = true,
                                                    onOpen = { m ->
                                                        m.href?.let {
                                                            openDashboardHref(
                                                                it,
                                                                m.name,
                                                                onOpenExams,
                                                                onOpenExam,
                                                                onOpenWeb,
                                                            )
                                                        }
                                                    },
                                                )
                                            }
                                        }

                                        if (fullMocks.isEmpty() && topicMocks.isEmpty()) {
                                            DashboardComingSoonCard(
                                                title = "Mocks coming soon",
                                                description = "Full-length and topic mocks for this exam will appear here.",
                                            )
                                        }
                                    }
                                }

                                DashboardSection(
                                    eyebrow = "Practice",
                                    title = examName?.let { "$it topics" } ?: "Your topics",
                                    description = "Topics you've practiced on this exam.",
                                    linkLabel = "All topics",
                                    onLink = practiceHref?.let { href ->
                                        { openDashboardHref(href, "Practice", onOpenExams, onOpenExam, onOpenWeb) }
                                    },
                                ) {
                                    DashboardPracticePanel(
                                        areas = practiceAreas,
                                        onOpenExam = {
                                            if (examSlug.isNotBlank()) {
                                                onOpenExam(examSlug, examName ?: formatExamSlug(examSlug))
                                            } else {
                                                onOpenExams()
                                            }
                                        },
                                    )
                                }

                                if (updates.isNotEmpty()) {
                                    DashboardSection(
                                        eyebrow = "Updates",
                                        title = examName?.let { "$it news" } ?: "Exam updates",
                                        description = "Articles for this exam.",
                                        linkLabel = "All articles",
                                        onLink = {
                                            if (!articlesHref.isNullOrBlank()) {
                                                openDashboardHref(
                                                    articlesHref,
                                                    "Articles",
                                                    onOpenExams,
                                                    onOpenExam,
                                                    onOpenWeb,
                                                )
                                            } else {
                                                onOpenArticles()
                                            }
                                        },
                                    ) {
                                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                            updates.take(3).forEach { item ->
                                                DashboardUpdateCard(item) {
                                                    if (item.slug.isNotBlank()) onOpenArticle(item.slug)
                                                }
                                            }
                                        }
                                    }
                                }

                                val roadmaps = dashboard?.myRoadmaps.orEmpty()
                                if (roadmaps.isNotEmpty()) {
                                    DashboardSection(
                                        eyebrow = "Study plans",
                                        title = "Roadmaps",
                                        description = "Plans for ${examName ?: "this exam"}.",
                                        linkLabel = "Browse plans",
                                        onLink = onOpenRoadmaps,
                                    ) {
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(16.dp),
                                            colors = CardDefaults.cardColors(containerColor = Color.White),
                                            border = androidx.compose.foundation.BorderStroke(
                                                1.dp,
                                                Border.copy(alpha = 0.9f),
                                            ),
                                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(20.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                            ) {
                                                roadmaps.take(3).forEach { rm ->
                                                    Text(
                                                        rm.title,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = Ink,
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .clickable(onClick = onOpenRoadmaps)
                                                            .padding(vertical = 4.dp),
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!limitedMode && dashState.initialLoading) {
                        item {
                            DashboardLoadingSkeleton()
                        }
                    }
                }
            }
        }

        if (dashState.loading && dashboard != null && dashState.switchingExam) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = 8.dp),
                contentAlignment = Alignment.TopCenter,
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(28.dp),
                    color = Brand,
                    strokeWidth = 2.dp,
                )
            }
        }
    }
}

private fun openDashboardHref(
    href: String,
    title: String?,
    onOpenExams: () -> Unit,
    onOpenExam: (slug: String, name: String) -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
) {
    val path = href.trim()
    if (path.isBlank()) {
        onOpenExams()
        return
    }
    val examFromPractice = Regex("^/([^/]+)/(?:practice|subjects|chapters)").find(path)?.groupValues?.getOrNull(1)
    if (examFromPractice != null) {
        onOpenExam(examFromPractice, formatExamSlug(examFromPractice))
        return
    }
    onOpenWeb(path, title)
}

@Composable
private fun SignedHomeTopChrome(
    displayName: String,
    streak: Int,
    credits: Int?,
    unlimited: Boolean,
    loading: Boolean,
    onSignOut: () -> Unit,
) {
    val initials = remember(displayName) {
        displayName.trim().split(Regex("\\s+")).let { parts ->
            when {
                parts.size >= 2 -> "${parts[0].first()}${parts[1].first()}".uppercase(Locale.getDefault())
                parts.firstOrNull().orEmpty().length >= 2 -> parts.first().take(2).uppercase(Locale.getDefault())
                else -> "ST"
            }
        }
    }

    StudentFadeInUp(play = !loading, delayMillis = 0) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            BrandLogo(nameSize = 20.sp)
            if (loading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(72.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White)
                        .border(1.dp, Border, RoundedCornerShape(16.dp)),
                )
            } else {
                Card(
                    onClick = onSignOut,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFF5F5F5))
                                .border(1.dp, Border, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(initials, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Muted)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                displayName,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                color = Ink,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.padding(top = 2.dp),
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.LocalFireDepartment,
                                        contentDescription = null,
                                        tint = Color(0xFFF97316),
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        if (streak > 0) "$streak day streak" else "Start your streak",
                                        fontSize = 12.sp,
                                        color = Muted,
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.MonetizationOn,
                                        contentDescription = null,
                                        tint = if (unlimited) Color(0xFF059669) else Color(0xFFD97706),
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        if (unlimited) "Unlimited" else "${credits ?: 0} credits",
                                        fontSize = 12.sp,
                                        color = Muted,
                                    )
                                }
                            }
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = "Account", tint = Muted, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardErrorState(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFEF4444))
                Text("Could not load your home", fontWeight = FontWeight.SemiBold, color = Color(0xFF7F1D1D))
                Text(message, fontSize = 14.sp, color = Color(0xFFB91C1C))
                Button(
                    onClick = onRetry,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Try again")
                }
            }
        }
    }
}

@Composable
private fun DashboardPartialErrorBanner(
    message: String,
    partialErrors: List<String>,
    onRetry: () -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Some sections didn't load", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Text(message, fontSize = 12.sp, color = Muted)
                if (partialErrors.isNotEmpty()) {
                    Text(partialErrors.joinToString(", "), fontSize = 11.sp, color = Muted)
                }
            }
            TextButton(onClick = onRetry) {
                Text("Retry", color = Brand)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DashboardHeroSection(
    firstName: String,
    examName: String?,
    examSlug: String,
    examsPreparing: List<DashboardExamRef>,
    showExamSwitcher: Boolean,
    switchingExam: Boolean,
    initialLoading: Boolean,
    limitedMode: Boolean,
    hasContinue: Boolean,
    continueOptions: DashboardContinueOptions?,
    practiceHref: String?,
    mockHref: String?,
    topicMockCount: Int,
    onExamChange: (String) -> Unit,
    onOpenPath: (String, String?) -> Unit,
    onBrowseExams: () -> Unit,
    animateEntrance: Boolean,
) {
  val switchAlpha by animateFloatAsState(
        targetValue = if (switchingExam) 0.7f else 1f,
        animationSpec = tween(200),
        label = "heroSwitchAlpha",
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = StudentHeroBottomPad)
            .alpha(switchAlpha),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (showExamSwitcher) {
            StudentFadeInUp(play = animateEntrance, delayMillis = 0) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Column {
                        Text(
                            "Focus exam",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.6.sp,
                            color = Muted,
                        )
                        Text(
                            "Switch to personalize mocks, updates, and countdown.",
                            fontSize = 14.sp,
                            color = Muted,
                            modifier = Modifier.padding(top = 2.dp),
                        )
                    }
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .border(1.dp, Border.copy(alpha = 0.8f), RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.9f))
                            .padding(4.dp)
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        examsPreparing.forEach { exam ->
                            val active = exam.slug == examSlug
                            val shape = RoundedCornerShape(12.dp)
                            Box(
                                modifier = Modifier
                                    .clip(shape)
                                    .background(if (active) Brand else Color.Transparent)
                                    .clickable(enabled = !active && !switchingExam) { onExamChange(exam.slug) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                            ) {
                                Text(
                                    exam.name,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (active) Color.White else Muted,
                                )
                            }
                        }
                    }
                }
            }
        }

        if (initialLoading) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = Brand, trackColor = BrandSoft)
            return
        }

        StudentFadeInUp(play = animateEntrance, delayMillis = 40) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(999.dp))
                    .background(BrandSoft.copy(alpha = 0.92f))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Icon(Icons.Default.Star, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
                Text(
                    text = examName?.let { "Preparing for $it" } ?: "10Tracker · Your study home",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = BrandDeep,
                )
            }
        }

        StudentFadeInUp(play = animateEntrance, delayMillis = 80) {
            Text(
                text = "${greetingForHour()}, $firstName",
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontSize = 30.sp,
                    lineHeight = 34.sp,
                    fontWeight = FontWeight.Black,
                ),
                color = Ink,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        StudentFadeInUp(play = animateEntrance, delayMillis = 120) {
            Text(
                text = when {
                    hasContinue ->
                        "One clear next step — continue practice or a mock, then explore what's new for your exam."
                    examName != null ->
                        "Your $examName home: practice, mocks, updates, and a countdown to exam day."
                    else ->
                        "Choose an exam to practice. Your personalized home will build around it."
                },
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp, lineHeight = 22.sp),
                color = Muted,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        StudentFadeInUp(play = animateEntrance, delayMillis = 160) {
            Column(modifier = Modifier.padding(top = 12.dp)) {
                Text(
                    "Continue",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.6.sp,
                    color = Brand,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                DashboardContinueBlock(
                    options = continueOptions,
                    emptyHref = practiceHref,
                    emptyLabel = examName?.let { "Start $it practice" } ?: "Browse exams",
                    onOpen = onOpenPath,
                    onBrowseExams = onBrowseExams,
                )
            }
        }

        if (!limitedMode) {
            StudentFadeInUp(play = animateEntrance, delayMillis = 200) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    Text(
                        "Start a session",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.6.sp,
                        color = Brand,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        val pathways = listOf(
                            Triple("Practice", examName?.let { "Chapter-wise MCQs for $it." } ?: "Topic-wise MCQs across your exams.", Icons.AutoMirrored.Filled.MenuBook) to {
                                if (!practiceHref.isNullOrBlank()) onOpenPath(practiceHref, "Practice") else onBrowseExams()
                            },
                            Triple("Mock tests", examName?.let { "Timed mocks for $it." } ?: "Full-length timed tests when you are ready.", Icons.Default.Timer) to {
                                if (!mockHref.isNullOrBlank()) onOpenPath(mockHref, "Mocks") else onBrowseExams()
                            },
                            Triple(
                                "Topic mocks",
                                when {
                                    topicMockCount > 0 -> "$topicMockCount topic-wise mock${if (topicMockCount == 1) "" else "s"} ready."
                                    examName != null -> "Shorter topic-scoped mocks for $examName."
                                    else -> "Shorter mocks scoped to a chapter or topic."
                                },
                                Icons.Default.Layers,
                            ) to {
                                val href = examSlug.takeIf { it.isNotBlank() }?.let { "/mock-test/$it?type=topic" } ?: mockHref
                                if (!href.isNullOrBlank()) onOpenPath(href, "Topic mocks") else onBrowseExams()
                            },
                        )
                        pathways.forEachIndexed { index, (meta, onClick) ->
                            val (title, description, icon) = meta
                            StudentStaggerItem(index = index, play = animateEntrance) {
                                DashboardPathwayCard(
                                    title = title,
                                    description = description,
                                    icon = icon,
                                    onClick = onClick,
                                )
                            }
                        }
                    }
                }
            }
        } else {
            StudentFadeInUp(play = animateEntrance, delayMillis = 200) {
                Button(
                    onClick = onBrowseExams,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    modifier = Modifier.padding(top = 8.dp),
                ) {
                    Text("Browse exams")
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
                }
            }
        }
    }
}

@Composable
private fun DashboardContinueBlock(
    options: DashboardContinueOptions?,
    emptyHref: String?,
    emptyLabel: String,
    onOpen: (String, String?) -> Unit,
    onBrowseExams: () -> Unit,
) {
    val practice = options?.practice
    val mock = options?.mock
    val fallback = options?.fallback
    val showFallback = fallback?.href != null && practice?.href == null && mock?.href == null

    when {
        practice?.href != null -> ContinueCard(
            eyebrow = "Pick up where you left off",
            title = listOfNotNull(practice.subject, practice.topic).joinToString(" · "),
            description = practice.description,
            cta = "Continue",
            onClick = { onOpen(practice.href!!, practice.topic ?: "Practice") },
        )
        mock?.href != null -> ContinueCard(
            eyebrow = "Mock test in progress",
            title = mock.title ?: mock.subject ?: "Mock test",
            description = mock.description,
            cta = "Resume",
            onClick = { onOpen(mock.href!!, mock.title) },
        )
        showFallback -> ContinueCard(
            eyebrow = "Continue learning",
            title = fallback?.subject ?: "Get started",
            description = fallback?.description,
            cta = "Get started",
            onClick = { onOpen(fallback!!.href!!, fallback.subject) },
        )
        else -> Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            border = androidx.compose.foundation.BorderStroke(1.dp, Brand.copy(alpha = 0.25f)),
        ) {
            Column(
                modifier = Modifier
                    .background(
                        Brush.linearGradient(
                            colors = listOf(BrandSoft.copy(alpha = 0.9f), Color.White),
                        ),
                    )
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("READY WHEN YOU ARE", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = BrandDeep)
                Text("No session in progress", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Ink)
                Text("Start practicing and we'll save your place for next time.", fontSize = 14.sp, color = Muted)
                Button(
                    onClick = {
                        if (!emptyHref.isNullOrBlank()) onOpen(emptyHref, emptyLabel)
                        else onBrowseExams()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(emptyLabel)
                }
            }
        }
    }
}

@Composable
private fun ContinueCard(
    eyebrow: String,
    title: String,
    description: String?,
    cta: String,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Brand.copy(alpha = 0.2f)),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(eyebrow.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Brand)
            Text(title, fontWeight = FontWeight.Bold, color = Ink)
            description?.let { Text(it, fontSize = 13.sp, color = Muted) }
            Text(cta, color = Brand, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        }
    }
}

@Composable
private fun DashboardPathwayCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 2.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = Brand.copy(alpha = 0.12f),
                spotColor = Brand.copy(alpha = 0.18f),
                clip = false,
            ),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Brand),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                }
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Neutral300)
            }
            Text(
                title,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Ink,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                description,
                fontSize = 14.sp,
                color = Neutral600,
                lineHeight = 20.sp,
                modifier = Modifier.padding(top = 6.dp),
            )
            Text(
                "Open",
                color = Brand,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                modifier = Modifier.padding(top = 16.dp),
            )
        }
    }
}

@Composable
private fun DashboardPulseRow(
    streak: Int,
    questions: Int,
    mocks: Int,
    topics: Int,
    loading: Boolean,
    animateEntrance: Boolean,
) {
    if (loading) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = StudentPulseBottomPad)
                .height(88.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White)
                .border(1.dp, Border, RoundedCornerShape(16.dp)),
        )
        return
    }
    val rawStats = listOf(
        "Day streak" to streak,
        "Questions" to questions,
        "Mocks" to mocks,
        "Topics" to topics,
    )
    StudentRevealBlock(
        visible = animateEntrance,
        modifier = Modifier.padding(bottom = StudentPulseBottomPad),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = 14.dp,
                    shape = RoundedCornerShape(16.dp),
                    ambientColor = Brand.copy(alpha = 0.22f),
                    spotColor = Brand.copy(alpha = 0.28f),
                    clip = false,
                )
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.92f))
                .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp)),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(56.dp)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(BrandSoft.copy(alpha = 0.7f), Color.Transparent),
                            radius = 280f,
                        ),
                    )
                    .alpha(0.7f),
            )
            Column(modifier = Modifier.fillMaxWidth()) {
                rawStats.chunked(2).forEachIndexed { rowIndex, row ->
                    Row(modifier = Modifier.fillMaxWidth()) {
                        row.forEachIndexed { colIndex, (label, value) ->
                            val index = rowIndex * 2 + colIndex
                            val displayValue = rememberStudentCountUp(value, animateEntrance)
                            if (colIndex > 0) {
                                Box(
                                    modifier = Modifier
                                        .width(1.dp)
                                        .height(88.dp)
                                        .background(Neutral100),
                                )
                            }
                            StudentStaggerItem(
                                index = index,
                                play = animateEntrance,
                                modifier = Modifier.weight(1f),
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 20.dp, horizontal = 12.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    Text(
                                        "%,d".format(Locale.getDefault(), displayValue),
                                        fontWeight = FontWeight.Black,
                                        fontSize = 24.sp,
                                        color = if (index == 0) Brand else Ink,
                                    )
                                    Text(
                                        label.uppercase(Locale.getDefault()),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        letterSpacing = 1.4.sp,
                                        color = Muted,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(top = 8.dp),
                                    )
                                }
                            }
                        }
                    }
                    if (rowIndex == 0) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(Neutral100),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardActivityInsight(
    summary: DashboardSummary?,
    streak: DashboardStreak,
    examName: String?,
    onPractice: () -> Unit,
    onDaily: () -> Unit,
) {
    val practiced = summary?.practiceQuestions ?: 0
    val accuracy = summary?.practiceAccuracy ?: 0
    val mocksDone = summary?.mockTestsCompleted ?: 0
    val streakDays = streak.currentStreak

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White)
                .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp)),
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 24.dp, y = (-40).dp)
                    .size(140.dp)
                    .alpha(0.55f)
                    .background(BrandSoft, CircleShape),
            )
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Brand),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Default.LocalFireDepartment,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            (examName ?: "Your exam").uppercase(Locale.getDefault()),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.6.sp,
                            color = Brand,
                        )
                        Text(
                            when {
                                streakDays > 0 -> "$streakDays-day streak"
                                practiced > 0 -> "Progress on this exam"
                                else -> "Start this exam today"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Ink,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    InsightCell("Practiced", practiced.toString(), Modifier.weight(1f))
                    InsightCell("Accuracy", if (practiced > 0) "$accuracy%" else "—", Modifier.weight(1f))
                    InsightCell("Mocks", mocksDone.toString(), Modifier.weight(1f))
                }
            }
        }
        ActivityShortcutRow(
            title = "Practice",
            description = examName?.let { "$it topics" } ?: "Browse exams",
            icon = Icons.AutoMirrored.Filled.MenuBook,
            softIcon = false,
            onClick = onPractice,
        )
        ActivityShortcutRow(
            title = "Daily set",
            description = "Short · no timer",
            icon = Icons.Default.Timer,
            softIcon = true,
            onClick = onDaily,
        )
    }
}

@Composable
private fun ActivityShortcutRow(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    softIcon: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .then(
                    if (softIcon) {
                        Modifier
                            .background(BrandSoft)
                            .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                    } else {
                        Modifier.background(Brand)
                    },
                ),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (softIcon) Brand else Color.White,
                modifier = Modifier.size(20.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Ink)
            Text(description, fontSize = 12.sp, color = Muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Neutral300, modifier = Modifier.size(16.dp))
    }
}

@Composable
private fun InsightCell(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Bg.copy(alpha = 0.8f))
            .border(1.dp, Border, RoundedCornerShape(12.dp))
            .padding(vertical = 10.dp, horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(value, fontWeight = FontWeight.Black, fontSize = 18.sp, color = Ink)
        Text(
            label.uppercase(Locale.getDefault()),
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Muted,
            letterSpacing = 0.8.sp,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun DashboardSection(
    eyebrow: String,
    title: String,
    description: String,
    linkLabel: String? = null,
    onLink: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    Column {
        StudentRevealBlock(visible = true, delayMillis = 0) {
            Column(
                modifier = Modifier.padding(bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Column {
                    Text(
                        eyebrow.uppercase(Locale.getDefault()),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.6.sp,
                        color = Brand,
                    )
                    Text(
                        title,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Ink,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                    Text(
                        description,
                        fontSize = 14.sp,
                        color = Neutral600,
                        lineHeight = 22.sp,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                }
                if (linkLabel != null && onLink != null) {
                    OutlinedButton(
                        onClick = onLink,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                        colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(linkLabel, color = Neutral800, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.weight(1f))
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Brand)
                    }
                }
            }
        }
        StudentRevealBlock(visible = true, delayMillis = StudentRevealChildDelayMs) {
            content()
        }
    }
}

@Composable
private fun SoftGlowBlob(
    modifier: Modifier = Modifier,
    size: androidx.compose.ui.unit.Dp = 96.dp,
) {
    Box(
        modifier = modifier
            .size(size)
            .alpha(0.65f)
            .background(BrandSoft, CircleShape),
    )
}

@Composable
private fun DashboardPlanCard(
    wallet: CreditsWalletResponse?,
    onUpgrade: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val unlimited = wallet?.unlimited == true
    Box(
        modifier = modifier
            .shadow(
                elevation = 10.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = Brand.copy(alpha = 0.2f),
                spotColor = Brand.copy(alpha = 0.25f),
                clip = false,
            )
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp)),
    ) {
        SoftGlowBlob(modifier = Modifier.align(Alignment.TopEnd).offset(x = 20.dp, y = (-20).dp))
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                "YOUR PLAN",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.4.sp,
                color = Brand,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .then(
                            if (unlimited) {
                                Modifier.background(Brand)
                            } else {
                                Modifier
                                    .background(BrandSoft)
                                    .border(1.dp, Brand.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            },
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        if (unlimited) Icons.Default.AllInclusive else Icons.Default.MonetizationOn,
                        contentDescription = null,
                        tint = if (unlimited) Color.White else Brand,
                        modifier = Modifier.size(16.dp),
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    if (unlimited) {
                        Text(
                            "Paid · ${wallet?.subscription?.planName ?: "Unlimited"}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Ink,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text("Unlimited access active", fontSize = 12.sp, color = Muted)
                    } else {
                        Text("Free", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Ink)
                        Text("${wallet?.credits ?: 0} credits left", fontSize = 12.sp, color = Muted)
                    }
                }
            }
            if (unlimited) {
                TextButton(
                    onClick = onUpgrade,
                    contentPadding = PaddingValues(0.dp),
                ) {
                    Text("Manage plan", color = Brand, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = Brand,
                        modifier = Modifier.size(14.dp),
                    )
                }
            } else {
                Button(
                    onClick = onUpgrade,
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Default.FlashOn, contentDescription = null, tint = Color(0xFFFDE68A), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Upgrade", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun DashboardCountdownCard(
    countdown: DashboardCountdown?,
    examName: String?,
    modifier: Modifier = Modifier,
) {
    val dashedUnset = countdown == null || !countdown.visible || countdown.status == "unset" || countdown.status == "hidden"
    if (dashedUnset) {
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.8f))
                .border(1.dp, Neutral300, RoundedCornerShape(16.dp)),
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    "DAYS TO EXAM",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.4.sp,
                    color = Muted,
                )
                Text(
                    if (countdown?.status == "unset") "Date coming soon" else "Not set yet",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Neutral800,
                )
                Text(
                    countdown?.label
                        ?: "Your admin can set the official ${examName ?: "exam"} date from Platform exams.",
                    fontSize = 12.sp,
                    color = Muted,
                    lineHeight = 18.sp,
                )
            }
        }
        return
    }

    val active = countdown ?: return
    val days = active.daysLeft ?: 0
    val dateLabel = active.label ?: active.examDate.orEmpty()
    val headline = when (active.status) {
        "today" -> "0"
        else -> kotlin.math.abs(days).toString()
    }
    val sub = when (active.status) {
        "today" -> "Today is exam day"
        "past" -> "days since${if (dateLabel.isNotBlank()) " · $dateLabel" else ""}"
        else -> "days left${if (dateLabel.isNotBlank()) " · $dateLabel" else ""}"
    }

    Box(
        modifier = modifier
            .shadow(
                elevation = 10.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = Brand.copy(alpha = 0.2f),
                spotColor = Brand.copy(alpha = 0.25f),
                clip = false,
            )
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp)),
    ) {
        SoftGlowBlob(modifier = Modifier.align(Alignment.BottomStart).offset(x = (-24).dp, y = 24.dp))
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                "DAYS TO ${examName ?: "exam"}".uppercase(Locale.getDefault()),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.4.sp,
                color = Brand,
            )
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 4.dp),
            ) {
                Text(
                    headline,
                    fontWeight = FontWeight.Black,
                    fontSize = 36.sp,
                    color = Ink,
                    lineHeight = 36.sp,
                )
                Icon(
                    Icons.Default.CalendarMonth,
                    contentDescription = null,
                    tint = Brand,
                    modifier = Modifier
                        .padding(bottom = 4.dp)
                        .size(20.dp),
                )
            }
            Text(sub, fontSize = 12.sp, color = Neutral600, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun DashboardMotdCard(motd: DashboardMockOfDay, onOpen: (String, String?) -> Unit) {
    val mock = motd.mock ?: return
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 16.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = Color(0xFF0F172A).copy(alpha = 0.14f),
                spotColor = Color(0xFF0F172A).copy(alpha = 0.18f),
                clip = false,
            )
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Border.copy(alpha = 0.9f), RoundedCornerShape(16.dp))
            .clickable { mock.href?.let { onOpen(it, mock.name) } },
    ) {
        SoftGlowBlob(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 28.dp, y = (-28).dp),
            size = 144.dp,
        )
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .border(1.dp, Brand.copy(alpha = 0.25f), RoundedCornerShape(999.dp))
                    .background(BrandSoft.copy(alpha = 0.8f))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Icon(Icons.Default.Star, contentDescription = null, tint = Brand, modifier = Modifier.size(14.dp))
                Text(
                    "Today",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BrandDeep,
                )
            }
            Text(
                mock.name.ifBlank { "Mock of the day" },
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = Ink,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            val desc = motd.description ?: mock.description.orEmpty()
            if (desc.isNotBlank()) {
                Text(desc, fontSize = 14.sp, color = Neutral600, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            Text(
                listOfNotNull(
                    mock.totalQuestions.takeIf { it > 0 }?.let { "$it questions" },
                    mock.duration.takeIf { it > 0 }?.let { "$it min" },
                    mock.difficulty?.takeIf { it.isNotBlank() },
                ).joinToString(" · "),
                fontSize = 12.sp,
                color = Muted,
            )
            Button(
                onClick = { mock.href?.let { onOpen(it, mock.name) } },
                colors = ButtonDefaults.buttonColors(containerColor = Brand),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Start mock", fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.width(8.dp))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun DashboardComingSoonCard(title: String, description: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.8f))
            .border(1.dp, Neutral300, RoundedCornerShape(16.dp))
            .padding(horizontal = 24.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(BrandSoft)
                .border(1.dp, Brand.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Default.AccessTime, contentDescription = null, tint = Brand, modifier = Modifier.size(20.dp))
        }
        Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Ink, textAlign = TextAlign.Center)
        Text(
            description,
            fontSize = 14.sp,
            color = Neutral600,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp,
        )
    }
}

@Composable
private fun MockCardGrid(
    mocks: List<DashboardMockCard>,
    animateEntrance: Boolean,
    onOpen: (DashboardMockCard) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        mocks.forEachIndexed { index, mock ->
            StudentStaggerItem(index = index, play = animateEntrance) {
                Card(
                    onClick = { onOpen(mock) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            mock.name,
                            fontWeight = FontWeight.SemiBold,
                            color = Ink,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        mock.description?.takeIf { it.isNotBlank() }?.let {
                            Text(it, fontSize = 12.sp, color = Muted, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                        Text(
                            listOfNotNull(
                                mock.totalQuestions.takeIf { it > 0 }?.let { "$it Qs" },
                                mock.duration.takeIf { it > 0 }?.let { "$it min" },
                                mock.difficulty?.takeIf { it.isNotBlank() },
                            ).joinToString(" · "),
                            fontSize = 11.sp,
                            color = Muted,
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Start mock", color = Brand, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = null,
                                tint = Brand,
                                modifier = Modifier.size(14.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardPracticePanel(
    areas: List<DashboardPracticeArea>,
    onOpenExam: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        if (areas.isEmpty()) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("No topics practiced yet", fontWeight = FontWeight.SemiBold)
                Text("Start your first session to see progress here.", fontSize = 13.sp, color = Muted)
                TextButton(onClick = onOpenExam) {
                    Text("Start practice", color = Brand, fontWeight = FontWeight.SemiBold)
                }
            }
        } else {
            Column(modifier = Modifier.padding(8.dp)) {
                areas.forEach { area ->
                    area.topics.take(5).forEach { topic ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onOpenExam)
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(topic.topic, fontWeight = FontWeight.Medium, color = Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(
                                    "${topic.completedQuestions} answered · ${topic.accuracy}%",
                                    fontSize = 12.sp,
                                    color = Muted,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardUpdateCard(item: DashboardUpdateItem, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                item.title,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                color = Ink,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            item.excerpt?.takeIf { it.isNotBlank() }?.let {
                Text(it, fontSize = 12.sp, color = Muted, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun DashboardLoadingSkeleton() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(3) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .border(1.dp, Border, RoundedCornerShape(16.dp)),
            )
        }
    }
}