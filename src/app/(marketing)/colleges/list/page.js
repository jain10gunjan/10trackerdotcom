// app/colleges/list/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase/browser';
import { getAuth, signOut } from "firebase/auth";
import { app } from '@/lib/firebase';
import Link from "next/link";

const Navbar = ({ user, onSignOut }) => (
  <nav className="bg-white shadow p-4">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <h1 className="text-xl font-bold">College Portal</h1>
      <div className="flex items-center gap-4">
        {user && (
          <Link href="/colleges" className="text-blue-500 hover:underline">
            Create College
          </Link>
        )}
        {user ? (
          <>
            <span className="text-gray-600">
              {user.displayName || user.email}
            </span>
            <button
              onClick={onSignOut}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login" className="text-blue-500 hover:underline">
            Sign In
          </Link>
        )}
      </div>
    </div>
  </nav>
);

const CollegeListPage = () => {
  const router = useRouter();
  const auth = getAuth(app);
  const [colleges, setColleges] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      fetchColleges();
    });
    return () => unsubscribe();
  }, [auth]);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("colleges")
        .select(
          "*, college_users!inner(user_id, is_admin, users(display_name, email))"
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setColleges(data || []);
    } catch (err) {
      console.error("Error fetching colleges:", err.message);
      setError("Failed to load colleges.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error.message);
      setError("Failed to sign out.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={currentUser} onSignOut={handleSignOut} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">All Colleges</h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-gray-500">Loading colleges...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colleges.map((college) => {
              const admin = college.college_users.find((u) => u.is_admin);
              return (
                <Link
                  key={college.id}
                  href={`/colleges/${college.id}`}
                  className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow block"
                >
                  <h2 className="text-xl font-semibold">{college.name}</h2>
                  <p className="text-gray-600">Location: {college.location}</p>
                  {college.website && (
                    <p className="text-gray-600">
                      Website:{" "}
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent link click from triggering parent navigation
                      >
                        {college.website}
                      </a>
                    </p>
                  )}
                  <p className="text-gray-600">
                    Description: {college.description}
                  </p>
                  <p className="text-gray-600">
                    Admin:{" "}
                    {admin
                      ? admin.users?.display_name || admin.users?.email
                      : "No admin assigned"}
                  </p>
                  <p className="text-gray-600">
                    Members: {college.college_users.length}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && colleges.length === 0 && (
          <div className="text-center text-gray-500 mt-6">
            No colleges yet.{" "}
            {currentUser && (
              <Link href="/colleges" className="text-blue-500 hover:underline">
                Create one now!
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeListPage;
