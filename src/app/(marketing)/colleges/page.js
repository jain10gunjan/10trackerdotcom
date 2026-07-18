// app/colleges/page.jsx
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
          <Link href="/colleges/list" className="text-blue-500 hover:underline">
            View Colleges
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

const CollegesPage = () => {
  const router = useRouter();
  const auth = getAuth(app);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newCollege, setNewCollege] = useState({
    name: "",
    location: "",
    website: "",
    description: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserToSupabase(user);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const syncUserToSupabase = async (user) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.uid)
        .single();

      if (error && error.code === "PGRST116") {
        const { error: insertError } = await supabase.from("users").insert({
          id: user.uid,
          email: user.email || "unknown@example.com",
          display_name: user.displayName,
        });
        if (insertError) throw insertError;
      } else if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Error syncing user:", err.message);
      setError("Failed to sync user data.");
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const { name, location, description } = newCollege;
    if (!name || !location || !description) {
      setError("Name, Location, and Description are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await syncUserToSupabase(currentUser);

      const { data: college, error: collegeError } = await supabase
        .from("colleges")
        .insert({
          name,
          location,
          website: newCollege.website,
          description,
          created_by: currentUser.uid,
        })
        .select()
        .single();

      if (collegeError) throw collegeError;

      const { error: adminError } = await supabase
        .from("college_users")
        .insert({
          college_id: college.id,
          user_id: currentUser.uid,
          is_admin: true,
        });

      if (adminError) throw adminError;

      setNewCollege({ name: "", location: "", website: "", description: "" });
      router.push("/colleges/list"); // Redirect to the list page after creation
    } catch (error) {
      console.error("Error creating college:", error.message);
      setError(`Failed to create college: ${error.message}`);
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
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Create New College</h1>
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateCollege} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                value={newCollege.name}
                onChange={(e) =>
                  setNewCollege({ ...newCollege, name: e.target.value })
                }
                placeholder="College Name"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location *
              </label>
              <input
                type="text"
                value={newCollege.location}
                onChange={(e) =>
                  setNewCollege({ ...newCollege, location: e.target.value })
                }
                placeholder="City, State, Country"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                value={newCollege.website}
                onChange={(e) =>
                  setNewCollege({ ...newCollege, website: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                value={newCollege.description}
                onChange={(e) =>
                  setNewCollege({ ...newCollege, description: e.target.value })
                }
                placeholder="Brief description of the college"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                rows="3"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create College"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollegesPage;
