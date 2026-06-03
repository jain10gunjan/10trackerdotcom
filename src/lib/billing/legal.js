/** Legal / billing display — set in .env.local (NEXT_PUBLIC_* for client display). */

export const TERMS_VERSION = '2025-06-01';

export function getBillingLegalInfo() {
  const businessName =
    process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME?.trim() ||
    process.env.BUSINESS_LEGAL_NAME?.trim() ||
    '10Tracker';

  const gstin =
    process.env.NEXT_PUBLIC_BUSINESS_GSTIN?.trim() ||
    process.env.BUSINESS_GSTIN?.trim() ||
    '';

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    '';

  return {
    businessName,
    gstin,
    supportEmail,
    termsVersion: TERMS_VERSION,
  };
}

export function validateTermsAcceptance(body) {
  if (body?.termsAccepted !== true) {
    return { ok: false, error: 'You must accept the Terms of Service and Privacy Policy to continue.' };
  }
  return { ok: true };
}
