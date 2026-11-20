package com.tentracker.nativeapp.ui

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tentracker.nativeapp.data.ApiClient
import com.tentracker.nativeapp.data.SessionStore
import com.tentracker.nativeapp.ui.screens.ArticleDetailScreen
import com.tentracker.nativeapp.ui.screens.ExamDetailScreen
import com.tentracker.nativeapp.ui.screens.InAppBrowserScreen
import com.tentracker.nativeapp.ui.screens.LoginScreen
import com.tentracker.nativeapp.ui.screens.PathScreen
import com.tentracker.nativeapp.ui.screens.PracticeScreen
import com.tentracker.nativeapp.ui.screens.VideoPlayerScreen
import com.tentracker.nativeapp.ui.util.AppDestination
import com.tentracker.nativeapp.ui.util.absoluteOrSiteUrl
import com.tentracker.nativeapp.ui.util.browserRoute
import com.tentracker.nativeapp.ui.util.resolveDeepLink
import com.tentracker.nativeapp.ui.viewmodel.ExamDetailViewModel
import com.tentracker.nativeapp.ui.viewmodel.PathViewModel
import com.tentracker.nativeapp.ui.viewmodel.PracticeViewModel
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Composable
fun TenTrackerNav(
    api: ApiClient,
    sessionStore: SessionStore,
    pendingDeepLink: Uri? = null,
    onDeepLinkConsumed: () -> Unit = {},
) {
    val nav = rememberNavController()

    fun enc(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.toString())

    fun dec(value: String?): String =
        URLDecoder.decode(value ?: "", StandardCharsets.UTF_8.toString())

    fun openBrowser(pathOrUrl: String, title: String? = null) {
        nav.navigate(browserRoute(absoluteOrSiteUrl(pathOrUrl), title))
    }

    LaunchedEffect(pendingDeepLink) {
        val dest = resolveDeepLink(pendingDeepLink) ?: return@LaunchedEffect
        navigateDestination(nav, dest, ::enc)
        onDeepLinkConsumed()
    }

    NavHost(navController = nav, startDestination = "main/tab_home") {
        composable("login") {
            LoginScreen(
                onSignedIn = {
                    sessionStore.markSignedInFromCookies()
                    nav.navigate("main/tab_home") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onBack = { nav.popBackStack() },
            )
        }

        composable(
            route = "main/{tab}",
            arguments = listOf(
                navArgument("tab") {
                    type = NavType.StringType
                    defaultValue = "tab_home"
                },
            ),
        ) { entry ->
            val tab = entry.arguments?.getString("tab") ?: "tab_home"
            MainShell(
                api = api,
                sessionStore = sessionStore,
                initialTab = tab,
                onOpenPath = { slug -> nav.navigate("path/$slug") },
                onOpenExam = { slug, name ->
                    nav.navigate("exam/${enc(slug)}/${enc(name)}")
                },
                onOpenArticle = { slug -> nav.navigate("article/${enc(slug)}") },
                onOpenWeb = { path, title -> openBrowser(path, title) },
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
                onOpenWeb = { path, title -> openBrowser(path, title) },
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
                onOpenWeb = { url, title -> openBrowser(url, title) },
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

        composable(
            route = "browser/{url}/{title}",
            arguments = listOf(
                navArgument("url") { type = NavType.StringType },
                navArgument("title") {
                    type = NavType.StringType
                    defaultValue = ""
                },
            ),
        ) { entry ->
            val url = dec(entry.arguments?.getString("url"))
            val title = dec(entry.arguments?.getString("title")).ifBlank { null }
            InAppBrowserScreen(
                url = url,
                title = title,
                onBack = { nav.popBackStack() },
            )
        }
    }
}

private fun navigateDestination(
    nav: NavHostController,
    dest: AppDestination,
    enc: (String) -> String,
) {
    when (dest) {
        AppDestination.MainHome -> nav.navigate("main/tab_home") {
            launchSingleTop = true
            popUpTo("main/tab_home") { inclusive = false }
        }
        AppDestination.MainExams -> nav.navigate("main/tab_exams") { launchSingleTop = true }
        AppDestination.MainTrackers -> nav.navigate("main/tab_trackers") { launchSingleTop = true }
        AppDestination.MainUpdates -> nav.navigate("main/tab_updates") { launchSingleTop = true }
        AppDestination.MainMore -> nav.navigate("main/tab_more") { launchSingleTop = true }
        AppDestination.Login -> nav.navigate("login")
        is AppDestination.Path -> nav.navigate("path/${dest.slug}")
        is AppDestination.Exam -> nav.navigate("exam/${enc(dest.slug)}/${enc(dest.name)}")
        is AppDestination.Article -> nav.navigate("article/${enc(dest.slug)}")
        is AppDestination.Practice -> nav.navigate(
            "practice/${enc(dest.category)}/${enc(dest.subject)}/${enc(dest.chapter)}/${enc(dest.title)}"
        )
        is AppDestination.Browser -> nav.navigate(browserRoute(dest.url, dest.title))
    }
}
