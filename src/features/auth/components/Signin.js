// components/Signin.js
'use client'

import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Signin = () => {
  const { user, signOut, setShowAuthModal } = useAuth();

  return (
    <div className="flex items-center space-x-3">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold text-white">
            {user.displayName ? user.displayName[0].toUpperCase() : user?.emailAddresses[0]?.emailAddress ? user?.emailAddresses[0]?.emailAddress[0].toUpperCase() : ""}
          </div>
          <button
            onClick={signOut}
            className="text-sm bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAuthModal(true)}
          className="bg-white text-gray-600 px-4 py-2 rounded-full font-medium hover:bg-gray-100 border border-gray-300 transition-colors"
        >
          Sign In
        </button>
      )}
    </div>
  );
};