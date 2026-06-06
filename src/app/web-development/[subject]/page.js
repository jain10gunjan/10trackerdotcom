"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import debounce from "lodash.debounce"; // Debouncing updates
import dynamic from "next/dynamic";
import { htmlCssLearning } from "@/app/data/videodata";
import { useParams } from "next/navigation";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
export default function WebDevlopement() {
  const { subject } = useParams();
  const [currentModule, setCurrentModule] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [score, setScore] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const [watchedProgress, setWatchedProgress] = useState({}); // Track progress by module ID
  const [videoDurations, setVideoDurations] = useState({}); // Track video durations by module ID
  const [modules, setModules] = useState([]); // Track video durations by module ID

  const playerRef = useRef(null);

  // Initialize saved progress from localStorage
  useEffect(() => {
    const savedProgress =
      JSON.parse(localStorage.getItem(`${subject}examtrackerlmsProgress`)) ||
      {};
    setCurrentModule(savedProgress.currentModule || 0);
    setWatchedProgress(savedProgress.watchedProgress || {});
    setVideoDurations(savedProgress.videoDurations || {});
    setCompletedModules(savedProgress.completedModules || []);
    console.log("In Use-Effect");
    setModules(htmlCssLearning[subject]);
  }, []);

  // Save progress to localStorage

  const saveProgress = debounce(() => {
    const progress = {
      currentModule,
      watchedProgress,
      videoDurations,
      completedModules,
    };

    toast.promise(
      new Promise((resolve, reject) => {
        try {
          // Simulate an async operation with a delay
          setTimeout(() => {
            localStorage.setItem(
              `${subject}examtrackerlmsProgress`,
              JSON.stringify(progress)
            );
            console.log("Progress saved!");
            resolve("Progress auto-saved!"); // Resolves successfully
          }, 1500); // Delay to ensure the "loading" toast appears
        } catch (error) {
          reject("Failed to save progress!"); // Rejects with an error
        }
      }),
      {
        loading: "Saving progress...", // Appears during the delay
        success: "Progress auto-saved!", // When resolved
        error: "Failed to save progress!", // When rejected
      },
      { duration: 3000 } // Toast stays visible for 3 seconds
    );

    console.log("In De-Bounce");
  }, 1000);

  const handleDuration = (duration) => {
    const updatedDurations = {
      ...videoDurations,
      [modules[currentModule]?.id]: duration,
    };
    setVideoDurations(updatedDurations);
  };

  const handleProgress = (state) => {
    if (modules[currentModule]?.type === "video") {
      const moduleId = modules[currentModule]?.id;
      const currentDuration = videoDurations[moduleId];

      if (currentDuration > 0) {
        const percentage = (state.playedSeconds / currentDuration) * 100;

        if (percentage > (watchedProgress[moduleId] || 0)) {
          const updatedProgress = {
            ...watchedProgress,
            [moduleId]: percentage,
          };
          setWatchedProgress(updatedProgress);

          // Mark module as completed if progress >= 95%
          if (percentage >= 95 && !completedModules.includes(currentModule)) {
            setCompletedModules([...completedModules, currentModule]);
            toast.success("Module completed!");
          }

          // Auto-save progress at significant checkpoints
          if (percentage % 10 === 0 || percentage >= 95) {
            saveProgress();
          }
        }
      }
    }
  };

  const handleModuleSwitch = (index) => {
    // Save current module progress before switching
    saveProgress();
    setCurrentModule(index);
  };

  const handleAnswer = (index) => {
    const moduleQuiz = modules[currentModule]?.questions;
    if (index === moduleQuiz[quizStep].answer) {
      setScore(score + 1);
    }
    if (quizStep < moduleQuiz.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      if (score + 1 >= modules[currentModule]?.passingScore) {
        toast.success(
          `Quiz passed! Your score: ${score + 1}/${moduleQuiz.length}`
        );
        setCompletedModules([...completedModules, currentModule]);
      } else {
        toast.error(
          `Quiz failed. Your score: ${score + 1}/${moduleQuiz.length}`
        );
      }
      setQuizStep(0);
      setScore(0);
    }
  };

  const handlePreviousModule = () => {
    if (currentModule > 0) {
      handleModuleSwitch(currentModule - 1);
    } else {
      toast.error("You are already at the first module.");
    }
  };

  const handleNextModule = () => {
    if (currentModule < modules.length - 1) {
      handleModuleSwitch(currentModule + 1);
    } else {
      toast.success("Congratulations! You have completed all modules.");
    }
  };

  const calculateOverallProgress = () => {
    const completed = completedModules.length;
    const total = modules.length;
    return Math.round((completed / total) * 100);
  };

  return (
    <>
      <section class="mt-12  py-2 antialiased  ">
        <section className="bg-white mt-24 ">
          <div className="py-4 px-4 mx-auto max-w-screen-xl text-center lg:py-4 lg:px-12">
            <a
              href="#"
              className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-gray-700 bg-gray-100 rounded-full "
              role="alert"
            >
              <span className="text-xs bg-primary-600 rounded-full   px-4 py-1.5 mr-3">
                Live
              </span>{" "}
              <span className="text-sm font-medium">[Beta Version]</span>
              <svg
                className="ml-2 w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark: ">
              Learn {subject.replace("-", " ").toUpperCase()}
            </h1>
            <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 ">
              Practice MCQs, track your progress, and master exams with ease.
              Our tracker helps you focus on strengths, improve weaknesses, and
              stay exam-ready!
            </p>
          </div>
        </section>
        <section class="m-8 flex items-center    ">
          <div class="w-full   px-4 mx-auto lg:px-12">
            <div class="relative overflow-hidden   rounded-b-lg shadow-md  ">
              <nav
                class="flex flex-row items-center justify-between p-4"
                aria-label="Table navigation"
              >
                <button
                  onClick={saveProgress}
                  type="button"
                  class="flex items-center justify-center px-4 py-2 text-sm font-medium   text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-100 bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                >
                  Save Progress
                </button>
                <p class="text-sm">
                  <span class="font-normal text-gray-500  ">
                    Total Progress:{" "}
                  </span>
                  <span class="font-semibold text-gray-900  ">
                    {calculateOverallProgress()} %
                  </span>
                </p>
              </nav>
            </div>
          </div>
        </section>
        <div class="mx-auto  max-w-screen-xl  text-gray-500    px-4">
          <div className="mt-2 flex flex-col lg:flex-row">
{/* Main Content */}
            <div className="flex-1 flex flex-col p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {modules[currentModule]?.title}
                {/* Progress Bar */}

                {/* {console.log(modules[currentModule]?.id)} */}
                <div className="ml-4 h-2 bg-gray-300 rounded m-4">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{
                      width: `${
                        watchedProgress[modules[currentModule]?.id] || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </h2>

              {modules[currentModule]?.type === "video" && (
                <ReactPlayer
                  ref={playerRef}
                  url={modules[currentModule]?.url}
                  playing
                  controls
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                  width="100%"
                  height="360px"
                />
              )}

              <div class="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                {currentModule > 0 && (
                  <button
                    onClick={handlePreviousModule}
                    class="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark: dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  >
                    <svg
                      class="mr-2 -ml-1 w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                    </svg>
                    Previous Module
                  </button>
                )}
                {currentModule < modules.length - 1 && (
                  <button
                    onClick={handleNextModule}
                    class="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark: dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  >
                    <svg
                      class="mr-2 -ml-1 w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                    </svg>
                    Next Module
                  </button>
                )}
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="w-full lg:w-1/3 p-4 space-y-4 overflow-auto lg:h-screen h-80">
              <h2 className="text-lg font-bold text-gray-800">
                Course Overview Tracker
              </h2>
              {modules?.map((module, index) => (
                <div
                  key={module.id}
                  className={`p-2 rounded cursor-pointer  items-center justify-between ${
                    index === currentModule ? "bg-blue-500 " : "bg-gray-200"
                  }`}
                  onClick={() => handleModuleSwitch(index)}
                >
                  <div>
                    {module.title}
                    {
                      <span className="ml-2 text-green-500 font-bold">
                        {watchedProgress[module?.id]?.toFixed(1) || 0}%
                      </span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
