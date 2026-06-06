"use client";

import React, {
  useState, useEffect, useLayoutEffect, useCallback,
  useMemo, memo, useRef,
} from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { applyProgressUserFilter } from "@/lib/progressIdentity";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { usePracticeCreditGate } from "@/lib/credits/usePracticeCreditGate";
import { useCredits } from "@/context/CreditsContext";
import { showPracticeAnswerToast } from "@/lib/credits/practiceAnswerToast";
import { applyPracticeProgressUpdate } from "@/lib/credits/recordPracticeProgress";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import {
  readProgressBuffer, writeProgressBuffer, saveProgressBufferToSupabase,
} from "@/lib/progressBuffer";
import toast from "react-hot-toast";
import { toastPromise, parseJsonResponse } from "@/lib/toastAsync";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Award, X, ChevronUp, Save, Flame,
  Circle, LayoutGrid, AlertCircle,
} from "lucide-react";

const QuestionCard = dynamic(() => import("@/components/QuestionCard"), {
  ssr: false,
  loading: () => <QuestionSkeleton />,
});
const MetaDataJobs = dynamic(() => import("@/components/Seo"),     { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL            = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
const QUESTIONS_PER_PAGE     = 10;
const DIFFICULTIES           = ["easy", "medium", "hard"];
const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// ─── helpers ─────────────────────────────────────────────────────────────────
const parseDifficultyParam = (sp) => {
  if (!sp) return null;
  const d = String(sp.get("difficulty") ?? "").toLowerCase();
  return DIFFICULTIES.includes(d) ? d : null;
};
const normalizeChapterName = (name) =>
  name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";
const chapterNamesMatch = (a, b) =>
  normalizeChapterName(a) === normalizeChapterName(b);
const progressQuestionId = (id) => (id == null ? "" : String(id));
const getChapterCandidates = (chapter) => {
  const ch = chapter ?? "";
  return Array.from(new Set([
    ch, ch.trim(), ch.replace(/-/g, " "),
    normalizeChapterName(ch), normalizeChapterName(ch).replace(/\s+/g, "-"),
  ].filter(Boolean)));
};

// Layout Navbar is fixed h-20 (80px) — practice page does not render a second Navbar
const NAV_H = 80;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  /* ── design tokens (aligned with site Tailwind neutrals + Geist) ── */
  :root {
    --nav-h: ${NAV_H}px;
    --topbar-h: 56px;
    --mob-diff-h: 48px;
    --tablet-diff-h: 0px;
    --mob-bar-h: 68px;

    --bg:       #fafafa;
    --surface:  #ffffff;
    --surface2: #f5f5f5;
    --border:   #e5e5e5;
    --border2:  #d4d4d4;
    --ink1:     #171717;
    --ink2:     #525252;
    --ink3:     #737373;
    --ink4:     #a3a3a3;

    --accent:   #171717;
    --accent-f: #ffffff;
    --accent-hover: #262626;

    --indigo-bg:  #eef2ff;
    --indigo-bd:  #e0e7ff;
    --indigo-fg:  #4338ca;

    --easy:     #059669;
    --easy-bg:  #ecfdf5;
    --easy-bd:  #6ee7b7;
    --med:      #d97706;
    --med-bg:   #fffbeb;
    --med-bd:   #fcd34d;
    --hard:     #dc2626;
    --hard-bg:  #fef2f2;
    --hard-bd:  #fca5a5;

    --ok-bg:  #ecfdf5; --ok-fg:  #059669; --ok-bd:  #059669;
    --err-bg: #fef2f2; --err-fg: #dc2626; --err-bd: #dc2626;

    --r:  12px;
    --sh: 0 1px 2px rgba(0,0,0,.05);
    --sh2: 0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -2px rgba(0,0,0,.05);
    --font: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --mono: var(--font-geist-mono), ui-monospace, monospace;
  }

  @media(min-width:768px) {
    :root { --mob-diff-h: 0px; }
  }
  @media(min-width:768px) and (max-width:1023px) {
    :root { --tablet-diff-h: 44px; }
  }

  :root {
    --stick-top: var(--nav-h);
    --content-start: calc(var(--nav-h) + var(--topbar-h));
  }
  @media(max-width:767px) {
    :root { --content-start: calc(var(--nav-h) + var(--topbar-h) + var(--mob-diff-h)); }
  }
  @media(min-width:768px) and (max-width:1023px) {
    :root { --content-start: calc(var(--nav-h) + var(--topbar-h) + var(--tablet-diff-h)); }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pq {
    font-family: var(--font);
    background: var(--bg);
    min-height: 100svh;
    color: var(--ink1);
    padding-top: var(--nav-h);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .pq * { font-family: inherit; }
  .pq kbd { font-family: var(--mono); }

  /* ── topbar ── */
  .pq-topbar {
    position: sticky;
    top: var(--nav-h);
    z-index: 40;
    background: rgba(255,255,255,.98);
    backdrop-filter: blur(16px) saturate(1.4);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    overflow: visible;
  }
  .pq-topbar-row {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0.625rem 1rem;
    min-height: var(--topbar-h);
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: visible;
  }
  @media(min-width:640px) { .pq-topbar-row { padding: 0 1.5rem; } }
  @media(min-width:1024px) { .pq-topbar-row { padding: 0 2rem; } }
  .pq-strip {
    height: 2px;
    background: var(--border);
    position: relative;
    overflow: hidden;
  }
  .pq-strip-fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--accent);
    transition: width .7s cubic-bezier(.22,.68,0,1.2);
  }

  /* mobile diff row */
  .pq-diff-row {
    display: flex;
    gap: 6px;
    padding: 8px 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .pq-diff-row::-webkit-scrollbar { display: none; }
  @media(min-width:768px) { .pq-diff-row { display: none !important; } }

  /* tablet difficulty (768–1023, sidebar hidden) */
  .pq-tablet-diff {
    display: none;
    gap: 8px;
    padding: 8px 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    max-width: 80rem;
    margin: 0 auto;
  }
  @media(min-width:768px) and (max-width:1023px) {
    .pq-tablet-diff {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      padding: 8px 1.5rem;
    }
  }
  @media(min-width:1024px) { .pq-tablet-diff { display: none !important; } }
  .pq-tablet-diff .btn { flex: 1; min-width: 0; max-width: 140px; }

  /* ── body layout ── */
  .pq-body {
    max-width: 80rem;
    margin: 0 auto;
    padding: 1rem 1rem 5.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    align-items: start;
  }
  @media(min-width:640px) {
    .pq-body { padding: 1.25rem 1.5rem 5.5rem; gap: 1.25rem; }
  }
  @media(min-width:768px) and (max-width:1023px) {
    .pq-body { padding: 1.25rem 1.5rem 5.5rem; gap: 1.25rem; }
  }
  @media(min-width:1024px) {
    .pq-body {
      grid-template-columns: 17.5rem 1fr;
      padding: 1.5rem 2rem 2.5rem;
      gap: 1.5rem;
    }
  }
  @media(min-width:1280px) {
    .pq-body { grid-template-columns: 18.75rem 1fr; }
  }

  /* ── sidebar ── */
  .pq-sidebar {
    display: none;
    flex-direction: column;
    gap: 12px;
    position: sticky;
    top: calc(var(--content-start) + 16px);
    max-height: calc(100svh - var(--content-start) - 32px);
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 14px;
    scrollbar-gutter: stable;
    min-height: 0;
  }
  @media(min-width:1024px) { .pq-sidebar { display: flex; } }
  .pq-sidebar::-webkit-scrollbar { width: 3px; }
  .pq-sidebar::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* ── cards ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: var(--sh);
  }
  .card-main {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: var(--sh2);
  }

  /* ── buttons ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 0.5rem 1rem; border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface); color: var(--ink1);
    font-weight: 500; font-size: 0.875rem;
    cursor: pointer; transition: background .15s, border-color .15s, color .15s, box-shadow .15s;
    box-shadow: var(--sh);
    white-space: nowrap; text-decoration: none; line-height: 1.25;
  }
  .btn:hover:not(:disabled) { border-color: var(--border2); background: var(--surface2); }
  .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .btn:active:not(:disabled) { transform: scale(0.98); }
  .btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; }
  .btn-ink { background: var(--accent); border-color: var(--accent); color: var(--accent-f); font-weight: 600; }
  .btn-ink:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; border-radius: 0.5rem; }
  .btn-ghost { background: transparent; box-shadow: none; border-color: transparent; color: var(--ink2); }
  .btn-ghost:hover:not(:disabled) { background: var(--surface2); border-color: var(--border); }

  /* ── difficulty chips ── */
  .diff-easy   { background: var(--easy-bg); color: var(--easy); border-color: var(--easy-bd); }
  .diff-medium { background: var(--med-bg);  color: var(--med);  border-color: var(--med-bd);  }
  .diff-hard   { background: var(--hard-bg); color: var(--hard); border-color: var(--hard-bd); }
  .diff-easy.active   { background: var(--easy); color: #fff; border-color: var(--easy); }
  .diff-medium.active { background: var(--med);  color: #fff; border-color: var(--med);  }
  .diff-hard.active   { background: var(--hard); color: #fff; border-color: var(--hard); }

  /* ── dot nav ── */
  .dot-grid { display: flex; flex-wrap: wrap; gap: 5px; }
  .dot {
    width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: .7rem; font-weight: 600; cursor: pointer; color: var(--ink2);
    transition: all .12s; background: var(--surface); position: relative;
  }
  .dot:hover  { border-color: var(--border2); background: var(--surface2); }
  .dot-cur    { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; }
  .dot-ok     { background: var(--ok-bg) !important; border-color: var(--ok-bd) !important; color: var(--ok-fg) !important; }
  .dot-err    { background: var(--err-bg) !important; border-color: var(--err-bd) !important; color: var(--err-fg) !important; }

  /* ── progress ring ── */
  .ring-track { fill: none; stroke: var(--border); }
  .ring-fill {
    fill: none; stroke: var(--accent); stroke-linecap: round;
    transition: stroke-dashoffset .7s cubic-bezier(.22,.68,0,1.2);
  }

  /* ── tricolor bar ── */
  .tri-bar { display: flex; height: 7px; border-radius: 99px; overflow: hidden; gap: 2px; }
  .tri-seg { border-radius: 99px; transition: flex .6s cubic-bezier(.22,.68,0,1.2); min-width: 0; }

  /* category pill (matches subject dashboard) */
  .pq-cat-pill {
    display: inline-flex; align-items: center; gap: 0.375rem;
    padding: 0.3125rem 0.625rem; border-radius: 9999px;
    background: var(--indigo-bg); border: 1px solid var(--indigo-bd);
    font-size: 0.6875rem; font-weight: 600; color: var(--indigo-fg);
    line-height: 1.25;
    text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
  }
  .pq-cat-pill::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: #6366f1; flex-shrink: 0;
  }
  .pq-chapter-title {
    font-size: 0.9375rem; font-weight: 600; color: var(--ink1);
    overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }
  @media(min-width:640px) { .pq-chapter-title { font-size: 1rem; } }
  @media(min-width:1024px) { .pq-chapter-title { font-size: 1.0625rem; } }

  /* ── labels & misc ── */
  .label {
    font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--ink3);
  }
  .pq-heading {
    font-size: 1.125rem; font-weight: 600; color: var(--ink1);
    line-height: 1.35; letter-spacing: -0.02em;
  }
  @media(min-width:640px) { .pq-heading { font-size: 1.25rem; } }
  .topic-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 0.25rem 0.625rem; border-radius: 0.375rem;
    background: var(--surface2); border: 1px solid var(--border);
    font-size: 0.75rem; font-weight: 500; color: var(--ink2);
  }

  /* tablet progress strip (main column) */
  .pq-tablet-progress {
    display: none;
    padding: 1rem 1.125rem;
    gap: 1rem;
    align-items: center;
  }
  @media(min-width:768px) and (max-width:1023px) {
    .pq-tablet-progress { display: flex; }
  }
  @media(min-width:1024px) { .pq-tablet-progress { display: none !important; } }
  .unsaved-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    background: #EF4444; color: #fff; border-radius: 99px;
    font-size: .65rem; font-weight: 700;
  }
  .status-badge-ok {
    font-size: .63rem; font-weight: 700; padding: 2px 8px; border-radius: 5px;
    background: var(--ok-bg); color: var(--ok-fg); border: 1px solid var(--ok-bd);
  }
  .status-badge-err {
    font-size: .63rem; font-weight: 700; padding: 2px 8px; border-radius: 5px;
    background: var(--err-bg); color: var(--err-fg); border: 1px solid var(--err-bd);
  }
  .status-badge-none {
    font-size: .63rem; font-weight: 700; padding: 2px 8px; border-radius: 5px;
    background: var(--surface2); color: var(--ink3); border: 1px solid var(--border);
  }
  .legend-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: .7rem; font-weight: 500; color: var(--ink2); }
  .legend-dot  { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }

  /* ── desktop question map (sidebar) ── */
  .qmap-card {
    padding: 14px 14px 12px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 260px;
  }
  .qmap-head { display:flex; align-items:flex-end; justify-content:space-between; gap: 10px; margin-bottom: 10px; }
  .qmap-title { display:flex; flex-direction:column; gap: 2px; min-width:0; }
  .qmap-sub { font-size: .68rem; color: var(--ink3); font-weight: 600; }
  .qmap-actions { display:flex; align-items:center; gap: 6px; flex-shrink:0; }
  .qmap-mini {
    display:inline-flex; align-items:center; gap: 4px;
    padding: 4px 8px; border-radius: 999px;
    border: 1px solid var(--border); background: var(--surface2);
    font-size: .68rem; font-weight: 800; color: var(--ink2);
  }
  .qmap-jump { display:flex; align-items:center; gap: 6px; margin-bottom: 10px; }
  .qmap-input {
    flex: 1; min-width: 0;
    height: 34px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 0 10px;
    font-size: .78rem;
    font-weight: 700;
    color: var(--ink1);
    outline: none;
    box-shadow: var(--sh);
  }
  .qmap-input:focus { border-color: var(--border2); box-shadow: var(--sh2); }
  .qmap-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 6px;
  }
  .qmap-grid .dot { width: 100%; height: 30px; border-radius: 9px; }
  .qmap-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding-right: 6px;
  }
  .qmap-foot {
    margin-top: 10px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;
  }
  .qmap-legend { display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
  .qmap-legend-item { display:flex; align-items:center; gap: 5px; font-size: .66rem; font-weight: 700; color: var(--ink2); }
  .qmap-legend-swatch { width: 10px; height: 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface2); }
  .qmap-legend-swatch.ok  { background: var(--ok-bg); border-color: var(--ok-bd); }
  .qmap-legend-swatch.err { background: var(--err-bg); border-color: var(--err-bd); }
  .qmap-legend-swatch.cur { background: var(--accent); border-color: var(--accent); }

  /* ── animations ── */
  @keyframes qIn    { from { opacity:0; transform:translateX(18px) scale(.99); } to { opacity:1; transform:none; } }
  @keyframes sheetUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes savePop { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }

  .q-enter { animation: qIn .28s cubic-bezier(.22,.68,0,1.2) both; }
  .skel    { animation: pulse 1.6s ease-in-out infinite; background: var(--surface2); border-radius: 7px; }
  .save-pop { animation: savePop .3s ease; }

  /* ── bottom sheet ── */
  .sheet-overlay {
    position: fixed; inset: 0; background: rgba(26,25,23,.5);
    backdrop-filter: blur(4px); z-index: 60; animation: fadeIn .18s ease;
  }
  .sheet {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 61;
    background: var(--surface); border-radius: 16px 16px 0 0;
    animation: sheetUp .3s cubic-bezier(.22,.68,0,1.2);
    max-height: 76svh; display: flex; flex-direction: column;
    box-shadow: 0 -8px 40px rgba(26,25,23,.14);
  }
  .sheet-drag { width: 36px; height: 4px; background: var(--border2); border-radius: 99px; margin: 10px auto 0; flex-shrink: 0; }
  .sheet-body { overflow-y: auto; padding: 0 16px 20px; flex: 1; }
  .sheet-body::-webkit-scrollbar { width: 3px; }
  .sheet-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* ── mobile bottom bar ── */
  .mob-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: rgba(255,255,255,.97);
    backdrop-filter: blur(16px);
    border-top: 1px solid var(--border);
    padding: 10px 16px;
    padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
  }
  @media(min-width:1024px) { .mob-bar { display: none !important; } }
  .mob-bar-inner { display: flex; align-items: center; gap: 8px; max-width: 600px; margin: 0 auto; }
  .mob-icon-btn {
    width: 44px; height: 44px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .12s; flex-shrink: 0; box-shadow: var(--sh);
  }
  .mob-icon-btn:disabled { opacity: .38; cursor: not-allowed; }
  .mob-icon-btn:hover:not(:disabled) { border-color: var(--border2); background: var(--surface2); }
  .mob-center-btn {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    cursor: pointer; transition: all .12s; box-shadow: var(--sh);
  }
  .mob-center-btn:hover { border-color: var(--border2); background: var(--surface2); }

  /* ── desktop nav footer ── */
  .desk-nav { display: flex; }
  @media(max-width:1023px) { .desk-nav { display: none !important; } }

  /* ── mobile progress card ── */
  .mob-progress { display: flex; }
  @media(min-width:1024px) { .mob-progress { display: none !important; } }

  /* question card header / body spacing */
  .pq-q-body { padding: 0; }
  .pq-question-host { font-family: var(--font); }
  .pq-question-host,
  .pq-question-host *:not(mjx-container):not(svg):not(path) {
    font-family: inherit;
  }
  .pq-question-host .text-gray-800,
  .pq-question-host .text-gray-700,
  .pq-question-host .text-gray-600,
  .pq-question-host .text-slate-900,
  .pq-question-host .text-slate-800 {
    color: var(--ink1) !important;
  }
  .pq-question-host .text-gray-500,
  .pq-question-host .text-slate-700 {
    color: var(--ink2) !important;
  }
  .pq-desk-nav {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border);
    align-items: center; justify-content: space-between; gap: 0.75rem;
    background: var(--surface2);
  }
  @media(min-width:640px) { .pq-desk-nav { padding: 0.875rem 1.25rem; } }

  @media(max-width:767px) {
    .pq-topbar-row { padding: 0.5rem 0.75rem; min-height: 52px; gap: 8px; }
    .pq-body { padding: 0.875rem 0.75rem 5.25rem; gap: 0.75rem; }
  }
  @media(max-width:380px) {
    .pq-topbar-row .pq-points-pill { display: none; }
  }
