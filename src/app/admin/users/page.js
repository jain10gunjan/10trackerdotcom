"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import MetaDataJobs from "@/components/ui/Seo";
import AdminCreditAdjustModal from "@/features/admin/components/users/AdminCreditAdjustModal";
import AdminUsersDashboard from "@/features/admin/components/users/AdminUsersDashboard";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [counts, setCounts] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [clerkWarning, setClerkWarning] = useState(null);
  const [creditUser, setCreditUser] = useState(null);

  const refreshUsers = useCallback(async () => {
    setFetching(true);
    setError(null);
    setClerkWarning(null);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load users");
      }
      setUsers(data.users || []);
      setSummary(data.summary || null);
      setCounts(data.counts || null);
      if (data.clerkError) setClerkWarning(data.clerkError);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load users");
      setUsers([]);
      setSummary(null);
      setCounts(null);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/admin/users");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && isAdmin) {
      refreshUsers();
    }
  }, [loading, isAdmin, refreshUsers]);

  if (!isAdmin && !loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <MetaDataJobs seoTitle="Users dashboard" seoDescription="Admin user progress" />
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-neutral-900">Admin access only</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MetaDataJobs seoTitle="User progress dashboard" seoDescription="Admin merged users" />
      <AdminUsersDashboard
        users={users}
        summary={summary}
        counts={counts}
        fetching={fetching}
        error={error}
        clerkWarning={clerkWarning}
        onAdjustCredits={setCreditUser}
        onRefresh={refreshUsers}
      />
      <AdminCreditAdjustModal
        user={creditUser}
        open={Boolean(creditUser)}
        onClose={() => setCreditUser(null)}
        onSaved={() => refreshUsers()}
      />
    </div>
  );
}
