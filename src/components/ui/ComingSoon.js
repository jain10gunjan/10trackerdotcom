'use client'
import { useState } from 'react';
import { Bell, Instagram } from 'lucide-react';
import Navbar from './Navbar';

export default function ComingSoon() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you! We'll notify you at ${email} when we launch.`);
    setEmail('');
  };

  return (
    <>
    <Navbar/>
    <div className="mt-32 min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 mb-6">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Coming Soon
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Ace Your Exams with ExamTracker
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-lg">
              Unlock organized MCQs, past papers, and a smart progress tracker designed for competitive exam success.
            </p>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Join the Waitlist</h3>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full sm:w-auto flex-1 px-6 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button 
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors duration-200"
                >
                  Get Notified
                </button>
              </form>
              <p className="text-sm text-gray-500 mt-4">We respect your privacy. No spam, ever.</p>
            </div>
            <div className="flex items-center mt-8">
              <a 
                href="https://instagram.com/placementtracker" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <Instagram className="w-6 h-6 mr-2" />
                <span className="text-lg">@placementtracker</span>
              </a>
            </div>
             
          </div>
          <div className="w-full lg:w-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl opacity-70 transform -rotate-2"></div>
              <img 
                src="https://examtracker.in/wp-content/uploads/2025/04/12.png" 
                alt="ExamTracker Dashboard Preview" 
                className="relative rounded-2xl shadow-xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}