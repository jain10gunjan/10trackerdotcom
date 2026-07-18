// pages/admin/reported-questions.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { MathJax, MathJaxContext } from "better-react-mathjax";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    fetch: (...args) => fetch(...args),
  }
);

const ADMIN_EMAIL = "jain10gunjan@gmail.com";

const ReportedQuestions = () => {
  const [reportedQuestions, setReportedQuestions] = useState([]);
  const { user, loading } = useAuth();
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Get user email from Clerk user object
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.email;

  useEffect(() => {
    if (!loading && userEmail === ADMIN_EMAIL) {
      fetchReportedQuestions();
    }
  }, [userEmail, loading]);

  const fetchReportedQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("reported_questions")
        .select(
          `
          *,
          examtracker (
            _id,
            question,
            options_A,
            options_B,
            options_C,
            options_D,
            correct_option,
            solution,
            difficulty,
            topic
          )
        `
        )
        .order("reported_at", { ascending: false });

      if (error) throw error;
      setReportedQuestions(data);
    } catch (error) {
      toast.error("Failed to load reported questions");
      console.error(error);
    }
  };

  const saveEditedQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const { error } = await supabase.from("examtracker").upsert({
        _id: editingQuestion._id, // Include the ID to update existing row
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

      setReportedQuestions(
        reportedQuestions.map((report) =>
          report?.examtracker?._id === editingQuestion._id
            ? {
                ...report,
                examtracker: { ...report.examtracker, ...editingQuestion },
              }
            : report
        )
      );
      setEditingQuestion(null);
      toast.success("Question updated successfully");
    } catch (error) {
      toast.error("Failed to update question");
      console.error("Update error:", error);
    }
  };

  const handleEditClick = (report) => {
    setEditingQuestion({ ...report.examtracker });
  };

  const closeEditModal = () => {
    setEditingQuestion(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-xl shadow-lg text-gray-600 font-semibold text-lg">
          Loading...
        </div>
      </div>
    );
  }

  if (!user || userEmail !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-xl shadow-lg text-red-600 font-semibold text-lg">
          Access Denied. Admin Only.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-10 text-gray-900">
          Reported Questions
        </h1>
        <MathJaxContext>
          {reportedQuestions.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Topic
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Reported By
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Reported At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Link
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportedQuestions.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          <MathJax>{report?.examtracker?.question}</MathJax>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {report.topic}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report?.examtracker?.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : report?.examtracker?.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {report?.examtracker?.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600">
                          {report?.reason}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {report?.user_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(report?.reported_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <a href={`/question/${report?.examtracker?._id}`}>
                            Link
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleEditClick(report)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg text-gray-600 text-lg">
              No reported questions found.
            </div>
          )}

          {/* Edit Question Modal */}
          {editingQuestion && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                  Edit Question
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <textarea
                      value={editingQuestion.question}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          question: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option {opt}
                      </label>
                      <textarea
                        value={editingQuestion[`options_${opt}`]}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            [`options_${opt}`]: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Option
                    </label>
                    <select
                      value={editingQuestion.correct_option}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          correct_option: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Solution
                    </label>
                    <textarea
                      value={editingQuestion.solution}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          solution: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={editingQuestion.difficulty}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          difficulty: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={closeEditModal}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedQuestion}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </MathJaxContext>
      </div>
</div>
  );
};

export default ReportedQuestions;
