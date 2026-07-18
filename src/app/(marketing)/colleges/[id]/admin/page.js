"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from '@/lib/supabase/browser';
import { getAuth } from "firebase/auth";
import { app } from '@/lib/firebase';

const AdminDashboard = () => {
  const { id } = useParams();
  const router = useRouter();
  const auth = getAuth(app);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [contest, setContest] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    questions: [{ platform: "leetcode", url: "" }],
  });
  const [supabaseToken, setSupabaseToken] = useState(null);

  // Check admin status only when loading the page
  useEffect(() => {
    const checkAdminStatus = async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // Get the Firebase ID token for Supabase authentication
        const idToken = await user.getIdToken();
        setSupabaseToken(idToken);
        setCurrentUser(user);

        // Set authorization header for all future Supabase requests
        supabase.auth.setSession({
          access_token: idToken,
          refresh_token: "",
        });

        // Check if user is admin for this college
        const { data, error } = await supabase
          .from("college_users")
          .select("is_admin")
          .eq("college_id", id)
          .eq("user_id", user.uid)
          .single();

        if (error || !data?.is_admin) {
          console.error("Admin check error:", error || "User is not an admin");
          router.push(`/colleges/${id}`);
        }
      } catch (err) {
        console.error("Auth error:", err.message);
        router.push(`/colleges/${id}`);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(checkAdminStatus);
    return () => unsubscribe();
  }, [id, auth, router]);

  // Validate date inputs
  const dateValidation = useMemo(() => {
    const { startTime, endTime } = contest;
    if (!startTime || !endTime) return null;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return "Start time cannot be in the past";
    }

    if (end <= start) {
      return "End time must be after start time";
    }

    return null;
  }, [contest.startTime, contest.endTime]);

  const handleAddQuestion = useCallback(() => {
    setContest((prev) => ({
      ...prev,
      questions: [...prev.questions, { platform: "leetcode", url: "" }],
    }));
  }, []);

  const handleRemoveQuestion = useCallback(
    (indexToRemove) => {
      if (contest.questions.length <= 1) return;

      setContest((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, index) => index !== indexToRemove),
      }));
    },
    [contest.questions.length]
  );

  const handleQuestionChange = useCallback((index, field, value) => {
    setContest((prev) => {
      const updatedQuestions = prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      );
      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const validateForm = useCallback(() => {
    const { title, startTime, endTime, questions } = contest;

    if (!title.trim()) return "Title is required";
    if (!startTime) return "Start time is required";
    if (!endTime) return "End time is required";
    if (dateValidation) return dateValidation;

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].url.trim()) {
        return `Question ${i + 1} URL is required`;
      }

      try {
        new URL(questions[i].url);
      } catch (e) {
        return `Question ${i + 1} has an invalid URL`;
      }
    }

    return null;
  }, [contest, dateValidation]);

  const handleCreateContest = useCallback(
    async (e) => {
      e.preventDefault();

      // No need to check isAdmin here since we already checked on page load
      if (!currentUser) {
        return setError("You must be logged in to create contests");
      }

      const validationError = validateForm();
      if (validationError) {
        return setError(validationError);
      }

      setSubmitting(true);
      setError(null);

      try {
        const { title, description, startTime, endTime, questions } = contest;

        // Insert contest
        const { data: contestData, error: contestError } = await supabase
          .from("contests")
          .insert({
            college_id: id,
            title,
            description: description.trim() || null,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            created_by: currentUser.uid,
            active: true,
            participants: [], // Initialize empty array
          })
          .select()
          .single();

        if (contestError) {
          console.error("Contest creation error:", contestError);
          throw new Error(`Database error: ${contestError.message}`);
        }

        // Prepare and insert questions
        const questionInserts = questions.map((q) => ({
          contest_id: contestData.id,
          platform: q.platform,
          question_url: q.url.trim(),
        }));

        const { error: questionError } = await supabase
          .from("contest_questions")
          .insert(questionInserts);

        if (questionError) {
          console.error("Question insertion error:", questionError);
          await supabase.from("contests").delete().eq("id", contestData.id);
          throw new Error(`Failed to add questions: ${questionError.message}`);
        }

        // Reset form on success
        setContest({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          questions: [{ platform: "leetcode", url: "" }],
        });

        router.push(`/colleges/${id}?contest_created=true`);
      } catch (err) {
        console.error("Contest creation failed:", err);
        setError(`Failed to create contest: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    },
    [currentUser, id, router, validateForm, contest]
  );

  if (loading) return <div className="text-center p-6">Loading...</div>;

  // If we reach here, the user is an admin (due to the redirect in useEffect)
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Admin Dashboard - Create Contest
          </h1>
          <button
            onClick={() => router.push(`/colleges/${id}`)}
            className="text-blue-500 hover:underline"
          >
            Back to College
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateContest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={contest.title}
              onChange={(e) =>
                setContest({ ...contest, title: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={contest.description}
              onChange={(e) =>
                setContest({ ...contest, description: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
              rows="3"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={contest.startTime}
                onChange={(e) =>
                  setContest({ ...contest, startTime: e.target.value })
                }
                className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={contest.endTime}
                onChange={(e) =>
                  setContest({ ...contest, endTime: e.target.value })
                }
                className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {dateValidation && (
            <p className="text-yellow-600 text-sm">{dateValidation}</p>
          )}

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Questions *</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-blue-500 hover:bg-blue-50 px-2 py-1 rounded"
                disabled={submitting}
              >
                + Add Question
              </button>
            </div>

            {contest.questions.map((q, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <select
                  value={q.platform}
                  onChange={(e) =>
                    handleQuestionChange(index, "platform", e.target.value)
                  }
                  className="p-2 border rounded w-32"
                  disabled={submitting}
                >
                  <option value="leetcode">LeetCode</option>
                  <option value="gfg">GFG</option>
                  <option value="hackerrank">HackerRank</option>
                  <option value="codeforces">CodeForces</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="url"
                  value={q.url}
                  onChange={(e) =>
                    handleQuestionChange(index, "url", e.target.value)
                  }
                  placeholder="Question URL"
                  className="flex-1 p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                  required
                  disabled={submitting}
                />

                {contest.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(index)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                    disabled={submitting}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={submitting || !!dateValidation}
            >
              {submitting ? "Creating..." : "Create Contest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
