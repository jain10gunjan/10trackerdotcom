package com.tentracker.nativeapp.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.spring
import androidx.compose.ui.unit.IntOffset
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsBottomHeight
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.tentracker.nativeapp.data.ActiveExam
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.SessionStore
import com.tentracker.nativeapp.ui.screens.ArticlesScreen
import com.tentracker.nativeapp.ui.screens.ExamsScreen
import com.tentracker.nativeapp.ui.screens.HomeScreen
import com.tentracker.nativeapp.ui.screens.MoreScreen
import com.tentracker.nativeapp.ui.screens.MoreSheetChrome
import com.tentracker.nativeapp.ui.screens.MoreSheetScrollContent
import com.tentracker.nativeapp.ui.screens.TrackersScreen
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.util.openSite
import com.tentracker.nativeapp.ui.viewmodel.ArticlesViewModel
import com.tentracker.nativeapp.ui.viewmodel.DashboardViewModel
import com.tentracker.nativeapp.ui.viewmodel.ExamsViewModel
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel
import com.tentracker.nativeapp.ui.viewmodel.MoreViewModel

private data class Tab(val route: String?, val label: String, val icon: ImageVector)

/** Matches web `MOBILE_TAB_NAV` plus a More affordance (sheet, not a route). */
private val mobileBarTabs = listOf(
    Tab("tab_home", "Home", Icons.Default.Home),
    Tab("tab_exams", "Exams", Icons.AutoMirrored.Filled.MenuBook),
    Tab(null, "Pricing", Icons.Default.CurrencyRupee),
    Tab("tab_updates", "Updates", Icons.Default.Campaign),
)

private val TabInactive = Color(0xFF737373)

private fun isMoreNavActive(route: String?): Boolean =
    route == "tab_more" || route == "tab_trackers"

@Composable
private fun MobileBottomBar(
    current: String,
    moreSheetOpen: Boolean,
    barEnabled: Boolean,
    onTabSelected: (String) -> Unit,
    onOpenPricing: () -> Unit,
    onMoreClick: () -> Unit,
) {
    val moreActive = isMoreNavActive(current) || moreSheetOpen
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (moreSheetOpen) 0f else 1f)
            .background(Color.White.copy(alpha = 0.95f)),
    ) {
        HorizontalDivider(color = Border.copy(alpha = 0.9f), thickness = 1.dp)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            mobileBarTabs.forEach { tab ->
                val active = tab.route != null && current == tab.route
                val contentColor = if (active) Brand else TabInactive
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clickable(enabled = barEnabled) {
                            if (tab.route != null) {
                                onTabSelected(tab.route)
                            } else {
                                onOpenPricing()
                            }
                        }
                        .padding(horizontal = 4.dp, vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
                ) {
                    Icon(
                        tab.icon,
                        contentDescription = tab.label,
                        tint = contentColor,
                        modifier = Modifier.size(20.dp),
                    )
                    Text(
                        text = tab.label,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        color = contentColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                        lineHeight = 12.sp,
                    )
                    Box(
                        modifier = Modifier
                            .width(20.dp)
                            .height(2.dp)
                            .clip(RoundedCornerShape(99.dp))
                            .background(if (active) Brand else Color.Transparent),
                    )
                }
            }
            val moreColor = if (moreActive) Brand else TabInactive
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clickable(enabled = barEnabled, onClick = onMoreClick)
                    .padding(horizontal = 4.dp, vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
            ) {
                Icon(
                    Icons.Default.GridView,
                    contentDescription = "More",
                    tint = moreColor,
                    modifier = Modifier.size(20.dp),
                )
                Text(
                    text = "More",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = moreColor,
                    maxLines = 1,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                    lineHeight = 12.sp,
                )
                Box(
                    modifier = Modifier
                        .width(20.dp)
                        .height(2.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(if (moreActive) Brand else Color.Transparent),
                )
            }
        }
        Box(Modifier.windowInsetsBottomHeight(WindowInsets.navigationBars))
    }
}

/** Framer spring on web More sheet: damping 28, stiffness 320 (mass 1). */
private val moreSheetSpring = spring<IntOffset>(
    dampingRatio = 28f / (2f * kotlin.math.sqrt(320f)),
    stiffness = 320f,
)

@Composable
private fun MoreBottomSheet(
    visible: Boolean,
    vm: MoreViewModel,
    signedInHint: Boolean,
    activeTabRoute: String,
    onDismiss: () -> Unit,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onOpenTrackers: () -> Unit,
    onOpenHome: () -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onOpenPricing: () -> Unit,
) {
    BackHandler(enabled = visible) { onDismiss() }

    Box(Modifier.fillMaxSize()) {
        AnimatedVisibility(
            visible = visible,
            modifier = Modifier
                .fillMaxSize()
                .zIndex(60f),
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0x4D171717))
                    .clickable(onClick = onDismiss),
            )
        }
        AnimatedVisibility(
            visible = visible,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .zIndex(70f),
            enter = slideInVertically(
                initialOffsetY = { it },
                animationSpec = moreSheetSpring,
            ),
            exit = slideOutVertically(
                targetOffsetY = { it },
                animationSpec = moreSheetSpring,
            ),
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 640.dp),
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                color = Color.White,
                shadowElevation = 16.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .windowInsetsPadding(WindowInsets.navigationBars),
                ) {
                    MoreSheetChrome(onDismiss = onDismiss)
                    MoreSheetScrollContent(
                        vm = vm,
                        signedInHint = signedInHint,
                        activeTabRoute = activeTabRoute,
                        onSignIn = onSignIn,
                        onSignOut = onSignOut,
                        onOpenTrackers = onOpenTrackers,
                        onOpenHome = onOpenHome,
                        onOpenWeb = onOpenWeb,
                        onOpenPricing = onOpenPricing,
                        dismissOnNavigate = true,
                        onDismiss = onDismiss,
                    )
                }
            }
        }
    }
}

