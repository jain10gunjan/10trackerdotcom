// pages/practice/[category]/[topics].js (or app/practice/[category]/[topics]/page.js)
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { MathJax, MathJaxContext } from "better-react-mathjax";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "your_supabase_url";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your_supabase_key";
const supabase = createClient(supabaseUrl, supabaseKey);

const PracticeSession = () => {
  const { category, topics } = useParams(); // Extract category and topics from URL
  const searchParams = useSearchParams(); // Extract query params
  const totalQuestions = parseInt(searchParams.get("total")) || 10;
  const difficulty = searchParams.get("difficulty") || "all";

  // Decode topics from URL (split by "_")
  const selectedTopics = topics ? topics.split("_") : [];

  const [state, setState] = useState({
    questionsQueue: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    userAnswer: "",
    showSolution: false,
    isLoading: true,
    error: null,
  });

  // MathJax configuration
  const config = {
    "fast-preview": { disabled: true },
    tex2jax: {
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"],
      ],
    },
    messageStyle: "none",
  };

  useEffect(() => {
    console.log("Initializing MathJax Config...");

    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        processEscapes: true,
      },
      svg: { fontCache: "global" },
    };
  }, [state.currentQuestion]);

  // Fetch questions efficiently
  const fetchQuestions = async () => {
    if (selectedTopics.length === 0) {
      setState((prev) => ({
        ...prev,
        error: "No topics selected",
        isLoading: false,
      }));
      return;
    }

    try {
      let query = supabase
        .from("examtracker")
        .select(
          "_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty"
        )
        .eq("category", category.toUpperCase())
        .in("topic", selectedTopics);

      if (difficulty !== "all") {
        query = query.eq("difficulty", difficulty);
      }

      // Fetch in batches for scalability (e.g., limit to totalQuestions)
      const { data, error } = await query.limit(totalQuestions);

      if (error) throw error;

      if (!data?.length) {
        throw new Error(
          "No questions available for selected topics and filters"
        );
      }

      const shuffledQuestions = [...data].sort(() => Math.random() - 0.5);
      setState((prev) => ({
        ...prev,
        questionsQueue: shuffledQuestions,
        currentQuestion: shuffledQuestions[0] || null,
        isLoading: false,
      }));
      toast.success(`Loaded ${shuffledQuestions.length} questions!`);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setState((prev) => ({ ...prev, error: err.message, isLoading: false }));
      toast.error("Failed to fetch questions");
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [category, topics, totalQuestions, difficulty]);

  const handleAnswerSelect = (selectedAnswer) => {
    if (!state.currentQuestion) return;

    const isCorrect = selectedAnswer === state.currentQuestion.correct_option;
    setState((prev) => ({
      ...prev,
      userAnswer: selectedAnswer,
      showSolution: true,
    }));
    toast[isCorrect ? "success" : "error"](
      isCorrect ? "Correct!" : "Incorrect"
    );
  };

  const handleNextQuestion = () => {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < state.questionsQueue.length) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        currentQuestion: prev.questionsQueue[nextIndex] || null,
        userAnswer: "",
        showSolution: false,
      }));
    } else {
      toast.info("You've completed all questions!");
    }
  };

  if (state.isLoading) {
    return <div>Loading questions...</div>;
  }

  if (state.error) {
    return <div>Error: {state.error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
{state.currentQuestion ? (
        <MathJaxContext config={config}>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <div className="text-lg font-medium text-gray-800 mb-6">
              <MathJax hideUntilTypeset={"first"} inline dynamic>
                <div
                  dangerouslySetInnerHTML={{
                    __html: state.currentQuestion.question,
                  }}
                />
              </MathJax>
            </div>

            <MathJax hideUntilTypeset={"first"} inline dynamic>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {["A", "B", "C", "D"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-start p-4 border rounded-md cursor-pointer transition duration-200 ${
                      state.showSolution
                        ? option === state.currentQuestion.correct_option
                          ? "border-green-500 bg-green-50"
                          : state.userAnswer === option
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200"
                        : state.userAnswer === option
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={state.userAnswer === option}
                      onChange={() => handleAnswerSelect(option)}
                      disabled={state.showSolution}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <div
                      className="ml-3 text-gray-700 flex-1"
                      dangerouslySetInnerHTML={{
                        __html: `${option}: ${
                          state.currentQuestion[`options_${option}`]
                        }`,
                      }}
                    />
                  </label>
                ))}
              </div>
            </MathJax>

            {state.showSolution && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Solution:
                </p>
                <MathJax hideUntilTypeset={"first"} inline dynamic>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: state.currentQuestion.solution,
                    }}
                  />
                </MathJax>
              </div>
            )}

            {state.showSolution && (
              <button
                onClick={handleNextQuestion}
                disabled={
                  state.currentQuestionIndex >= state.questionsQueue.length - 1
                }
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Next Question
              </button>
            )}
          </div>
        </MathJaxContext>
      ) : (
        <div className="text-center">No more questions available.</div>
      )}
    </div>
  );
};

export default PracticeSession;