`;

// ─── sub-components ───────────────────────────────────────────────────────────

const QuestionSkeleton = memo(() => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
    <div className="skel" style={{ height: 20, width: "65%" }} />
    <div className="skel" style={{ height: 16, width: "85%" }} />
    <div className="skel" style={{ height: 16, width: "75%" }} />
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="skel" style={{ height: 52, borderRadius: 10 }} />
      ))}
    </div>
  </div>
));
QuestionSkeleton.displayName = "QuestionSkeleton";

const Ring = memo(({ pct, size = 52, stroke = 4.5 }) => {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
      <circle className="ring-fill"
        cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
      />
    </svg>
  );
});
Ring.displayName = "Ring";

const StatusBadge = memo(({ completed, correct }) => {
  if (!completed) return <span className="status-badge-none">Not tried</span>;
  if (correct) return <span className="status-badge-ok">✓ Correct</span>;
  return <span className="status-badge-err">✗ Wrong</span>;
});
StatusBadge.displayName = "StatusBadge";

const DiffButton = memo(({ d, count, active, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`btn diff-${d} ${active ? "active" : ""}`}
    style={{ justifyContent: "space-between", padding: "7px 12px", width: "100%" }}
  >
    <span style={{ textTransform: "capitalize", fontWeight: 700, fontSize: ".8rem" }}>{d}</span>
    <span style={{
      background: active ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.08)",
      borderRadius: 5, padding: "1px 7px", fontSize: ".72rem", fontWeight: 700,
    }}>{count ?? 0}</span>
  </button>
));
DiffButton.displayName = "DiffButton";

// ── NavSheet (bottom sheet on mobile) ────────────────────────────────────────
const NavSheet = memo(({
  questions,
  currentIndex,
  completedSet,
  correctSet,
  onSelect,
  onClose,
  hasMore,
  stats,
  user,
  unsaved,
  saving,
  onSave,
  onSignIn,
}) => {
  const curRef = useRef(null);
  useEffect(() => { curRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [currentIndex]);

  const correctCount = questions.filter(q => correctSet.has(progressQuestionId(q._id))).length;
  const wrongCount   = questions.filter(q => {
    const id = progressQuestionId(q._id);
    return completedSet.has(id) && !correctSet.has(id);
  }).length;
  const pendingCount = questions.filter(q => !completedSet.has(progressQuestionId(q._id))).length;
  const firstPending = questions.findIndex(q => !completedSet.has(progressQuestionId(q._id)));

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-drag" />
        <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 className="pq-heading" style={{ fontSize: "1.0625rem" }}>Question Map</h3>
            <p style={{ fontSize: ".7rem", color: "var(--ink3)", marginTop: 2, fontWeight: 500 }}>
              {questions.length}{hasMore ? "+" : ""} loaded · tap to jump
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "6px 8px" }}>
            <X size={14} />
          </button>
        </div>

        {/* progress summary */}
        {!!stats && (
          <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Ring pct={stats.pct ?? 0} size={46} stroke={4.5} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: ".68rem", fontWeight: 800, color: "var(--ink1)" }}>{stats.pct ?? 0}%</span>
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: ".82rem", fontWeight: 800, color: "var(--ink1)", lineHeight: 1.2 }}>
                  {stats.comp ?? 0}
                  <span style={{ color: "var(--ink4)", fontWeight: 500 }}>/{stats.total ?? 0}</span> completed
                </p>
                <p style={{ fontSize: ".7rem", color: "var(--ink3)", fontWeight: 600, marginTop: 2 }}>
                  {stats.acc ?? 0}% accuracy · {stats.pts ?? 0} pts
                </p>
              </div>

              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {user ? (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!unsaved || saving}
                    className={`btn btn-sm ${unsaved ? "btn-ink" : ""}`}
                    style={{ padding: "6px 10px" }}
                    title={unsaved ? "Save buffered progress to your account" : "Nothing to save yet"}
                  >
                    {saving ? "Saving…" : "Save"}
                    {unsaved > 0 && <span className="unsaved-badge" style={{ marginLeft: 4 }}>{unsaved}</span>}
                  </button>
                ) : (
                  <button type="button" onClick={onSignIn} className="btn btn-sm btn-ink" style={{ padding: "6px 10px" }}>
                    Sign in
                  </button>
                )}
              </div>
            </div>

            {user && (
              <p style={{ fontSize: ".68rem", color: "var(--ink3)", fontWeight: 600, marginTop: 6 }}>
                {unsaved ? `${unsaved} unsaved answers` : "Nothing to save yet"}
              </p>
            )}
          </div>
        )}

        {/* legend */}
        <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
          <div className="legend-row">
            {[
              ["var(--ok-bg)", "var(--ok-bd)", "var(--ok-fg)", "Correct", correctCount],
              ["var(--err-bg)", "var(--err-bd)", "var(--err-fg)", "Wrong", wrongCount],
              ["var(--surface2)", "var(--border)", "var(--ink3)", "Pending", pendingCount],
            ].map(([bg, bd, fg, label, count]) => (
              <div key={label} className="legend-item">
                <div className="legend-dot" style={{ background: bg, border: `1.5px solid ${bd}` }} />
                {label}: <strong style={{ color: fg, marginLeft: 3 }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />
        <div className="sheet-body" style={{ paddingTop: 12 }}>
          <div className="dot-grid">
            {questions.map((q, i) => {
              const qid = progressQuestionId(q._id);
              const ok  = correctSet.has(qid);
              const bad = completedSet.has(qid) && !ok;
              const cur = i === currentIndex;
              return (
                <div key={q._id} ref={cur ? curRef : null}
                  className={`dot ${cur ? "dot-cur" : ok ? "dot-ok" : bad ? "dot-err" : ""}`}
                  onClick={() => { onSelect(i); onClose(); }}
                >
                  {i + 1}
                  {!cur && (ok || bad) && (
                    <span style={{
                      position: "absolute", top: 2, right: 2,
                      width: 5, height: 5, borderRadius: "50%",
                      background: ok ? "var(--ok-fg)" : "var(--err-fg)",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          {firstPending !== -1 && (
            <div style={{ marginTop: 12, padding: "9px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9 }}>
              <p style={{ fontSize: ".75rem", fontWeight: 600, color: "#92400E", margin: 0 }}>
                First unattempted: Q{firstPending + 1}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
NavSheet.displayName = "NavSheet";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ChapterPracticePage = memo(() => {
  const mathJaxConfig = useMemo(() => ({
    "fast-preview": { disabled: false },
    tex: {
      inlineMath: [["$","$"],["\\(","\\)"]],
      displayMath: [["$$","$$"],["\\[","\\]"]],
      processEscapes: true,
    },
    messageStyle: "none", showMathMenu: false,
  }), []);

  const { category, subject, chaptername } = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pathname     = usePathname();
  const { user, setShowAuthModal } = useAuth();
  const { chargeForQuestion, canAttemptPractice } = usePracticeCreditGate();
  const { setShowPaywall } = useCredits();

  const userRef              = useRef(user);
  const categoryRef          = useRef(category);
  const normalizedChapterRef = useRef("");
  const questionsRef         = useRef([]);
  const isSavingRef          = useRef(false);
  const fetchAbortRef        = useRef(null);
  const hasShownToastRef     = useRef(false);
  const qmapJumpRef          = useRef(null);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { categoryRef.current = category; }, [category]);

  const isAdmin = useMemo(
    () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL, [user]
  );
  const normalizedChapter = useMemo(
    () => chaptername ? chaptername.replace(/-/g, " ") : "", [chaptername]
  );
  useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

  const activeDifficulty = useMemo(
    () => parseDifficultyParam(searchParams) ?? "easy", [searchParams]
  );

  // ── state ──────────────────────────────────────────────────────────────────
  const [questions,   setQuestions]   = useState([]);
  const [counts,      setCounts]      = useState({ easy: 0, medium: 0, hard: 0 });
  const [totalQ,      setTotalQ]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingQ,    setLoadingQ]    = useState(false);
  const [progress,    setProgress]    = useState({ completed: [], correct: [], points: 0 });
  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const autoAdvanceRef = useRef({ difficulty: null, ran: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [rewritingId, setRewritingId] = useState(null);
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [animKey,     setAnimKey]     = useState(0);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [unsaved,     setUnsaved]     = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [saveBtnKey,  setSaveBtnKey]  = useState(0);

  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── fetchers ───────────────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    if (!category || !normalizedChapter) return;
    try {
      const r = await fetch(`/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setCounts({ easy: d.easy ?? 0, medium: d.medium ?? 0, hard: d.hard ?? 0 });
      setTotalQ(d.total ?? 0);
    } catch { setCounts({ easy: 0, medium: 0, hard: 0 }); }
  }, [category, normalizedChapter]);

  const fetchQuestions = useCallback(async (diff, page = 1, append = false) => {
    if (!normalizedChapter || !category) return;
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;
    setLoadingQ(true);
    try {
      const r = await fetch(
        `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${diff}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
        { signal: ctrl.signal }
      );
      if (!r.ok) throw new Error();
      const d = await r.json();
      const qs = d.questions ?? [];
      setQuestions(prev => append ? [...prev, ...qs] : qs);
      setHasMore(d.hasMore ?? false);
      if (!append) setCurrentIdx(0);
    } catch (e) {
      if (e.name === "AbortError") return;
      toast.error("Failed to load questions");
      setQuestions([]); setHasMore(false);
    } finally { setLoadingQ(false); }
  }, [category, normalizedChapter]);

  const fetchUserProgress = useCallback(async () => {
    const uid = userRef.current?.id, cat = categoryRef.current, ch = normalizedChapterRef.current;
    if (!uid || !ch || !cat) { setProgress({ completed: [], correct: [], points: 0 }); return; }
    try {
      const cands = getChapterCandidates(ch);
      const { data: rows, error: re } = await supabase.from("examtracker")
        .select("topic, chapter").eq("category", cat.toUpperCase()).in("chapter", cands);
      if (re) throw re;
      const topicSet = new Set();
      const norm = normalizeChapterName(ch);
      for (const row of rows ?? []) {
        if (row?.topic && chapterNamesMatch(row.chapter, norm)) topicSet.add(String(row.topic).trim());
      }
      for (const q of questionsRef.current ?? []) { if (q?.topic) topicSet.add(String(q.topic).trim()); }
      const topics = [...topicSet];
      if (!topics.length) { setProgress({ completed: [], correct: [], points: 0 }); return; }
      const area = cat.toLowerCase();
      let progressQuery = supabase.from("user_progress")
        .select("completedquestions, correctanswers, points, topic")
        .eq("area", area).in("topic", topics);
      progressQuery = applyProgressUserFilter(progressQuery, userRef.current);
      const { data: pd, error: pe } = await progressQuery;
      if (pe && pe.code !== "PGRST116") throw pe;
      const comp = new Set(), corr = new Set(); let pts = 0;
      for (const item of pd ?? []) {
        (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach(id => { const s = progressQuestionId(id); if (s) comp.add(s); });
        (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach(id => { const s = progressQuestionId(id); if (s) corr.add(s); });
        pts += typeof item.points === "number" ? item.points : 0;
      }
      setProgress({ completed: [...comp], correct: [...corr], points: pts });
    } catch { setProgress({ completed: [], correct: [], points: 0 }); }
  }, []);

  const refreshUnsaved = useCallback(() => {
    const uid = userRef.current?.id;
    if (!uid) { setUnsaved(0); return; }
    try {
      const buf = readProgressBuffer(uid);
      setUnsaved(Object.keys(buf.entries ?? {}).length);
    } catch { setUnsaved(0); }
  }, []);

  const saveProgress = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) { setShowAuthModal(true); return; }
    const uid = currentUser.id;
    if (isSavingRef.current) return;
    try {
      const buf = readProgressBuffer(uid);
      if (!Object.keys(buf.entries ?? {}).length) { setUnsaved(0); return; }
      isSavingRef.current = true;
      setSaving(true);
      await saveProgressBufferToSupabase({ supabase, upsertUserProgress, user: currentUser, onMissingTopic: () => {} });
      await fetchUserProgress();
      setUnsaved(0);
      setSaveBtnKey(k => k + 1);
      toast.success("Progress saved!", { duration: 2200 });
    } catch {
      refreshUnsaved();
      toast.error("Save failed. Try again.");
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [fetchUserProgress, refreshUnsaved, setShowAuthModal]);

  const handleAnswer = useCallback((questionId, isCorrect, questionTopic) => {
    if (!userRef.current) { setShowAuthModal(true); return; }
    const qid = progressQuestionId(questionId);
    if (!qid) return;
    const topic = questionTopic != null && String(questionTopic).trim() ? String(questionTopic).trim() : null;
    const area = (categoryRef.current ?? "").toLowerCase();

    const creditCharge = chargeForQuestion({
      user: userRef.current,
      questionId: qid,
      completedIds: progressRef.current.completed,
      area,
      topic,
    });

    if (!creditCharge.ok) return;
    if (creditCharge.skipped) return;

    showPracticeAnswerToast(isCorrect);

    const unsaved = applyPracticeProgressUpdate({
      userId: userRef.current.id,
      questionId: qid,
      isCorrect,
      area,
      topic,
      pointsPerCorrect: 100,
      setProgress,
    });
    if (typeof unsaved === "number") setUnsaved(unsaved);
  }, [setShowAuthModal, chargeForQuestion]);

  // ── routing ────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !category || !normalizedChapter) return;
    if (parseDifficultyParam(searchParams)) return;
    try {
      const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
      if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
        const p = new URLSearchParams(searchParams.toString());
        p.set("difficulty", saved);
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
      }
    } catch {}
  }, [category, normalizedChapter, pathname, router, searchParams]);

  useEffect(() => {
    try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch {}
  }, [activeDifficulty]);

  const changeDifficulty = useCallback((d) => {
    if (d === activeDifficulty || loadingQ) return;
    setCurrentPage(1); setHasMore(true); setCurrentIdx(0);
    autoAdvanceRef.current = { difficulty: d, ran: false };
    const p = new URLSearchParams(searchParams.toString());
    p.set("difficulty", d);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [activeDifficulty, loadingQ, router, searchParams, pathname]);

  useEffect(() => {
    if (loadingQ) return;
    if (!questions.length) return;
    if (hasMore) return;
    if (currentIdx !== questions.length - 1) return;

    const cur = questions[currentIdx];
    if (!cur?._id) return;
    const completedSet = new Set((progressRef.current.completed ?? []).map(progressQuestionId));
    if (!completedSet.has(progressQuestionId(cur._id))) return;

    const marker = autoAdvanceRef.current;
    if (marker.difficulty === activeDifficulty && marker.ran) return;

    const order = ["easy", "medium", "hard"];
    const i = order.indexOf(activeDifficulty);
    if (i < 0 || i === order.length - 1) return;

    autoAdvanceRef.current = { difficulty: activeDifficulty, ran: true };
    const next = order[i + 1];
    toast(`Moving to ${next.toUpperCase()} difficulty…`, { duration: 2200 });
    changeDifficulty(next);
  }, [activeDifficulty, changeDifficulty, currentIdx, hasMore, loadingQ, questions, progress.completed]);

  // ── navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= questions.length) return;
    setAnimKey(k => k + 1);
    setCurrentIdx(idx);
    if (idx >= questions.length - 3 && hasMore && !loadingQ) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchQuestions(activeDifficulty, next, true);
    }
  }, [questions.length, hasMore, loadingQ, currentPage, activeDifficulty, fetchQuestions]);

  const goNext = useCallback(() => goTo(currentIdx + 1), [currentIdx, goTo]);
  const goPrev = useCallback(() => goTo(currentIdx - 1), [currentIdx, goTo]);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev]);

  // ── data effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!category || !normalizedChapter) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setCurrentPage(1); setHasMore(true);
      try { await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

  useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
  useEffect(() => { if (!user?.id || !questions.length) return; fetchUserProgress(); }, [user, questions, fetchUserProgress]);
  useEffect(() => { refreshUnsaved(); }, [user?.id, refreshUnsaved]);

  useEffect(() => {
    if (!user?.id || !unsaved || hasShownToastRef.current) return;
    hasShownToastRef.current = true;
    toast("You have unsaved answers — save before leaving.", { duration: 3500, icon: "⚠️" });
  }, [user?.id, unsaved]);

  useEffect(() => {
    if (!unsaved) return;
    const warn = "You have unsaved progress. Leave anyway?";
    const h = (e) => { e.preventDefault(); e.returnValue = warn; return warn; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unsaved]);

  // ── admin rewrite ──────────────────────────────────────────────────────────
  const extractStem = useCallback((content) => {
    if (!content) return null;
    let t = String(content).trim().replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ""));
    t = t.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
    const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(t);
    if (stop?.index > 0) t = t.slice(0, stop.index).trim();
    t = (t.split(/\n\s*\n/)[0] ?? t).trim();
    return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
  }, []);

  const rewriteQuestion = useCallback(async (question) => {
    if (!isAdmin || !question?._id || rewritingId) return;
    setRewritingId(question._id);
    try {
      await toastPromise(
        async () => {
          const stem = String(question.question ?? "").replace(/<\/?[^>]+(>|$)/g, " ").trim();
          if (!stem) throw new Error("empty");
          const resp = await fetch("/api/generate-similar", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "rewrite-question", question: stem, maxTokens: 160 }),
          });
          if (!resp.ok) throw new Error(await resp.text());
          const rewritten = extractStem((await parseJsonResponse(resp))?.content);
          if (!rewritten) throw new Error("empty result");
          const { error } = await supabase.from("examtracker").update({ question: rewritten }).eq("_id", question._id);
          if (error) throw error;
          setQuestions((prev) =>
            prev.map((q) => (q?._id === question._id ? { ...q, question: rewritten } : q))
          );
          return "Rewritten!";
        },
        {
          loading: "Rewriting…",
          success: (msg) => msg,
          error: () => "Failed to rewrite",
        }
      );
    } catch {
      /* toast.promise shows error */
    } finally {
      setRewritingId(null);
    }
  }, [extractStem, isAdmin, rewritingId]);

  // ── derived ────────────────────────────────────────────────────────────────
  const savedComp = useMemo(() => new Set((progress.completed ?? []).map(progressQuestionId)), [progress.completed]);
  const savedCorr = useMemo(() => new Set((progress.correct ?? []).map(progressQuestionId)), [progress.correct]);

  const bufferOverlay = useMemo(() => {
    const uid = user?.id;
    if (!uid) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const visible = new Set((questions ?? []).map(q => progressQuestionId(q?._id)).filter(Boolean));
    if (!visible.size) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const area = String(category ?? "").toLowerCase();
    const { entries } = readProgressBuffer(uid) ?? { entries: {} };
    const comp = new Set(), corr = new Set(); let ptsDelta = 0;
    for (const [id, e] of Object.entries(entries ?? {})) {
      const qid = progressQuestionId(id);
      if (!qid || !visible.has(qid) || String(e?.area ?? "") !== area) continue;
      comp.add(qid);
      if (e?.correct === true) { corr.add(qid); if (!savedComp.has(qid)) ptsDelta += typeof e.points === "number" ? e.points : 100; }
    }
    return { comp, corr, ptsDelta };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, category, questions, unsaved, savedComp]);

  const compSet = useMemo(() => {
    const s = new Set(savedComp); bufferOverlay.comp.forEach(id => s.add(id)); return s;
  }, [savedComp, bufferOverlay.comp]);

  const corrSet = useMemo(() => {
    const s = new Set(savedCorr);
    bufferOverlay.comp.forEach(id => { if (bufferOverlay.corr.has(id)) s.add(id); else s.delete(id); });
    return s;
  }, [savedCorr, bufferOverlay.comp, bufferOverlay.corr]);

  const stats = useMemo(() => {
    const comp    = questions.filter(q => compSet.has(progressQuestionId(q._id))).length;
    const corr    = questions.filter(q => corrSet.has(progressQuestionId(q._id))).length;
    const wrong   = comp - corr;
    const pending = questions.length - comp;
    const total   = counts[activeDifficulty] ?? 0;
    return {
      comp, corr, wrong, pending, total,
      pct: total ? Math.round((comp / total) * 100) : 0,
      acc: comp ? Math.round((corr / comp) * 100) : 0,
      pts: progress.points + (bufferOverlay.ptsDelta || 0),
    };
  }, [questions, progress, counts, activeDifficulty, compSet, corrSet, bufferOverlay.ptsDelta]);

  const chapterName = useMemo(
    () => normalizedChapter?.replace(/\b\w/g, c => c.toUpperCase()) ?? "", [normalizedChapter]
  );

  const curQ    = questions[currentIdx];
  const nVisible = questions.length;
  const firstPendingIdx = useMemo(
    () => questions.findIndex(q => !compSet.has(progressQuestionId(q._id))),
    [questions, compSet]
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="pq">
      <style>{STYLES}</style>
      <MetaDataJobs seoTitle={`${chapterName} Practice`} seoDescription={`Practice ${chapterName} questions.`} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: "1rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "2rem 1.5rem", maxWidth: 360, width: "100%" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#6366f1", animation: "spin .7s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink1)", marginBottom: 4 }}>Loading questions</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink3)" }}>Please wait a moment…</p>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="pq">
        <MetaDataJobs seoTitle={`${chapterName} ${category?.toUpperCase()} Practice`} seoDescription={`Practice ${chapterName} questions.`} />

        {/* Bottom sheet (mobile) */}
        {sheetOpen && (
          <NavSheet
            questions={questions} currentIndex={currentIdx}
            completedSet={compSet} correctSet={corrSet}
            onSelect={goTo} onClose={() => setSheetOpen(false)}
            hasMore={hasMore}
            stats={stats}
            user={user}
            unsaved={unsaved}
            saving={saving}
            onSave={saveProgress}
            onSignIn={() => setShowAuthModal(true)}
          />
        )}

        {/* ── TOP BAR ── */}
        <div className="pq-topbar">
          <div className="pq-topbar-row">

            {/* Back */}
            <Link
              href={`/${category}/${subject}`}
              className="btn btn-ghost btn-sm"
              style={{ padding: "6px 10px", textDecoration: "none", flexShrink: 0 }}
            >
              <ArrowLeft size={13} />
              <span style={{ display: "none" }} className="back-label">Back</span>
              <style>{`@media(min-width:640px){.back-label{display:inline}}`}</style>
            </Link>

            {/* Breadcrumb */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <span className="pq-cat-pill">{category?.toUpperCase()}</span>
              <span className="pq-chapter-title">{chapterName}</span>
            </div>

            {/* Counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--ink1)", fontVariantNumeric: "tabular-nums" }}>
                {currentIdx + 1}
                <span style={{ color: "var(--ink4)", fontWeight: 400 }}>/{nVisible}</span>
              </span>
              <div style={{ width: 64, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", borderRadius: 99, background: "var(--accent)", transition: "width .5s", width: `${nVisible ? ((currentIdx + 1) / nVisible) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Points */}
            <div className="pq-points-pill" style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--accent)", borderRadius: 8, color: "#fff", flexShrink: 0 }}>
              <Award size={12} style={{ opacity: .85 }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{stats.pts}</span>
            </div>

            {/* Save */}
            {user ? (
              <button
                key={saveBtnKey}
                type="button"
                onClick={saveProgress}
                disabled={!unsaved || saving}
                className={`btn btn-sm ${unsaved ? "btn-ink save-pop" : ""}`}
                style={{ position: "relative", flexShrink: 0 }}
              >
                <Save size={12} />
                <span style={{ display: "none" }} className="save-label">{saving ? "Saving…" : "Save"}</span>
                <style>{`@media(min-width:480px){.save-label{display:inline}}`}</style>
                {unsaved > 0 && <span className="unsaved-badge">{unsaved}</span>}
              </button>
            ) : (
              <button type="button" onClick={() => setShowAuthModal(true)} className="btn btn-sm btn-ink" style={{ flexShrink: 0 }}>
                Sign in
              </button>
            )}
          </div>

          {/* Chapter progress strip */}
          <div className="pq-strip">
            <div className="pq-strip-fill" style={{ width: `${stats.pct}%` }} />
          </div>

          {/* Mobile difficulty row */}
          <div className="pq-diff-row">
            {DIFFICULTIES.map(d => (
              <button key={d} type="button" onClick={() => changeDifficulty(d)} disabled={loadingQ}
                className={`btn btn-sm diff-${d} ${activeDifficulty === d ? "active" : ""}`}
                style={{ flexShrink: 0, gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: activeDifficulty === d ? "rgba(255,255,255,.7)" : { easy: "var(--easy)", medium: "var(--med)", hard: "var(--hard)" }[d] }} />
                <span style={{ textTransform: "capitalize" }}>{d}</span>
                <span style={{ fontWeight: 600, opacity: .8 }}>{counts[d]}</span>
              </button>
            ))}
          </div>

          {/* Tablet difficulty row */}
          <div className="pq-tablet-diff" role="tablist" aria-label="Difficulty">
            {DIFFICULTIES.map(d => (
              <button key={d} type="button" role="tab" aria-selected={activeDifficulty === d}
                onClick={() => changeDifficulty(d)} disabled={loadingQ}
                className={`btn btn-sm diff-${d} ${activeDifficulty === d ? "active" : ""}`}>
                <span style={{ textTransform: "capitalize" }}>{d}</span>
                <span style={{ fontWeight: 600, opacity: .85 }}>({counts[d]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="pq-body">

          {/* ── SIDEBAR ── */}
          <aside className="pq-sidebar">

            {/* Chapter info */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <p className="label" style={{ marginBottom: 6 }}>Chapter</p>
              <h2 className="pq-heading" style={{ fontSize: "1.125rem", marginBottom: 4 }}>
                {chapterName}
              </h2>
              <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ink3)" }}>{category?.toUpperCase()}</p>
            </div>

            {/* Progress */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <p className="label" style={{ marginBottom: 12 }}>Your Progress</p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Ring pct={stats.pct} size={54} stroke={5} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--ink1)" }}>{stats.pct}%</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink1)", lineHeight: 1 }}>
                    {stats.comp}<span style={{ color: "var(--ink4)", fontWeight: 400, fontSize: ".82rem" }}>/{stats.total}</span>
                  </p>
                  <p style={{ fontSize: ".7rem", color: "var(--ink3)", marginTop: 2, fontWeight: 500 }}>questions done</p>
                  <p style={{ fontSize: ".68rem", color: "var(--ink3)", marginTop: 2 }}>{stats.acc}% accuracy</p>
                </div>
              </div>

              <div className="tri-bar" style={{ marginBottom: 9 }}>
                <div className="tri-seg" style={{ flex: stats.corr, background: "var(--easy)", minWidth: stats.corr ? 4 : 0 }} />
                <div className="tri-seg" style={{ flex: stats.wrong, background: "var(--hard)", minWidth: stats.wrong ? 4 : 0 }} />
                <div className="tri-seg" style={{ flex: stats.pending, background: "var(--border)", minWidth: stats.pending ? 4 : 0, borderRadius: "0 99px 99px 0" }} />
              </div>

              <div className="legend-row">
                {[["var(--easy)", "Correct", stats.corr], ["var(--hard)", "Wrong", stats.wrong], ["var(--border2)", "Pending", stats.pending]].map(([c, l, v]) => (
                  <div key={l} className="legend-item">
                    <div className="legend-dot" style={{ background: c }} />{l}: <strong style={{ marginLeft: 2 }}>{v}</strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: ".76rem", fontWeight: 600, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Flame size={13} style={{ color: "var(--med)" }} /> Points earned
                </span>
                <span style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--ink1)" }}>{stats.pts}</span>
              </div>

              {user && unsaved > 0 && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: ".7rem", color: "#92400E", fontWeight: 700 }}>{unsaved} unsaved</span>
                  <button type="button" onClick={saveProgress} disabled={saving} className="btn btn-sm btn-ink" style={{ padding: "4px 9px" }}>
                    {saving ? "…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <p className="label" style={{ marginBottom: 10 }}>Difficulty</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DIFFICULTIES.map(d => (
                  <DiffButton key={d} d={d} count={counts[d]} active={activeDifficulty === d} loading={loadingQ} onClick={() => changeDifficulty(d)} />
                ))}
              </div>
            </div>

            {/* Question map */}
            {questions.length > 0 && (
              <div className="card qmap-card" style={{ overflow: "hidden" }}>
                <div className="qmap-head">
                  <div className="qmap-title">
                    <p className="label">Question Map</p>
                    <p className="qmap-sub">
                      Jump fast · {questions.length}{hasMore ? "+" : ""} loaded
                    </p>
                  </div>
                  <div className="qmap-actions">
                    {firstPendingIdx !== -1 && (
                      <button
                        type="button"
                        className="qmap-mini"
                        onClick={() => goTo(firstPendingIdx)}
                        title={`First pending: Q${firstPendingIdx + 1}`}
                      >
                        Pending
                      </button>
                    )}
                    <button
                      type="button"
                      className="qmap-mini"
                      onClick={() => goTo(currentIdx)}
                      title={`Current: Q${currentIdx + 1}`}
                    >
                      Current
                    </button>
                  </div>
                </div>

                <div className="qmap-jump">
                  <input
                    ref={qmapJumpRef}
                    className="qmap-input"
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={Math.max(1, questions.length)}
                    placeholder="Jump to question #"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const raw = qmapJumpRef.current?.value;
                      const n = Math.floor(Number(raw));
                      if (!Number.isFinite(n)) return;
                      const i = Math.max(1, Math.min(n, questions.length));
                      goTo(i - 1);
                      if (qmapJumpRef.current) qmapJumpRef.current.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ height: 34, padding: "0 10px" }}
                    onClick={() => {
                      const raw = qmapJumpRef.current?.value;
                      const n = Math.floor(Number(raw));
                      if (!Number.isFinite(n)) return;
                      const i = Math.max(1, Math.min(n, questions.length));
                      goTo(i - 1);
                      if (qmapJumpRef.current) qmapJumpRef.current.value = "";
                    }}
                  >
                    Go
                  </button>
                </div>

                <div className="qmap-scroll">
                  <div className="qmap-grid" style={{ paddingBottom: 2 }}>
                  {questions.map((q, i) => {
                    const qid = progressQuestionId(q._id);
                    const ok  = corrSet.has(qid);
                    const bad = compSet.has(qid) && !ok;
                    const cur = i === currentIdx;
                    return (
                      <div key={q._id} className={`dot ${cur ? "dot-cur" : ok ? "dot-ok" : bad ? "dot-err" : ""}`}
                        onClick={() => goTo(i)}
                        title={`Q${i + 1}${cur ? " · Current" : ok ? " · Correct" : bad ? " · Wrong" : " · Pending"}`}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                  </div>
                </div>

                <div className="qmap-foot">
                  <div className="qmap-legend" aria-hidden="true">
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch cur" />Current</span>
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch ok" />Correct</span>
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch err" />Wrong</span>
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch" />Pending</span>
                  </div>
                  <span style={{ fontSize: ".66rem", fontWeight: 800, color: "var(--ink3)", fontVariantNumeric: "tabular-nums" }}>
                    {currentIdx + 1}/{questions.length}
                  </span>
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            <p style={{ fontSize: ".65rem", color: "var(--ink4)", textAlign: "center", padding: "0 4px" }}>
              Use{" "}
              <kbd style={{ padding: "1px 5px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "monospace", fontSize: ".65rem" }}>←</kbd>
              {" "}
              <kbd style={{ padding: "1px 5px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "monospace", fontSize: ".65rem" }}>→</kbd>
              {" "}to navigate
            </p>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div style={{ minWidth: 0 }}>

            {/* Tablet: compact progress */}
            {questions.length > 0 && (
              <div className="card pq-tablet-progress">
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Ring pct={stats.pct} size={48} stroke={4} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--ink1)" }}>{stats.pct}%</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--ink1)" }}>
                    {stats.comp}<span style={{ color: "var(--ink4)", fontWeight: 400 }}> / {stats.total}</span> done
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--ink3)", marginTop: 2 }}>
                    {stats.acc}% accuracy · {stats.pts} pts
                  </p>
                  <div className="tri-bar" style={{ marginTop: 8, maxWidth: 280 }}>
                    <div className="tri-seg" style={{ flex: stats.corr, background: "var(--easy)", minWidth: stats.corr ? 4 : 0 }} />
                    <div className="tri-seg" style={{ flex: stats.wrong, background: "var(--hard)", minWidth: stats.wrong ? 4 : 0 }} />
                    <div className="tri-seg" style={{ flex: stats.pending, background: "var(--border)", minWidth: stats.pending ? 4 : 0 }} />
                  </div>
                </div>
                <button type="button" onClick={() => setSheetOpen(true)} className="btn btn-sm" style={{ flexShrink: 0 }}>
                  <LayoutGrid size={14} /> Map
                </button>
              </div>
            )}

            {/* ── Question area ── */}
            {loadingQ && questions.length === 0 ? (
              <div className="card-main" style={{ minHeight: 320 }}><QuestionSkeleton /></div>
            ) : questions.length === 0 ? (
              <div className="card" style={{ padding: "52px 24px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <AlertCircle size={22} style={{ color: "var(--ink4)" }} />
                </div>
                <h3 className="pq-heading" style={{ marginBottom: 8 }}>No questions available</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--ink2)", lineHeight: 1.5 }}>No {activeDifficulty} questions found for this chapter.</p>
              </div>
            ) : curQ ? (
              <div key={animKey} className="card-main q-enter" style={{ overflow: "hidden" }}>
                {isAdmin && (
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "0.5rem 1rem 0", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                    <button type="button" onClick={() => rewriteQuestion(curQ)} disabled={rewritingId === curQ._id}
                      className="btn btn-ghost btn-sm">
                      {rewritingId === curQ._id ? "Rewriting…" : "Rewrite question"}
                    </button>
                  </div>
                )}

                <div className="pq-q-body pq-question-host">
                  <MathJaxContext config={mathJaxConfig}>
                    <MathJax>
                      <QuestionCard
                        category={category}
                        question={curQ}
                        index={currentIdx}
                        onAnswer={(ok) => handleAnswer(curQ._id, ok, curQ.topic)}
                        isCompleted={compSet.has(progressQuestionId(curQ._id))}
                        isCorrect={corrSet.has(progressQuestionId(curQ._id))}
                        isAdmin={isAdmin}
                        embedded
                        creditsLocked={Boolean(user) && !canAttemptPractice}
                        onRequireCredits={() => setShowPaywall(true)}
                        onEdit={(q) => setEditingQuestion({ ...q })}
                      />
                    </MathJax>
                  </MathJaxContext>
                </div>

                {/* Desktop nav footer */}
                <div className="desk-nav pq-desk-nav">
                  <button onClick={goPrev} disabled={currentIdx === 0} className="btn" style={{ gap: 5 }}>
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {/* Dot strip */}
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {questions.slice(Math.max(0, currentIdx - 3), currentIdx + 4).map((_, ii) => {
                      const ri = Math.max(0, currentIdx - 3) + ii, cur = ri === currentIdx;
                      return <div key={ri} style={{ width: cur ? 20 : 6, height: 6, borderRadius: 99, background: cur ? "var(--accent)" : "var(--border2)", transition: "all .2s" }} />;
                    })}
                  </div>

                  <button onClick={goNext} disabled={currentIdx === questions.length - 1 && !hasMore}
                    className="btn btn-ink" style={{ gap: 5 }}>
                    {loadingQ && currentIdx >= questions.length - 3 ? "Loading…" : "Next"} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>

        {/* ── MOBILE BOTTOM BAR ── */}
        <div className="mob-bar">
          <div className="mob-bar-inner">
            <button onClick={goPrev} disabled={currentIdx === 0} className="mob-icon-btn">
              <ChevronLeft size={18} style={{ color: currentIdx === 0 ? "var(--ink4)" : "var(--ink1)" }} />
            </button>

            <button onClick={() => setSheetOpen(true)} className="mob-center-btn">
              <div style={{ display: "flex", gap: 3, alignItems: "center", flex: 1, overflow: "hidden" }}>
                {questions.slice(0, 10).map((q, i) => {
                  const qid = progressQuestionId(q._id), cur = i === currentIdx;
                  const ok  = corrSet.has(qid), bad = compSet.has(qid) && !ok;
                  return <div key={q._id} style={{
                    width: cur ? 18 : 6, height: 6, borderRadius: 99, flexShrink: 0,
                    background: cur ? "var(--accent)" : ok ? "var(--easy)" : bad ? "var(--hard)" : "var(--border2)",
                    transition: "all .2s",
                  }} />;
                })}
                {questions.length > 10 && (
                  <span style={{ fontSize: ".58rem", color: "var(--ink4)", fontWeight: 700, marginLeft: 2, flexShrink: 0 }}>+{questions.length - 10}</span>
                )}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--ink1)", lineHeight: 1 }}>{currentIdx + 1}/{nVisible}</p>
                <p style={{ fontSize: ".58rem", color: "var(--ink3)", lineHeight: 1.4 }}>All Qs</p>
              </div>
              <ChevronUp size={13} style={{ color: "var(--ink4)", flexShrink: 0 }} />
            </button>

            <button
              onClick={goNext}
              disabled={currentIdx === questions.length - 1 && !hasMore}
              className="mob-icon-btn"
              style={{
                background: currentIdx === questions.length - 1 && !hasMore ? "var(--surface2)" : "var(--accent)",
                borderColor: currentIdx === questions.length - 1 && !hasMore ? "var(--border)" : "var(--accent)",
              }}
            >
              <ChevronRight size={18} style={{ color: currentIdx === questions.length - 1 && !hasMore ? "var(--ink4)" : "#fff" }} />
            </button>
          </div>
        </div>

        {editingQuestion && (
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Admin edit</p>
                  <p className="text-lg font-semibold text-neutral-900">Edit question</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-3 py-2 rounded-lg hover:bg-neutral-100 text-neutral-700"
                >
                  Close
                </button>
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={editingQuestion.question || ""}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, question: e.target.value }))}
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                  rows={4}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["A", "B", "C", "D"].map((opt) => (
                    <input
                      key={opt}
                      value={editingQuestion[`options_${opt}`] || ""}
                      onChange={(e) =>
                        setEditingQuestion((p) => ({ ...p, [`options_${opt}`]: e.target.value }))
                      }
                      className="w-full p-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      placeholder={`Option ${opt}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={editingQuestion.correct_option || "A"}
                    onChange={(e) =>
                      setEditingQuestion((p) => ({ ...p, correct_option: e.target.value }))
                    }
                    className="w-full p-3 border border-neutral-200 rounded-xl"
                  >
                    {["A", "B", "C", "D"].map((o) => (
                      <option key={o} value={o}>
                        Correct: {o}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editingQuestion.difficulty || "easy"}
                    onChange={(e) =>
                      setEditingQuestion((p) => ({ ...p, difficulty: e.target.value }))
                    }
                    className="w-full p-3 border border-neutral-200 rounded-xl"
                  >
                    {["easy", "medium", "hard"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={editingQuestion.solution || ""}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, solution: e.target.value }))}
                  className="w-full p-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                  rows={4}
                  placeholder="Solution"
                />
              </div>
              <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editingQuestion?._id) return;
                    setSavingEdit(true);
                    try {
                      const { error } = await supabase.from("examtracker").upsert({
                        _id: editingQuestion._id,
                        question: editingQuestion.question,
                        options_A: editingQuestion.options_A,
                        options_B: editingQuestion.options_B,
                        options_C: editingQuestion.options_C,
                        options_D: editingQuestion.options_D,
                        correct_option: editingQuestion.correct_option,
                        solution: editingQuestion.solution,
                        difficulty: editingQuestion.difficulty,
                      });
                      if (error) throw error;
                      setQuestions((prev) =>
                        prev.map((q) => (q?._id === editingQuestion._id ? { ...q, ...editingQuestion } : q))
                      );
                      toast.success("Question updated successfully");
                      setEditingQuestion(null);
                    } catch (_) {
                      toast.error("Failed to update question");
                    } finally {
                      setSavingEdit(false);
                    }
                  }}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 disabled:opacity-60"
                >
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

ChapterPracticePage.displayName = "ChapterPracticePage";
export default ChapterPracticePage;