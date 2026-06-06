import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/middleware/adminAuth";
import { checkRewriteRateLimit, REWRITE_MODES } from "@/lib/rewriteRateLimit";

/**
 * Admin session + rate limit for rewrite modes on /api/generate-similar.
 * @returns {NextResponse} on failure, or {{ userEmail: string }} on success
 */
export async function guardAdminRewrite(mode) {
  if (!REWRITE_MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid rewrite mode" }, { status: 400 });
  }

  const { isAdmin, error, userEmail } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: error || "Admin access required" },
      { status: 403 }
    );
  }

  const rl = checkRewriteRateLimit(userEmail, mode);
  if (!rl.ok) {
    const windowMin = Math.round(rl.windowMs / 60000);
    return NextResponse.json(
      {
        error: `Rewrite rate limit exceeded (${rl.limit} per ${windowMin} min). Try again in ${rl.retryAfterSec}s.`,
        retryAfterSec: rl.retryAfterSec,
        limit: rl.limit,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  return { userEmail };
}
