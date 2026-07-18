import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  data,
  activeSubject,
  setActiveSubject,
  calculateTotalQuestions,
  calculateOverallProgress,
}) => {
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg z-20 pt-8 pb-6 px-4 overflow-y-auto"
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-2xl text-gray-800">Subjects</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 mb-2">
                  Total Questions
                </h3>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2.8"
                    />
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2.8"
                      strokeDasharray="100"
                      strokeDashoffset={100 - calculateOverallProgress()}
                      initial={{ strokeDashoffset: 100 }}
                      animate={{
                        strokeDashoffset: 100 - calculateOverallProgress(),
                      }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">
                      {calculateTotalQuestions()}
                    </span>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {calculateOverallProgress()}% Completed
                </p>
              </div>
            </div>

            <ul className="space-y-1">
              {data.map((subject, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setActiveSubject(subject.subject);
                      window.innerWidth < 768 && setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeSubject === subject.subject
                        ? "bg-gray-100 text-gray-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {subject.subject.replace(/-/g, " ").toUpperCase() === "CAT"
                      ? "CAT Previous Year Questions"
                      : subject.subject.replace(/-/g, " ").toUpperCase()}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
