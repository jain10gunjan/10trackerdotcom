/** Legal / billing display — set in .env.local (NEXT_PUBLIC_* for client display). */

export const TERMS_VERSION = '2026-06-06';

/** Registered seller / legal entity */
export const LEGAL_ENTITY_NAME = 'Manish Kumar Patni HUF';

/** Consumer-facing website brand */
export const PLATFORM_BRAND = '10Tracker.com';

/** General enquiries */
export const CONTACT_EMAIL = 'contact@10tracker.com';

/** Billing, payments, refunds, GST invoices */
export const BILLING_EMAIL = 'billing@10tracker.com';

export function getBillingLegalInfo() {
  const businessName = LEGAL_ENTITY_NAME;

  const gstin =
    process.env.NEXT_PUBLIC_BUSINESS_GSTIN?.trim() ||
    process.env.BUSINESS_GSTIN?.trim() ||
    '';

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || CONTACT_EMAIL;

  const billingEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    BILLING_EMAIL;

  return {
    businessName,
    platformBrand: PLATFORM_BRAND,
    gstin,
    contactEmail,
    billingEmail,
    /** @deprecated use billingEmail */
    supportEmail: billingEmail,
    termsVersion: TERMS_VERSION,
  };
}

export function validateTermsAcceptance(body) {
  if (body?.termsAccepted !== true) {
    return { ok: false, error: 'You must accept the Terms of Service and Privacy Policy to continue.' };
  }
  return { ok: true };
}
