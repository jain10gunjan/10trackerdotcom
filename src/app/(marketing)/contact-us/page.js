import Link from 'next/link';
import LegalPageShell from '@/features/legal/components/LegalPageShell';
import {
  CONTACT_EMAIL,
  BILLING_EMAIL,
  getBillingLegalInfo,
  LEGAL_ENTITY_NAME,
  PLATFORM_BRAND,
} from '@/features/billing/lib/legal';

export const metadata = {
  title: 'Contact Us - 10tracker',
  description:
    'Contact 10Tracker.com for support, feedback, billing, and account help.',
  openGraph: {
    title: 'Contact Us - 10tracker',
    description: 'Get in touch with the 10Tracker.com team.',
    type: 'website',
  },
};

function ContactCard({ title, description, email, emailLabel }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h2>
      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{description}</p>
      <a
        href={`mailto:${email}`}
        className="text-sm font-medium text-neutral-900 underline underline-offset-2"
      >
        {emailLabel || email}
      </a>
    </div>
  );
}

export default function ContactUsPage() {
  const legal = getBillingLegalInfo();
  const contactEmail = legal.contactEmail || CONTACT_EMAIL;
  const billingEmail = legal.billingEmail || BILLING_EMAIL;

  return (
    <LegalPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="mb-10 pb-8 border-b border-neutral-200">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Support
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mt-2 tracking-tight">
            Contact us
          </h1>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
            {PLATFORM_BRAND} is operated by {LEGAL_ENTITY_NAME}. Use the emails below for
            help with practice, mock tests, accounts, or billing.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <ContactCard
            title="General support"
            description="Account help, sign-in issues, practice or mock-test questions, content feedback, bug reports, privacy requests, and partnerships."
            email={contactEmail}
          />
          <ContactCard
            title="Billing & payments"
            description="Plan purchases, Razorpay payments, refunds, credit wallet issues, and GST invoice requests."
            email={billingEmail}
          />
        </div>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Before you write
          </h2>
          <ul className="space-y-3 text-sm text-neutral-600 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-neutral-400 shrink-0">•</span>
              <span>
                Sign in with the <strong className="text-neutral-800">Google account</strong>{' '}
                linked to your profile so we can locate your progress and purchases.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-400 shrink-0">•</span>
              <span>
                For billing, include your <strong className="text-neutral-800">order ID</strong>{' '}
                or payment date from Razorpay if available.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-400 shrink-0">•</span>
              <span>
                To request <strong className="text-neutral-800">account deletion</strong>, email{' '}
                {contactEmail} from the address tied to your account.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-neutral-400 shrink-0">•</span>
              <span>
                Plan and credit details are on{' '}
                <Link href="/pricing" className="underline text-neutral-800">
                  Pricing
                </Link>
                ; legal terms are in our{' '}
                <Link href="/terms-and-services" className="underline text-neutral-800">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="underline text-neutral-800">
                  Privacy Policy
                </Link>
                .
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Response time</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            We aim to reply within <strong className="text-neutral-800">2–3 business days</strong>{' '}
            (Monday–Friday, IST). Billing queries with complete payment details are usually
            handled first.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Follow us</h2>
          <p className="text-sm text-neutral-600 mb-3">
            Updates and exam prep tips on social media:
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href="https://x.com/10Tracker"
              className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              X (Twitter)
            </a>
            <a
              href="https://www.instagram.com/10tracker/"
              className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link href="/about-us" className="hover:text-neutral-900 underline">
            About us
          </Link>
          <Link href="/pricing" className="hover:text-neutral-900 underline">
            Pricing
          </Link>
          <Link href="/disclaimer" className="hover:text-neutral-900 underline">
            Disclaimer
          </Link>
        </div>
      </div>
    </LegalPageShell>
  );
}
