'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Play, Search, Target, X, Zap } from 'lucide-react';
import { getSubjectStats, slugifySubject, unslugTopic } from '@/features/exam-hub/lib/examHubUtils';

function SearchBar({ value, onChange }) {
  return (
    <div className="relative max-w-3xl">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Search subjects or topics…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white"
        aria-label="Search subjects and topics"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function SubjectCard({ subject, categorySlug }) {
  const [open, setOpen] = useState(false);
  const { topicsCount, questionsCount } = useMemo(() => getSubjectStats(subject), [subject]);
  const subjectName = subject?.subject ?? 'Unknown';
  const subjectSlug = slugifySubject(subjectName);

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:border-emerald-200 hover:shadow-sm transition-all">
      <div className="p-4 flex items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse topics' : 'Expand topics'}
          aria-expanded={open}
          className="mt-0.5 w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center shrink-0"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-600 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 text-sm">{subjectName}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
              <Target className="w-3 h-3" />
              {topicsCount} topics
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
              <Zap className="w-3 h-3" />
              {questionsCount.toLocaleString()} Qs
            </span>
          </div>
        </div>
        <Link
          href={`/${categorySlug}/${subjectSlug}`}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-800"
        >
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <AnimatePresence initial={false}>
        {open && subject?.subtopics?.length > 0 ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {subject.subtopics.map((t) => (
                  <Link
                    key={t?.title}
                    href={`/${categorySlug}/practice/${encodeURIComponent(t?.title ?? '')}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    <Play className="w-3 h-3 text-neutral-400" />
                    {unslugTopic(t?.title)}
                    <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md font-bold text-[10px]">
                      {t?.count ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SubjectRow({ subject, categorySlug }) {
  const [open, setOpen] = useState(false);
  const { topicsCount, questionsCount } = useMemo(() => getSubjectStats(subject), [subject]);
  const subjectName = subject?.subject ?? 'Unknown';
  const subjectSlug = slugifySubject(subjectName);

  return (
    <>
      <tr className="odd:bg-white even:bg-neutral-50/40 hover:bg-emerald-50/30 transition-colors">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center shrink-0"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900 text-sm truncate">{subjectName}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Topic-wise MCQs</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-right tabular-nums text-sm font-semibold text-neutral-700">
          {topicsCount}
        </td>
        <td className="py-3 px-4 text-right tabular-nums text-sm font-semibold text-neutral-700">
          {questionsCount.toLocaleString()}
        </td>
        <td className="py-3 px-4 text-right">
          <Link
            href={`/${categorySlug}/${subjectSlug}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-800"
          >
            Open <ArrowRight className="w-3 h-3" />
          </Link>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && subject?.subtopics?.length > 0 ? (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={4} className="px-4 pb-3 pt-0">
              <div className="ml-8 border-l-2 border-emerald-100 pl-4">
                <div className="flex flex-wrap gap-2 py-2">
                  {subject.subtopics.map((t) => (
                    <Link
                      key={t?.title}
                      href={`/${categorySlug}/practice/${encodeURIComponent(t?.title ?? '')}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium hover:border-emerald-300 hover:bg-emerald-50/50"
                    >
                      <Play className="w-3 h-3 text-neutral-400" />
                      {unslugTopic(t?.title)}
                      <span className="bg-neutral-100 px-1.5 py-0.5 rounded-md font-bold">
                        {t?.count ?? 0}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </td>
          </motion.tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default function ExamHubSubjectList({
  subjects,
  categorySlug,
  searchTerm,
  onSearchChange,
  totalCount,
}) {
  const total = totalCount ?? subjects.length;
  const filtered = subjects.length;
  const isFiltered = filtered !== total;

  return (
    <section id="practice-content" className="scroll-mt-[5.5rem]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Practice topic-wise</h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Search subjects and jump into any topic.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 tabular-nums">
          {isFiltered ? `${filtered} of ${total}` : total} subject{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="sticky top-20 z-20 mb-3 rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur-sm shadow-sm p-3 sm:p-4">
        <SearchBar value={searchTerm} onChange={onSearchChange} />
      </div>

      {subjects.length === 0 ? (
        <div className="py-12 sm:py-16 text-center rounded-3xl border border-neutral-200 bg-white">
          <Search className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-neutral-900">No subjects match your search</p>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="mt-4 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="sm:hidden flex flex-col gap-3">
            {subjects.map((subject, i) => (
              <SubjectCard
                key={subject?.subject ?? i}
                subject={subject}
                categorySlug={categorySlug}
              />
            ))}
          </div>
          <div className="hidden sm:block bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="max-h-[min(68vh,42rem)] overflow-auto overscroll-contain">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
                  <tr className="text-left text-neutral-500 text-xs font-semibold uppercase tracking-wide">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-right w-24">Topics</th>
                    <th className="py-3 px-4 text-right w-28">Questions</th>
                    <th className="py-3 px-4 text-right w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {subjects.map((subject, i) => (
                    <SubjectRow
                      key={subject?.subject ?? i}
                      subject={subject}
                      categorySlug={categorySlug}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
