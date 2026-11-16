import ExtensionConnectPage from '@/features/extension-auth/components/ExtensionConnectPage';

export const metadata = {
  title: 'Connect Chrome extension',
  description: 'Authorize the 10Tracker YouTube Progress Chrome extension.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ExtensionConnectPage />;
}
