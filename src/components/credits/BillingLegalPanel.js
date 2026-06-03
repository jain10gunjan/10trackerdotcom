'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BillingLegalPanel({ termsAccepted, onTermsChange }) {
  const [legal, setLegal] = useState({
    businessName: '10Tracker',
    gstin: '',
    supportEmail: '',
    termsVersion: '',
  });

  useEffect(() => {
    fetch('/api/billing/legal')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setLegal({
            businessName: data.businessName,
            gstin: data.gstin,
            supportEmail: data.supportEmail,
            termsVersion: data.termsVersion,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Seller details</p>
        <p className="text-base font-semibold text-neutral-900 mt-1">{legal.businessName}</p>
        {legal.gstin ? (
          <p className="text-sm text-neutral-600 mt-0.5">
            GSTIN: <span className="font-mono font-medium text-neutral-800">{legal.gstin}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-700 mt-1">
            Set NEXT_PUBLIC_BUSINESS_GSTIN in .env.local to display your GSTIN at checkout.
          </p>
        )}
        {legal.supportEmail && (
          <p className="text-sm text-neutral-600 mt-1">
            Billing support:{' '}
            <a href={`mailto:${legal.supportEmail}`} className="text-neutral-900 underline">
              {legal.supportEmail}
            </a>
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        <span className="text-sm text-neutral-700 leading-relaxed group-hover:text-neutral-900">
          I agree to the{' '}
          <Link href="/terms-and-services" className="underline font-medium" target="_blank">
            Terms of Service
          </Link>
          ,{' '}
          <Link href="/privacy-policy" className="underline font-medium" target="_blank">
            Privacy Policy
          </Link>
          , and{' '}
          <Link href="/disclaimer" className="underline font-medium" target="_blank">
            Disclaimer
          </Link>
          . I understand that payments are processed securely by Razorpay and that digital access
          begins after successful payment. GST invoice will be issued to the email used at checkout.
          {legal.termsVersion && (
            <span className="block text-xs text-neutral-500 mt-1">Terms version: {legal.termsVersion}</span>
          )}
        </span>
      </label>

      {!termsAccepted && (
        <p className="text-xs text-neutral-500">
          Accept the terms above to enable subscription buttons below.
        </p>
      )}
    </div>
  );
}
