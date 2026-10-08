import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getAuthSecret,
  getGoogleClientId,
  getGoogleClientSecret,
  validateGoogleAuthEnv,
} from "@/lib/authEnv";

const googleEnv = validateGoogleAuthEnv();
if (process.env.NODE_ENV === "development" && !googleEnv.ok) {
  console.warn("[auth] Google OAuth env issues:\n", googleEnv.issues.join("\n "));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: getGoogleClientId(),
      clientSecret: getGoogleClientSecret(),
    }),
  ],
  secret: getAuthSecret(),
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ token, user, profile }) {
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