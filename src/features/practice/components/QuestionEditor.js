"use client";
import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';

const QuestionEditor = ({ 
  question, 
  onSave, 
  onCancel, 
  availableSubjects = [], 
  availableTopics = [] 
}) => {
  const [editedQuestion, setEditedQuestion] = useState({ ...question });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when question changes
  useEffect(() => {
    setEditedQuestion({ ...question });
  }, [question]);

  const handleInputChange = (field, value) => {
    setEditedQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(editedQuestion);
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedQuestion({ ...question });
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Question</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {editedQuestion.question}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Question text cannot be edited. Use the database to modify question content.
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              value={editedQuestion.subject || ''}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <select
              value={editedQuestion.topic || ''}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Topic</option>
              {availableTopics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level *
            </label>
            <select
              value={editedQuestion.difficulty || ''}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Question ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question ID
            </label>
            <input
              type="text"
              value={editedQuestion._id || ''}
              disabled
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Question ID cannot be changed
            </p>
          </div>

          {/* Options Preview */}
          {editedQuestion.options_A && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionKey = `options_${option}`;
                  const optionValue = editedQuestion[optionKey];
                  if (!optionValue) return null;
                  
                  return (
                    <div key={option} className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {option}
                      </span>
                      <span className="text-sm text-gray-700 flex-1">
                        {optionValue}
                      </span>
                      {editedQuestion.correct_option === option && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isLoading || !editedQuestion.subject || !editedQuestion.topic || !editedQuestion.difficulty}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
