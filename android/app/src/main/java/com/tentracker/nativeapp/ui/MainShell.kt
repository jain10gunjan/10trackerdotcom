package com.tentracker.nativeapp.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsBottomHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.tentracker.nativeapp.ui.screens.TrackersScreen
import com.tentracker.nativeapp.ui.theme.Bg
import com.tentracker.nativeapp.ui.theme.Border
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.viewmodel.ArticlesViewModel
import com.tentracker.nativeapp.ui.viewmodel.ExamsViewModel
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel
import com.tentracker.nativeapp.ui.viewmodel.MoreViewModel

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab("tab_home", "Home", Icons.Default.Home),
    Tab("tab_exams", "Exams", Icons.AutoMirrored.Filled.MenuBook),
    Tab("tab_trackers", "Trackers", Icons.Default.Hub),
    Tab("tab_updates", "Updates", Icons.Default.Campaign),
    Tab("tab_more", "More", Icons.Default.GridView),
)

private val TabInactive = Color(0xFF737373)

@Composable
private fun MobileBottomBar(
    current: String,
    onTabSelected: (String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
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
            tabs.forEach { tab ->
                val active = current == tab.route
                val contentColor = if (active) Brand else TabInactive
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clickable(onClick = { onTabSelected(tab.route) })
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
        }
        Box(Modifier.windowInsetsBottomHeight(WindowInsets.navigationBars))
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
    val homeState by homeVm.state.collectAsState()
    val backStack by tabNav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route ?: initialTab

    LaunchedEffect(initialTab) {
        if (current != initialTab) {
            tabNav.navigate(initialTab) {
                popUpTo(tabNav.graph.findStartDestination().id) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    fun goTab(route: String) {
        tabNav.navigate(route) {
            popUpTo(tabNav.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    Scaffold(
        containerColor = Bg,
        bottomBar = {
            MobileBottomBar(
                current = current,
                onTabSelected = { goTab(it) },
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
                    onOpenPath = onOpenPath,
                    onOpenExams = { goTab("tab_exams") },
                    onOpenTrackers = { goTab("tab_trackers") },
                    onOpenArticles = { goTab("tab_updates") },
                    onOpenMore = { goTab("tab_more") },
                    onOpenRoadmaps = onOpenRoadmaps,
                    onOpenExam = { exam: ActiveExam -> onOpenExam(exam.slug, exam.name) },
                    onOpenRoadmap = onOpenRoadmap,
                    onOpenWeb = onOpenWeb,
                    onSignIn = onSignIn,
                    onSignOut = {
                        sessionStore.clear()
                        homeVm.refresh()
                    },
                )
            }
            composable("tab_exams") {
                val vm: ExamsViewModel = viewModel(factory = ExamsViewModel.factory(api))
                ExamsScreen(
                    vm = vm,
                    onOpenExam = { exam -> onOpenExam(exam.slug, exam.name) },
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
                val moreVm: MoreViewModel = viewModel(factory = MoreViewModel.factory(api, sessionStore))
                MoreScreen(
                    vm = moreVm,
                    signedInHint = homeState.signedIn,
                    onSignIn = onSignIn,
                    onSignOut = {
                        sessionStore.clear()
                        moreVm.onSignedOut()
                        homeVm.refresh()
                    },
                    onOpenRoadmaps = onOpenRoadmaps,
                    onOpenExams = { goTab("tab_exams") },
                    onOpenTrackers = { goTab("tab_trackers") },
                    onOpenArticles = { goTab("tab_updates") },
                    onOpenWeb = onOpenWeb,
                )
            }
        }
    }
}