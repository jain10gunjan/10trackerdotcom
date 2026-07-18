import React from "react";

const TabContent = ({ topics, index, userData, url }) => {
  // Check if topics and userData are defined before accessing properties
  if (!topics || !userData) {
    return null; // Return null or handle the case of undefined props
  }

  // Proceed with rendering only if topics and userData are defined
  return (
    <div key={index} className="relative question-numbercontainer">
      <div className="py-2 flex border-b border-gray-200">
        <details className="group">
          <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
            <span>
              <a
                className={`text-slate-600`}
                href={`/${url}/practice/${topics.title}`}
              >
                {index + 1}: {topics.title}
              </a>
              <p className="text-xs">
                {userData[topics.title]?.completedQuestions
                  ? `${Math.round(
                      (userData[topics.title].completedQuestions.length /
                        userData[topics.title].totalquestion) *
                        100
                    )}% Module Completed`
                  : "0% Module Completed"}
              </p>
            </span>
            <span className="text-xs absolute bottom-0 right-0">
              {userData[topics.title]?.completedQuestions
                ? `${Math.round(userData[topics.title].points)} Points`
                : "0 Points"}
            </span>
          </summary>
        </details>
      </div>
    </div>
  );
};

export default TabContent;
