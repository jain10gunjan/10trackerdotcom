"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import { ProfileGateProvider } from "@/context/ProfileGateContext";
import { CreditsProvider } from "@/context/CreditsContext";
import PaywallModal from "@/features/credits/components/PaywallModal";
import WelcomeBonusToast from "@/features/credits/components/WelcomeBonusToast";
import { Toaster } from "react-hot-toast";
import AppChrome from "@/components/layout/AppChrome";

export default function Providers({ children }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthProvider>
        <CreditsProvider>
          <ProfileGateProvider>
            <AppChrome>{children}</AppChrome>
            <PaywallModal />
            <WelcomeBonusToast />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: { fontSize: '14px' },
                success: { duration: 3000 },
                error: { duration: 4000 },
              }}
            />
          </ProfileGateProvider>
        </CreditsProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