@Composable
fun MainShell(
    api: ApiClient,
    sessionStore: SessionStore,
    onOpenPath: (String) -> Unit,
    onOpenExam: (slug: String, name: String) -> Unit,
    onOpenArticle: (slug: String) -> Unit,
    onOpenRoadmaps: () -> Unit,
    onOpenRoadmap: (String) -> Unit,
    onOpenWeb: (pathOrUrl: String, title: String?) -> Unit,
    onSignIn: () -> Unit,
    initialTab: String = "tab_home",
) {
    val tabNav = rememberNavController()
    val homeVm: HomeViewModel = viewModel(factory = HomeViewModel.factory(api, sessionStore))
    val moreVm: MoreViewModel = viewModel(factory = MoreViewModel.factory(api, sessionStore))
    val dashboardVm: DashboardViewModel = viewModel(factory = DashboardViewModel.factory(api, sessionStore))
    val homeState by homeVm.state.collectAsState()
    val backStack by tabNav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route ?: initialTab
    var moreSheetOpen by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val openPricing: () -> Unit = { openSite(context, "/pricing") }

    LaunchedEffect(initialTab) {
        if (current != initialTab) {
            tabNav.navigate(initialTab) {
                popUpTo(tabNav.graph.findStartDestination().id) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    LaunchedEffect(current) {
        when (current) {
            "tab_more" -> moreSheetOpen = true
            else -> moreSheetOpen = false
        }
    }

    fun goTab(route: String) {
        tabNav.navigate(route) {
            popUpTo(tabNav.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    fun signOut() {
        sessionStore.clear()
        moreVm.onSignedOut()
        dashboardVm.reset()
        homeVm.refresh()
    }

    Box(Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = Bg,
            bottomBar = {
                MobileBottomBar(
                    current = current,
                    moreSheetOpen = moreSheetOpen,
                    barEnabled = !moreSheetOpen,
                    onTabSelected = { goTab(it) },
                    onOpenPricing = openPricing,
                    onMoreClick = { moreSheetOpen = !moreSheetOpen },
                )
            },
        ) { padding ->
            NavHost(
                navController = tabNav,
                startDestination = initialTab,
                modifier = Modifier.padding(padding),
            ) {
                composable("tab_home") {
                    HomeScreen(
                        vm = homeVm,
                        dashboardVm = dashboardVm,
                        onOpenPath = onOpenPath,
                        onOpenExams = { goTab("tab_exams") },
                        onOpenTrackers = { goTab("tab_trackers") },
                        onOpenArticles = { goTab("tab_updates") },
                        onOpenArticle = onOpenArticle,
                        onOpenMore = { moreSheetOpen = true },
                        onOpenRoadmaps = onOpenRoadmaps,
                        onOpenExam = { exam: ActiveExam -> onOpenExam(exam.slug, exam.name) },
                        onOpenRoadmap = onOpenRoadmap,
                        onOpenWeb = onOpenWeb,
                        onSignIn = onSignIn,
                        onSignOut = {
                            dashboardVm.reset()
                            signOut()
                        },
                    )
                }
                composable("tab_exams") {
                    val vm: ExamsViewModel = viewModel(factory = ExamsViewModel.factory(api))
                    ExamsScreen(
                        vm = vm,
                        onOpenExam = { exam -> onOpenExam(exam.slug, exam.name) },
                        onGoHome = { goTab("tab_home") },
                    )
                }
                composable("tab_trackers") {
                    TrackersScreen(vm = homeVm, onOpenPath = onOpenPath)
                }
                composable("tab_updates") {
                    val vm: ArticlesViewModel = viewModel(factory = ArticlesViewModel.factory(api))
                    ArticlesScreen(
                        vm = vm,
                        onOpenArticle = { onOpenArticle(it.slug) },
                    )
                }
                composable("tab_more") {
                    MoreScreen(
                        vm = moreVm,
                        signedInHint = homeState.signedIn,
                        activeTabRoute = current,
                        onSignIn = onSignIn,
                        onSignOut = { signOut() },
                        onOpenTrackers = { goTab("tab_trackers") },
                        onOpenHome = { goTab("tab_home") },
                        onOpenWeb = onOpenWeb,
                        onOpenPricing = openPricing,
                    )
                }
            }
        }

        MoreBottomSheet(
            visible = moreSheetOpen,
            vm = moreVm,
            signedInHint = homeState.signedIn,
            activeTabRoute = current,
            onDismiss = {
                moreSheetOpen = false
                if (current == "tab_more") {
                    goTab("tab_home")
                }
            },
            onSignIn = onSignIn,
            onSignOut = { signOut() },
            onOpenTrackers = { goTab("tab_trackers") },
            onOpenHome = { goTab("tab_home") },
            onOpenWeb = onOpenWeb,
            onOpenPricing = openPricing,
        )
    }
}