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
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
