"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useParams } from "next/navigation";

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// MathJax config
const MATHJAX_CONFIG = {
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

const PracticeUnlimited = () => {
  const { category } = useParams();

  const [state, setState] = useState({
    topics: [],
    selectedTopics: [],
    currentQuestion: null,
    userAnswer: "",
    showSolution: false,
    points: 0,
    timeSpent: 0,
    answeredQuestionIds: [],
    practiceStarted: false,
  });

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data, error } = await supabase
          .from(category)
          .select("topic")
          .order("topic", { ascending: true });

        if (error) throw error;
        const uniqueTopics = [...new Set(data.map((item) => item.topic))];
        setState((prev) => ({ ...prev, topics: uniqueTopics }));
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("Failed to load topics");
      }
    };
    fetchTopics();
  }, []);

  // Timer for time spent on current question
  useEffect(() => {
    let timer;
    if (state.practiceStarted && !state.showSolution) {
      timer = setInterval(() => {
        setState((prev) => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.practiceStarted, state.showSolution]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTopicChange = (topic) => {
    setState((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter((t) => t !== topic)
        : [...prev.selectedTopics, topic],
    }));
  };

  const fetchNextQuestion = useCallback(async () => {
    if (state.selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("upscprelims")
        .select("*")
        .in("topic", state.selectedTopics)
        .limit(1);

      if (error) throw error;

      if (data.length === 0) {
        toast.error("No questions available for selected topics");
        return;
      }

      const question = data[0];
      if (state.answeredQuestionIds.includes(question.id)) {
        // If question was already answered, fetch another
        fetchNextQuestion();
      } else {
        setState((prev) => ({
          ...prev,
          currentQuestion: question,
          userAnswer: "",
          showSolution: false,
          timeSpent: 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      toast.error("Failed to fetch question");
    }
  }, [state.selectedTopics, state.answeredQuestionIds]);

  const startPractice = async () => {
    if (state.selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }
    await fetchNextQuestion();
    setState((prev) => ({ ...prev, practiceStarted: true, points: 0 }));
    toast.success("Practice session started!");
  };

  const handleAnswerSelect = (selectedAnswer) => {
    const isCorrect = selectedAnswer === state.currentQuestion.correct_option;
    setState((prev) => ({
      ...prev,
      userAnswer: selectedAnswer,
      showSolution: true,
      points: isCorrect ? prev.points + 100 : prev.points,
      answeredQuestionIds: isCorrect
        ? [...prev.answeredQuestionIds, prev.currentQuestion.id]
        : prev.answeredQuestionIds,
    }));
    toast[isCorrect ? "success" : "error"](
      isCorrect ? "Correct!" : "Incorrect"
    );
  };

  const handleNextQuestion = () => {
    fetchNextQuestion();
  };

  const resetPractice = () => {
    setState((prev) => ({
      ...prev,
      practiceStarted: false,
      currentQuestion: null,
      userAnswer: "",
      showSolution: false,
      points: 0,
      timeSpent: 0,
      answeredQuestionIds: [],
    }));
  };

  if (!state.practiceStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              UPSC Prelims Practice Unlimited
            </h1>
          </div>
        </nav>
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <BookOpen className="h-6 w-6 mr-2 text-indigo-600" />
              Start Your Practice Session
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Topics
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {state.topics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={state.selectedTopics.includes(topic)}
                      onChange={() => handleTopicChange(topic)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={startPractice}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
            >
              <BookOpen className="h-5 w-5 mr-2" /> Start Practice
            </button>
          </div>
        </div>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            UPSC Prelims Practice Unlimited
          </h1>
          <div className="flex items-center text-gray-700">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-mono">{formatTime(state.timeSpent)}</span>
          </div>
        </div>
      </nav>
      <div className="container mx-auto p-6">
        {state.currentQuestion && (
          <MathJaxContext config={MATHJAX_CONFIG}>
            <MathJax>
              <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Topic: {state.currentQuestion.topic}</p>
                    <p>Difficulty: {state.currentQuestion.difficulty}</p>
                    <p>Points: {state.points}</p>
                  </div>
                </div>
                <p
                  className="text-lg font-medium text-gray-800 mb-6"
                  dangerouslySetInnerHTML={{
                    __html: state.currentQuestion.question,
                  }}
                />
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {["A", "B", "C", "D"].map((option) => (
                    <label
                      key={option}
                      className={`flex items-center p-4 border rounded-md cursor-pointer transition duration-200 ${
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
                      <span
                        className="ml-3 text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: `${option}: ${
                            state.currentQuestion[`options_${option}`]
                          }`,
                        }}
                      />
                      {state.showSolution &&
                        (option === state.currentQuestion.correct_option ? (
                          <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                        ) : (
                          state.userAnswer === option && (
                            <XCircle className="ml-2 h-5 w-5 text-red-500" />
                          )
                        ))}
                    </label>
                  ))}
                </div>
                {state.showSolution && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Solution:
                    </p>
                    <p
                      className="text-gray-600 italic"
                      dangerouslySetInnerHTML={{
                        __html: state.currentQuestion.solution,
                      }}
                    />
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center"
                  >
                    Next <ChevronRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
              </div>
            </MathJax>
          </MathJaxContext>
        )}
        <button
          onClick={resetPractice}
          className="mt-6 mx-auto block bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
        >
          End Practice Session
        </button>
      </div>
</div>
  );
};

export default PracticeUnlimited;
