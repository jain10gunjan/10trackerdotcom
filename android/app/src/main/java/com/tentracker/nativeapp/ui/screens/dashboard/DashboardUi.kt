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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
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
import com.tentracker.nativeapp.data.UserDashboardResponse
import com.tentracker.nativeapp.ui.components.BrandLogo
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandDeep
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Ink
import com.tentracker.nativeapp.ui.theme.Muted
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
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFF8FAFC),
                            Color(0xFFF1F5F9),
                            Bg,
                        ),
                    ),
                ),
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(BrandSoft.copy(alpha = 0.55f), Color.Transparent),
                        center = Offset(900f, 120f),
                        radius = 520f,
                    ),
                ),
        )

        when {
            dashState.error != null && dashboard == null -> {
                DashboardErrorState(message = dashState.error.orEmpty(), onRetry = dashboardVm::reload)
            }
            showFullDashboard -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = StudentGutter),
                    verticalArrangement = Arrangement.spacedBy(StudentSectionSpacing),
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
                                onOpenPath = { href, title -> openDashboardHref(href, title, onOpenExams, onOpenExam, onOpenWeb) },
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
                            StudentRevealBlock(visible = true) {
                                DashboardActivityInsight(
                                summary = summary,
                                streak = streak,
                                examName = examName,
                                onPractice = {
                                    if (!practiceHref.isNullOrBlank()) {
                                        openDashboardHref(practiceHref, "Practice", onOpenExams, onOpenExam, onOpenWeb)
                                    } else if (examSlug.isNotBlank()) {
                                        onOpenExam(examSlug, examName ?: formatExamSlug(examSlug))
                                    } else {
                                        onOpenExams()
                                    }
                                },
                                onDaily = {
                                    if (!dailyHref.isNullOrBlank()) {
                                        openDashboardHref(dailyHref, "Daily practice", onOpenExams, onOpenExam, onOpenWeb)
                                    } else {
                                        onOpenExams()
                                    }
                                },
                                )
                            }
                        }

                        item {
                            StudentRevealBlock(visible = true, delayMillis = 60) {
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
                            }
                        }

                        item {
                            StudentRevealBlock(visible = true, delayMillis = 60) {
                            DashboardSection(
                                eyebrow = "Mocks",
                                title = examName?.let { "$it mocks" } ?: "Mocks",
                                description = "Daily, full-length, and topic-wise — this exam only.",
                                linkLabel = "All mocks",
                                onLink = mockHref?.let { href ->
                                    { openDashboardHref(href, "Mocks", onOpenExams, onOpenExam, onOpenWeb) }
                                },
                            ) {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
                                                m.href?.let { openDashboardHref(it, m.name, onOpenExams, onOpenExam, onOpenWeb) }
                                            },
                                        )
                                    }

                                    if (topicMocks.isNotEmpty()) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Text(
                                                "Topic mocks",
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 14.sp,
                                                color = Ink,
                                            )
                                            TextButton(onClick = {
                                                val href = examSlug.takeIf { it.isNotBlank() }?.let { "/mock-test/$it?type=topic" }
                                                    ?: mockHref
                                                href?.let {
                                                    openDashboardHref(it, "Topic mocks", onOpenExams, onOpenExam, onOpenWeb)
                                                }
                                            }) {
                                                Text("Browse all", fontSize = 12.sp, color = Muted)
                                            }
                                        }
                                        MockCardGrid(
                                            mocks = topicMocks,
                                            animateEntrance = true,
                                            onOpen = { m ->
                                                m.href?.let { openDashboardHref(it, m.name, onOpenExams, onOpenExam, onOpenWeb) }
                                            },
                                        )
                                    }

                                    if (fullMocks.isEmpty() && topicMocks.isEmpty()) {
                                        DashboardComingSoonCard(
                                            title = "Mocks coming soon",
                                            description = "Full-length and topic mocks for this exam will appear here.",
                                        )
                                    }
                                }
                            }
                            }
                        }

                        item {
                            StudentRevealBlock(visible = true, delayMillis = 60) {
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
                            }
                        }

                        if (updates.isNotEmpty()) {
                            item {
                                StudentRevealBlock(visible = true, delayMillis = 60) {
                                DashboardSection(
                                    eyebrow = "Updates",
                                    title = examName?.let { "$it news" } ?: "Exam updates",
                                    description = "Articles for this exam.",
                                    linkLabel = "All articles",
                                    onLink = {
                                        if (!articlesHref.isNullOrBlank()) {
                                            openDashboardHref(articlesHref, "Articles", onOpenExams, onOpenExam, onOpenWeb)
                                        } else {
                                            onOpenArticles()
                                        }
                                    },
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        updates.take(3).forEach { item ->
                                            DashboardUpdateCard(item) {
                                                if (item.slug.isNotBlank()) onOpenArticle(item.slug)
                                            }
                                        }
                                    }
                                }
                                }
                            }
                        }

                        val roadmaps = dashboard?.myRoadmaps.orEmpty()
                        if (roadmaps.isNotEmpty()) {
                            item {
                                StudentRevealBlock(visible = true, delayMillis = 60) {
                                DashboardSection(
                                    eyebrow = "Study plans",
                                    title = "Roadmaps",
                                    description = "Plans for ${examName ?: "this exam"}.",
                                    linkLabel = "Browse plans",
                                    onLink = onOpenRoadmaps,
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        roadmaps.take(3).forEach { rm ->
                                            Card(
                                                onClick = onOpenRoadmaps,
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(16.dp),
                                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                                            ) {
                                                Text(
                                                    rm.title,
                                                    modifier = Modifier.padding(16.dp),
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = Ink,
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

                    item { Spacer(modifier = Modifier.height(24.dp)) }
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
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
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
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color(0xFFD4D4D4))
            }
            Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Ink, modifier = Modifier.padding(top = 16.dp))
            Text(description, fontSize = 14.sp, color = Muted, lineHeight = 20.sp, modifier = Modifier.padding(top = 6.dp))
            Text("Open", color = Brand, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, modifier = Modifier.padding(top = 16.dp))
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
    StudentRevealBlock(visible = animateEntrance, modifier = Modifier.padding(bottom = StudentPulseBottomPad)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border.copy(alpha = 0.9f)),
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                rawStats.chunked(2).forEachIndexed { rowIndex, row ->
                    Row(modifier = Modifier.fillMaxWidth()) {
                        row.forEachIndexed { colIndex, (label, value) ->
                            val index = rowIndex * 2 + colIndex
                            val displayValue = rememberStudentCountUp(value, animateEntrance)
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
                                        displayValue.toString(),
                                        fontWeight = FontWeight.Black,
                                        fontSize = if (index == 0) 28.sp else 24.sp,
                                        color = if (index == 0) Brand else Ink,
                                    )
                                    Text(
                                        label.uppercase(),
                                        fontSize = 11.sp,
                                        letterSpacing = 1.4.sp,
                                        color = Muted,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
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
                                .background(Border.copy(alpha = 0.35f)),
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
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Brand),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.LocalFireDepartment, contentDescription = null, tint = Color.White)
                    }
                    Column {
                        Text(examName?.uppercase() ?: "YOUR EXAM", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Brand)
                        Text(
                            when {
                                streakDays > 0 -> "$streakDays-day streak"
                                practiced > 0 -> "Progress on this exam"
                                else -> "Start this exam today"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Ink,
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
        DashboardPathwayCard(
            title = "Practice",
            description = examName?.let { "$it topics" } ?: "Browse exams",
            icon = Icons.AutoMirrored.Filled.MenuBook,
            onClick = onPractice,
        )
        DashboardPathwayCard(
            title = "Daily set",
            description = "Short · no timer",
            icon = Icons.Default.Timer,
            onClick = onDaily,
        )
    }
}

@Composable
private fun InsightCell(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Bg)
            .border(1.dp, Border, RoundedCornerShape(12.dp))
            .padding(vertical = 10.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(value, fontWeight = FontWeight.Black, color = Ink)
        Text(label.uppercase(), fontSize = 9.sp, color = Muted, letterSpacing = 0.8.sp)
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
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Column {
            Text(eyebrow.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.6.sp, color = Brand)
            Text(title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Ink, modifier = Modifier.padding(top = 6.dp))
            Text(description, fontSize = 14.sp, color = Muted, lineHeight = 22.sp, modifier = Modifier.padding(top = 6.dp))
        }
        if (linkLabel != null && onLink != null) {
            OutlinedButton(
                onClick = onLink,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(linkLabel, color = Ink, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.weight(1f))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Brand)
            }
        }
        content()
    }
}

@Composable
private fun DashboardPlanCard(
    wallet: CreditsWalletResponse?,
    onUpgrade: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val unlimited = wallet?.unlimited == true
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("YOUR PLAN", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Brand)
            if (unlimited) {
                Text("Paid · ${wallet?.subscription?.planName ?: "Unlimited"}", fontWeight = FontWeight.Bold, color = Ink)
                Text("Unlimited access active", fontSize = 12.sp, color = Muted)
            } else {
                Text("Free", fontWeight = FontWeight.Bold, color = Ink)
                Text("${wallet?.credits ?: 0} credits left", fontSize = 12.sp, color = Muted)
                Button(
                    onClick = onUpgrade,
                    colors = ButtonDefaults.buttonColors(containerColor = Brand),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Default.FlashOn, contentDescription = null, tint = Color(0xFFFDE68A))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Upgrade")
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
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (countdown?.status == "unset") Color(0xFFD4D4D4) else Border,
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("DAYS TO EXAM", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Muted)
            if (countdown == null || !countdown.visible || countdown.status == "hidden") {
                Text("—", fontWeight = FontWeight.Bold, fontSize = 22.sp)
                Text("Countdown not available", fontSize = 12.sp, color = Muted)
            } else if (countdown.status == "unset") {
                Text("Date coming soon", fontWeight = FontWeight.Bold, color = Ink)
                Text(
                    countdown.label ?: "Official ${examName ?: "exam"} date will appear here.",
                    fontSize = 12.sp,
                    color = Muted,
                )
            } else {
                val days = countdown.daysLeft ?: 0
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(kotlin.math.abs(days).toString(), fontWeight = FontWeight.Black, fontSize = 32.sp, color = Brand)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (kotlin.math.abs(days) == 1) "day" else "days", color = Muted)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Muted, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(countdown.label ?: countdown.examDate.orEmpty(), fontSize = 12.sp, color = Muted)
                }
            }
        }
    }
}

@Composable
private fun DashboardMotdCard(motd: DashboardMockOfDay, onOpen: (String, String?) -> Unit) {
    val mock = motd.mock ?: return
    Card(
        onClick = { mock.href?.let { onOpen(it, mock.name) } },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BrandSoft.copy(alpha = 0.5f)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Brand.copy(alpha = 0.25f)),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("MOCK OF THE DAY", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Brand)
            Text(mock.name, fontWeight = FontWeight.Bold, color = Ink)
            Text(motd.description ?: mock.description.orEmpty(), fontSize = 13.sp, color = Muted, maxLines = 2)
        }
    }
}

@Composable
private fun DashboardComingSoonCard(title: String, description: String) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontWeight = FontWeight.SemiBold, color = Ink)
            Text(description, fontSize = 13.sp, color = Muted)
        }
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
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(mock.name, fontWeight = FontWeight.SemiBold, color = Ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
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
                        Text("Start mock", color = Brand, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
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
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(item.title, fontWeight = FontWeight.SemiBold, color = Ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
            item.excerpt?.let { Text(it, fontSize = 12.sp, color = Muted, maxLines = 2, overflow = TextOverflow.Ellipsis) }
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