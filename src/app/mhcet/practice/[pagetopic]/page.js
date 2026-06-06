"use client";
import React, { useState, useEffect, useCallback } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams } from "next/navigation";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { createClient } from "@supabase/supabase-js";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import toast from "react-hot-toast";
import debounce from "lodash/debounce";
import ProgressBar from "../../../../components/ProgressBar";
import QuestionCard from "../../../../components/QuestionCard";
import AuthModal from "../../../../components/AuthModal";
import Navbar from "../../../../components/Navbar";
import Sidebar from "../../../../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyHHobmWFRWb_ZnKhs3JXSCKdbTQaNHW8",
  authDomain: "examtracker-6731e.firebaseapp.com",
  projectId: "examtracker-6731e",
  storageBucket: "examtracker-6731e.firebasestorage.app",
  messagingSenderId: "492165379080",
  appId: "1:492165379080:web:6c71aa16d2447f81348dbd",
  measurementId: "G-Z5B4SRV9H7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    fetch: (...args) => fetch(...args),
  }
);

const ADMIN_EMAIL = "jain10gunjan@gmail.com";

const Pagetracker = () => {
  const config = {
    "fast-preview": {
      disabled: true,
    },
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
  const { pagetopic } = useParams();
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState({});
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeDifficulty, setActiveDifficulty] = useState("easy");
  const [progress, setProgress] = useState({
    completedquestions: [],
    correctanswers: [],
    points: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);

  useEffect(() => {
    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        processEscapes: true,
      },
      svg: {
        fontCache: "global",
      },
    };
  }, []);

  const debouncedFetchUserProgress = useCallback(
    debounce(async (uid) => {
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("completedquestions, correctanswers, points")
          .eq("user_id", uid)
          .eq("topic", pagetopic)
          .eq("area", "mhcet")
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;
        setProgress(
          data || { completedquestions: [], correctanswers: [], points: 0 }
        );
      } catch (error) {
        console.error("Progress fetch error:", error);
        toast.error("Failed to load progress");
      }
    }, 300),
    [pagetopic]
  );

  const apiEndpoint = "/api/mhcet/allsubtopics";
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

  // Fetch subjects data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch data");
        const responseData = await response.json();
        setData(responseData.subjectsData);
        if (responseData.subjectsData.length > 0) {
          setActiveSubject(responseData.subjectsData[0].subject);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Authentication handling
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        debouncedFetchUserProgress(currentUser.uid);
      }
    });
    return () => {
      unsubscribe();
      debouncedFetchUserProgress.cancel();
    };
  }, [pagetopic, debouncedFetchUserProgress]);

  // Fetch questions
  useEffect(() => {
    if (!pagetopic) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: questionsData, error: questionsError } = await supabase
          .from("mhcetquestions")
          .select("*")
          .eq("topic", pagetopic);

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
      } catch (error) {
        toast.error("Failed to load questions");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pagetopic]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setShowAuthModal(false);
      toast.success("Successfully signed in!");
      debouncedFetchUserProgress(result.user.uid);
    } catch (error) {
      toast.error("Authentication failed");
      console.error(error);
    }
  };

  const debouncedUpdateProgress = useCallback(
    debounce(async (updatedProgress) => {
      if (!user) return;

      try {
        const { data, error } = await upsertUserProgress(
          supabase,
          {
            user_id: user.uid,
            topic: pagetopic,
            completedquestions: updatedProgress.completedquestions,
            correctanswers: updatedProgress.correctanswers,
            points: updatedProgress.points,
            area: "mhcet",
          },
          { select: "*" }
        );

        if (error) throw error;
        console.log("Progress updated:", data);
      } catch (error) {
        console.error("Progress update error:", error);
        toast.error(`Failed to update progress: ${error.message}`);
      }
    }, 500),
    [user, pagetopic]
  );

  const updateProgress = (questionId, isCorrect) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const updatedCompleted = [
      ...new Set([...progress.completedquestions, questionId]),
    ];
    const updatedCorrect = isCorrect
      ? [...new Set([...progress.correctanswers, questionId])]
      : progress.correctanswers;
    const points = progress.points + (isCorrect ? 100 : 0);

    const updatedProgress = {
      completedquestions: updatedCompleted,
      correctanswers: updatedCorrect,
      points,
    };

    setProgress(updatedProgress);
    toast.success(isCorrect ? "Correct! +100 points" : "Marked as completed");
    debouncedUpdateProgress(updatedProgress);
  };

  const reportQuestion = async (questionId, reason) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { error } = await supabase.from("reported_questions").insert({
        question_id: questionId,
        topic: pagetopic,
        user_id: user.email,
        reason: reason,
        reported_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Question reported successfully");
    } catch (error) {
      toast.error(`Failed to report question: ${error.message}`);
      console.error("Report error:", error);
    }
  };

  const saveEditedQuestion = async (questionId, updatedData) => {
    if (user?.email !== ADMIN_EMAIL) return;

    try {
      const { error } = await supabase
        .from("mhcetquestions")
        .update(updatedData)
        .eq("id", questionId);

      if (error) throw error;
      setQuestions(
        questions.map((q) =>
          q.id === questionId ? { ...q, ...updatedData } : q
        )
      );
      setEditingQuestionId(null);
      toast.success("Question updated successfully");
    } catch (error) {
      toast.error("Failed to update question");
      console.error("Update error:", error);
    }
  };

  const startEditingQuestion = (questionId) => {
    if (user?.email === ADMIN_EMAIL) {
      setEditingQuestionId(questionId);
    }
  };

  const calculateTotalQuestions = () => {
    return data.reduce(
      (acc, subject) =>
        acc + subject.subtopics.reduce((sum, topic) => sum + topic.count, 0),
      0
    );
  };

  const calculateOverallProgress = () => {
    const totalQuestions = calculateTotalQuestions();
    const totalCompleted = Object.values(userData).reduce(
      (acc, topic) => acc + (topic.completedQuestions?.length || 0),
      0
    );
    return totalQuestions
      ? Math.round((totalCompleted / totalQuestions) * 100)
      : 0;
  };

  const filteredQuestions = questions.filter(
    (q) => q.difficulty === activeDifficulty
  );
  const completionPercentage = questions.length
    ? Math.round((progress.completedquestions.length / questions.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        user={user}
        setShowAuthModal={setShowAuthModal}
      />

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        data={data}
        activeSubject={activeSubject}
        setActiveSubject={setActiveSubject}
        calculateTotalQuestions={calculateTotalQuestions}
        calculateOverallProgress={calculateOverallProgress}
      />

      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 p-6 md:p-10 pt-20 mt-16">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <header className="p-6 bg-gradient-to-r from-gray-800 to-gray-600 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {pagetopic?.replace(/-/g, " ").toUpperCase()}
              </h1>
            </div>
            <ProgressBar
              percentage={completionPercentage}
              points={progress.points}
            />
          </header>

          <main className="p-6">
            <div className="flex flex-wrap gap-3 mb-8">
              {["easy", "medium", "hard"].map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setActiveDifficulty(difficulty)}
                  className={`px-5 py-2 rounded-full capitalize font-medium transition-all ${
                    activeDifficulty === difficulty
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {difficulty} (
                  {questions.filter((q) => q.difficulty === difficulty).length})
                </button>
              ))}
            </div>

            <MathJaxContext config={config}>
              <MathJax>
                <div className="space-y-6">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        onAnswer={(isCorrect) =>
                          updateProgress(question.id, isCorrect)
                        }
                        isCompleted={progress.completedquestions.includes(
                          question.id
                        )}
                        onReport={reportQuestion}
                        onEdit={
                          user?.email === ADMIN_EMAIL
                            ? saveEditedQuestion
                            : null
                        }
                        isEditing={editingQuestionId === question.id}
                        onStartEditing={() => startEditingQuestion(question.id)}
                        isAdmin={user?.email === ADMIN_EMAIL}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500 text-lg">
                        No questions available for {activeDifficulty} level yet.
                      </p>
                    </div>
                  )}
                </div>
              </MathJax>
            </MathJaxContext>
          </main>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onGoogleSignIn={handleGoogleSignIn}
        />
</div>
    </>
  );
};

export default Pagetracker;
