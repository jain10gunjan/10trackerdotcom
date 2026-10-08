/**
 * Server-side prices for legacy one-time purchase flows
 * (BuyNow / checkout via /api/create-razorpay-order).
 * Amounts are always in paise. Never trust client-supplied amounts.
 */

/** Fixed named plans */
const FIXED_PLAN_AMOUNT_PAISE = {
  unlimited_practice: 99900, // ₹999 — GATE CSE checkout
};

/** Default for exam-category premium packages (BuyNow) */
const CATEGORY_PLAN_AMOUNT_PAISE = 4900; // ₹49

/**
 * @param {string} plan
 * @returns {number | null} amount in paise, or null if plan is invalid
 */
export function resolveLegacyPlanAmountPaise(plan) {
  if (!plan || typeof plan !== 'string') return null;
  const key = plan.trim().toLowerCase();
  if (!key) return null;

  if (Object.prototype.hasOwnProperty.call(FIXED_PLAN_AMOUNT_PAISE, key)) {
    return FIXED_PLAN_AMOUNT_PAISE[key];
  }

  // Exam category slugs: cat, gate-cse, jee-main, etc.
  if (/^[a-z0-9][a-z0-9-]{0,63}$/.test(key)) {
    return CATEGORY_PLAN_AMOUNT_PAISE;
  }

  return null;
}
