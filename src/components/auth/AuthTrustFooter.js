'use client';

import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';

export default function AuthTrustFooter({ compact = false }) {
  if (compact) {
    return (
      <p className="text-center text-xs text-neutral-500 leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="/terms-and-services" className="text-emerald-700 hover:text-emerald-800 font-medium">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy-policy" className="text-emerald-700 hover:text-emerald-800 font-medium">
          Privacy Policy
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          Secure Google sign-in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          Free to start
        </span>
        <span>No credit card required</span>
      </div>
      <p className="text-center text-xs text-neutral-500 leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="/terms-and-services" className="text-emerald-700 hover:text-emerald-800 font-medium">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy-policy" className="text-emerald-700 hover:text-emerald-800 font-medium">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
