'use client';

import { LogIn } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

const AuthModal = ({ isOpen, onClose, onGoogleSignIn, categoryName = "exam" }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleClose = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLoading) {
      setIsLoading(false);
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [isLoading, onClose]);

  // Fix: Close modal on successful sign-in (call onClose after Google sign-in)
  const handleGoogleSignIn = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isLoading) return;
    try {
      setIsLoading(true);
      if (typeof onGoogleSignIn === 'function') {
        await onGoogleSignIn();
        // Close modal after sign-in
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      setIsLoading(false);
    }
  };

  // Handle escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isOpen) return null;

  const Spinner = () => (
    <svg 
      className="animate-spin h-5 w-5 text-slate-600" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Fix: Update feature text to "free for a limited time" and make modal smaller, always scrollable
  const features = [
    {
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ),
      title: "Unlimited Free Practice",
      description: `Access unlimited ${categoryName} questions topic-wise for a limited time`,
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-100"
    },
    {
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Free Tracker (Limited Time)",
      description: "Track your progress and performance while the offer lasts",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    {
      icon: (
        <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      title: "Comprehensive Analytics",
      description: "Detailed insights and performance metrics",
      bgColor: "bg-slate-50",
      iconBg: "bg-slate-100"
    },
    {
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
      ),
      title: "No Hidden Costs",
      description: "Everything is free for a limited time",
      bgColor: "bg-amber-50",
      iconBg: "bg-amber-100"
    }
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 transition-all duration-300"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      {/* Modal Container */}
      <div
        className="bg-white w-full max-w-sm sm:max-w-sm md:max-w-md lg:max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Layout Container */}
        <div className="flex flex-col">
          {/* Left Side - Hero Section */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-6 py-8 flex flex-col justify-center items-center text-center min-h-[220px]">
            
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 group z-10"
              aria-label="Close modal"
              disabled={isLoading}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/20">
              <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white text-sm font-semibold">Free For Limited Time</span>
            </div>
            
            {/* Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg border border-white/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white sm:w-10 sm:h-10"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10,17 15,12 10,7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            
            {/* Title and Description */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to 10tracker.com</h2>
            <p className="text-slate-200 text-sm leading-relaxed max-w-xs px-2">
              Sign in to unlock unlimited free practice and track your progress.
            </p>
          </div>

          {/* Right Side - Features and Sign In */}
          <div className="flex flex-col h-full overflow-y-auto">
            
            {/* Features Section */}
            <div className="px-4 py-4 bg-gradient-to-br from-slate-50 to-slate-100/50 flex-1">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 mb-1">What you get for FREE (Limited Time)</h3>
                <p className="text-slate-600 text-xs">Unlimited access to premium features for a limited period</p>
              </div>
              
              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${feature.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm sm:text-base mb-1">{feature.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign In Section */}
            <div className="px-4 py-4 bg-white border-t border-slate-100">
              
              {/* Sign in with Google via NextAuth */}
              <button
                onClick={handleGoogleSignIn}
                className={`w-full py-4 px-6 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
                  isLoading 
                    ? 'bg-slate-100 cursor-not-allowed text-slate-500'
                    : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:from-slate-900 active:to-slate-900 hover:shadow-lg hover:shadow-slate-500/25 text-white'
                } font-semibold shadow-lg transform hover:scale-[1.02] active:scale-[0.98]`}
                disabled={isLoading || typeof onGoogleSignIn !== 'function'}
                type="button"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span className="font-medium">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn />
                    <span className="font-semibold text-sm sm:text-base">Continue to sign in</span>
                  </>
                )}
              </button>
              
              {/* Footer Info */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-slate-700">Free For Limited Time</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Quick and secure sign-in
                </p>
                <p className="text-slate-400 text-xs leading-relaxed px-2">
                  By continuing, you agree to our{' '}
                  <a href="https://10tracker.com/terms" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="https://10tracker.com/privacy" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;