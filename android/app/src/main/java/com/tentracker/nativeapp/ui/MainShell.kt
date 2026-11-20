package com.tentracker.nativeapp.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.SessionStore
import com.tentracker.nativeapp.ui.screens.ArticlesScreen
import com.tentracker.nativeapp.ui.screens.ExamsScreen
import com.tentracker.nativeapp.ui.screens.HomeScreen
import com.tentracker.nativeapp.ui.screens.MoreScreen
import com.tentracker.nativeapp.ui.screens.TrackersScreen
import com.tentracker.nativeapp.ui.theme.Brand
import com.tentracker.nativeapp.ui.theme.BrandSoft
import com.tentracker.nativeapp.ui.theme.Muted
import com.tentracker.nativeapp.ui.viewmodel.ArticlesViewModel
import com.tentracker.nativeapp.ui.viewmodel.ExamsViewModel
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel

private data class Tab(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab("tab_home", "Home", Icons.Default.Home),
    Tab("tab_exams", "Exams", Icons.AutoMirrored.Filled.MenuBook),
    Tab("tab_trackers", "Trackers", Icons.Default.Hub),
    Tab("tab_updates", "Updates", Icons.Default.Campaign),
    Tab("tab_more", "More", Icons.Default.GridView),
)

@Composable
fun MainShell(
    api: ApiClient,
    sessionStore: SessionStore,
    onOpenPath: (String) -> Unit,
    onOpenExam: (slug: String, name: String) -> Unit,
    onOpenArticle: (slug: String) -> Unit,
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

    Scaffold(
        containerColor = Color.White,
        bottomBar = {
            NavigationBar(containerColor = Color.White.copy(alpha = 0.97f), tonalElevation = 0.dp) {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        selected = current == tab.route,
                        onClick = {
                            tabNav.navigate(tab.route) {
                                popUpTo(tabNav.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label, fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Brand,
                            selectedTextColor = Brand,
                            indicatorColor = BrandSoft,
                            unselectedIconColor = Muted,
                            unselectedTextColor = Muted,
                        ),
                    )
                }
            }
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
                    onOpenExams = {
                        tabNav.navigate("tab_exams") {
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onOpenTrackers = {
                        tabNav.navigate("tab_trackers") {
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onOpenArticles = {
                        tabNav.navigate("tab_updates") {
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    onOpenMore = {
                        tabNav.navigate("tab_more") {
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
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
                MoreScreen(
                    signedIn = homeState.signedIn,
                    onSignIn = onSignIn,
                    onSignOut = {
                        sessionStore.clear()
                        homeVm.refresh()
                    },
                    onOpenWeb = onOpenWeb,
                )
            }
        }
    }
}
