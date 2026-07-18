"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from '@/lib/supabase/browser';
import { getAuth, signOut } from "firebase/auth";
import { app } from '@/lib/firebase';

const CollegeDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const auth = getAuth(app);
  const [college, setCollege] = useState(null);
  const [contests, setContests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      fetchCollege();
      fetchContests();
    });
    return () => unsubscribe();
  }, [id, auth]);

  const fetchCollege = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("colleges")
        .select(
          "*, college_users!inner(user_id, is_admin, users(display_name, email))"
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setCollege(data);
    } catch (err) {
      console.error("Error fetching college:", err.message);
      setError("Failed to load college details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select(
          `
          *,
          contest_questions(id, platform, question_url),
          contest_participants(user_id)
        `
        )
        .eq("college_id", id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const contestsWithParticipants = data.map((contest) => ({
        ...contest,
        participants: contest.contest_participants.map((p) => p.user_id),
      }));

      setContests(contestsWithParticipants || []);
    } catch (err) {
      console.error("Error fetching contests:", err);
      setError("Failed to load contests.");
    }
  };

  const syncUserToSupabase = async (
    user,
    leetcodeUsername = null,
    geeksforgeeksUsername = null
  ) => {
    try {
      const { error } = await supabase.from("users").upsert(
        {
          id: user.uid,
          email: user.email || "unknown@example.com",
          display_name: user.displayName || "Anonymous",
          leetcode_username: leetcodeUsername,
          geeksforgeeks_username: geeksforgeeksUsername,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("Error syncing user:", err.message);
      throw err;
    }
  };

  const handleJoinContest = async (contestId) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setActionInProgress(true);
    setError(null);

    try {
      // Check if user is already a participant
      const { data: existing, error: fetchError } = await supabase
        .from("contest_participants")
        .select("user_id")
        .eq("contest_id", contestId)
        .eq("user_id", currentUser.uid)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
      if (existing) {
        setError("You are already participating in this contest.");
        return;
      }

      // Prompt for usernames
      const leetcodeUsername = prompt("Enter your LeetCode username:");
      const geeksforgeeksUsername = prompt(
        "Enter your GeeksforGeeks username:"
      );

      // Sync user with usernames
      await syncUserToSupabase(
        currentUser,
        leetcodeUsername,
        geeksforgeeksUsername
      );

      // Add participant
      const { error: insertError } = await supabase
        .from("contest_participants")
        .insert({ contest_id: contestId, user_id: currentUser.uid });

      if (insertError) throw insertError;

      console.log("Joined contest successfully");
      await fetchContests();
    } catch (err) {
      console.error("Error joining contest:", err);
      setError(`Failed to join contest: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleJoinCollege = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setActionInProgress(true);
    setError(null);

    try {
      await syncUserToSupabase(currentUser);
      const isMember = college.college_users.some(
        (member) => member.user_id === currentUser.uid
      );
      if (isMember) {
        setError("You are already a member of this college.");
      } else {
        const { error: joinError } = await supabase
          .from("college_users")
          .insert({
            college_id: id,
            user_id: currentUser.uid,
            is_admin: false,
          });
        if (joinError) throw joinError;
        await fetchCollege();
      }
    } catch (err) {
      console.error("Error joining college:", err);
      setError(`Failed to join college: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleLeaveCollege = async () => {
    if (!currentUser) return;

    setActionInProgress(true);
    setError(null);

    try {
      const isAdmin = college.college_users.some(
        (member) => member.user_id === currentUser.uid && member.is_admin
      );
      if (isAdmin && college.college_users.length === 1) {
        setError("Admin cannot leave unless there are other members.");
      } else {
        const { error: leaveError } = await supabase
          .from("college_users")
          .delete()
          .eq("college_id", id)
          .eq("user_id", currentUser.uid);
        if (leaveError) throw leaveError;
        await fetchCollege();
      }
    } catch (err) {
      console.error("Error leaving college:", err);
      setError(`Failed to leave college: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      setError("Failed to sign out.");
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error && !college)
    return <div className="text-center p-6 text-red-600">{error}</div>;
  if (!college)
    return <div className="text-center p-6">College not found.</div>;

  const admin = college.college_users.find((u) => u.is_admin);
  const isMember =
    currentUser &&
    college.college_users.some((member) => member.user_id === currentUser.uid);
  const isCurrentUserAdmin =
    isMember &&
    college.college_users.some(
      (member) => member.user_id === currentUser.uid && member.is_admin
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{college.name}</h1>
          {currentUser && (
            <div className="flex gap-4">
              {isCurrentUserAdmin && (
                <Link
                  href={`/colleges/${id}/admin`}
                  className="text-blue-500 hover:underline"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">Location: {college.location}</p>
          {college.website && (
            <p className="text-gray-600">
              Website:{" "}
              <a
                href={college.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {college.website}
              </a>
            </p>
          )}
          <p className="text-gray-600">Description: {college.description}</p>
          <p className="text-gray-600">
            Admin:{" "}
            {admin
              ? admin.users?.display_name || admin.users?.email
              : "No admin assigned"}
          </p>
          <p className="text-gray-600">
            Total Members: {college.college_users.length}
          </p>
        </div>

        {currentUser && (
          <div className="mt-6 space-y-2">
            {isMember ? (
              <>
                <p className="text-green-600">
                  You are a member of this college.
                </p>
                <button
                  onClick={handleLeaveCollege}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-yellow-300"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? "Processing..." : "Leave College"}
                </button>
              </>
            ) : (
              <button
                onClick={handleJoinCollege}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                disabled={actionInProgress}
              >
                {actionInProgress ? "Joining..." : "Join College"}
              </button>
            )}
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Members</h2>
          {college.college_users.length > 0 ? (
            <ul className="space-y-2">
              {college.college_users.map((member) => (
                <li key={member.user_id} className="p-2 bg-gray-50 rounded">
                  {member.users?.display_name || member.users?.email}{" "}
                  {member.is_admin && (
                    <span className="text-sm text-blue-500">(Admin)</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No members yet.</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Contests</h2>
          {contests.length > 0 ? (
            <ul className="space-y-4">
              {contests.map((contest) => {
                const isParticipant = contest.participants.includes(
                  currentUser?.uid
                );
                const isActive =
                  new Date(contest.start_time) <= new Date() &&
                  new Date() <= new Date(contest.end_time);
                return (
                  <li key={contest.id} className="p-4 bg-gray-50 rounded">
                    <h3 className="text-lg font-medium">{contest.title}</h3>
                    <p className="text-gray-600">{contest.description}</p>
                    <p className="text-gray-600">
                      Start: {new Date(contest.start_time).toLocaleString()} |
                      End: {new Date(contest.end_time).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      Participants: {contest.participants.length}
                    </p>
                    <Link
                      href={`/colleges/${id}/contests/${contest.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      View Contest Details
                    </Link>
                    {currentUser && isActive && !isParticipant && (
                      <button
                        onClick={() => handleJoinContest(contest.id)}
                        className="mt-2 ml-4 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 disabled:bg-green-300"
                        disabled={actionInProgress}
                      >
                        {actionInProgress ? "Joining..." : "Join Contest"}
                      </button>
                    )}
                    {isParticipant && (
                      <p className="mt-2 text-green-600">
                        You are participating in this contest.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500">No contests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeDetailPage;
