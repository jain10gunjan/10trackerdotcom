"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from '@/lib/supabase/browser';
import { getAuth } from "firebase/auth";
import { app } from '@/lib/firebase';

const ContestDetailPage = () => {
  const { id, contestId } = useParams();
  const router = useRouter();
  const auth = getAuth(app);
  const [contest, setContest] = useState(null);
  const [participantDetails, setParticipantDetails] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      fetchContest(user?.uid);
    });
    return () => unsubscribe();
  }, [id, contestId, auth]);

  const fetchContest = async (userId) => {
    try {
      setLoading(true);
      const { data: contestData, error: contestError } = await supabase
        .from("contests")
        .select(
          `
          *,
          contest_questions(id, platform, question_url),
          contest_participants(user_id)
        `
        )
        .eq("id", contestId)
        .eq("college_id", id)
        .single();

      if (contestError)
        throw new Error(`Contest fetch failed: ${contestError.message}`);
      if (!contestData) throw new Error("Contest not found.");

      const participants = contestData.contest_participants.map(
        (p) => p.user_id
      );
      contestData.participants = participants;

      if (participants.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select(
            "id, display_name, email, leetcode_username, geeksforgeeks_username"
          )
          .in("id", participants);

        if (usersError)
          throw new Error(
            `Failed to fetch participants: ${usersError.message}`
          );
        setParticipantDetails(usersData || []);
      } else {
        setParticipantDetails([]);
      }

      setContest(contestData);
    } catch (err) {
      console.error("Error in fetchContest:", err);
      setError(err.message || "Failed to load contest details.");
    } finally {
      setLoading(false);
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

  const handleJoinContest = async () => {
    if (!currentUser) {
      setError("Please log in to participate.");
      router.push("/login");
      return;
    }

    setActionInProgress(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("contest_participants")
        .select("user_id")
        .eq("contest_id", contestId)
        .eq("user_id", currentUser.uid)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
      if (existing) {
        setError("You are already participating.");
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

      if (insertError)
        throw new Error(`Failed to join: ${insertError.message}`);

      console.log("Joined contest successfully");
      setSuccessMessage("Successfully joined the contest!");
      await fetchContest(currentUser.uid);
    } catch (err) {
      console.error("Error in handleJoinContest:", err);
      setError(err.message || "Failed to join contest.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleEvaluateQuestion = (questionId) => {
    console.log(`Evaluate clicked for question ID: ${questionId}`);
    console.log(user);
    // Replace with API call later, e.g.:
    // fetch(`/api/evaluate-question/${questionId}`, { method: "POST" });
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error && !contest)
    return <div className="text-center p-6 text-red-600">{error}</div>;
  if (!contest)
    return <div className="text-center p-6">Contest not found.</div>;

  const isParticipant =
    Array.isArray(contest.participants) &&
    contest.participants.includes(currentUser?.uid);
  const isActive =
    new Date(contest.start_time) <= new Date() &&
    new Date() <= new Date(contest.end_time);
  const isUpcoming = new Date(contest.start_time) > new Date();
  const isEnded = new Date(contest.end_time) < new Date();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {contest.title}
        </h1>
        {error && (
          <p className="text-red-600 mb-4 bg-red-100 p-2 rounded">{error}</p>
        )}
        {successMessage && (
          <p className="text-green-600 mb-4 bg-green-100 p-2 rounded">
            {successMessage}
          </p>
        )}
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              {contest.description || "No description provided."}
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-semibold">Start:</span>{" "}
              {new Date(contest.start_time).toLocaleString()}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">End:</span>{" "}
              {new Date(contest.end_time).toLocaleString()}
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-semibold">Status:</span>{" "}
              {isUpcoming ? (
                <span className="text-yellow-600">Upcoming</span>
              ) : isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-red-600">Ended</span>
              )}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Questions
            </h2>
            {contest.contest_questions &&
            contest.contest_questions.length > 0 ? (
              <ul className="space-y-2">
                {contest.contest_questions.map((q) => (
                  <li key={q.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <a
                        href={q.question_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {q.platform.charAt(0).toUpperCase() +
                          q.platform.slice(1)}{" "}
                        Question
                      </a>
                    </div>
                    {isParticipant && isActive && (
                      <button
                        onClick={() => handleEvaluateQuestion(q.id)}
                        className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                      >
                        Evaluate
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No questions available.</p>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Participants ({contest.participants.length})
            </h2>
            {participantDetails.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {participantDetails.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <p className="font-medium text-gray-800">
                      {p.display_name || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {p.email || "No email provided"}
                    </p>
                    {p.leetcode_username && (
                      <p className="text-sm text-gray-600">
                        LeetCode: {p.leetcode_username}
                      </p>
                    )}
                    {p.geeksforgeeks_username && (
                      <p className="text-sm text-gray-600">
                        GeeksforGeeks: {p.geeksforgeeks_username}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">ID: {p.id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No participants yet.</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              isActive && !isParticipant ? (
                <button
                  onClick={handleJoinContest}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? "Joining..." : "Join Contest"}
                </button>
              ) : isParticipant ? (
                <p className="text-green-600 font-medium">
                  ✓ You are participating in this contest
                </p>
              ) : isUpcoming ? (
                <p className="text-yellow-600 font-medium">
                  Contest starts at{" "}
                  {new Date(contest.start_time).toLocaleTimeString()}
                </p>
              ) : (
                <p className="text-red-600 font-medium">Contest has ended</p>
              )
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Log in to Participate
              </button>
            )}
            <button
              onClick={() => router.push(`/colleges/${id}`)}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to College
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestDetailPage;
