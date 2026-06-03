'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomMenu from '@/components/MobileBottomMenu';
import AuthModalWrapper from '@/components/AuthModalWrapper';
import ProfileModal from '@/components/ProfileModal';
import AnalyticsInitializer from '@/components/AnalyticsInitializer';
import ProfileGateLoader from '@/components/ProfileGateLoader';
import { useAuth } from '@/app/context/AuthContext';
import { useProfileGate } from '@/context/ProfileGateContext';
import { isProfileExemptPath } from '@/lib/profileGatePaths';

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { gateActive, loading: profileLoading } = useProfileGate();

  const onProfilePage = pathname === '/profile' || pathname?.startsWith('/profile/');
  const shellHidden = Boolean(gateActive);
  const blockContent =
    user && !authLoading && profileLoading && !isProfileExemptPath(pathname) && !onProfilePage;

  if (blockContent) {
    return (
      <>
        <AnalyticsInitializer />
        <ProfileGateLoader />
      </>
    );
  }

  return (
    <>
      <AnalyticsInitializer />
      <AuthModalWrapper />
      {!shellHidden && <Navbar />}
      {!shellHidden && <ProfileModal />}
      <div
        className={
          shellHidden ? '' : onProfilePage ? 'pt-24 pb-16 md:pb-0' : 'pb-16 md:pb-0'
        }
      >
        {children}
      </div>
      {!shellHidden && <Footer />}
      {!shellHidden && <MobileBottomMenu />}
    </>
  );
}
