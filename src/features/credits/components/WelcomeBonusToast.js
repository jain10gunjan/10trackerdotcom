'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function WelcomeBonusToast() {
  useEffect(() => {
    const onBonus = (e) => {
      const credits = e.detail?.credits;
      toast.success(
        credits != null
          ? `Welcome! ${credits} free credits added to your account.`
          : 'Welcome! Free credits added to your account.',
        { duration: 5000 }
      );
    };
    window.addEventListener('credits-welcome-bonus', onBonus);
    return () => window.removeEventListener('credits-welcome-bonus', onBonus);
  }, []);
  return null;
}
