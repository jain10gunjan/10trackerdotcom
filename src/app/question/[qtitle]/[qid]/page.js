"use client";
import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import QuestionCard from "@/components/QuestionCard";
import Navbar from "@/components/Navbar";
import { ArrowLeft, X } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const ADMIN_EMAIL = "jain10gunjan@gmail.com";

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

// Skeleton Loader
const QuestionSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6 bg-white rounded-lg">
    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    <div className="h-24 bg-gray-200 rounded"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

 

const RelatedQuestionItem = ({ question, index } ) => (
  <a
    href={`/question/${question.question
      .replace(/<[^>]*>/g, '')
      .slice(0, 50)
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()}/${question._id}`}
    className="block bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors border border-gray-100"
  >
    <div className="flex items-center gap-3">
      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {question.topic?.replace(/-/g, " ") || "Untitled"}
        </p>
        <p
          className="text-xs text-gray-600 line-clamp-2"
          dangerouslySetInnerHTML={{
            __html:
              question.question?.split("<img")[0]?.substring(0, 100) +
                (question.question?.length > 100 ? "..." : "") || "",
          }}
        />
      </div>
      {question?.year && (
        <span className="text-xs text-gray-500">{question.year}</span>
      )}
    </div>
  </a>
);

const SingleQuestionPage = () => {
  const { category, qid } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mainQuestion, setMainQuestion] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // MathJax Configuration
  const config = useMemo(
    () => ({
      loader: { load: ["input/tex", "output/svg"] },
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        displayMath: [
          ["$$", "$$"],
          ["\\[", "\\]"],
        ],
      },
      svg: { fontCache: "global" },
      messageStyle: "none",
    }),
    []
  );

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    if (!qid) return;
    setIsLoading(true);
    try {
      const { data: mainData, error: mainError } = await supabase
        .from("examtracker")
        .select("*")
        .eq("_id", qid)
        .single();

      if (mainError) throw mainError;
      setMainQuestion(mainData);

      if (mainData?.topic) {
        const { data: relatedData, error: relatedError } = await supabase
          .from("examtracker")
          .select("_id, question, topic, year, category")
          .eq("topic", mainData.topic)
          .neq("_id", qid)
          .limit(4);

        if (relatedError) throw relatedError;
        setRelatedQuestions(relatedData || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load question");
    } finally {
      setIsLoading(false);
    }
  }, [qid]);

  // Fetch on Mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Not Found State
  if (!isLoading && !mainQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Question Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The question you are looking for might have been moved or deleted.
          </p>
          <button
            onClick={() => router.push(`/exam/${category}`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-36 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <MathJaxContext config={config}>
            <MathJax dynamic>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Question */}
                <main className="lg:col-span-2">
                  {isLoading ? (
                    <QuestionSkeleton />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h1 className="text-lg font-semibold text-gray-900">
                            {mainQuestion?.topic?.replace(/-/g, " ") || "Loading..."}
                          </h1>
                          {mainQuestion?.year && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {mainQuestion.year}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-6">
                        <Suspense fallback={<LoadingSpinner />}>
                          <QuestionCard
                            question={mainQuestion}
                            index={0}
                            onAnswer={(isCorrect) =>
                              console.log("Answered:", isCorrect)
                            }
                            isAdmin={user?.email === ADMIN_EMAIL}
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </main>

                {/* Related Questions */}
                <aside className="lg:col-span-1">
                  <div className="sticky top-20">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">
                      Related Questions
                    </h2>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse bg-gray-100 rounded-lg p-4"
                          >
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : relatedQuestions.length > 0 ? (
                      <div className="space-y-3">
                        {relatedQuestions.map((question, index) => (
                          <RelatedQuestionItem
                            key={question._id}
                            question={question}
                            index={index}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-gray-500 text-sm">
                        No related questions found
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </MathJax>
          </MathJaxContext>
        </div>
      </div>
</>
  );
};

export default SingleQuestionPage;

