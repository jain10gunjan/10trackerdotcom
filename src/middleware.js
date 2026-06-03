import { NextResponse } from "next/server";

const ARTICLE_CATEGORY_SLUGS = new Set([
  "latest-jobs",
  "exam-results",
  "answer-key",
  "admit-cards",
  "news",
  "categories",
]);

export function middleware(req) {
  const { pathname } = req.nextUrl;

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
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
