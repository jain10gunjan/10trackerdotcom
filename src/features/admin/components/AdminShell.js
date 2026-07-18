"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Newspaper,
  Users,
  ListOrdered,
  Map,
  GraduationCap,
  FileText,
  ClipboardList,
  IndianRupee,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/mcq-creation", label: "MCQ creation", icon: Sparkles },
  { href: "/admin/mcq-extractor", label: "MCQ extractor", icon: FileText },
  { href: "/admin/gktoday", label: "GKToday", icon: Sparkles },
  { href: "/admin/mock-tests", label: "Mock tests", icon: ClipboardList },
  { href: "/admin/pricing", label: "Pricing & credits", icon: IndianRupee },
  { href: "/admin/bulk-questions", label: "Bulk questions (JSON)", icon: Database },
  { href: "/admin/articles", label: "Articles", icon: Newspaper },
  { href: "/admin/postable-entries", label: "Postable entries", icon: ListOrdered },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roadmaps", label: "Roadmaps", icon: Map },
  { href: "/admin/upsc-prelims", label: "UPSC Prelims", icon: GraduationCap },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => {
    const item = NAV.find((n) =>
      n.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(n.href)
    );
    return item?.label || "Admin";
  }, [pathname]);

  const NavLinks = ({ onNavigate } = {}) => (
    <nav className="space-y-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin"
            ? pathname === "/admin"
            : pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => onNavigate?.()}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0 opacity-90" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      {/* Mobile top bar — below global Navbar (h-20) */}
      <header className="sticky top-20 z-40 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 p-2 text-neutral-800 hover:bg-neutral-50"
          aria-label="Open admin menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
        <span className="w-10" />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(88vw,280px)] flex-col border-r border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-3">
              <span className="text-sm font-semibold text-neutral-900">Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-neutral-200 p-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-center text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                ← Back to site
              </Link>
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-60 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white md:block">
          <div className="border-b border-neutral-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              10tracker
            </p>
            <p className="text-sm font-semibold text-neutral-900">Admin panel</p>
          </div>
          <NavLinks />
          <div className="border-t border-neutral-200 p-3">
            <Link
              href="/"
              className="block rounded-xl px-3 py-2 text-center text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              ← Back to site
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
