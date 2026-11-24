'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileBottomMenu from '@/components/layout/MobileBottomMenu';
import AuthModalWrapper from '@/features/auth/components/AuthModalWrapper';
import AnalyticsInitializer from '@/components/AnalyticsInitializer';
import TermsReacceptanceModal from '@/features/profile/components/TermsReacceptanceModal';
import TermsReacceptanceBanner from '@/features/profile/components/TermsReacceptanceBanner';
import { useProfileGate } from '@/context/ProfileGateContext';
import { APP_MOBILE_BOTTOM_CLEARANCE } from '@/lib/appChrome';
import {
  isImmersiveMobileNavPath,
  isOnboardingBrowsePath,
  isHomeDashboardPath,
  isVendorAttemptPath,
} from '@/lib/profileGatePaths';

function TermsReacceptanceBannerSlot() {
  return (
    <Suspense fallback={null}>
      <TermsReacceptanceBanner />
    </Suspense>
  );
}

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const { gateActive, termsReacceptRequired } = useProfileGate();

  const onProfilePage = pathname === '/profile' || pathname?.startsWith('/profile/');
  const onAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
  const onHome = isHomeDashboardPath(pathname);
  const onBrowsePage = isOnboardingBrowsePath(pathname);
  const onVendorAttempt = isVendorAttemptPath(pathname);
  const shellHidden = Boolean(gateActive && !onBrowsePage && !onHome) || onVendorAttempt;
  const termsDockActive = Boolean(termsReacceptRequired && onBrowsePage && !shellHidden);
  const showMobileBottomMenu =
    !isImmersiveMobileNavPath(pathname) &&
    !onAuthPage &&
    !(gateActive && onProfilePage);

  const mainPadding = (() => {
    if (shellHidden) {
      return showMobileBottomMenu ? 'pb-16 lg:pb-0' : '';
    }
    if (onProfilePage) {
      return showMobileBottomMenu
        ? 'pt-[4.25rem] pb-16 lg:pb-0'
        : 'pt-[4.25rem]';
    }
    if (onAuthPage) {
      return '';
    }
    if (termsDockActive) {
      return 'pb-36 lg:pb-28';
    }
    if (onBrowsePage) {
      return 'pb-16 lg:pb-0';
    }
    return 'pb-16 lg:pb-0';
  })();

  // `/` is both the signed-in home and the guest page. Only the bottom
  // clearance changes here — guest marketing layout is otherwise untouched.
  // Length comes from APP_MOBILE_BOTTOM_CLEARANCE; lg:pb-0 wins at desktop.
  const mainClass = onHome
    ? 'pb-[var(--app-mobile-bottom-clearance)] lg:pb-0'
    : mainPadding;
  const mainStyle = onHome
    ? { '--app-mobile-bottom-clearance': APP_MOBILE_BOTTOM_CLEARANCE }
    : undefined;

  return (
    <>
      <AnalyticsInitializer />
      <Suspense fallback={null}>
        <AuthModalWrapper />
      </Suspense>
      {!shellHidden && <Navbar />}
      <div className={mainClass} style={mainStyle}>{children}</div>
      {termsDockActive ? <div className="h-20 md:h-16 shrink-0" aria-hidden /> : null}
      {!shellHidden && <Footer />}
      {showMobileBottomMenu ? <MobileBottomMenu /> : null}
      <TermsReacceptanceBannerSlot />
      <TermsReacceptanceModal />
    </>
  );
}
