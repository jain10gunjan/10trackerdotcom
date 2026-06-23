'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import LegalTermsCheckbox from '@/components/legal/LegalTermsCheckbox';
import { useProfileGate } from '@/context/ProfileGateContext';
import { TERMS_VERSION } from '@/lib/billing/legal';

function formatTermsDate(version) {
  const d = new Date(`${version}T00:00:00`);
  if (Number.isNaN(d.getTime())) return version;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Shared accept UI for terms re-acceptance.
 * @param {'modal' | 'dock'} variant — modal on app routes; dock (fixed bottom) on legal/browse pages
 */
export default function TermsReacceptPanel({
  variant = 'modal',
  returnPath = '/',
  onAccepted,
}) {
  const { acceptTerms, saving, profile } = useProfileGate();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  const previousVersion = profile?.terms_version;
  const isDock = variant === 'dock';

  const handleAccept = async () => {
    setError('');
    if (!termsAccepted) {
      setError('Please accept the updated Terms, Privacy Policy, and Disclaimer.');
      return;
    }
    try {
      await acceptTerms();
      setTermsAccepted(false);
      onAccepted?.();
    } catch (e) {
      setError(e.message || 'Could not save acceptance');
    }
  };

  if (isDock) {
    return (
      <div
        className="fixed bottom-16 md:bottom-0 inset-x-0 z-[90] border-t border-neutral-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        role="region"
        aria-label="Accept updated policies"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
          <p className="text-xs text-neutral-500 mb-2 sm:mb-0 sm:hidden">
            Scroll to read this page, then accept to continue.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <LegalTermsCheckbox
                id="terms-reaccept-dock-checkbox"
                checked={termsAccepted}
                onChange={setTermsAccepted}
                termsVersion={TERMS_VERSION}
                openInNewTab={false}
                returnPath={returnPath}
                compact
                showVersion={false}
              />
            </div>
            <button
              type="button"
              onClick={handleAccept}
              disabled={saving || !termsAccepted}
              className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Accept & continue'}
            </button>
          </div>
          {error ? <p className="text-xs text-red-600 mt-2">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-neutral-700" />
        </div>
        <div>
          <h2 id="terms-reaccept-title" className="text-lg font-semibold text-neutral-900">
            We&apos;ve updated our policies
          </h2>
          <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
            Please review and accept the latest terms to keep using 10Tracker. Open Terms,
            Privacy, or Disclaimer from the checkbox — those pages are fully readable while you
            review.
            {previousVersion && previousVersion !== TERMS_VERSION ? (
              <span className="block mt-1 text-xs text-neutral-500">
                Updated {formatTermsDate(TERMS_VERSION)}
                {previousVersion !== 'legacy' ? ` (was ${previousVersion})` : ''}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <LegalTermsCheckbox
        id="terms-reaccept-checkbox"
        checked={termsAccepted}
        onChange={setTermsAccepted}
        termsVersion={TERMS_VERSION}
        openInNewTab={false}
        returnPath={returnPath}
        className="bg-neutral-50 mb-4"
      />

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      <button
        type="button"
        onClick={handleAccept}
        disabled={saving || !termsAccepted}
        className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving…' : 'Accept & continue'}
      </button>
    </div>
  );
}
