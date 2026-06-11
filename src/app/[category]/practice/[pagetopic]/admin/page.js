"use client";

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import debounce from "lodash/debounce";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import toast from "react-hot-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Brain,
  Star,
  Clock,
  Grid3X3,
  RotateCcw,
  Play,
  Pause,
  BookOpen,
  Edit2,
  Save,
  X
} from "lucide-react";

// Lazy loaded components - minimal loading states
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Sidebar = dynamic(() => import("@/components/Sidebar"), { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"), { ssr: false });

// Supabase singleton
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Constants
const ADMIN_EMAIL = "jain10gunjan@gmail.com";
const API_ENDPOINT = "/api/allsubtopics?category=GATE-CSE";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

// Optimized MathJax config
const mathJaxConfig = {
  "fast-preview": { disabled: false },
  tex: { 
    inlineMath: [["$", "$"], ["\\(", "\\)"]], 
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true
  },
  messageStyle: "none",
  showMathMenu: false,
  skipStartupTypeset: true
};

// Question Grid Component - Optimized
const QuestionGrid = memo(({ questions, currentIndex, progress, onQuestionSelect, isOpen, onClose }) => {
  const getQuestionStatus = useCallback((question, index) => {
    const isCompleted = progress.completedquestions.includes(question._id);
    const isCorrect = progress.correctanswers.includes(question._id);
    const isCurrent = index === currentIndex;
    
    if (isCurrent) return 'current';
    if (isCompleted && isCorrect) return 'correct';
    if (isCompleted && !isCorrect) return 'incorrect';
    return 'unanswered';
  }, [progress, currentIndex]);

  const statusStyles = useMemo(() => ({
    current: 'bg-blue-600 text-white ring-2 ring-blue-300',
    correct: 'bg-green-100 text-green-800 border-green-300',
    incorrect: 'bg-red-100 text-red-800 border-red-300',
    unanswered: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
  }), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Question Navigator</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <XCircle size={24} />
            </button>
          </div>
          <p className="text-blue-100 mt-1">Jump to any question</p>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-8 gap-3">
            {questions.map((question, index) => {
              const status = getQuestionStatus(question, index);
              return (
                <button
                  key={question._id}
                  onClick={() => { onQuestionSelect(index); onClose(); }}
                  className={`aspect-square rounded-xl border-2 font-bold text-sm transition-all ${statusStyles[status]}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-3">Legend</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-600"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

QuestionGrid.displayName = 'QuestionGrid';

// Edit Question Modal - New Component
const EditQuestionModal = memo(({ isOpen, onClose, question, onSave }) => {
  const [editedQuestion, setEditedQuestion] = useState({ ...question });

  const handleChange = useCallback((field, value) => {
    setEditedQuestion(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("examtracker")
        .update(editedQuestion)
        .eq("_id", question._id);

      if (error) throw error;
      toast.success("Question updated successfully!");
      onSave();
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update question.");
    }
  }, [editedQuestion, question._id, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Edit Question</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea
              value={editedQuestion.question}
              onChange={(e) => handleChange("question", e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-y"
            />
          </div>

          {["A", "B", "C", "D"].map((opt) => (
            <div key={opt}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Option {opt}</label>
              <textarea
                value={editedQuestion[`options_${opt}`]}
                onChange={(e) => handleChange(`options_${opt}`, e.target.value)}
                className="w-full h-20 p-3 border border-gray-300 rounded-xl resize-y"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
            <select
              value={editedQuestion.correct_option}
              onChange={(e) => handleChange("correct_option", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solution Text</label>
            <textarea
              value={editedQuestion.solutiontext || editedQuestion.solution}
              onChange={(e) => handleChange("solutiontext", e.target.value)} // Assuming solutiontext is primary
              className="w-full h-40 p-3 border border-gray-300 rounded-xl resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={editedQuestion.difficulty}
                onChange={(e) => handleChange("difficulty", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={editedQuestion.year || ""}
                onChange={(e) => handleChange("year", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          {/* Add more fields if needed based on schema */}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

EditQuestionModal.displayName = 'EditQuestionModal';

// Single Question Display - Highly Optimized
const QuestionDisplay = memo(({ question, index, total, userAnswer, isSubmitted, onAnswer, user, onQuestionUpdate }) => {
  const [selectedOption, setSelectedOption] = useState(userAnswer || null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Reset selection when question changes
  useEffect(() => {
    setSelectedOption(userAnswer || null);
  }, [question._id, userAnswer]);

  const handleOptionSelect = useCallback((option) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  }, [isSubmitted]);

  const handleSubmit = useCallback(() => {
    if (!selectedOption || isSubmitted) return;
    const isCorrect = selectedOption === question.correct_option;
    onAnswer(selectedOption, isCorrect);
  }, [selectedOption, isSubmitted, question.correct_option, onAnswer]);

  // Memoize options to prevent re-computation
  const options = useMemo(() => [
    { key: 'A', value: question.options_A },
    { key: 'B', value: question.options_B },
    { key: 'C', value: question.options_C },
    { key: 'D', value: question.options_D }
  ].filter(option => option.value), [question]);

  const getOptionStyle = useCallback((optionKey) => {
    const baseStyle = "w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 relative";
    
    if (!isSubmitted) {
      return selectedOption === optionKey
        ? `${baseStyle} border-blue-500 bg-blue-50 text-blue-700 shadow-md`
        : `${baseStyle} border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50`;
    }

    if (optionKey === question.correct_option) {
      return `${baseStyle} border-green-500 bg-green-50 text-green-700 shadow-md`;
    }
    
    if (selectedOption === optionKey && optionKey !== question.correct_option) {
      return `${baseStyle} border-red-500 bg-red-50 text-red-700 shadow-md`;
    }
    
    return `${baseStyle} border-gray-200 bg-gray-50 text-gray-500`;
  }, [isSubmitted, selectedOption, question.correct_option]);

  const getOptionIcon = useCallback((optionKey) => {
    if (!isSubmitted) return null;

    if (optionKey === question.correct_option) {
      return <CheckCircle2 size={20} className="text-green-600" />;
    }
    
    if (selectedOption === optionKey && optionKey !== question.correct_option) {
      return <XCircle size={20} className="text-red-600" />;
    }
    
    return null;
  }, [isSubmitted, selectedOption, question.correct_option]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-lg overflow-hidden">
        {/* Question Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-white font-bold">Question {index + 1} of {total}</span>
              </div>
              <div className="bg-blue-600 rounded-full px-3 py-1">
                <span className="text-white text-sm font-medium capitalize">{question.difficulty}</span>
              </div>
            </div>
            
            {isSubmitted && (
              <div className={`rounded-full p-2 ${
                userAnswer === question.correct_option
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {userAnswer === question.correct_option ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <XCircle size={20} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Question Text */}
          <div className="mb-8">
            <MathJax>
              <div className="text-lg leading-relaxed text-gray-800"
                   dangerouslySetInnerHTML={{ __html: question.question }} />
            </MathJax>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-8">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => handleOptionSelect(option.key)}
                disabled={isSubmitted}
                className={getOptionStyle(option.key)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      selectedOption === option.key ? 'border-current' : 'border-gray-300'
                    }`}>
                      {option.key}
                    </div>
                    <div className="flex-1 text-left">
                      <MathJax>
                        <div dangerouslySetInnerHTML={{ __html: option.value }} />
                      </MathJax>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getOptionIcon(option.key)}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button - Only show when not submitted */}
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                selectedOption
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          )}

          {/* Correct Answer Display */}
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/60"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-800 mb-2">Correct Answer</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                      {question.correct_option}
                    </span>
                    <span className="text-blue-700 font-medium">
                      {options.find(opt => opt.key === question.correct_option)?.value ? (
                        <MathJax>
                          <div dangerouslySetInnerHTML={{ 
                            __html: options.find(opt => opt.key === question.correct_option)?.value 
                          }} />
                        </MathJax>
                      ) : (
                        `Option ${question.correct_option}`
                      )}
                    </span>
                  </div>
                  
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedOption === question.correct_option 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedOption === question.correct_option ? (
                      <>
                        <CheckCircle2 size={16} />
                        Correct! Well done!
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Incorrect. You selected option {selectedOption}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Solution */}
          {isSubmitted && (question.solutiontext || question.solution) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/60"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-slate-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Detailed Solution</h4>
              </div>
              
              <div className="ml-11">
                <MathJax>
                  <div className="text-slate-700 leading-relaxed prose prose-sm max-w-none"
                       dangerouslySetInnerHTML={{ __html: question.solutiontext || question.solution }} />
                </MathJax>
              </div>

              <div className="mt-4 ml-11 p-3 bg-white/60 rounded-xl border border-slate-200/40">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600">
                      <strong>Difficulty:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty?.toUpperCase()}
                      </span>
                    </span>
                    {question.year && (
                      <span className="text-slate-600">
                        <strong>Year:</strong> {question.year}
                      </span>
                    )}
                  </div>
                  
                  {selectedOption === question.correct_option && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Star size={14} className="fill-current" />
                      <span className="text-xs font-semibold">+100 Points</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Edit Button for Admin */}
          {isSubmitted && isAdmin && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="mt-6 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Edit2 size={20} />
              Edit Question
            </button>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <EditQuestionModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            question={question}
            onSave={onQuestionUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
});

QuestionDisplay.displayName = 'QuestionDisplay';

// Stats Card Component - Optimized
const StatCard = memo(({ icon: Icon, label, value, color = "slate" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-4 rounded-xl border border-${color}-200/50`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-${color}-600 text-sm font-medium`}>{label}</p>
        <p className={`text-${color}-900 text-xl font-bold`}>{value}</p>
      </div>
      <Icon className={`text-${color}-500`} size={20} />
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

// Main Component - Ultra Optimized
const PremiumTestInterface = () => {
  const { category, pagetopic } = useParams();
  const { user, setShowAuthModal } = useAuth();

  // Core state - minimal and efficient
  const [data, setData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(new Map()); // More efficient than object
  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());
  const [questionCounts, setQuestionCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [activeDifficulty, setActiveDifficulty] = useState("easy");
  const [progress, setProgress] = useState({ completedquestions: [], correctanswers: [], points: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDifficultyLoading, setIsDifficultyLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  // Timer functionality
  useEffect(() => {
    if (testMode && questions.length > 0) {
      timerRef.current = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [testMode, questions.length]);

  // Optimized format time function
  const formatTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Optimized fetch functions with better caching and error handling
  const fetchSubjectsData = useCallback(async () => {
    try {
      const cacheKey = `subjects-${category}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedData = JSON.parse(cached);
        setData(parsedData);
        setActiveSubject(parsedData[0]?.subject);
        return;
      }

      const response = await fetch(API_ENDPOINT, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      if (!response.ok) throw new Error("Failed to fetch subjects");

      const { subjectsData } = await response.json();
      setData(subjectsData);
      setActiveSubject(subjectsData[0]?.subject);
      sessionStorage.setItem(cacheKey, JSON.stringify(subjectsData));
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setData([]);
    }
  }, [category]);

  const fetchQuestionCounts = useCallback(async () => {
    if (!pagetopic || !category) return;
    
    try {
      const countPromises = ['easy', 'medium', 'hard'].map(async (difficulty) => {
        const { count } = await supabase
          .from("examtracker")
          .select("*", { count: 'exact', head: true })
          .eq("topic", pagetopic)
          .eq("category", category.toUpperCase())
          .eq("difficulty", difficulty);
        return [difficulty, count || 0];
      });
      
      const counts = Object.fromEntries(await Promise.all(countPromises));
      setQuestionCounts(counts);
    } catch (error) {
      console.error("Error fetching question counts:", error);
    }
  }, [pagetopic, category]);

  const fetchQuestionsByDifficulty = useCallback(async (difficulty) => {
    if (!pagetopic || !category) return;
    
    setIsDifficultyLoading(true);
    
    try {
      const { data: questionsData, error } = await supabase
        .from("examtracker")
        .select("*")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty)
        .order('_id');
      
      if (error) throw error;
      
      setQuestions(questionsData || []);
      setCurrentIndex(0);
      setUserAnswers(new Map());
      setSubmittedQuestions(new Set());
      setTimeSpent(0);
    } catch (error) {
      console.error("Fetch questions error:", error);
      setQuestions([]);
    } finally {
      setIsDifficultyLoading(false);
    }
  }, [pagetopic, category]);

  const fetchUserProgress = useCallback(async (userId) => {
    if (!userId || !pagetopic || !category) return;
    
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("completedquestions, correctanswers, points")
        .eq("user_id", userId)
        .eq("topic", pagetopic)
        .eq("area", category)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      const progressData = data || { completedquestions: [], correctanswers: [], points: 0 };
      setProgress(progressData);
      
      // Load existing answers efficiently
      const answerMap = new Map();
      const submitted = new Set(progressData.completedquestions);
      setSubmittedQuestions(submitted);
      setUserAnswers(answerMap);
      
    } catch (error) {
      console.error("Progress fetch error:", error);
    }
  }, [pagetopic, category]);

  // Ultra-optimized debounced progress update
  const debouncedUpdateProgress = useCallback(
    debounce(async (updatedProgress) => {
      if (!user) return;
      try {
        const { error } = await upsertUserProgress(supabase, {
          user_id: user.id,
          email: user?.emailAddresses[0]?.emailAddress,
          topic: pagetopic,
          completedquestions: updatedProgress.completedquestions,
          correctanswers: updatedProgress.correctanswers,
          points: updatedProgress.points,
          area: category,
        });
        if (error) throw error;
      } catch (error) {
        console.error("Progress update error:", error);
      }
    }, 500),
    [user, pagetopic, category]
  );

  // Navigation functions - optimized
  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }, [questions.length]);

  const goToNextQuestion = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  }, [questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Answer handling - no auto-advance
  const handleAnswer = useCallback((selectedOption, isCorrect) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setUserAnswers(prev => new Map(prev).set(currentQuestion._id, selectedOption));
    setSubmittedQuestions(prev => new Set([...prev, currentQuestion._id]));

    const updatedCompleted = [...new Set([...progress.completedquestions, currentQuestion._id])];
    const updatedCorrect = isCorrect
      ? [...new Set([...progress.correctanswers, currentQuestion._id])]
      : progress.correctanswers.filter((id) => id !== currentQuestion._id);
    const points = isCorrect ? progress.points + 100 : progress.points;

    const updatedProgress = { 
      completedquestions: updatedCompleted, 
      correctanswers: updatedCorrect, 
      points 
    };
    
    setProgress(updatedProgress);
    debouncedUpdateProgress(updatedProgress);

    // Show feedback toast - no auto-advance
    toast.success(isCorrect ? '🎉 Correct!' : '❌ Try again', { duration: 2000 });
  }, [user, questions, currentIndex, progress, debouncedUpdateProgress, setShowAuthModal]);

  const handleQuestionUpdate = useCallback(() => {
    // Refetch questions after update
    fetchQuestionsByDifficulty(activeDifficulty);
  }, [fetchQuestionsByDifficulty, activeDifficulty]);

  const handleDifficultyChange = useCallback((difficulty) => {
    if (difficulty === activeDifficulty || isDifficultyLoading) return;
    setActiveDifficulty(difficulty);
    fetchQuestionsByDifficulty(difficulty);
  }, [activeDifficulty, isDifficultyLoading, fetchQuestionsByDifficulty]);

  // Keyboard navigation - optimized
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      switch(event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousQuestion();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextQuestion();
          break;
        case 'Escape':
          setIsGridOpen(false);
          break;
        case 'g':
          event.preventDefault();
          setIsGridOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPreviousQuestion, goToNextQuestion]);

  // Initial data loading - optimized
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSubjectsData(), fetchQuestionCounts()]);
      await fetchQuestionsByDifficulty(activeDifficulty);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchSubjectsData, fetchQuestionCounts, fetchQuestionsByDifficulty, activeDifficulty]);

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    } else {
      setProgress({ completedquestions: [], correctanswers: [], points: 0 });
      setUserAnswers(new Map());
      setSubmittedQuestions(new Set());
    }
  }, [user, fetchUserProgress]);

  // Memoized calculations - ultra optimized
  const stats = useMemo(() => {
    const completed = questions.filter(q => submittedQuestions.has(q._id)).length;
    const correct = questions.filter(q => 
      submittedQuestions.has(q._id) && progress.correctanswers.includes(q._id)
    ).length;
    const completionPercentage = questions.length ? Math.round((completed / questions.length) * 100) : 0;
    const accuracy = completed ? Math.round((correct / completed) * 100) : 0;
    
    return { completed, correct, completionPercentage, accuracy, total: questions.length };
  }, [questions, submittedQuestions, progress.correctanswers]);

  const currentQuestion = questions[currentIndex];

  // Loading state - minimal UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Loading Questions...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <MetaDataJobs
        seoTitle={`${pagetopic?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} Practice Test`}
        seoDescription={`Practice ${pagetopic?.replace(/-/g, " ")} questions in premium test format.`}
      />
      
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
      />

      {/* Question Grid Modal */}
      <AnimatePresence>
        {isGridOpen && (
          <QuestionGrid
            questions={questions}
            currentIndex={currentIndex}
            progress={progress}
            onQuestionSelect={goToQuestion}
            isOpen={isGridOpen}
            onClose={() => setIsGridOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 lg:hidden" 
               onClick={() => setIsSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-20 pb-12">
        {/* Test Header - Optimized */}
        <div className="bg-white border border-slate-200/60 rounded-3xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {pagetopic?.replace(/-/g, " ").toUpperCase()}
                </h1>
                <p className="text-blue-100">Premium Practice Test</p>
              </div>
              
              <div className="flex items-center gap-4">
                {testMode && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <div className="text-white font-mono text-lg font-bold">
                      <Clock size={18} className="inline mr-2" />
                      {formatTime(timeSpent)}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setTestMode(!testMode)}
                  className={`p-3 rounded-2xl transition-all ${
                    testMode 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {testMode ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Progress and Controls */}
            <div className="flex items-center justify-between mb-6 flex-col lg:flex-row gap-4 lg:gap-0">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">Progress:</span>
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500">{stats.completed}/{stats.total}</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-end">
                {/* Difficulty Selector */}
                <div className="flex gap-2">
                  {["easy", "medium", "hard"].map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => handleDifficultyChange(difficulty)}
                      disabled={isDifficultyLoading}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        activeDifficulty === difficulty
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <span className="capitalize">{difficulty}</span>
                      <span className="ml-1 opacity-75">({questionCounts[difficulty]})</span>
                    </button>
                  ))}
                </div>

                {/* Question Grid Toggle */}
                <button
                  onClick={() => setIsGridOpen(true)}
                  className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  title="Question Grid (Press G)"
                >
                  <Grid3X3 size={18} />
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Target} label="Completed" value={stats.completed} color="blue" />
              <StatCard icon={CheckCircle2} label="Correct" value={stats.correct} color="green" />
              <StatCard icon={Brain} label="Accuracy" value={`${stats.accuracy}%`} color="purple" />
              <StatCard icon={Star} label="Points" value={progress.points} color="yellow" />
            </div>

            {/* Auth Prompt */}
            {!user && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between flex-col lg:flex-row gap-4 lg:gap-0">
                <div>
                  <p className="font-semibold text-amber-800">Sign in to save progress</p>
                  <p className="text-sm text-amber-600">Your answers won&apos;t be saved without an account</p>
                </div>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Question Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Display */}
          <div className="lg:col-span-3">
            <MathJaxContext config={mathJaxConfig}>
              <MathJax>
                <AnimatePresence mode="wait">
                  {isDifficultyLoading ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-lg">
                      <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Loading Questions...</h3>
                    </div>
                  ) : currentQuestion ? (
                    <motion.div
                      key={currentQuestion._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <QuestionDisplay
                        question={currentQuestion}
                        index={currentIndex}
                        total={questions.length}
                        userAnswer={userAnswers.get(currentQuestion._id)}
                        isSubmitted={submittedQuestions.has(currentQuestion._id)}
                        onAnswer={handleAnswer}
                        user={user}
                        onQuestionUpdate={handleQuestionUpdate}
                      />
                    </motion.div>
                  ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-lg">
                      <Clock size={48} className="mx-auto text-slate-400 mb-4" />
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No questions available</h3>
                      <p className="text-slate-500">No questions found for {activeDifficulty} difficulty.</p>
                    </div>
                  )}
                </AnimatePresence>
              </MathJax>
            </MathJaxContext>

            {/* Navigation Controls */}
            {currentQuestion && (
              <div className="mt-8 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between flex-col lg:flex-row gap-4 lg:gap-0">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={currentIndex === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                      currentIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>

                  <div className="flex items-center gap-4 flex-wrap justify-center">
                    {/* Quick navigation dots */}
                    <div className="flex items-center gap-2">
                      {questions.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, idx) => {
                        const actualIndex = Math.max(0, currentIndex - 2) + idx;
                        const question = questions[actualIndex];
                        if (!question) return null;

                        const isCompleted = submittedQuestions.has(question._id);
                        const isCorrect = progress.correctanswers.includes(question._id);
                        const isCurrent = actualIndex === currentIndex;

                        return (
                          <button
                            key={question._id}
                            onClick={() => goToQuestion(actualIndex)}
                            className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                              isCurrent
                                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                : isCompleted && isCorrect
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : isCompleted
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {actualIndex + 1}
                          </button>
                        );
                      })}
                    </div>

                    <span className="text-sm text-slate-500 font-medium">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <button
                    onClick={goToNextQuestion}
                    disabled={currentIndex === questions.length - 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${
                      currentIndex === questions.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-6">
            {/* Performance Stats */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Trophy size={20} className="mr-2 text-yellow-500" />
                Performance
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Questions Done</span>
                  <span className="font-bold text-slate-800">{stats.completed}/{stats.total}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Accuracy</span>
                  <span className="font-bold text-slate-800">{stats.accuracy}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Points Earned</span>
                  <span className="font-bold text-slate-800">{progress.points}</span>
                </div>

                {testMode && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Time Spent</span>
                    <span className="font-bold text-slate-800 font-mono">{formatTime(timeSpent)}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 mb-1">
                    {stats.completionPercentage}%
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Complete</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsGridOpen(true)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <Grid3X3 size={18} className="text-slate-600" />
                  <span className="font-medium text-slate-700">Question Grid</span>
                </button>
                
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setUserAnswers(new Map());
                    setSubmittedQuestions(new Set());
                    setTimeSpent(0);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <RotateCcw size={18} className="text-slate-600" />
                  <span className="font-medium text-slate-700">Restart Test</span>
                </button>
                
                <button
                  onClick={() => setTestMode(!testMode)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    testMode 
                      ? 'bg-green-50 hover:bg-green-100' 
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  {testMode ? (
                    <>
                      <Pause size={18} className="text-green-600" />
                      <span className="font-medium text-green-700">Exit Test Mode</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} className="text-blue-600" />
                      <span className="font-medium text-blue-700">Start Test Mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Achievement */}
            {stats.completionPercentage === 100 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-3xl p-6 shadow-lg">
                <div className="text-center">
                  <Trophy className="mx-auto text-yellow-600 mb-3" size={40} />
                  <h3 className="font-bold text-yellow-800 text-lg mb-2">Congratulations!</h3>
                  <p className="text-yellow-700 text-sm mb-4">
                    You&apos;ve completed all questions!
                  </p>
                  <div className="bg-yellow-100 rounded-xl p-3">
                    <div className="text-yellow-800 font-bold text-lg">{stats.accuracy}% Accuracy</div>
                    <div className="text-yellow-600 text-sm">{stats.correct}/{stats.total} Correct</div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      
      {/* Toast Notifications */}
</div>
  );
};

export default memo(PremiumTestInterface);