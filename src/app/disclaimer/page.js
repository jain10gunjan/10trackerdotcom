import Link from 'next/link';
import LegalPageShell from '@/components/legal/LegalPageShell';
import {
  getBillingLegalInfo,
  LEGAL_ENTITY_NAME,
  PLATFORM_BRAND,
  TERMS_VERSION,
  CONTACT_EMAIL,
} from '@/lib/billing/legal';

export const metadata = {
  title: 'Disclaimer - 10tracker',
  description:
    'Disclaimer for 10Tracker.com — educational content, mock tests, credits, and limitation of liability.',
  openGraph: {
    title: 'Disclaimer - 10tracker',
    description: 'Important information about content accuracy and liability on 10Tracker.com.',
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

export default function DisclaimerPage() {
  const legal = getBillingLegalInfo();
  const contactEmail = legal.contactEmail || CONTACT_EMAIL;

  return (
    <LegalPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="mb-10 pb-8 border-b border-neutral-200">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mt-2 tracking-tight">
            Disclaimer
          </h1>
          <p className="text-sm text-neutral-500 mt-3">
            Last updated: {formatLegalDate(TERMS_VERSION)}
          </p>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
            This Disclaimer applies to <strong className="text-neutral-800">{PLATFORM_BRAND}</strong>{' '}
            (the &quot;Platform&quot;), operated by{' '}
            <strong className="text-neutral-800">{LEGAL_ENTITY_NAME}</strong>. It should be read
            together with our{' '}
            <Link href="/terms-and-services" className="underline text-neutral-800">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="underline text-neutral-800">
              Privacy Policy
            </Link>
            .
          </p>
        </header>

        <div className="space-y-10">
          <Section title="1. General">
            <p>
              Information and services on the Platform are provided for general educational and
              practice purposes. We try to keep content current, but we do not warrant that
              everything on the Platform is complete, accurate, or suitable for every purpose.
            </p>
          </Section>

          <Section title="2. Not an official exam authority">
            <p>
              {PLATFORM_BRAND} is <strong>not affiliated with, endorsed by, or sponsored by</strong>{' '}
              any government body, university, or official examination board unless we explicitly
              state otherwise on a specific page.
            </p>
            <p>
              Practice questions, explanations, and mock tests are study aids only. They may not
              reflect the exact difficulty, format, syllabus, or wording of real examinations.
              Always verify syllabus, dates, eligibility, and rules with{' '}
              <strong>official sources</strong>.
            </p>
          </Section>

          <Section title="3. Educational & informational content">
            <p>
              MCQ practice, chapter-wise questions, timed mock tests, dashboards, and articles (such
              as exam-related news or job updates) are offered to support self-study. Errors,
              omissions, or outdated material may occur despite our review efforts.
            </p>
            <p>
              You are responsible for how you use the Platform and for cross-checking critical
              information before relying on it for exam or career decisions.
            </p>
          </Section>

          <Section title="4. Credits, subscriptions, and payments">
            <p>
              Some features use a credit wallet or paid unlimited plans processed via Razorpay. Plan
              prices, credit costs, and durations may change. Access rules (such as when credits are
              consumed for practice or mock tests) are described on the Platform and in our Terms of
              Service.
            </p>
            <p>
              Purchasing a plan does not guarantee exam success. Digital access is non-refundable
              after it is granted, except where applicable law requires otherwise.
            </p>
          </Section>

          <Section title="5. No warranty">
            <p>
              The Platform is provided <strong>&quot;as is&quot;</strong> and{' '}
              <strong>&quot;as available&quot;</strong> without warranties of any kind, whether
              express or implied, including merchantability, fitness for a particular purpose, or
              non-infringement.
            </p>
            <p>
              We do not guarantee uninterrupted access, error-free operation, or that defects will
              be corrected immediately.
            </p>
          </Section>

          <Section title="6. Limitation of liability">
            <p>
              To the fullest extent permitted by Indian law, {LEGAL_ENTITY_NAME} and its operators
              shall not be liable for indirect, incidental, special, consequential, or punitive
              damages, including loss of data, profits, opportunities, or exam outcomes arising
              from use of the Platform.
            </p>
            <p>
              Mock-test scores, practice accuracy, and dashboard analytics are indicative only and
              do not predict actual exam performance.
            </p>
          </Section>

          <Section title="7. Third-party links and services">
            <p>
              The Platform may link to external websites or use third-party services (for example
              Google sign-in, payment processors, and cloud hosting). We do not control third-party
              content or policies and are not responsible for their availability or accuracy.
            </p>
          </Section>

          <Section title="8. User responsibility">
            <p>
              You use the Platform at your own risk. You should not share account access, attempt
              to bypass credit or paywall limits, or misuse content in ways that violate our Terms
              or applicable law.
            </p>
          </Section>

          <Section title="9. Changes">
            <p>
              We may update this Disclaimer from time to time. Continued use of the Platform after
              changes constitutes acceptance of the updated Disclaimer.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about this Disclaimer:
              <br />
              <strong>{LEGAL_ENTITY_NAME}</strong> ({PLATFORM_BRAND})
              <br />
              <a href={`mailto:${contactEmail}`} className="underline text-neutral-800">
                {contactEmail}
              </a>
            </p>
            <p>
              Registered business particulars are available on request for compliance enquiries.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link href="/terms-and-services" className="hover:text-neutral-900 underline">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="hover:text-neutral-900 underline">
            Privacy Policy
          </Link>
          <Link href="/pricing" className="hover:text-neutral-900 underline">
            Pricing
          </Link>
        </div>
      </div>
    </LegalPageShell>
  );
}
