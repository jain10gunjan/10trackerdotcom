import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getAuthSecret,
  getGoogleClientId,
  getGoogleClientSecret,
  validateGoogleAuthEnv,
} from "@/lib/authEnv";
import { sharedAuthCookieDomain } from "@/lib/authCookies";

const googleEnv = validateGoogleAuthEnv();
if (process.env.NODE_ENV === "development" && !googleEnv.ok) {
  console.warn("[auth] Google OAuth env issues:\n", googleEnv.issues.join("\n "));
}

const useSecureCookies = process.env.NODE_ENV === "production";
const sharedCookieDomain = sharedAuthCookieDomain();

function sharedCookie(extra = {}) {
  return { options: { domain: sharedCookieDomain, ...extra } };
}

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  // People API phone numbers. Enable People API in Google Cloud and add this
  // scope on the OAuth consent screen. Google returns a number only if the
  // account has one.
  "https://www.googleapis.com/auth/user.phonenumbers.read",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: getGoogleClientId(),
      clientSecret: getGoogleClientSecret(),
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
        },
      },
    }),
  ],
  secret: getAuthSecret(),
  trustHost: true,
  // Keep the PKCE cookie name stable behind the Hostinger proxy. Detecting
  // HTTPS per request flips between authjs.* and __Secure-authjs.*, and the
  // callback then cannot decrypt the verifier.
  useSecureCookies,
  ...(sharedCookieDomain
    ? {
        cookies: {
          sessionToken: sharedCookie(),
          callbackUrl: sharedCookie(),
          pkceCodeVerifier: sharedCookie({ maxAge: 60 * 15 }),
          state: sharedCookie({ maxAge: 60 * 15 }),
        },
      }
    : {}),
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user, profile, account }) {
      if (user?.id) {
        token.id = user.id;
      }
      // Persist Google verification + Workspace hd for vendor domain access checks.
      // Only set when profile is present (initial sign-in); keep prior values on refresh.
      if (profile) {
        token.emailVerified = profile.email_verified === true;
        token.hostedDomain =
          typeof profile.hd === "string" && profile.hd.trim()
            ? profile.hd.trim().toLowerCase()
            : null;
        if (profile.name) token.name = profile.name;
        if (profile.picture) token.picture = profile.picture;
        if (profile.email) token.email = profile.email;
      }
      if (account?.provider === "google" && account.access_token && profile) {
        try {
          const { syncGoogleSignInProfile } = await import("@/lib/googleProfileSync");
          const { phone } = await syncGoogleSignInProfile({
            email: profile.email || token.email,
            profile,
            accessToken: account.access_token,
          });
          if (phone) token.phoneNumber = phone;
        } catch (error) {
          console.error("[auth] Google profile sync failed", error);
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // Prefer token.id (set on sign-in); fall back to token.sub (JWT subject).
        session.user.id = token.id || token.sub;
        session.user.emailVerified = token.emailVerified === true;
        session.user.hostedDomain = token.hostedDomain || null;
      }
      return session;
    },
  },
});