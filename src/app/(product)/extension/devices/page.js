import ExtensionDevicesPage from '@/features/extension-auth/components/ExtensionDevicesPage';

export const metadata = {
  title: 'Extension devices',
  description: 'Manage Chrome extension access for 10Tracker YouTube progress.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ExtensionDevicesPage />;
}
