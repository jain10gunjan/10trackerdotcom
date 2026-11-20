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
import com.tentracker.nativeapp.ui.screens.ArticleDetailScreen
import com.tentracker.nativeapp.ui.screens.ExamDetailScreen
import com.tentracker.nativeapp.ui.screens.LoginScreen
import com.tentracker.nativeapp.ui.screens.PathScreen
import com.tentracker.nativeapp.ui.screens.PracticeScreen
import com.tentracker.nativeapp.ui.screens.VideoPlayerScreen
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel
import com.tentracker.nativeapp.ui.viewmodel.PracticeViewModel
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Composable
fun TenTrackerNav(api: ApiClient, sessionStore: SessionStore) {
    val nav = rememberNavController()

    fun enc(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.toString())

    fun dec(value: String?): String =
        URLDecoder.decode(value ?: "", StandardCharsets.UTF_8.toString())

    NavHost(navController = nav, startDestination = "main") {
        composable("login") {
            LoginScreen(
                onSignedIn = {
                    sessionStore.markSignedInFromCookies()
                    nav.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onBack = { nav.popBackStack() },
            )
        }

        composable("main") {
            MainShell(
                api = api,
                sessionStore = sessionStore,
                onOpenPath = { slug -> nav.navigate("path/$slug") },
                onOpenExam = { slug, name ->
                    nav.navigate("exam/${enc(slug)}/${enc(name)}")
                },
                onOpenArticle = { slug -> nav.navigate("article/${enc(slug)}") },
                onSignIn = { nav.navigate("login") },
            )
        }

        composable(
            route = "exam/{slug}/{name}",
            arguments = listOf(
                navArgument("slug") { type = NavType.StringType },
                navArgument("name") { type = NavType.StringType },
            ),
        ) { entry ->
            val slug = dec(entry.arguments?.getString("slug"))
            val name = dec(entry.arguments?.getString("name"))
            val vm: ExamDetailViewModel = viewModel(
                key = slug,
                factory = ExamDetailViewModel.factory(api, slug),
            )
            ExamDetailScreen(
                title = name.ifBlank { slug },
                category = slug,
                vm = vm,
                onBack = { nav.popBackStack() },
                onOpenChapter = { subject, chapter, chapterTitle ->
                    nav.navigate(
                        "practice/${enc(slug)}/${enc(subject)}/${enc(chapter)}/${enc(chapterTitle)}"
                    )
                },
            )
        }

        composable(
            route = "practice/{category}/{subject}/{chapter}/{title}",
            arguments = listOf(
                navArgument("category") { type = NavType.StringType },
                navArgument("subject") { type = NavType.StringType },
                navArgument("chapter") { type = NavType.StringType },
                navArgument("title") { type = NavType.StringType },
            ),
        ) { entry ->
            val category = dec(entry.arguments?.getString("category"))
            val subject = dec(entry.arguments?.getString("subject"))
            val chapter = dec(entry.arguments?.getString("chapter"))
            val title = dec(entry.arguments?.getString("title")).ifBlank { chapter }
            val vm: PracticeViewModel = viewModel(
                key = "$category/$subject/$chapter",
                factory = PracticeViewModel.factory(api, sessionStore, category, subject, chapter),
            )
            PracticeScreen(
                title = title.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() },
                vm = vm,
                onBack = { nav.popBackStack() },
            )
        }

        composable(
            route = "path/{slug}",
            arguments = listOf(navArgument("slug") { type = NavType.StringType }),
        ) { entry ->
            val slug = entry.arguments?.getString("slug").orEmpty()
            val vm: PathViewModel = viewModel(
                key = slug,
                factory = PathViewModel.factory(api, slug),
            )
            PathScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
                onPlayVideo = { resourceId, youtubeId, title ->
                    val t = enc(title)
                    nav.navigate("video/$resourceId/$youtubeId/$t")
                },
            )
        }

        composable(
            route = "video/{resourceId}/{youtubeId}/{title}",
            arguments = listOf(
                navArgument("resourceId") { type = NavType.StringType },
                navArgument("youtubeId") { type = NavType.StringType },
                navArgument("title") { type = NavType.StringType },
            ),
        ) { entry ->
            val resourceId = entry.arguments?.getString("resourceId").orEmpty()
            val youtubeId = dec(entry.arguments?.getString("youtubeId"))
            val title = dec(entry.arguments?.getString("title")).ifBlank { "Lesson" }
            VideoPlayerScreen(
                api = api,
                resourceId = resourceId,
                youtubeVideoId = youtubeId,
                title = title,
                onBack = { nav.popBackStack() },
            )
        }

        composable(
            route = "article/{slug}",
            arguments = listOf(navArgument("slug") { type = NavType.StringType }),
        ) { entry ->
            val slug = dec(entry.arguments?.getString("slug"))
            ArticleDetailScreen(
                slug = slug,
                api = api,
                onBack = { nav.popBackStack() },
            )
        }
    }
}
