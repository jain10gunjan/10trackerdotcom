import Link from 'next/link';
import LegalPageShell from '@/features/legal/components/LegalPageShell';
import {
  CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  PLATFORM_BRAND,
} from '@/features/billing/lib/legal';

export const metadata = {
  title: 'About Us - 10tracker',
  description:
    'About 10Tracker.com — MCQ practice, mock tests, and exam prep for competitive exams in India.',
  openGraph: {
    title: 'About Us - 10tracker',
    description: 'Learn about 10Tracker.com and what we offer exam aspirants.',
    type: 'website',
  },
};

function FeatureCard({ title, children }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="text-base font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-600 leading-relaxed">{children}</p>
    </div>
  );
}

export default function AboutUsPage() {
  return (
    <LegalPageShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="mb-10 pb-8 border-b border-neutral-200">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">About</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mt-2 tracking-tight">
            About {PLATFORM_BRAND}
          </h1>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">
            Practice smarter, track better, achieve more. {PLATFORM_BRAND} helps students prepare
            for competitive exams with structured MCQ practice, timed mock tests, and progress
            tracking — all in one place.
          </p>
        </header>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Who we are</h2>
            <div className="space-y-3 text-neutral-600 leading-relaxed text-[15px]">
              <p>
                {PLATFORM_BRAND} is operated by{' '}
                <strong className="text-neutral-800">{LEGAL_ENTITY_NAME}</strong>, based in India.
                We build tools for self-study — not coaching centres — so you can practice on your
                schedule and see where you stand.
              </p>
              <p>
                We are <strong>not affiliated with any official exam board</strong>. Content is
                for learning and practice; always confirm syllabus and rules from official sources.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">What you can do here</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard title="Chapter & topic practice">
                MCQ practice organised by subject, chapter, and topic — with progress saved to
                your account.
              </FeatureCard>
              <FeatureCard title="Previous year & year-wise papers">
                Work through PYQs and year-wise question sets to spot patterns in real exams.
              </FeatureCard>
              <FeatureCard title="Timed mock tests">
                Full-length and topic-wise mock tests with scoring, review, and optional
                leaderboards (first and last name only — never your email).
              </FeatureCard>
              <FeatureCard title="Personal dashboard">
                Track activity, accuracy, streaks, and mock-test performance from one home
                dashboard.
              </FeatureCard>
              <FeatureCard title="Credits & unlimited plans">
                Start with free signup credits, then choose one-time unlimited plans when you
                need more — no auto-renewal.
              </FeatureCard>
              <FeatureCard title="News & job updates">
                Browse exam-related articles, notifications, and government job listings alongside
                your prep.
              </FeatureCard>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Exams we support</h2>
            <p className="text-neutral-600 leading-relaxed text-[15px]">
              We cover multiple competitive exam categories — including engineering entrances,
              civil services, aptitude, and more. Browse the full list on our{' '}
              <Link href="/exams" className="underline text-neutral-800">
                Exams
              </Link>{' '}
              page. Availability of practice content and mock tests varies by exam and is updated
              over time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">How we work</h2>
            <ul className="space-y-3 text-neutral-600 leading-relaxed text-[15px]">
              <li className="flex gap-2">
                <span className="text-neutral-400 shrink-0">✓</span>
                <span>
                  <strong className="text-neutral-800">Sign in with Google</strong> — quick
                  access without a separate password.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400 shrink-0">✓</span>
                <span>
                  <strong className="text-neutral-800">Transparent pricing</strong> — credits for
                  free-tier use; one-time Razorpay plans for unlimited access.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400 shrink-0">✓</span>
                <span>
                  <strong className="text-neutral-800">Privacy-first rankings</strong> — mock-test
                  leaderboards show your name only, not contact details.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400 shrink-0">✓</span>
                <span>
                  <strong className="text-neutral-800">Continuous improvement</strong> — we add
                  questions, tests, and features based on student needs and feedback.
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 text-center">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Ready to start?</h2>
            <p className="text-sm text-neutral-600 mb-5">
              Explore exams, practice a few questions, or see plan options — it takes less than a
              minute to sign in.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/exams"
                className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
              >
                Browse exams
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                View pricing
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Get in touch</h2>
            <p className="text-neutral-600 leading-relaxed text-[15px]">
              Questions, feedback, or billing help? Visit our{' '}
              <Link href="/contact-us" className="underline text-neutral-800">
                Contact
              </Link>{' '}
              page — general support at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline text-neutral-800">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link href="/contact-us" className="hover:text-neutral-900 underline">
            Contact us
          </Link>
          <Link href="/terms-and-services" className="hover:text-neutral-900 underline">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="hover:text-neutral-900 underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </LegalPageShell>
  );
}
