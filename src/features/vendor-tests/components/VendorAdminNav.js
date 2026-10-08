import Link from 'next/link';

const LINKS = [
  { href: 'admin', label: 'Overview' },
  { href: 'admin/settings', label: 'Settings' },
  { href: 'admin/members', label: 'Members' },
  { href: 'admin/questions', label: 'Questions' },
  { href: 'admin/tests', label: 'Tests' },
  { href: 'admin/results', label: 'Results' },
];

export default function VendorAdminNav({ slug, active = 'admin' }) {
  return (
    <nav className="mb-6 rounded-2xl border border-neutral-200/90 bg-white/90 p-1 shadow-sm backdrop-blur sm:mb-8">
      <div className="flex flex-wrap gap-1">
        {LINKS.map((link) => {
          const key = link.href;
          const isActive =
            active === key || (key !== 'admin' && String(active || '').startsWith(key));
          return (
            <Link
              key={key}
              href={`/practice-tests/${slug}/${link.href}`}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
