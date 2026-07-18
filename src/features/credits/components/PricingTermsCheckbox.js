'use client';

import LegalTermsCheckbox from '@/features/legal/components/LegalTermsCheckbox';

export default function PricingTermsCheckbox({ termsAccepted, onTermsChange, termsVersion }) {
  return (
    <LegalTermsCheckbox
      checked={termsAccepted}
      onChange={onTermsChange}
      termsVersion={termsVersion}
      openInNewTab
      className="bg-white"
    />
  );
}
