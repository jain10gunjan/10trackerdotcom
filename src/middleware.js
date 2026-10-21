import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canonicalAuthHost, publicRequestHostname } from "@/lib/authCookies";
import { isAdminEmail } from "@/features/mock-test/lib/mockTestUtils";

const ARTICLE_CATEGORY_SLUGS = new Set([
  "latest-jobs",
  "exam-results",
  "answer-key",
  "admit-cards",
  "categories",
  // News / education categories (served at /article/[cate], not redirected to /articles/[slug])
  "current-affairs",
  "board-exams",
  "sarkari-exams",
  "admissions",
  "general",
  "college-news",
  "entrance-exams",
]);

function redirectToSignIn(req, pathname) {
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

function canonicalHostRedirect(req) {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const hostname = publicRequestHostname(
    req.headers.get("x-forwarded-host") || req.headers.get("host")
  );
  if (hostname !== "10tracker.com" && hostname !== "www.10tracker.com") return null;
  const target = canonicalAuthHost();
  if (!target || hostname === target) return null;
  const dest = new URL(
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
    `https://${target}`
  );
  return NextResponse.redirect(dest, 307);
}

const withAuth = auth((req) => {
  const { pathname } = req.nextUrl;

  // Legacy broken login path → NextAuth sign-in
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Legacy auth pages (token-in-URL) → sign-in
  if (pathname === "/auth-handler" || pathname === "/auth-success") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (pathname === "/roadmaps" || pathname.startsWith("/roadmaps/")) {
    const url = req.nextUrl.clone();
    url.pathname =
      pathname === "/roadmaps"
        ? "/og-trackers"
        : pathname.replace(/^\/roadmaps/, "/og-trackers");
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/admin/roadmaps" || pathname.startsWith("/admin/roadmaps/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/og-trackers";
    return NextResponse.redirect(url, 308);
  }

  // Protect admin UI: must be signed in + admin email
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const email = req.auth?.user?.email;
    if (!email) {
      return redirectToSignIn(req, pathname);
    }
    if (!isAdminEmail(email)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Vendor practice-tests: require sign-in for all portal paths except nothing public.
  // Full domain/allowlist checks run in server components + /api/practice-tests (service role).
  if (
    pathname === "/practice-tests" ||
    pathname.startsWith("/practice-tests/") ||
    pathname.startsWith("/api/practice-tests/")
  ) {
    const email = req.auth?.user?.email;
    if (!email) {
      return redirectToSignIn(req, pathname);
    }
  }

  if (pathname === "/profile/setup" || pathname === "/user-profile") {
    const url = req.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  if (pathname === "/article") {
    const url = req.nextUrl.clone();
    url.pathname = "/articles";
    return NextResponse.redirect(url);
  }

  if (pathname === "/article/news" || pathname.startsWith("/article/news/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/articles";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/article/")) {
    const rest = pathname.slice("/article/".length);
    const firstSeg = rest.split("/")[0];

    if (firstSeg && !ARTICLE_CATEGORY_SLUGS.has(firstSeg)) {
      const url = req.nextUrl.clone();
      url.pathname = `/articles/${rest}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export default function middleware(req, event) {
  const { pathname } = req.nextUrl;
  // The Auth.js wrapper reads the session on every matched request and merges
  // Set-Cookie onto the response. On /api/auth that overwrites the PKCE cookie
  // written by the Google callback.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const redirected = canonicalHostRedirect(req);
  if (redirected) return redirected;
  return withAuth(req, event);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};
