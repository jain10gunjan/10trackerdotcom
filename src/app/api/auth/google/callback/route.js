import { NextResponse } from "next/server";

/**
 * Legacy Google OAuth callback — redirects to NextAuth sign-in.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") || "/";

  const signInUrl = new URL("/sign-in", url.origin);
  signInUrl.searchParams.set("redirect", redirect);

  return NextResponse.redirect(signInUrl);
}
