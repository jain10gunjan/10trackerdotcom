/** Institute SaaS plans (amounts in paise). Reuse Razorpay like B2C subscriptions. */

export const VENDOR_PLAN_IDS = {
  TRIAL: 'trial',
  MONTHLY: 'vendor_monthly',
  TEST_PACK: 'vendor_test_pack',
  CODING_ADDON: 'vendor_coding_addon',
};

export const VENDOR_PLANS = [
  {
    id: VENDOR_PLAN_IDS.TRIAL,
    name: '14-day trial',
    description: 'Create your institute portal, import questions, and run a sample test.',
    amountPaise: 0,
    intervalDays: 14,
    codingContestsAddon: false,
    isSelfServe: true,
  },
  {
    id: VENDOR_PLAN_IDS.MONTHLY,
    name: 'Institute monthly',
    description: 'Unlimited published MCQ tests for one institute portal.',
    amountPaise: 499900, // ₹4,999
    intervalDays: 30,
    codingContestsAddon: false,
    isSelfServe: true,
  },
  {
    id: VENDOR_PLAN_IDS.TEST_PACK,
    name: 'Test pack (10)',
    description: 'Credit pack for institutes that prefer per-test billing.',
    amountPaise: 199900, // ₹1,999
    intervalDays: null,
    codingContestsAddon: false,
    isSelfServe: true,
  },
  {
    id: VENDOR_PLAN_IDS.CODING_ADDON,
    name: 'Coding contests add-on',
    description: 'Judge0 contests inside your portal (requires monthly plan).',
    amountPaise: 299900, // ₹2,999 / month
    intervalDays: 30,
    codingContestsAddon: true,
    isSelfServe: true,
  },
];

export function getVendorPlanById(planId) {
  return VENDOR_PLANS.find((p) => p.id === String(planId || '').trim()) || null;
}

export function formatVendorPlanPrice(plan) {
  if (!plan) return '';
  if (!plan.amountPaise) return 'Free';
  return `₹${Math.round(plan.amountPaise / 100).toLocaleString('en-IN')}`;
}
