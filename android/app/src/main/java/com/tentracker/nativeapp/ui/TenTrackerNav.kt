package com.tentracker.nativeapp.ui

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.SessionStore
import com.tentracker.nativeapp.ui.screens.HomeScreen
import com.tentracker.nativeapp.ui.screens.LoginScreen
import com.tentracker.nativeapp.ui.screens.PathScreen
import com.tentracker.nativeapp.ui.screens.VideoPlayerScreen
import com.tentracker.nativeapp.ui.viewmodel.HomeViewModel
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Composable
fun TenTrackerNav(api: ApiClient, sessionStore: SessionStore) {
    val nav = rememberNavController()

    // Always land on native home (web-like). Sign-in is a separate screen.
    NavHost(navController = nav, startDestination = "home") {
        composable("login") {
            LoginScreen(
                onSignedIn = {
                    sessionStore.markSignedInFromCookies()
                    nav.navigate("home") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onBack = { nav.popBackStack() }
            )
        }
        composable("home") {
            val vm: HomeViewModel = viewModel(factory = HomeViewModel.factory(api, sessionStore))
            HomeScreen(
                vm = vm,
                onOpenPath = { slug -> nav.navigate("path/$slug") },
                onOpenPathsTab = {
                    // Paths list is on the same home screen below the hero.
                    // Refresh so the YouTube trackers section is current.
                    vm.refresh(silent = true)
                },
                onSignIn = { nav.navigate("login") },
                onSignOut = {
                    sessionStore.clear()
                    vm.refresh()
                }
            )
        }
        composable(
            route = "path/{slug}",
            arguments = listOf(navArgument("slug") { type = NavType.StringType })
        ) { entry ->
            val slug = entry.arguments?.getString("slug").orEmpty()
            val vm: PathViewModel = viewModel(
                key = slug,
                factory = PathViewModel.factory(api, slug)
            )
            PathScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
                onPlayVideo = { resourceId, youtubeId, title ->
                    val t = URLEncoder.encode(title, StandardCharsets.UTF_8.toString())
                    nav.navigate("video/$resourceId/$youtubeId/$t")
                }
            )
        }
        composable(
            route = "video/{resourceId}/{youtubeId}/{title}",
            arguments = listOf(
                navArgument("resourceId") { type = NavType.StringType },
                navArgument("youtubeId") { type = NavType.StringType },
                navArgument("title") { type = NavType.StringType }
            )
        ) { entry ->
            val resourceId = entry.arguments?.getString("resourceId").orEmpty()
            val youtubeId = entry.arguments?.getString("youtubeId").orEmpty()
            val title = URLDecoder.decode(
                entry.arguments?.getString("title") ?: "Lesson",
                StandardCharsets.UTF_8.toString()
            )
            VideoPlayerScreen(
                api = api,
                resourceId = resourceId,
                youtubeVideoId = youtubeId,
                title = title,
                onBack = { nav.popBackStack() }
            )
        }
    }
}
