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
import com.tentracker.nativeapp.ui.screens.RoadmapDetailScreen
import com.tentracker.nativeapp.ui.screens.RoadmapsScreen
import com.tentracker.nativeapp.ui.screens.VideoPlayerScreen
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel
import com.tentracker.nativeapp.ui.viewmodel.PracticeViewModel
import com.tentracker.nativeapp.ui.viewmodel.RoadmapDetailViewModel
import com.tentracker.nativeapp.ui.viewmodel.RoadmapsViewModel
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

    fun openPractice(category: String, subject: String, chapter: String, title: String) {
        nav.navigate("practice/${enc(category)}/${enc(subject)}/${enc(chapter)}/${enc(title)}")
    }

    NavHost(navController = nav, startDestination = "main") {
        composable("login") {
            LoginScreen(
                onSignedIn = {
                    sessionStore.markSignedInFromCookies()
                    nav.navigate("main") { popUpTo("login") { inclusive = true } }
                },
                onBack = { nav.popBackStack() },
            )
        }

        composable("main") {
            MainShell(
                api = api,
                sessionStore = sessionStore,
                onOpenPath = { slug -> nav.navigate("path/$slug") },
                onOpenExam = { slug, name -> nav.navigate("exam/${enc(slug)}/${enc(name)}") },
                onOpenArticle = { slug -> nav.navigate("article/${enc(slug)}") },
                onOpenRoadmaps = { nav.navigate("roadmaps") },
                onSignIn = { nav.navigate("login") },
            )
        }

        composable("roadmaps") {
            val vm: RoadmapsViewModel = viewModel(factory = RoadmapsViewModel.factory(api))
            RoadmapsScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
                onOpenRoadmap = { roadmap ->
                    nav.navigate("roadmap/${enc(roadmap.slug)}")
                },
            )
        }

        composable(
            route = "roadmap/{slug}",
            arguments = listOf(navArgument("slug") { type = NavType.StringType }),
        ) { entry ->
            val slug = dec(entry.arguments?.getString("slug"))
            val vm: RoadmapDetailViewModel = viewModel(
                key = slug,
                factory = RoadmapDetailViewModel.factory(api, slug),
            )
            RoadmapDetailScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
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
            val vm: ExamDetailViewModel = viewModel(key = slug, factory = ExamDetailViewModel.factory(api, slug))
            ExamDetailScreen(
                title = name.ifBlank { slug },
                category = slug,
                vm = vm,
                onBack = { nav.popBackStack() },
                onOpenChapter = { subject, chapter, chapterTitle ->
                    openPractice(slug, subject, chapter, chapterTitle)
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
            val vm: PathViewModel = viewModel(key = slug, factory = PathViewModel.factory(api, slug))
            PathScreen(
                vm = vm,
                onBack = { nav.popBackStack() },
                onPlayVideo = { resourceId, youtubeId, title ->
                    nav.navigate("video/${enc(slug)}/${enc(resourceId)}/${enc(youtubeId)}/${enc(title)}")
                },
            )
        }

        composable(
            route = "video/{pathSlug}/{resourceId}/{youtubeId}/{title}",
            arguments = listOf(
                navArgument("pathSlug") { type = NavType.StringType },
                navArgument("resourceId") { type = NavType.StringType },
                navArgument("youtubeId") { type = NavType.StringType },
                navArgument("title") { type = NavType.StringType },
            ),
        ) { entry ->
            val pathSlug = dec(entry.arguments?.getString("pathSlug"))
            val resourceId = dec(entry.arguments?.getString("resourceId"))
            val youtubeId = dec(entry.arguments?.getString("youtubeId"))
            val title = dec(entry.arguments?.getString("title")).ifBlank { "Lesson" }
            VideoPlayerScreen(
                api = api,
                pathSlug = pathSlug,
                resourceId = resourceId,
                youtubeVideoId = youtubeId,
                title = title,
                onBack = { nav.popBackStack() },
                onOpenPractice = { category, subject, chapter, t ->
                    openPractice(category, subject, chapter, t)
                },
            )
        }

        composable(
            route = "article/{slug}",
            arguments = listOf(navArgument("slug") { type = NavType.StringType }),
        ) { entry ->
            ArticleDetailScreen(
                slug = dec(entry.arguments?.getString("slug")),
                api = api,
                onBack = { nav.popBackStack() },
            )
        }
    }
}
