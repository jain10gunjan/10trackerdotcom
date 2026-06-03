import { Suspense } from 'react';
import ProfileGateLoader from '@/components/ProfileGateLoader';

export default function ProfileLayout({ children }) {
  return <Suspense fallback={<ProfileGateLoader />}>{children}</Suspense>;
}
