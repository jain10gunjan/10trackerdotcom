"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { examMeta } from "@/data/examMeta";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CalendarDays,
  MapPin,
  Layers,
  Lightbulb,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── tiny helpers ─── */
function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
      {icon ? (
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        </div>
      ) : (
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">{title}</h2>
      )}
      {children}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
      <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-semibold text-neutral-900">{value}</span>
    </div>
  );
}

function PracticeLink({ href, label, tag, primary }) {
  if (!href) return null;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
        primary
          ? "bg-neutral-900 text-white hover:bg-neutral-800"
          : "border border-neutral-200 text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span
        className={`text-xs ${primary ? "text-neutral-400" : "text-neutral-500"}`}
      >
        {tag ?? "Open"}
      </span>
    </Link>
  );
}

function Accordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-medium text-neutral-900">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
        )}
      </button>
      {open && (
        <p className="text-sm text-neutral-600 pb-3 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

/* ─── main page ─── */
export default function ExamPage() {
  const router = useRouter();
  const { slug } = useParams();
  const rawSlug = Array.isArray(slug) ? slug[0] : slug;
  let normalizedSlug = "";
  try {
    normalizedSlug = decodeURIComponent(rawSlug || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  } catch {
    normalizedSlug = String(rawSlug || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  const exam =
    examMeta[normalizedSlug] ||
    Object.values(examMeta).find(
      (item) => item?.slug?.toLowerCase() === normalizedSlug
    );

  useEffect(() => {
    if (!exam && normalizedSlug) {
      router.replace(`/${normalizedSlug}`);
    }
  }, [exam, normalizedSlug, router]);

  if (!exam) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-neutral-50 pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-2">
                Redirecting to practice page
              </h1>
              <p className="text-sm text-neutral-600 mb-4">
                Guide is not available for this exam yet. Opening category practice
                page.
              </p>
              <Link
                href={normalizedSlug ? `/${normalizedSlug}` : "/exams"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 text-sm font-medium hover:bg-neutral-50"
              >
                <ArrowRight className="w-4 h-4" />
                Open practice page
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const hasPractice = Object.values(exam.practiceLinks ?? {}).some(Boolean);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-neutral-50 pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Hero ── */}
          <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
              Exam overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              {exam.name}
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-neutral-500 leading-relaxed max-w-2xl">
              {exam.heroTagline}
            </p>

            {/* Overview pills */}
            {exam.overview && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatPill label="Level" value={exam.overview.level} />
                <StatPill label="Mode" value={exam.overview.mode} />
                <StatPill label="Frequency" value={exam.overview.frequency} />
                <StatPill
                  label="Conducted by"
                  value={exam.overview.conductingBody}
                />
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-5 flex flex-wrap gap-2">
              {exam.practiceLinks?.topicWisePyqs && (
                <Link
                  href={exam.practiceLinks.topicWisePyqs}
                   
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  PYQs – topic wise
                </Link>
              )}
              {exam.practiceLinks?.mockTests && (
                <div
                  // href={exam.practiceLinks.mockTests}
                  onClick={()=>{
                    toast.success("Coming soon");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-gray-500 text-white text-sm font-medium hover:bg-neutral-600 hover:cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Mock tests  
                </div>
              )}
              {exam.practiceLinks?.dpp && (
                <Link
                  href={exam.practiceLinks.dpp}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  DPP
                </Link>
              )}
              {exam.practiceLinks?.topicWiseTests && (
                <div
                onClick={()=>{
                  toast.success("Coming soon");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-gray-500 text-white text-sm font-medium hover:bg-neutral-600 hover:cursor-pointer transition-colors"
              
                >
                  <ArrowRight className="w-4 h-4" />
                  Topic tests
                </div>
              )}
            </div>
          </section>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* ── LEFT main content ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* About */}
              <SectionCard icon={<Info className="w-3.5 h-3.5 text-neutral-600" />} title="About the exam">
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {exam.about}
                </p>
              </SectionCard>

              {/* Highlights */}
              {exam.highlights?.length > 0 && (
                <SectionCard title="Key highlights">
                  <ul className="space-y-1.5">
                    {exam.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-neutral-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Pattern */}
              {exam.pattern?.length > 0 && (
                <SectionCard
                  icon={<FileText className="w-3.5 h-3.5 text-neutral-600" />}
                  title="Exam pattern"
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {exam.pattern.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3 bg-neutral-50 rounded-xl px-3 py-2"
                      >
                        <dt className="text-xs text-neutral-500">{row.label}</dt>
                        <dd className="text-xs font-semibold text-neutral-900 text-right">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>
              )}

              {/* Pattern breakdown table */}
              {exam.patternBreakdown?.length > 0 && (
                <SectionCard title="Section-wise distribution">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-neutral-100">
                          <th className="pb-2 pr-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            Section
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            Questions
                          </th>
                          <th className="pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            Marks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {exam.patternBreakdown.map((r) => (
                          <tr key={r.section} className="text-neutral-700 hover:bg-neutral-50 transition-colors">
                            <td className="py-2.5 pr-4 font-medium text-neutral-900">
                              {r.section}
                            </td>
                            <td className="py-2.5 pr-4 tabular-nums text-neutral-600">
                              {r.questions}
                            </td>
                            <td className="py-2.5 tabular-nums text-neutral-600">
                              {r.marks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {/* Sessions */}
              {exam.sessions?.length > 0 && (
                <SectionCard title="Exam sessions">
                  <ul className="space-y-2">
                    {exam.sessions.map((s) => (
                      <li
                        key={s.label}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-neutral-500">{s.label}</span>
                        <span className="font-medium text-neutral-900">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Important dates */}
              {exam.importantDates?.length > 0 && (
                <SectionCard
                  icon={<CalendarDays className="w-3.5 h-3.5 text-neutral-600" />}
                  title="Important dates (tentative)"
                >
                  <ul className="space-y-0">
                    {exam.importantDates.map((d, i) => (
                      <li
                        key={d.label}
                        className={`flex items-center justify-between gap-3 text-sm py-2.5 ${
                          i < exam.importantDates.length - 1
                            ? "border-b border-neutral-100"
                            : ""
                        }`}
                      >
                        <span className="text-neutral-500">{d.label}</span>
                        <span className="font-medium text-neutral-900 text-right">
                          {d.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Latest updates */}
              {exam.updates?.length > 0 && (
                <SectionCard title="Latest updates">
                  <div className="space-y-0">
                    {exam.updates.map((u, i) => (
                      <div
                        key={u.id}
                        className={`py-3 ${
                          i < exam.updates.length - 1
                            ? "border-b border-neutral-100"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[11px] font-medium uppercase tracking-wide">
                            {u.type}
                          </span>
                          <span className="text-xs text-neutral-400">{u.date}</span>
                        </div>
                        <p className="text-sm font-medium text-neutral-900">{u.title}</p>
                        {u.summary && (
                          <p className="mt-0.5 text-xs text-neutral-500 leading-relaxed">
                            {u.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Eligibility */}
              {exam.eligibility && (
                <SectionCard title="Eligibility">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <StatPill label="Nationality" value={exam.eligibility.nationality} />
                    <StatPill label="Age limit" value={exam.eligibility.ageLimit} />
                    <StatPill label="Attempts" value={exam.eligibility.attempts} />
                  </div>
                  {exam.eligibility.education?.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                        Educational qualification
                      </p>
                      <ul className="space-y-1.5">
                        {exam.eligibility.education.map((line, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-neutral-600"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </SectionCard>
              )}

              {/* Syllabus */}
              {exam.syllabusSummary?.length > 0 && (
                <SectionCard title="Syllabus (high-level)">
                  <p className="text-xs text-neutral-400 mb-3">
                    Detailed topic-wise syllabus is available on the PYQ and practice pages.
                  </p>
                  <ul className="space-y-1.5">
                    {exam.syllabusSummary.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Application process */}
              {exam.application?.steps?.length > 0 && (
                <SectionCard title="Application process">
                  <p className="text-sm text-neutral-500 mb-3">
                    Apply online via{" "}
                    <a
                      href={exam.application.portalUrl || "#"}
                      className="text-neutral-900 underline underline-offset-4 hover:text-neutral-700 inline-flex items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {exam.application.portalName || "official portal"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <ol className="space-y-2">
                    {exam.application.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-semibold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-neutral-600 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </SectionCard>
              )}

              {/* Exam centers */}
              {exam.centers && (
                <SectionCard
                  icon={<MapPin className="w-3.5 h-3.5 text-neutral-600" />}
                  title="Exam centers"
                >
                  {exam.centers.summary && (
                    <p className="text-sm text-neutral-600 mb-2">
                      {exam.centers.summary}
                    </p>
                  )}
                  {exam.centers.notes?.length > 0 && (
                    <ul className="space-y-1.5">
                      {exam.centers.notes.map((n) => (
                        <li key={n} className="flex items-start gap-2 text-sm text-neutral-600">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              )}

              {/* Preparation tips */}
              {exam.preparationTips?.length > 0 && (
                <SectionCard
                  icon={<Lightbulb className="w-3.5 h-3.5 text-neutral-600" />}
                  title="Preparation tips"
                >
                  <ul className="space-y-1.5">
                    {exam.preparationTips.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm text-neutral-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* Score usage */}
              {exam.scoreUsage?.length > 0 && (
                <SectionCard
                  icon={<Trophy className="w-3.5 h-3.5 text-neutral-600" />}
                  title="Score usage"
                >
                  <ul className="space-y-1.5">
                    {exam.scoreUsage.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-neutral-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {/* FAQs – accordion */}
              {exam.faqs?.length > 0 && (
                <SectionCard
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />}
                  title="Frequently asked questions"
                >
                  <div>
                    {exam.faqs.map((f, idx) => (
                      <Accordion key={idx} q={f.q} a={f.a} />
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>

            {/* ── RIGHT sticky sidebar ── */}
            <div className="space-y-4 lg:sticky lg:top-24">

              {/* Practice links */}
              {hasPractice && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                    Practice for {exam.shortName}
                  </p>
                  <div className="space-y-2">
                    {exam.practiceLinks?.topicWisePyqs && (
                      <PracticeLink
                        href={exam.practiceLinks.topicWisePyqs}
                        label="PYQs – topic wise"
                        tag="Practice"
                        primary
                      />
                    )}
                    {exam.practiceLinks?.dpp && (
                      <PracticeLink
                        href={exam.practiceLinks.dpp}
                        label="DPP (daily practice)"
                        tag="Practice"
                      />
                    )}
                    {exam.practiceLinks?.topicWiseTests && (
                      <PracticeLink
                        href={exam.practiceLinks.topicWiseTests}
                        label="Topic-wise tests"
                        tag="Attempt"
                      />
                    )}
                    {exam.practiceLinks?.mockTests && (
                      <PracticeLink
                        href={exam.practiceLinks.mockTests}
                        label="Full-length mock tests"
                        tag="Attempt"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Updates & notices */}
              {exam.newsLinks && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                    Updates & notices
                  </p>
                  <div className="space-y-2">
                    {exam.newsLinks.examUpdates && (
                      <PracticeLink
                        href={exam.newsLinks.examUpdates}
                        label="News & exam updates"
                        tag="View"
                      />
                    )}
                    {exam.newsLinks.importantNotices && (
                      <PracticeLink
                        href={exam.newsLinks.importantNotices}
                        label="Official notices"
                        tag="View"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Jobs */}
              {exam.jobsLinks && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                    After {exam.shortName}
                  </p>
                  <div className="space-y-2">
                    {exam.jobsLinks.psuJobs && (
                      <PracticeLink
                        href={exam.jobsLinks.psuJobs}
                        label="PSU / Govt jobs"
                        tag="Browse"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Quick pattern summary if no full table */}
              {!exam.patternBreakdown && exam.pattern?.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                    Pattern at a glance
                  </p>
                  <dl className="space-y-2">
                    {exam.pattern.map((row) => (
                      <div key={row.label} className="flex justify-between gap-3 text-sm">
                        <dt className="text-neutral-500">{row.label}</dt>
                        <dd className="font-semibold text-neutral-900">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
</>
  );
}