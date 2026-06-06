"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { getSafeRedirect } from "@/lib/safeRedirect";
import { resolvePostAuthRedirect } from "@/lib/resolvePostAuthRedirect";
import { buildAuthResumePath } from "@/lib/profileGatePaths";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const defaultRedirect = "/";

  const redirectUrl = useMemo(
    () => getSafeRedirect(searchParams.get("redirect")) || defaultRedirect,
    [searchParams]
  );

  useEffect(() => {
    const authError = searchParams.get("error");
    if (!authError) return;
    if (authError === "Configuration") {
      setError(
        "Google sign-in is misconfigured. In Google Cloud Console, open your OAuth client, reset the client secret, paste the new value into GOOGLE_CLIENT_SECRET in .env.local (must match GOOGLE_CLIENT_ID), add redirect URI http://localhost:3000/api/auth/callback/google, then restart the dev server."
      );
      return;
    }
    if (authError === "AccessDenied") {
      setError("Sign-in was cancelled or denied.");
      return;
    }
    setError("Sign-in failed. Please try again.");
  }, [searchParams]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      const target = await resolvePostAuthRedirect(redirectUrl);
      if (!cancelled) router.replace(target);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router, redirectUrl]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: buildAuthResumePath("sign-in", redirectUrl) });
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-4">
                <Sparkles className="w-4 h-4 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">Welcome Back</span>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Sign In</h2>
              <p className="text-neutral-600 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="text-neutral-900 font-semibold hover:text-neutral-700 underline"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-neutral-300 rounded-md shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-60 transition-colors"
            >
              {isLoading ? (
                <svg
                  className="w-5 h-5 mr-2 -ml-1 animate-spin text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2 -ml-1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                  />
                </svg>
              )}
              {isLoading ? "Signing in..." : "Continue with Google"}
            </button>

            <p className="mt-6 text-center text-xs text-neutral-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
