import Link from 'next/link';
import LegalPageShell from '@/features/legal/components/LegalPageShell';
import {
  getBillingLegalInfo,
  LEGAL_ENTITY_NAME,
  PLATFORM_BRAND,
  TERMS_VERSION,
  CONTACT_EMAIL,
  BILLING_EMAIL,
} from '@/features/billing/lib/legal';

export const metadata = {
  title: 'Privacy Policy - 10tracker',
  description:
    'How 10Tracker.com collects, uses, and protects your data — accounts, practice progress, payments.',
  openGraph: {
    title: 'Privacy Policy - 10tracker',
    description: 'Privacy practices for 10Tracker.com operated by Manish Kumar Patni HUF.',
    type: 'website',
  },
};

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-neutral-900 mb-3">{title}</h2>
      <div className="space-y-3 text-neutral-600 leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}

function formatLegalDate(version) {
  const d = new Date(`${version}T00:00:00`);
  if (Number.isNaN(d.getTime())) return version;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PrivacyPolicyPage() {
  const legal = getBillingLegalInfo();
  const contactEmail = legal.contactEmail || CONTACT_EMAIL;
  const billingEmail = legal.billingEmail || BILLING_EMAIL;

  return (
    <LegalPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="mb-10 pb-8 border-b border-neutral-200">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mt-2 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-500 mt-3">
            Last updated: {formatLegalDate(TERMS_VERSION)}
          </p>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
            {LEGAL_ENTITY_NAME} (&quot;we,&quot; &quot;us&quot;) operates{' '}
            <strong className="text-neutral-800">{PLATFORM_BRAND}</strong>. This Policy explains
            what personal data we collect, how we use it, and your choices. It applies when you
            sign in, practice questions, take mock tests, or purchase plans on the Platform.
          </p>
        </header>

        <div className="space-y-10">
          <Section title="1. Data we collect">
            <p>
              <strong>Account & profile (Google sign-in)</strong>
            </p>
            <p>
              When you sign in with Google, we receive information from your Google account such as
              your <strong>name</strong>, <strong>email address</strong>, and{' '}
              <strong>profile picture</strong>. You may also provide optional profile details (for
              example display name, target exams, location fields) stored in our database.
            </p>
            <p>
              <strong>Learning & usage data</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Practice progress (topics completed, answers, points, timestamps)</li>
              <li>Mock test attempts (scores, answers, time spent, status)</li>
              <li>Credit wallet balance and credit usage history</li>
              <li>Subscription purchase records (plan, amount, status, dates)</li>
            </ul>
            <p>
              <strong>Technical data</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Session cookies required to keep you signed in</li>
              <li>Device/browser type, IP address, and server logs for security and debugging</li>
              <li>
                Analytics data (if enabled on our site, such as Google Analytics) about pages
                visited and general usage patterns
              </li>
            </ul>
            <p>
              <strong>Payment data</strong>
            </p>
            <p>
              Payments are handled by <strong>Razorpay</strong>. We do not store your full card,
              UPI PIN, or bank credentials. We may receive payment confirmation, order IDs, and
              billing-related metadata needed to activate your plan.
            </p>
          </Section>

          <Section title="2. How we use your data">
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account</li>
              <li>Save practice and mock-test progress across sessions</li>
              <li>Operate the credit wallet and unlimited subscription plans</li>
              <li>Process one-time plan purchases via Razorpay</li>
              <li>Issue GST invoices on request to your account email</li>
              <li>Show dashboards, mock-test rankings, and performance analytics</li>
              <li>Respond to support requests and prevent abuse or fraud</li>
              <li>Improve reliability, security, and features of the Platform</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal information to advertisers or data
              brokers.
            </p>
          </Section>

          <Section title="3. Mock test leaderboards">
            <p>
              The Platform includes <strong>mock test leaderboards</strong> (overall and per-test
              rankings). If you take mock tests and complete your profile, your{' '}
              <strong>first and last name</strong> may appear on these rankings for other users.
              Your <strong>email address and phone number are not shown</strong> on leaderboards.
            </p>
            <p>
              You can update the name displayed via your profile settings. Rankings are based on
              mock-test performance data stored in our database. Leaderboard views do not require
              other users to know your email or contact details.
            </p>
          </Section>

          <Section title="4. Where data is stored">
            <p>
              Data is stored in secure cloud databases (including Supabase) and processed on servers
              used to run {PLATFORM_BRAND}. Some infrastructure or support providers may process
              data outside your city, but always for the purposes described in this Policy.
            </p>
          </Section>

          <Section title="4. Sharing with service providers">
            <p>We share data only as needed with trusted providers, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Google</strong> — authentication (OAuth)
              </li>
              <li>
                <strong>Razorpay</strong> — payment processing
              </li>
              <li>
                <strong>Hosting & database providers</strong> — running the Platform
              </li>
              <li>
                <strong>Analytics providers</strong> — aggregated usage statistics, if enabled
              </li>
            </ul>
            <p>
              We may also disclose information if required by law, court order, or to protect the
              rights, safety, and security of users and the Platform.
            </p>
          </Section>

          <Section title="6. Cookies and sessions">
            <p>
              We use cookies and similar technologies to maintain your login session and remember
              preferences. Essential cookies are required for sign-in and core features. You can
              control non-essential cookies through your browser settings, but some features may not
              work if you disable essential cookies.
            </p>
          </Section>

          <Section title="7. Data retention">
            <p>
              We retain your account, progress, and purchase records for as long as your account is
              active or as needed to provide the Platform, resolve disputes, enforce our Terms, and
              meet legal requirements. You may request deletion as described below.
            </p>
          </Section>

          <Section title="8. Your rights and choices">
            <p>Subject to applicable Indian law, you may:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access or update profile information in your account settings</li>
              <li>Request correction of inaccurate data</li>
              <li>Request a GST invoice for a completed purchase — email {billingEmail}</li>
              <li>Withdraw consent where processing is consent-based (may limit features)</li>
            </ul>
            <p>
              <strong>Account deletion</strong> is not available in the app. To request deletion of
              your account and associated personal data, email{' '}
              <a href={`mailto:${contactEmail}`} className="underline text-neutral-800">
                {contactEmail}
              </a>{' '}
              from the address linked to your account. We may need to verify your identity before
              processing the request. Some purchase or tax records may be retained where required
              by law.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We use reasonable technical and organisational measures to protect your data,
              including encrypted connections (HTTPS) and access controls. No online service can
              guarantee absolute security; please use a strong Google account password and do not
              share your login.
            </p>
          </Section>

          <Section title="10. Children">
            <p>
              The Platform is intended for users aged <strong>13 and older</strong>. We do not
              knowingly collect personal information from children under 13. If you believe a child
              under 13 has provided data, contact us and we will take appropriate steps to delete
              it.
            </p>
          </Section>

          <Section title="11. Changes to this Policy">
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot;
              date at the top will change when we do. Material changes may be noted on the Platform.
              Continued use after updates constitutes acceptance.
            </p>
          </Section>

          <Section title="12. Governing law">
            <p>
              This Policy is governed by the laws of <strong>India</strong>. See also our{' '}
              <Link href="/terms-and-services" className="underline text-neutral-800">
                Terms of Service
              </Link>
              .
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Privacy questions and data requests:
              <br />
              <strong>{LEGAL_ENTITY_NAME}</strong> ({PLATFORM_BRAND})
              <br />
              <a href={`mailto:${contactEmail}`} className="underline text-neutral-800">
                {contactEmail}
              </a>
            </p>
            <p>
              GST invoice requests:{' '}
              <a href={`mailto:${billingEmail}`} className="underline text-neutral-800">
                {billingEmail}
              </a>
            </p>
            <p>
              We operate {PLATFORM_BRAND} as an online service in India. For statutory notices or
              compliance enquiries, use the email above. Registered business particulars are
              available on request.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link href="/terms-and-services" className="hover:text-neutral-900 underline">
            Terms of Service
          </Link>
          <Link href="/disclaimer" className="hover:text-neutral-900 underline">
            Disclaimer
          </Link>
          <Link href="/pricing" className="hover:text-neutral-900 underline">
            Pricing
          </Link>
        </div>
      </div>
    </LegalPageShell>
  );
}
