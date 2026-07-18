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
  title: 'Terms of Service - 10tracker',
  description:
    'Terms of Service for 10tracker — exam practice, mock tests, credits, subscription plans, and study roadmaps.',
  openGraph: {
    title: 'Terms of Service - 10tracker',
    description: 'Rules and guidelines for using the 10tracker exam preparation platform.',
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

function formatTermsDate(version) {
  const d = new Date(`${version}T00:00:00`);
  if (Number.isNaN(d.getTime())) return version;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function TermsAndServicesPage() {
  const legal = getBillingLegalInfo();
  const contactEmail = legal.contactEmail || CONTACT_EMAIL;
  const billingEmail = legal.billingEmail || BILLING_EMAIL;
  const lastUpdated = formatTermsDate(TERMS_VERSION);

  return (
    <LegalPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="mb-10 pb-8 border-b border-neutral-200">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mt-2 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-neutral-500 mt-3">
            Last updated: {lastUpdated} · Version {TERMS_VERSION}
          </p>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
            These Terms govern your use of{' '}
            <strong className="text-neutral-800">{PLATFORM_BRAND}</strong> (the
            &quot;Platform&quot;), operated by{' '}
            <strong className="text-neutral-800">{LEGAL_ENTITY_NAME}</strong>. By using the
            Platform, you agree to these Terms, our{' '}
            <Link href="/privacy-policy" className="underline text-neutral-800">
              Privacy Policy
            </Link>
            , and{' '}
            <Link href="/disclaimer" className="underline text-neutral-800">
              Disclaimer
            </Link>
            .
          </p>
        </header>

        <div className="space-y-10">
          <Section title="1. What the Platform provides">
            <p>
              {PLATFORM_BRAND} is an online exam-preparation platform operated by{' '}
              {LEGAL_ENTITY_NAME}. Depending on your account and plan, you may access:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chapter and topic-wise MCQ practice with progress tracking</li>
              <li>Timed mock tests across supported exam categories</li>
              <li>A personal dashboard, activity history, and performance analytics</li>
              <li>Optional structured study roadmaps (day-by-day plans) sold separately</li>
              <li>Optional articles and exam-related informational content</li>
            </ul>
            <p>
              Features may change, expand, or be limited by category, maintenance, or your credit
              or subscription status.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least <strong>13 years old</strong> to use the Platform. If you are
              under 18, you should use the Platform with a parent or guardian&apos;s permission.
              By signing in, you confirm you meet these requirements and that the information you
              provide is accurate.
            </p>
          </Section>

          <Section title="3. Accounts and sign-in">
            <p>
              Access to most features requires a registered account. New users sign in with{' '}
              <strong>Google OAuth</strong> through our authentication provider. Your account is
              tied to your email address.
            </p>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keeping your Google account secure</li>
              <li>All activity that occurs under your 10tracker account</li>
              <li>Completing your profile where required to use certain features</li>
            </ul>
            <p>
              Some legacy accounts may have been created through a previous authentication
              provider; the same email may be treated as one account where applicable.
            </p>
          </Section>

          <Section title="4. Credits (free and paid usage)">
            <p>
              Parts of the Platform use a <strong>credit wallet</strong>. Credit costs and signup
              bonus amounts are shown on the Platform and may be updated by us from time to time
              (current values appear on the pricing page and in your wallet).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Signup bonus:</strong> eligible new accounts may receive a one-time free
                credit grant on first wallet activation (one grant per account).
              </li>
              <li>
                <strong>Practice:</strong> credits are consumed when you attempt a new practice
                question (already-completed questions are not charged again).
              </li>
              <li>
                <strong>Mock tests:</strong> credits are charged once per mock test the first
                time you start it; resuming an in-progress attempt or retaking the same test does
                not charge again.
              </li>
            </ul>
            <p>
              Credits have no cash value, are non-transferable, and are not refundable. We may
              adjust, expire, or revoke credits in cases of error, abuse, or violation of these
              Terms.
            </p>
          </Section>

          <Section title="5. Unlimited subscription plans">
            <p>
              You may purchase <strong>fixed-term unlimited access</strong> plans from our{' '}
              <Link href="/pricing" className="underline text-neutral-800">
                pricing page
              </Link>
              . Plans grant unlimited practice and mock tests for the stated duration (for
              example, 24 hours, 90 days, or 180 days from activation).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Plans are <strong>one-time purchases</strong>, not recurring auto-debit
                subscriptions, unless we explicitly state otherwise at checkout.
              </li>
              <li>
                If you purchase a new plan while one is still active, access may extend from your
                current expiry date.
              </li>
              <li>Plan prices and durations may change for future purchases.</li>
            </ul>
          </Section>

          <Section title="6. Study roadmaps (one-time purchase)">
            <p>
              We offer optional <strong>study roadmaps</strong> — structured, day-by-day learning
              plans with tasks and resources. Roadmaps are listed on our{' '}
              <Link href="/roadmaps" className="underline text-neutral-800">
                roadmaps page
              </Link>
              .
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Roadmaps are <strong>separate products</strong> from credit wallets and unlimited
                practice/mock-test plans. Purchasing an unlimited plan does not include roadmap
                access unless we explicitly state otherwise at checkout.
              </li>
              <li>
                Each roadmap is a <strong>one-time purchase</strong> that grants lifetime access to
                that roadmap for as long as {PLATFORM_BRAND} continues to operate the product,
                including content updates we publish to that roadmap.
              </li>
              <li>
                Some roadmaps offer a limited number of <strong>free preview days</strong> at the
                start; the exact count is shown before purchase. Progress you record during preview
                days is retained if you later purchase the full roadmap.
              </li>
              <li>
                You must accept these Terms and our Privacy Policy before completing a roadmap
                purchase, the same as for other paid services on the Platform.
              </li>
            </ul>
            <p>
              <strong>No refunds:</strong> roadmap purchases are final. All fees for roadmap
              digital access are <strong>non-refundable</strong> once payment is confirmed and
              access is granted, except where applicable law requires otherwise. If you believe a
              payment was made in error, contact{' '}
              <a href={`mailto:${billingEmail}`} className="underline text-neutral-800">
                {billingEmail}
              </a>{' '}
              promptly with your order details.
            </p>
          </Section>

          <Section title="7. Payments (Razorpay)">
            <p>
              Payments are processed securely by <strong>Razorpay</strong>. By paying, you also
              agree to Razorpay&apos;s applicable terms. We do not store your full card or UPI
              credentials on our servers.
            </p>
            <p>
              Digital access begins after successful payment verification. GST invoices are
              issued on request — email{' '}
              <a href={`mailto:${billingEmail}`} className="underline text-neutral-800">
                {billingEmail}
              </a>
              .
            </p>
            <p>
              <strong>Refunds:</strong> except where required by applicable law, all fees for
              digital access are <strong>non-refundable</strong> once payment is confirmed and
              access is granted. If you believe a payment was made in error, contact us promptly
              at{' '}
              <a href={`mailto:${billingEmail}`} className="underline text-neutral-800">
                {billingEmail}
              </a>
              .
            </p>
          </Section>

          <Section title="8. Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Share account access or circumvent credit or paywall limits</li>
              <li>Scrape, bulk-download, or automate access without permission</li>
              <li>Reverse-engineer, disrupt, or overload our systems</li>
              <li>Copy, redistribute, or resell Platform content without authorisation</li>
              <li>Upload malware or attempt unauthorised access to data or accounts</li>
            </ul>
          </Section>

          <Section title="9. Intellectual property">
            <p>
              Questions, explanations, UI, branding, software, and other materials on the
              Platform are owned by us or our licensors and protected by applicable intellectual
              property laws. You receive a limited, personal, non-exclusive licence to use the
              Platform for your own exam preparation.
            </p>
          </Section>

          <Section title="10. Educational content">
            <p>
              Practice and mock-test content is for learning purposes only. It may not reflect
              official exam papers. See our{' '}
              <Link href="/disclaimer" className="underline text-neutral-800">
                Disclaimer
              </Link>{' '}
              for accuracy and liability limits.
            </p>
          </Section>

          <Section title="11. Third-party services">
            <p>
              The Platform relies on third-party services including Google (sign-in), Razorpay
              (payments), and cloud/database providers. We are not responsible for outages or
              actions of those providers beyond what the law requires.
            </p>
          </Section>

          <Section title="12. Suspension and termination">
            <p>
              We may suspend or terminate access if you breach these Terms, abuse credits or
              payments, or create risk for other users or the Platform. You may stop using the
              Platform at any time.
            </p>
          </Section>

          <Section title="13. Disclaimers and liability">
            <p>
              The Platform is provided <strong>&quot;as is&quot;</strong> and{' '}
              <strong>&quot;as available&quot;</strong>. We do not guarantee uninterrupted
              service, error-free content, or specific exam outcomes.
            </p>
            <p>
              To the fullest extent permitted by Indian law, we are not liable for indirect,
              incidental, or consequential damages arising from your use of the Platform. Our
              total liability for any claim relating to paid services is limited to the amount you
              paid us for that service in the preceding three months.
            </p>
          </Section>

          <Section title="14. Changes to these Terms">
            <p>
              We may update these Terms from time to time. The &quot;Last updated&quot; date and
              version at the top will change when we do. Continued use after changes constitutes
              acceptance. Material changes to paid features may be communicated on the Platform or
              by email where appropriate.
            </p>
          </Section>

          <Section title="15. Governing law">
            <p>
              These Terms are governed by the laws of <strong>India</strong>. Courts in India
              shall have exclusive jurisdiction, subject to applicable consumer protection laws.
            </p>
          </Section>

          <Section title="16. Contact">
            <p>
              General questions about these Terms:
              <br />
              <strong>{LEGAL_ENTITY_NAME}</strong> ({PLATFORM_BRAND})
              <br />
              <a href={`mailto:${contactEmail}`} className="underline text-neutral-800">
                {contactEmail}
              </a>
            </p>
            <p>
              Billing, payments, and refunds:{' '}
              <a href={`mailto:${billingEmail}`} className="underline text-neutral-800">
                {billingEmail}
              </a>
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link href="/privacy-policy" className="hover:text-neutral-900 underline">
            Privacy Policy
          </Link>
          <Link href="/disclaimer" className="hover:text-neutral-900 underline">
            Disclaimer
          </Link>
          <Link href="/roadmaps" className="hover:text-neutral-900 underline">
            Roadmaps
          </Link>
          <Link href="/pricing" className="hover:text-neutral-900 underline">
            Pricing
          </Link>
        </div>
      </div>
    </LegalPageShell>
  );
}
