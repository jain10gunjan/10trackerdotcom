/**
 * Google sign-in stores the PKCE verifier in a host-only cookie.
 * 10tracker is served on both apex and www, and Auth.js builds the OAuth
 * callback from NEXTAUTH_URL. If those hosts differ, the callback cannot
 * read the verifier and sign-in fails with InvalidCheck.
 */

const SITE_APEX = "10tracker.com";

function configuredAuthUrl(env) {
  if (env && env !== process.env) {
    return env.AUTH_URL || env.NEXTAUTH_URL || env.NEXT_PUBLIC_SITE_URL || "";
  }
  // Static access so Next.js includes these in the middleware bundle.
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  );
}

function hostnameFromEnv(env) {
  const raw = configuredAuthUrl(env);
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase().replace(/\.$/, "") || null;
  } catch {
    return null;
  }
}

/** Host to keep the browser on, or null when the public URL is not this site. */
export function canonicalAuthHost(env = process.env) {
  const host = hostnameFromEnv(env);
  if (host === SITE_APEX || host === `www.${SITE_APEX}`) return host;
  return null;
}

/** Parent domain so the PKCE and session cookies are sent to apex and www. */
export function sharedAuthCookieDomain(env = process.env) {
  if ((env || process.env).NODE_ENV !== "production") return undefined;
  const host = hostnameFromEnv(env);
  if (host && host !== SITE_APEX && host !== `www.${SITE_APEX}`) return undefined;
  return `.${SITE_APEX}`;
}

export function publicRequestHostname(hostHeader) {
  if (!hostHeader || typeof hostHeader !== "string") return "";
  return hostHeader.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}
