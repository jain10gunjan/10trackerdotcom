"use client";
import React, { useState, useMemo } from 'react';
import { X, GripVertical, Edit3, Trash2 } from 'lucide-react';

const SelectedQuestions = ({ 
  selectedQuestions, 
  onQuestionRemove, 
  onQuestionReorder,
  onQuestionEdit,
  maxQuestions = 65 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Memoized question distribution for better performance
  const questionDistribution = useMemo(() => {
    const distribution = {};
    selectedQuestions.forEach(q => {
      const subject = q.subject || 'Unknown';
      distribution[subject] = (distribution[subject] || 0) + 1;
    });
    return distribution;
  }, [selectedQuestions]);

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onQuestionReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (selectedQuestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Selected</h3>
        <p className="text-gray-500">Click &quot;Add Questions&quot; to start building your test</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Distribution Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(questionDistribution).map(([subject, count]) => (
            <div key={subject} className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700">{subject}</div>
              <div className="text-2xl font-bold text-blue-600">{count}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Questions</span>
            <span className="text-lg font-bold text-gray-900">
              {selectedQuestions.length} / {maxQuestions}
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedQuestions.length / maxQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Selected Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Selected Questions</h3>
          <p className="text-sm text-gray-600">
            Drag and drop to reorder questions. Click edit to modify question details.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {selectedQuestions.map((question, index) => (
            <div
              key={`${question._id}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Drag Handle */}
                <div className="flex-shrink-0 mt-1">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                </div>

                {/* Question Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {question.subject}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {question.topic}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {question.question}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">ID:</span> {question._id}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => onQuestionEdit(question, index)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Question"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onQuestionRemove(question, index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Question"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedQuestions.length} questions selected
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onQuestionReorder(0, selectedQuestions.length - 1)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Shuffle Questions
              </button>
              
              <button
                onClick={() => onQuestionReorder(0, 0)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedQuestions;
