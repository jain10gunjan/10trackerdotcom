/** Credit costs and subscription plans (INR, Razorpay amounts in paise) */

export const SIGNUP_BONUS_CREDITS = 60;

export const CREDIT_COST = {
  practice_question: 1,
  mock_test: 5,
};

export const SUBSCRIPTION_PLANS = {
  day_pass: {
    id: 'day_pass',
    name: '24-Hour Unlimited',
    description: 'Unlimited practice & mock tests for exactly 24 hours from purchase',
    priceInr: 5,
    durationHours: 24,
    badge: 'Try unlimited',
  },
  three_months: {
    id: 'three_months',
    name: '3 Months Unlimited',
    description: 'Full access for 90 days — best for serious prep',
    priceInr: 100,
    durationDays: 90,
    badge: 'Popular',
  },
  six_months: {
    id: 'six_months',
    name: '6 Months Unlimited',
    description: 'Full access for 180 days — maximum savings',
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
