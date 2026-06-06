"use client";
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const QuestionEntryPage = () => {
  const [inputMode, setInputMode] = useState("form"); // "form" or "json"
  const [jsonInput, setJsonInput] = useState("");
  const [questions, setQuestions] = useState([]);

  // Form states
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

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit single question from form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("upscprelims").insert([formData]);

      if (error) throw error;

      toast.success("Question added successfully!");
      setQuestions([...questions, formData]);
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
      toast.error("Failed to add question");
    }
  };

  // Submit JSON questions
  const handleJsonSubmit = async () => {
    try {
      const parsedQuestions = JSON.parse(jsonInput);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("JSON must be an array of questions");
      }

      const { error } = await supabase
        .from("upscprelims")
        .insert(parsedQuestions);

      if (error) throw error;

      toast.success(`${parsedQuestions.length} questions added successfully!`);
      setQuestions([...questions, ...parsedQuestions]);
      setJsonInput("");
    } catch (error) {
      console.error("Error adding JSON questions:", error);
      toast.error("Failed to add questions: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Question Entry System</h1>
        </div>
      </nav>

      <div className="container mx-auto p-6 mt-6">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Toggle Switch */}
          <div className="flex items-center justify-center mb-8">
            <button
              className={`px-6 py-2 rounded-l-full ${
                inputMode === "form"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setInputMode("form")}
            >
              Form Input
            </button>
            <button
              className={`px-6 py-2 rounded-r-full ${
                inputMode === "json"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setInputMode("json")}
            >
              JSON Input
            </button>
          </div>

          {/* Input Section */}
          {inputMode === "form" ? (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleFormChange}
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter topic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleFormChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleFormChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Enter question text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["A", "B", "C", "D"].map((option) => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option {option}
                    </label>
                    <input
                      type="text"
                      name={`options_${option}`}
                      value={formData[`options_${option}`]}
                      onChange={handleFormChange}
                      required
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder={`Enter option ${option}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Option
                </label>
                <select
                  name="correct_option"
                  value={formData.correct_option}
                  onChange={handleFormChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select correct option</option>
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
                  name="solution"
                  value={formData.solution}
                  onChange={handleFormChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Enter solution/explanation"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Add Question
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JSON Input (Array of Questions)
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
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
                onClick={handleJsonSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Add JSON Questions
              </button>
            </div>
          )}

          {/* Questions Table */}
          {questions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Added Questions</h2>
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
                          {q.question.substring(0, 50)}...
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
