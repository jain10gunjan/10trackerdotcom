"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import MetaDataJobs from "@/components/Seo";
import {
  Database,
  Newspaper,
  Users,
  ListOrdered,
  GraduationCap,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const CARDS = [
  {
    href: "/admin/bulk-questions",
    title: "Bulk questions (JSON)",
    desc: "Import many rows into Supabase examtracker via JSON — batched & validated.",
    icon: Database,
    accent: "from-violet-600 to-indigo-600",
  },
  {
    href: "/admin/articles",
    title: "Articles",
    desc: "Manage articles and publishing.",
    icon: Newspaper,
    accent: "from-emerald-600 to-teal-600",
  },
  {
    href: "/admin/postable-entries",
    title: "Postable entries",
    desc: "Curate postable content.",
    icon: ListOrdered,
    accent: "from-amber-600 to-orange-600",
  },
  {
    href: "/admin/users",
    title: "Users",
    desc: "Usage analytics for registered users.",
    icon: Users,
    accent: "from-sky-600 to-blue-600",
  },
  {
    href: "/admin/placement-tracker-cse",
    title: "Placement tracker",
    desc: "CSE placement tracker admin.",
    icon: GraduationCap,
    accent: "from-rose-600 to-pink-600",
  },
  {
    href: "/admin/upsc-prelims",
    title: "UPSC Prelims",
    desc: "UPSC-specific admin tools.",
    icon: GraduationCap,
    accent: "from-neutral-700 to-neutral-900",
  },
  {
    href: "/admin/platform-exams",
    title: "Platform exams",
    desc: "Enable or disable exams shown on profile signup and home.",
    icon: GraduationCap,
    accent: "from-cyan-600 to-blue-600",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/admin");
    }
  }, [loading, user, router]);

  if (!loading && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="Admin" seoDescription="Admin dashboard" />
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin only</h1>
          <p className="mt-2 text-sm text-neutral-600">
            You don&apos;t have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="Admin dashboard" seoDescription="10tracker admin" />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Quick links to admin tools. Use the sidebar on desktop or the menu on mobile.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map(({ href, title, desc, icon: Icon, accent }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
              <p className="mt-1 flex-1 text-sm text-neutral-600">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-900">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
