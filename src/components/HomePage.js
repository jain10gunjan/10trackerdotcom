"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Calendar,
  ChevronRight,
  FileText,
  MapPin,
  Newspaper,
  Search,
} from "lucide-react";
import { mergeExamData } from "@/data/examData";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {children}
    </span>
  );
}

function SectionHeader({ icon, title, subtitle, href, hrefLabel }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          {hrefLabel || "View all"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  );
}

function ExamCard({ exam }) {
  const [imageError, setImageError] = useState(false);
  const showImage = exam.image && !imageError;
  const isActive = exam.active !== false;

  return (
    <Link
      href={isActive ? `/exams/${exam.slug}` : "#"}
      aria-disabled={!isActive}
      className={`group block rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 ${
        isActive
          ? "border-neutral-200 hover:border-neutral-300 hover:shadow-md"
          : "border-neutral-200 bg-neutral-50/70 cursor-not-allowed opacity-70"
      }`}
      onClick={(e) => {
        if (!isActive) e.preventDefault();
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-neutral-100 flex-shrink-0 overflow-hidden">
          {showImage ? (
            <Image
              src={exam.image}
              alt=""
              width={56}
              height={56}
              className={`object-cover transition-transform duration-200 ${
                isActive ? "group-hover:scale-105" : "grayscale"
              }`}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              {exam.icon}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-semibold truncate ${
                isActive ? "text-neutral-900" : "text-neutral-500"
              }`}
            >
              {exam.name}
            </h3>
            {!isActive ? (
              <span className="text-[10px] font-semibold text-neutral-400 bg-white border border-neutral-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                Coming soon
              </span>
            ) : (
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-neutral-400 group-hover:text-neutral-700 group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
            {isActive
              ? exam.description || "Topic-wise practice with solutions"
              : "Coming soon"}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
            <FileText className="w-3 h-3" />
            <span>{exam.count?.toLocaleString() || 0} questions</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage({ categorySections = [] }) {
  const [examCategories, setExamCategories] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examQuery, setExamQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const hardcodedExams = mergeExamData([]);
    setExamCategories(hardcodedExams);
    setLoadingExams(false);
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    examCategories.forEach((e) => {
      if (e?.category) set.add(e.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [examCategories]);

  const visibleExams = useMemo(() => {
    const q = examQuery.trim().toLowerCase();
    return examCategories
      .filter((e) => (activeCategory === "All" ? true : e.category === activeCategory))
      .filter((e) => {
        if (!q) return true;
        const hay = `${e.name || ""} ${e.slug || ""} ${e.description || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const aActive = a.active !== false;
        const bActive = b.active !== false;
        if (aActive !== bActive) return aActive ? -1 : 1;
        return (b.count || 0) - (a.count || 0);
      });
  }, [examCategories, examQuery, activeCategory]);

  return (
    <>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        {/* Hero */}
        <section className="relative bg-white border-b border-neutral-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-neutral-50" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 md:pt-36 md:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <Pill>Daily updated exam prep + jobs + news</Pill>
                <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
                  Practice smarter. Track progress. Stay updated.
                </h1>
                <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
                  10tracker brings exam practice, chapter-wise prep, latest updates,
                  and government job alerts — in one clean dashboard.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/exams"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    Explore exams
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="https://news.10tracker.com"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-medium text-sm hover:bg-neutral-50 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                    Govt jobs
                  </Link>
                  <Link
                                        href="https://news.10tracker.com"

                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-medium text-sm hover:bg-neutral-50 transition-colors"
                  >
                    <Newspaper className="w-4 h-4 text-amber-700" />
                    Updates
                  </Link>
                </div>

                {/* Quick exam search */}
                <div className="mt-7 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <Search className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900">
                        Find your exam
                      </div>
                      <div className="text-xs text-neutral-500">
                        Search and jump straight into practice.
                      </div>
                    </div>
                    <Link
                      href="/exams"
                      className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={examQuery}
                        onChange={(e) => setExamQuery(e.target.value)}
                        placeholder="Search e.g. GATE, UPSC, JEE..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                      />
                    </div>
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="sm:w-56 w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                      aria-label="Filter by category"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hero visual */}
              <div className="hidden sm:block lg:col-span-5">
                <div className="relative rounded-3xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-neutral-200/30" />
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=900&fit=crop"
                    alt=""
                    width={1200}
                    height={900}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Exams */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              icon={<BookOpen className="w-5 h-5 text-neutral-700" />}
              title="Exams"
              subtitle="Pick an exam and start practicing with detailed solutions"
              href="/exams"
              hrefLabel="All exams"
            />

            {loadingExams ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-700 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        activeCategory === c
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleExams.map((exam) => (
                    <ExamCard key={exam.slug} exam={exam} />
                  ))}
                </div>
              </>
            )}
            <div className="mt-4">
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:hidden"
              >
                View all exams
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* News by category */}
        {/* {Array.isArray(categorySections) && categorySections.length > 0 ? (
          <section className="py-12 md:py-16 bg-white border-y border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                icon={<Newspaper className="w-5 h-5 text-neutral-700" />}
                title="Latest updates by category"
                subtitle="Fresh articles from 10tracker, grouped by category"
                href="/articles"
                hrefLabel="All articles"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categorySections.map((section) => (
                  <div
                    key={section.slug}
                    className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: `${section.color}20`,
                            color: section.color,
                          }}
                        >
                          {section.name}
                        </span>
                        <span className="text-xs text-neutral-500 truncate">
                          {section.items.length} latest
                        </span>
                      </div>
                      <Link
                        href={`/articles/category/${section.slug}`}
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="px-4 divide-y divide-neutral-100">
                      {section.items.length > 0 ? (
                        section.items.slice(0, 4).map((item) => (
                          <Link
                            key={item.id}
                            href={`/articles/${item.slug}`}
                            className="group flex items-start gap-3 py-3"
                          >
                            <div className="w-16 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                              <img
                                src={item.featuredImageUrl || "/10tracker.png"}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  if (e?.currentTarget?.src?.includes("/10tracker.png")) return;
                                  e.currentTarget.src = "/10tracker.png";
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 line-clamp-2">
                                {item.title}
                                {item.isFeatured ? (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                    Featured
                                  </span>
                                ) : null}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                                <span className="inline-flex items-center gap-1.5 text-neutral-400">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {item.dateLabel || ""}
                                </span>
                                <span className="text-neutral-300">•</span>
                                <span className="inline-flex items-center gap-1.5 text-neutral-400">
                                  <Newspaper className="w-3.5 h-3.5" />
                                  {section.name}
                                </span>
                              </div>
                              {item.excerpt ? (
                                <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                                  {item.excerpt}
                                </p>
                              ) : null}
                            </div>
                            <ChevronRight className="w-5 h-5 flex-shrink-0 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        ))
                      ) : (
                        <div className="py-6 text-sm text-neutral-500">
                          No articles yet in this category.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null} */}

        {/* Feeds */}
        {/* <section className="py-12 md:py-16 bg-white border-y border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-neutral-700" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                    News, updates & jobs
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Compact Google News-style lists (dummy now, RSS later)
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link
                  href="/article/news"
                  className="font-medium text-neutral-700 hover:text-neutral-900"
                >
                  All updates
                </Link>
                <span className="text-neutral-300">•</span>
                <Link
                  href="/article/latest-jobs"
                  className="font-medium text-neutral-700 hover:text-neutral-900"
                >
                  All jobs
                </Link>
              </div>
            </div>

            {(() => {
              const sections = [
                {
                  key: "top",
                  title: "Top stories",
                  href: "/article/news",
                  items: DUMMY_NEWS,
                },
                {
                  key: "exam",
                  title: "Exam updates",
                  href: "/article/news",
                  items: DUMMY_NEWS.filter((n) => n.category === "Exams"),
                },
                {
                  key: "results",
                  title: "Results",
                  href: "/article/news",
                  items: DUMMY_NEWS.filter((n) => n.category === "Results"),
                },
                {
                  key: "jobs",
                  title: "Latest govt jobs",
                  href: "/article/latest-jobs",
                  items: DUMMY_JOBS,
                },
              ];

              const Row = ({ href, item, metaLeft, metaRight }) => (
                <Link
                  href={href}
                  className="group flex items-start gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 line-clamp-2">
                      {item.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span className="font-medium text-neutral-600">10tracker</span>
                      <span className="text-neutral-300">•</span>
                      <span>{metaLeft}</span>
                      {metaRight ? (
                        <>
                          <span className="text-neutral-300">•</span>
                          <span className="font-semibold text-neutral-800">
                            {metaRight}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="w-16 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt=""
                      width={128}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              );

              const Section = ({ title, href, items, kind }) => {
                const list = (items || []).slice(0, 4);
                return (
                  <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                      <div className="text-sm font-semibold text-neutral-900">
                        {title}
                      </div>
                      <Link
                        href={href}
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                      >
                        View
                      </Link>
                    </div>
                    <div className="px-4 divide-y divide-neutral-100">
                      {list.map((item) =>
                        kind === "jobs" ? (
                          <Row
                            key={`${title}-${item.id}`}
                            href={href}
                            item={item}
                            metaLeft={`${item.organization} • ${item.location}`}
                            metaRight={`Last date: ${item.lastDate}`}
                          />
                        ) : (
                          <Row
                            key={`${title}-${item.id}`}
                            href={href}
                            item={item}
                            metaLeft={`${item.date} • ${item.category}`}
                          />
                        )
                      )}
                      {list.length === 0 ? (
                        <div className="py-6 text-sm text-neutral-500">
                          No items yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Section title="Top stories" href="/article/news" items={sections[0].items} />
                  <Section title="Exam updates" href="/article/news" items={sections[1].items} />
                  <Section title="Results" href="/article/news" items={sections[2].items} />
                  <Section title="Latest govt jobs" href="/article/latest-jobs" items={sections[3].items} kind="jobs" />
                </div>
              );
            })()}

            <div className="mt-5 sm:hidden flex items-center justify-center gap-3 text-sm text-neutral-600">
              <Link href="/article/news" className="font-medium hover:text-neutral-900">
                All updates
              </Link>
              <span className="text-neutral-300">•</span>
              <Link
                href="/article/latest-jobs"
                className="font-medium hover:text-neutral-900"
              >
                All jobs
              </Link>
            </div>
          </div>
        </section> */}
      </div>
    </>
  );
}
