/** Credit costs and subscription plans (INR, Razorpay amounts in paise) */

/**
 * Kill switch for free wallet credits (signup bonus + pay-per-question).
 * false = users need an active plan for practice/mocks.
 * Flip back to true (or set credit_pricing_settings.free_credits_enabled)
 * when you want admin-controlled free credits again.
 */
export const FREE_CREDITS_ENABLED = false;

/** Used only when FREE_CREDITS_ENABLED is true (or DB override). */
export const SIGNUP_BONUS_CREDITS = 0;

export const CREDIT_COST = {
  practice_question: 1,
  mock_test: 5,
};

export const SUBSCRIPTION_PLANS = {
  day_pass: {
    id: 'day_pass',
    name: '24-Hour Unlimited',
    description: 'Unlimited practice & mock tests for exactly 24 hours. Does not include AI trackers.',
    priceInr: 5,
    durationHours: 24,
    badge: 'Try unlimited',
  },
  three_months: {
    id: 'three_months',
    name: '3 Months Unlimited',
    description: 'Practice, mocks, and AI playlist builder (5 builds/month) for 90 days',
    priceInr: 100,
    durationDays: 90,
    badge: 'Popular',
  },
  six_months: {
    id: 'six_months',
    name: '6 Months Unlimited',
    description: 'Practice, mocks, and AI playlist builder (5 builds/month) for 180 days',
    priceInr: 149,
    durationDays: 180,
    badge: 'Best value',
  },
};

export function planAmountPaise(planId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) return null;
  return plan.priceInr * 100;
}
