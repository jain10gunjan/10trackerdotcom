// components/ProgressBar.jsx
import React from "react";

const ProgressBar = ({ percentage, points }) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-100 mb-2">
        <span>Progress: {percentage}%</span>
        <span>Points: {points}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
