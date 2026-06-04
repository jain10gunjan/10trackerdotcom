/** Trim and normalize auth-related env vars (quotes, trailing newlines). */
function clean(value) {
  if (value == null || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

export function getGoogleClientId() {
  return (
    clean(process.env.AUTH_GOOGLE_ID) ||
    clean(process.env.GOOGLE_CLIENT_ID)
  );
}

export function getGoogleClientSecret() {
  return (
    clean(process.env.AUTH_GOOGLE_SECRET) ||
    clean(process.env.GOOGLE_CLIENT_SECRET)
  );
}

export function getAuthSecret() {
  return (
    clean(process.env.AUTH_SECRET) ||
    clean(process.env.NEXTAUTH_SECRET)
  );
}

export function validateGoogleAuthEnv() {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const issues = [];

  if (!clientId) {
    issues.push("GOOGLE_CLIENT_ID (or AUTH_GOOGLE_ID) is missing.");
  } else if (!clientId.endsWith(".apps.googleusercontent.com")) {
    issues.push("GOOGLE_CLIENT_ID does not look like a Google OAuth client ID.");
  }

  if (!clientSecret) {
    issues.push("GOOGLE_CLIENT_SECRET (or AUTH_GOOGLE_SECRET) is missing.");
  } else if (!clientSecret.startsWith("GOCSPX-")) {
    issues.push(
      "GOOGLE_CLIENT_SECRET should start with GOCSPX- (create or reset the secret in Google Cloud Console)."
    );
  }

  const secret = getAuthSecret();
  if (!secret) {
    issues.push("NEXTAUTH_SECRET (or AUTH_SECRET) is missing.");
  } else if (secret.length < 32) {
    issues.push(
      "NEXTAUTH_SECRET should be at least 32 characters (e.g. openssl rand -base64 32)."
    );
  }

  return { ok: issues.length === 0, issues, clientId, clientSecret };
}
