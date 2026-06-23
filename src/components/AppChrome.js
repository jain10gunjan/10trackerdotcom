'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomMenu from '@/components/MobileBottomMenu';
import AuthModalWrapper from '@/components/AuthModalWrapper';
import ProfileModal from '@/components/ProfileModal';
import AnalyticsInitializer from '@/components/AnalyticsInitializer';
import TermsReacceptanceModal from '@/components/profile/TermsReacceptanceModal';
import TermsReacceptanceBanner from '@/components/profile/TermsReacceptanceBanner';
import { useProfileGate } from '@/context/ProfileGateContext';
import {
  isImmersiveMobileNavPath,
  isOnboardingBrowsePath,
  isHomeDashboardPath,
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
  const onHome = isHomeDashboardPath(pathname);
  const onBrowsePage = isOnboardingBrowsePath(pathname);
  const shellHidden = Boolean(gateActive && !onBrowsePage && !onHome);
  const termsDockActive = Boolean(termsReacceptRequired && onBrowsePage && !shellHidden);
  const showMobileBottomMenu = !isImmersiveMobileNavPath(pathname);

  const mainPadding = (() => {
    if (shellHidden) {
      return showMobileBottomMenu ? 'pb-16 lg:pb-0' : '';
    }
    if (onProfilePage) {
      return 'pt-24 pb-16 md:pb-0';
    }
    if (termsDockActive) {
      return 'pb-36 md:pb-28';
    }
    if (onHome || onBrowsePage) {
      return 'pb-16 md:pb-0';
    }
    return 'pb-16 md:pb-0';
  })();

  return (
    <>
      <AnalyticsInitializer />
      <Suspense fallback={null}>
        <AuthModalWrapper />
      </Suspense>
      {!shellHidden && <Navbar />}
      {!shellHidden && <ProfileModal />}
      <div className={mainPadding}>{children}</div>
      {termsDockActive ? <div className="h-20 md:h-16 shrink-0" aria-hidden /> : null}
      {!shellHidden && <Footer />}
      {showMobileBottomMenu ? <MobileBottomMenu /> : null}
      <TermsReacceptanceBannerSlot />
      <TermsReacceptanceModal />
    </>
  );
}
