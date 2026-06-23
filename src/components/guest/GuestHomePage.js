'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  ClipboardList,
  Map,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import ExamsFeaturedPanel from '@/components/exams/ExamsFeaturedPanel';
import RoadmapsFeaturedPanel from '@/components/roadmaps/RoadmapsFeaturedPanel';
import ExamCatalogCard from '@/components/exams/ExamCatalogCard';
import RoadmapCatalogCard from '@/components/roadmaps/RoadmapCatalogCard';

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="text-center px-4 py-1">
      <p className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}

function PathwayCard({ href, icon: Icon, title, description, cta, accent }) {
  const accents = {
    emerald: {
      icon: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      hover: 'hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50',
      cta: 'text-emerald-800 group-hover:text-emerald-900',
    },
    violet: {
      icon: 'bg-violet-50 border-violet-100 text-violet-700',
      hover: 'hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/50',
      cta: 'text-violet-800 group-hover:text-violet-900',
    },
  };
  const style = accents[accent] || accents.emerald;

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 transition-all duration-200 ${style.hover}`}
    >
      <div
        className={`w-11 h-11 rounded-xl border flex items-center justify-center ${style.icon}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 leading-relaxed flex-1">{description}</p>
      <span
        className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${style.cta}`}
      >
        {cta}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function CapabilityCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
        <Icon className="w-5 h-5 text-neutral-700" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}

function SectionShell({ id, eyebrow, title, description, href, linkLabel, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-xl">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 transition-colors shadow-sm"
        >
          {linkLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function GuestHomePage({
  featuredExams = [],
  featuredRoadmaps = [],
  stats = {},
}) {
  const panelExams = featuredExams.slice(0, 3);
  const panelRoadmaps = featuredRoadmaps.slice(0, 3);
  const gridExams = featuredExams.slice(0, 2);
  const gridRoadmaps = featuredRoadmaps.slice(0, 2);

  const examCount = stats.examCount ?? featuredExams.length;
  const roadmapCount = stats.roadmapCount ?? featuredRoadmaps.length;
  const questionCount = stats.questionCount ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero */}
      <section className="pt-24 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-200/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-violet-200/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-50/90 pointer-events-none" />

            <div className="relative p-6 sm:p-8 lg:p-10">
              <Pill>10Tracker · Exams &amp; study roadmaps</Pill>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-neutral-900 max-w-3xl leading-[1.1]">
                Everything you need to prepare — practice and plan in one place.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                Topic-wise MCQs, mock tests, and structured day-by-day roadmaps for competitive
                exams. Start free, upgrade when you need full plans.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <PathwayCard
                  href="/exams"
                  icon={BookOpen}
                  title="Practice"
                  description="Browse active exams, solve chapter-wise MCQs, and take timed mock tests."
                  cta="Browse exams"
                  accent="emerald"
                />
                <PathwayCard
                  href="/roadmaps"
                  icon={Map}
                  title="Study plans"
                  description="Follow curated day-by-day roadmaps with tasks, resources, and progress tracking."
                  cta="Explore roadmaps"
                  accent="violet"
                />
              </div>

              <Link
                href="/sign-in?redirect=%2F"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Sign in to save progress, streaks, and rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-10 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
              <StatItem label="Active exams" value={examCount.toLocaleString()} />
              <StatItem label="Study roadmaps" value={roadmapCount.toLocaleString()} />
              <StatItem
                label="Practice questions"
                value={
                  questionCount >= 1000
                    ? `${Math.round(questionCount / 1000)}k+`
                    : questionCount.toLocaleString()
                }
              />
              <StatItem label="Free to start" value="₹0" />
            </div>
          </div>
        </div>
      </section>

      {/* Practice + Roadmaps */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
          <SectionShell
            id="practice"
            eyebrow="Practice"
            title="Popular exams to start with"
            description="Jump into topic-wise MCQs or mock tests. Featured by activity across the platform."
            href="/exams"
            linkLabel="View all exams"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-5">
                {panelExams.length > 0 ? (
                  <ExamsFeaturedPanel featured={panelExams} isSignedIn={false} />
                ) : (
                  <div className="rounded-3xl border border-dashed border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">
                    Exams loading — check back shortly.
                  </div>
                )}
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 gap-4">
                {gridExams.length > 0 ? (
                  gridExams.map((exam) => <ExamCatalogCard key={exam.slug} exam={exam} />)
                ) : null}
              </div>
            </div>
          </SectionShell>

          <SectionShell
            id="roadmaps"
            eyebrow="Study plans"
            title="Structured roadmaps for serious prep"
            description="Day-by-day plans with preview days. One-time purchase — no subscriptions."
            href="/roadmaps"
            linkLabel="View all roadmaps"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-5">
                {panelRoadmaps.length > 0 ? (
                  <RoadmapsFeaturedPanel featured={panelRoadmaps} />
                ) : (
                  <div className="rounded-3xl border border-dashed border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">
                    Roadmaps coming soon — check back shortly.
                  </div>
                )}
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 gap-4">
                {gridRoadmaps.length > 0 ? (
                  gridRoadmaps.map((roadmap) => (
                    <RoadmapCatalogCard key={roadmap.slug} roadmap={roadmap} />
                  ))
                ) : null}
              </div>
            </div>
          </SectionShell>
        </div>
      </section>

      {/* Capabilities */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Platform
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Built for focused exam preparation
            </h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-600">
              Whether you practice chapter by chapter or follow a structured plan, 10Tracker keeps
              your prep organized.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CapabilityCard
              icon={BookOpen}
              title="Topic-wise MCQs"
              description="Chapter-level practice with solutions across active exams."
            />
            <CapabilityCard
              icon={ClipboardList}
              title="Mock tests"
              description="Timed full-length tests with rankings and detailed review."
            />
            <CapabilityCard
              icon={Calendar}
              title="Day-by-day plans"
              description="Roadmaps break syllabus into daily tasks you can track."
            />
            <CapabilityCard
              icon={TrendingUp}
              title="Progress tracking"
              description="Sign in for streaks, heatmaps, and activity history."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neutral-900/10 bg-neutral-900 text-white p-8 sm:p-10 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-200">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Start today
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
                  Pick an exam or roadmap and begin your prep
                </h2>
                <p className="mt-3 text-neutral-300 text-sm sm:text-base leading-relaxed max-w-lg">
                  Practice for free, preview roadmap days at no cost, and create an account when you
                  want personalized dashboards and streak tracking.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:justify-end">
                <Link
                  href="/exams"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse exams
                </Link>
                <Link
                  href="/roadmaps"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  <Map className="w-4 h-4" />
                  Explore roadmaps
                </Link>
                <Link
                  href="/sign-up?redirect=%2F"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
                >
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
