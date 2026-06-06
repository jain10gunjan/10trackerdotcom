'use client';

import Link from 'next/link';
import { buildOnboardingBrowseHref } from '@/lib/profileGatePaths';

/**
 * Standard terms acceptance checkbox (pricing checkout, profile onboarding).
 */
export default function LegalTermsCheckbox({
  checked,
  onChange,
  termsVersion,
  openInNewTab = false,
  className = '',
  id = 'legal-terms-checkbox',
  returnPath = '',
  variant = 'default',
  showVersion = true,
  compact = false,
}) {
  const linkProps = openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const onDark = variant === 'onDark';
  const termsHref = openInNewTab
    ? '/terms-and-services'
    : buildOnboardingBrowseHref('/terms-and-services', returnPath);
  const privacyHref = openInNewTab
    ? '/privacy-policy'
    : buildOnboardingBrowseHref('/privacy-policy', returnPath);
  const disclaimerHref = openInNewTab
    ? '/disclaimer'
    : buildOnboardingBrowseHref('/disclaimer', returnPath);

  const linkClass = `underline font-medium ${onDark ? 'text-white' : 'text-neutral-900'}`;
  const textClass = onDark
    ? 'text-neutral-200 group-hover:text-white'
    : 'text-neutral-600 group-hover:text-neutral-800';

  const labelContent = compact ? (
    <span className={`text-xs sm:text-sm leading-snug ${textClass}`}>
      I agree to the{' '}
      <Link href={termsHref} className={linkClass} {...linkProps}>
        Terms
      </Link>
      ,{' '}
      <Link href={privacyHref} className={linkClass} {...linkProps}>
        Privacy Policy
      </Link>
      , and{' '}
      <Link href={disclaimerHref} className={linkClass} {...linkProps}>
        Disclaimer
      </Link>
      .
    </span>
  ) : (
    <span className={`text-sm leading-relaxed ${textClass}`}>
      I agree to the{' '}
      <Link href={termsHref} className={linkClass} {...linkProps}>
        Terms of Service
      </Link>
      ,{' '}
      <Link href={privacyHref} className={linkClass} {...linkProps}>
        Privacy Policy
      </Link>
      , and{' '}
      <Link href={disclaimerHref} className={linkClass} {...linkProps}>
        Disclaimer
      </Link>
      .
      {showVersion && termsVersion ? (
        <span className={`block text-xs mt-1.5 ${onDark ? 'text-neutral-400' : 'text-neutral-400'}`}>
          Terms version: {termsVersion}
        </span>
      ) : null}
    </span>
  );

  return (
    <div
      className={`rounded-xl border ${
        compact ? 'px-0 py-0 border-0 bg-transparent' : 'px-4 py-4'
      } ${
        compact
          ? ''
          : onDark
            ? 'border-neutral-600 bg-neutral-800/50'
            : 'border-neutral-200 bg-neutral-50'
      } ${className}`}
    >
      <label
        htmlFor={id}
        className={`flex items-start gap-2.5 cursor-pointer group ${compact ? 'items-center' : ''}`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        {labelContent}
      </label>
    </div>
  );
}
