'use client';

import { useEffect, useState } from 'react';

export default function SellerDetailsFooter() {
  const [legal, setLegal] = useState(null);

  useEffect(() => {
    fetch('/api/billing/legal')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setLegal({
            businessName: data.businessName,
            platformBrand: data.platformBrand,
            billingEmail: data.billingEmail || data.supportEmail,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!legal) return null;

  return (
    <footer className="mt-10 pt-8 border-t border-neutral-200">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
        Seller details
      </p>
      <div className="text-sm text-neutral-600 space-y-1">
        <p className="font-medium text-neutral-900">{legal.businessName}</p>
        {legal.platformBrand ? (
          <p className="text-neutral-500">{legal.platformBrand}</p>
        ) : null}
        {legal.billingEmail ? (
          <p>
            Billing{' '}
            <a
              href={`mailto:${legal.billingEmail}`}
              className="text-neutral-900 underline underline-offset-2"
            >
              {legal.billingEmail}
            </a>
          </p>
        ) : null}
      </div>
    </footer>
  );
}
