"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { toast } from "react-hot-toast";
import debounce from "lodash.debounce"; // Debouncing updates

export default function LmsPlatform() {
  const [currentModule, setCurrentModule] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [score, setScore] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const [watchedProgress, setWatchedProgress] = useState({}); // Track progress by module ID
  const [videoDurations, setVideoDurations] = useState({}); // Track video durations by module ID
  const playerRef = useRef(null);

  const modules = [
    {
      id: "1",
      type: "video",
      title: "HTML and CSS Beginner",
      url: "https://www.youtube.com/watch?v=uX9OsJQ7FJY",
    },
    {
      id: "2",
      type: "video",
      title:
        "How to create and run HTML file | How to View/Download Source Code",
      url: "https://www.youtube.com/watch?v=3D7CdN9EoEI",
    },
    {
      id: "3",
      type: "video",
      title: "HTML Tutorial in Hindi [Part 3] - Basic Structure of an HTML",
      url: "https://www.youtube.com/watch?v=1cWMipIwokI",
    },
    {
      id: "4",
      type: "video",
      title:
        "What Is DOCTYPE Declaration In HTML?, Why DOCTYPE is used in HTML?",
      url: "https://www.youtube.com/watch?v=51VoZ5_0DSA",
    },
    {
      id: "5",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 5] - What is Tags, Elements, and Attributes in html?",
      url: "https://www.youtube.com/watch?v=xJmydRDONc0",
    },
    {
      id: "6",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 6] - What is Global Attributes in HTML?",
      url: "https://www.youtube.com/watch?v=AFGOlPqPxQ4",
    },
    {
      id: "7",
      type: "video",
      title: "HTML Tutorial in Hindi [Part 7] - Formatting Tags In HTML",
      url: "https://www.youtube.com/watch?v=Z3IIsjlw6jM",
    },
    {
      id: "8",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 8] - Links And Hyperlinks In HTML | Internal Links, External Links",
      url: "https://www.youtube.com/watch?v=F-Wo6WWAecw",
    },
    {
      id: "9",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 9] - Images in HTML | <img> tag | Different Attributes Of Image Tag",
      url: "https://www.youtube.com/watch?v=By3PzLeXw5A",
    },
    {
      id: "10",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 10] - How to Add Video and Audio in HTML | <audio> <video>",
      url: "https://www.youtube.com/watch?v=AZrPpDIOz8E",
    },
    {
      id: "11",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 11] - What Is Tables In HTML? How To Use Tables",
      url: "https://www.youtube.com/watch?v=jpyLfVJ4khg",
    },
    {
      id: "12",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 12] - What is Form in HTML? | Form Elements in HTML",
      url: "https://www.youtube.com/watch?v=QAhvnDbFO4s",
    },
    {
      id: "13",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 13] - Iframe in HTML | How To Embed Video In HTML Using iframe",
      url: "https://www.youtube.com/watch?v=YDY0I3O7Gy8",
    },
    {
      id: "14",
      type: "video",
      title:
        "HTML Tutorial in Hindi [Part 14] - HTML Head Tags | Head Section in HTML | <title> <meta>",
      url: "https://www.youtube.com/watch?v=DWPU2G1LpsY",
    },
    {
      id: "15",
      type: "video",
      title: "HTML Tutorial in Hindi [Part 15] - HTML Meta Tags Explained",
      url: "https://www.youtube.com/watch?v=l3vFpVTJW3Q",
    },

    {
      id: "16",
      type: "quiz",
      title: "HTML Quiz",
      questions: [
        {
          question: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "Hyperlinks and Text Markup Language",
            "Home Tool Markup Language",
          ],
          answer: 0,
        },
        {
          question: "Which HTML tag is used to define an unordered list?",
          options: ["<ul>", "<ol>", "<li>"],
          answer: 0,
        },
      ],
      passingScore: 2,
    },
    {
      id: "17",
      type: "video",
      title: "HTML5 Semantic Tags",
      url: "https://www.youtube.com/embed/Peq4GCPNC5c",
    },
  ];

  // Initialize saved progress from localStorage
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem("lmsProgress")) || {};
    setCurrentModule(savedProgress.currentModule || 0);
    setWatchedProgress(savedProgress.watchedProgress || {});
    setVideoDurations(savedProgress.videoDurations || {});
    setCompletedModules(savedProgress.completedModules || []);
    console.log("In Use-Effect");
  }, []);

  // Save progress to localStorage
  const saveProgress = debounce(() => {
    const progress = {
      currentModule,
      watchedProgress,
      videoDurations,
      completedModules,
    };
    localStorage.setItem("lmsProgress", JSON.stringify(progress));
    toast.success("Progress auto-saved!");
    console.log("In De-Bounce");
  }, 1000);

  const handleDuration = (duration) => {
    const updatedDurations = {
      ...videoDurations,
      [modules[currentModule].id]: duration,
    };
    setVideoDurations(updatedDurations);
  };

  const handleProgress = (state) => {
    if (modules[currentModule].type === "video") {
      const moduleId = modules[currentModule].id;
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
    const moduleQuiz = modules[currentModule].questions;
    if (index === moduleQuiz[quizStep].answer) {
      setScore(score + 1);
    }
    if (quizStep < moduleQuiz.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      if (score + 1 >= modules[currentModule].passingScore) {
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
        <div class="pt-8 px-4 mx-auto max-w-screen-xl lg:pt-12 lg:px-6 ">
          <div class="mx-auto max-w-screen-sm text-center mb-8 lg:mb-16">
            <h2 class="mb-4 text-4xl tracking-tight font-extrabold text-gray-900">
              Learn HTML with Tracker
            </h2>
            <p class="mb-4 max-w-2xl text-gray-500   md:mb-12 md:text-lg mb-3 lg:mb-5 lg:text-xl">
              Dont Wait - Just Go For It.
            </p>
          </div>
        </div>
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
                {modules[currentModule].title}
                {/* Progress Bar */}

                {/* {console.log(modules[currentModule].id)} */}
                <div className="ml-4 h-2 bg-gray-300 rounded m-4">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{
                      width: `${
                        watchedProgress[modules[currentModule].id] || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </h2>

              {modules[currentModule].type === "video" ? (
                <ReactPlayer
                  ref={playerRef}
                  url={modules[currentModule].url}
                  playing
                  controls
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                  width="100%"
                  height="360px"
                />
              ) : (
                modules[currentModule].questions[quizStep] && (
                  <div>
                    <p className="text-lg">
                      {modules[currentModule].questions[quizStep].question}
                    </p>
                    {modules[currentModule].questions[quizStep].options.map(
                      (option, idx) => (
                        <button
                          key={idx}
                          className="block w-full text-left p-2 mt-2 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() => handleAnswer(idx)}
                        >
                          {option}
                        </button>
                      )
                    )}
                  </div>
                )
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
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  className={`p-2 rounded cursor-pointer  items-center justify-between ${
                    index === currentModule ? "bg-blue-500 " : "bg-gray-200"
                  }`}
                  onClick={() => handleModuleSwitch(index)}
                >
                  <div>
                    {module.title}
                    {completedModules.includes(index) && (
                      <span className="ml-2 text-green-500 font-bold">
                        {watchedProgress[module.id]?.toFixed(1) || 0}%
                      </span>
                    )}
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
