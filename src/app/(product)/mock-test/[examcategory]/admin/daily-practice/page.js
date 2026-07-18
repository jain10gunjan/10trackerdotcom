"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  ListChecks,
} from "lucide-react";
import toast from "react-hot-toast";
import QuestionSelector from "@/features/practice/components/QuestionSelector";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { MATHJAX_CONFIG } from "@/lib/mathjaxConfig";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const normalizeCategory = (param) =>
  (param || "gate-cse").toString().trim().toUpperCase().replace(/_/g, "-");

const categoryLabel = (param) =>
  (param || "gate-cse").toString().trim().replace(/-/g, " ").toUpperCase();

export default function DailyPracticeAdminPage() {
  const router = useRouter();
  const params = useParams();
  const examcategory = params?.examcategory || "gate-cse";
  const categoryForApi = useMemo(
    () => normalizeCategory(examcategory),
    [examcategory]
  );
  const categoryDisplay = useMemo(
    () => categoryLabel(examcategory),
    [examcategory]
  );

  const { user, isAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateFor, setDateFor] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">
            Sign in required
          </h2>
          <p className="text-sm text-neutral-600">
            Please sign in with an admin account to create daily practice sets.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">
            Admin access only
          </h2>
          <p className="text-sm text-neutral-600">
            Only administrators can create daily practice sets.
          </p>
        </div>
      </div>
    );
  }

  const handleQuestionToggle = (question, action) => {
    if (action === "add") {
      setSelectedQuestions((prev) => [...prev, question]);
    } else {
      setSelectedQuestions((prev) =>
        prev.filter((q) => q._id !== question._id)
      );
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for the daily practice set.");
      return;
    }

    if (!selectedQuestions.length) {
      toast.error("Please select at least one question.");
      return;
    }

    setIsSaving(true);
    try {
      const questionIds = selectedQuestions.map((q) => q._id);

      const res = await fetch("/api/daily-practice/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: examcategory,
          title: title.trim(),
          description: description.trim(),
          date_for: dateFor,
          scopeSubject: null,
          scopeTopic: null,
          scopeChapter: null,
          questionIds,
          createdBy:
            user?.primaryEmailAddress?.emailAddress || user?.email || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create daily practice set.");
      }

      toast.success("Daily practice set created.");
      setSelectedQuestions([]);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create daily practice set.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <MathJaxContext config={MATHJAX_CONFIG}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to admin
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                {categoryDisplay} – Daily practice
              </h1>
              <p className="text-sm text-neutral-600">
                Create a lightweight daily MCQ set (no timer, no tracking).
              </p>
            </div>
            <div className="inline-flex items-center rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs sm:text-sm text-neutral-700">
              <BookOpen className="w-4 h-4 mr-1.5" />
              {categoryForApi}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Set title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Day 12 – Trees & Graphs"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short note about what this practice set focuses on."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Date for this set
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFor}
                    onChange={(e) => setDateFor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                  />
                  <Calendar className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-3 text-xs text-neutral-600 flex items-start gap-2">
                <ListChecks className="w-4 h-4 mt-0.5 text-neutral-500" />
                <p>
                  Aim for 10–15 questions. This panel does not track scores; it
                  just shows correct/incorrect and explanations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Selected questions
            </h2>
            <button
              type="button"
              onClick={() => setShowSelector(true)}
              className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-neutral-800"
            >
              Pick questions
            </button>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 mb-3">
            {selectedQuestions.length} question
            {selectedQuestions.length === 1 ? "" : "s"} selected.
          </p>
              {selectedQuestions.length > 0 ? (
            <div className="border border-neutral-100 rounded-xl max-h-64 overflow-y-auto divide-y divide-neutral-100">
              {selectedQuestions.map((q, idx) => (
                <div
                  key={q._id || idx}
                  className="px-3 py-2.5 text-xs sm:text-sm flex justify-between items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 line-clamp-2">
                      Q{idx + 1}.{" "}
                      <MathJax dynamic hideUntilTypeset={"first"}>
                        <span
                          dangerouslySetInnerHTML={{ __html: q.question }}
                        />
                      </MathJax>
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {q.subject || "Subject"} · {q.topic || "Topic"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuestionToggle(q, "remove")}
                    className="text-[11px] text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-neutral-200 rounded-xl p-4 text-xs sm:text-sm text-neutral-500 text-center">
              No questions selected yet. Click “Pick questions” to choose MCQs
              from the exam database.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save daily practice set"}
          </button>
        </div>
      </div>

      {showSelector && (
        <QuestionSelector
          selectedQuestions={selectedQuestions}
          onQuestionToggle={handleQuestionToggle}
          onClose={() => setShowSelector(false)}
          maxQuestions={25}
          examcategory={examcategory}
        />
      )}

</MathJaxContext>
    </div>
  );
}

