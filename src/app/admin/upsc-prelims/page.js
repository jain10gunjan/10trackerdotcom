"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const QuestionEntryPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [inputMode, setInputMode] = useState("form");
  const [jsonInput, setJsonInput] = useState("");
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    topic: "",
    question: "",
    options_A: "",
    options_B: "",
    options_C: "",
    options_D: "",
    correct_option: "",
    difficulty: "Medium",
    solution: "",
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const postQuestions = async (payload) => {
    const res = await fetch("/api/admin/upsc-prelims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to add question(s)");
    }
    return data;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await postQuestions(formData);
      toast.success("Question added successfully!");
      setQuestions((prev) => [...prev, ...(data.questions || [formData])]);
      setFormData({
        topic: "",
        question: "",
        options_A: "",
        options_B: "",
        options_C: "",
        options_D: "",
        correct_option: "",
        difficulty: "Medium",
        solution: "",
      });
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error(error.message || "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJsonSubmit = async () => {
    setSubmitting(true);
    try {
      const parsedQuestions = JSON.parse(jsonInput);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("JSON must be an array of questions");
      }

      const data = await postQuestions(parsedQuestions);
      toast.success(`${data.count || parsedQuestions.length} questions added successfully!`);
      setQuestions((prev) => [...prev, ...(data.questions || parsedQuestions)]);
      setJsonInput("");
    } catch (error) {
      console.error("Error adding JSON questions:", error);
      toast.error("Failed to add questions: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-neutral-600">
        Checking admin access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-neutral-900">Admin access required</p>
        <p className="mt-2 text-sm text-neutral-600">
          You do not have permission to manage UPSC prelims questions.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Question Entry System</h1>
        </div>
      </nav>

      <div className="container mx-auto mt-6 p-6">
        <div className="rounded-xl bg-white p-8 shadow-2xl">
          <div className="mb-8 flex items-center justify-center">
            <button
              type="button"
              className={`rounded-l-full px-6 py-2 ${
                inputMode === "form"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setInputMode("form")}
            >
              Form Input
            </button>
            <button
              type="button"
              className={`rounded-r-full px-6 py-2 ${
                inputMode === "json"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setInputMode("json")}
            >
              JSON Input
            </button>
          </div>

          {inputMode === "form" ? (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Topic
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter topic"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Question
                </label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter question text"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {["A", "B", "C", "D"].map((option) => (
                  <div key={option}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Option {option}
                    </label>
                    <input
                      type="text"
                      name={`options_${option}`}
                      value={formData[`options_${option}`]}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter option ${option}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Correct Option
                </label>
                <select
                  name="correct_option"
                  value={formData.correct_option}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select correct option</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Solution
                </label>
                <textarea
                  name="solution"
                  value={formData.solution}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter solution/explanation"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-3 text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Adding…" : "Add Question"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  JSON Input (Array of Questions)
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full rounded-lg border p-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="10"
                  placeholder={`[
  {
    "topic": "History",
    "question": "Who was the first emperor of the Maurya Empire?",
    "options_A": "Ashoka",
    "options_B": "Chandragupta Maurya",
    "options_C": "Bindusara",
    "options_D": "Samudragupta",
    "correct_option": "B",
    "difficulty": "Medium",
    "solution": "Chandragupta Maurya founded the Maurya Empire..."
  }
]`}
                />
              </div>
              <button
                type="button"
                onClick={handleJsonSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 py-3 text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Adding…" : "Add JSON Questions"}
              </button>
            </div>
          )}

          {questions.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold">Added Questions</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">Topic</th>
                      <th className="p-3 text-left">Question</th>
                      <th className="p-3 text-left">Correct</th>
                      <th className="p-3 text-left">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{q.topic}</td>
                        <td className="p-3">
                          {(q.question || "").substring(0, 50)}...
                        </td>
                        <td className="p-3">{q.correct_option}</td>
                        <td className="p-3">{q.difficulty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionEntryPage;
