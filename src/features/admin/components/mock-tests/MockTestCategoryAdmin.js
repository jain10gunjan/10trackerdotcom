"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus,
  BookOpen,
  BarChart3,
  FileText,
  Zap,
  Calendar,
  Layers,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Power,
} from "lucide-react";
import { parseJsonResponse, toastPromise } from "@/lib/toastAsync";
import { mockTestHrefForSlug } from "@/lib/platformExams";
import {
  mockTestAdminBase,
  mockTestAdminCreate,
  categoryLabelFromSlug,
} from "@/features/mock-test/lib/mockTestAdminPaths";
import MockTestEditModal from "./MockTestEditModal";

export default function MockTestCategoryAdmin({ examcategory }) {
  const base = mockTestAdminBase(examcategory);
  const categoryLabel = categoryLabelFromSlug(examcategory);
  const studentHub = mockTestHrefForSlug(examcategory);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mock-test/admin/tests?category=${encodeURIComponent(examcategory)}`,
        { credentials: "include" }
      );
      const data = await parseJsonResponse(res);
      if (!data.success) {
        const msg = data.setupHint
          ? `${data.error || "Failed to load tests"}`
          : data.error || "Failed to load tests";
        throw new Error(msg);
      }
      setTests(data.tests || []);
    } catch (e) {
      toast.error(e.message || "Failed to fetch tests", { duration: 8000 });
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [examcategory]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const patchTest = async (testId, patch) => {
    setActionId(testId);
    try {
      return await toastPromise(
        async () => {
          const res = await fetch("/api/mock-test/admin/tests", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId, examCategory: examcategory, patch }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(
              data.setupHint ? `${data.error}\n${data.setupHint}` : data.error || "Update failed"
            );
          }
          await fetchTests();
          return true;
        },
        {
          loading: "Saving test…",
          success: "Test updated",
          error: (e) => e.message || "Update failed",
        }
      );
    } catch {
      return false;
    } finally {
      setActionId(null);
    }
  };

  const handleSaveEdit = async (form) => {
    if (!editing) return;
    setSavingEdit(true);
    const ok = await patchTest(editing.id, form);
    setSavingEdit(false);
    if (ok) setEditing(null);
  };

  const handleToggleActive = async (test) => {
    await patchTest(test.id, { is_active: !test.isActive });
  };

  const handleDeactivate = async (test) => {
    if (!test.isActive) {
      toast.error("Test is already inactive — use Activate to restore");
      return;
    }
    const attemptNote =
      test.attemptCount > 0
        ? `\n\n${test.attemptCount} student attempt(s) will be kept.`
        : "";
    if (
      !window.confirm(
        `Deactivate "${test.name}"? It will be hidden from students but kept in the database.${attemptNote}`
      )
    ) {
      return;
    }

    setActionId(test.id);
    try {
      await toastPromise(
        async () => {
          const res = await fetch("/api/mock-test/admin/tests", {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testId: test.id,
              examCategory: examcategory,
            }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) {
            throw new Error(
              data.setupHint
                ? `${data.error}\n${data.setupHint}`
                : data.error || "Deactivate failed"
            );
          }
          await fetchTests();
          return data.message || "Test deactivated";
        },
        {
          loading: "Deactivating test…",
          success: (msg) => msg,
          error: (e) => e.message || "Deactivate failed",
        }
      );
    } catch {
      /* toast.promise surfaces the error */
    } finally {
      setActionId(null);
    }
  };

  const totalQuestions = tests.reduce((s, t) => s + (t.totalQuestions || 0), 0);
  const totalAttempts = tests.reduce((s, t) => s + (t.attemptCount || 0), 0);

  const ActionBtn = ({ onClick, title, children, danger }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg border p-1.5 transition-colors ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Mock tests
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">{categoryLabel}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Create, edit, and manage mock tests for this exam category.
          </p>
        </div>
        <Link
          href={mockTestAdminCreate(examcategory)}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New test
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tests", value: tests.length },
          { label: "Questions", value: totalQuestions },
          { label: "Attempts", value: totalAttempts },
          { label: "Active", value: tests.filter((t) => t.isActive).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="text-xl font-semibold text-neutral-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: mockTestAdminCreate(examcategory),
            icon: Plus,
            title: "Create test",
            desc: "Manual or auto question selection",
            color: "bg-blue-50 text-blue-700",
          },
          {
            href: mockTestAdminCreate(examcategory, { mode: "topic" }),
            icon: Layers,
            title: "Topic-wise test",
            desc: "20 questions · single topic",
            color: "bg-sky-50 text-sky-700",
          },
          {
            href: `${base}/create-yearwise`,
            icon: Calendar,
            title: "Year-wise test",
            desc: "PYQs filtered by year",
            color: "bg-indigo-50 text-indigo-700",
          },
          {
            href: `${base}/api-integration`,
            icon: Zap,
            title: "API integration",
            desc: "Import from allowlisted hosts",
            color: "bg-orange-50 text-orange-700",
          },
          {
            href: `${base}/daily-practice`,
            icon: BookOpen,
            title: "Daily practice",
            desc: "Build DPP sets",
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            href: studentHub,
            icon: BarChart3,
            title: "Student hub",
            desc: "Preview learner mock-test page",
            color: "bg-neutral-100 text-neutral-700",
          },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow"
          >
            <div className={`rounded-lg p-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">{title}</p>
              <p className="text-xs text-neutral-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-900">All tests</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : tests.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-600">No tests yet for this category.</p>
            <Link
              href={mockTestAdminCreate(examcategory)}
              className="mt-4 inline-block rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create first test
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium sm:px-5">Name</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Qs</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {tests.map((test) => {
                  const busy = actionId === test.id;
                  return (
                    <tr key={test.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-medium text-neutral-900 sm:px-5">
                        <span className="line-clamp-2">{test.name}</span>
                        {test.creationMode && (
                          <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                            {test.creationMode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {test.createdAt
                          ? new Date(test.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{test.totalQuestions ?? 0}</td>
                      <td className="px-4 py-3 text-neutral-600">{test.duration ?? "—"}m</td>
                      <td className="px-4 py-3 text-neutral-600">{test.attemptCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            test.isActive
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {test.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                          ) : (
                            <>
                              <ActionBtn
                                title="Preview attempt"
                                onClick={() =>
                                  window.open(
                                    `${studentHub}/attempt/${test.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </ActionBtn>
                              <ActionBtn
                                title="Edit"
                                onClick={() => setEditing(test)}
                              >
                                <Pencil className="h-4 w-4" />
                              </ActionBtn>
                              <ActionBtn
                                title={test.isActive ? "Deactivate" : "Activate"}
                                onClick={() => handleToggleActive(test)}
                              >
                                <Power className="h-4 w-4" />
                              </ActionBtn>
                              {test.isActive && (
                                <ActionBtn
                                  title="Deactivate (soft delete)"
                                  danger
                                  onClick={() => handleDeactivate(test)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </ActionBtn>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MockTestEditModal
        test={editing}
        open={Boolean(editing)}
        saving={savingEdit}
        onClose={() => !savingEdit && setEditing(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
