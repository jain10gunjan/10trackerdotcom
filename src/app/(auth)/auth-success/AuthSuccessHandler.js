// components/AuthSuccessHandler.js
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthSuccessHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const userParam = searchParams.get('user');

  useEffect(() => {
    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('Access Token:', token);
        console.log('User Data:', userData);
        localStorage.setItem('googleAccessToken', token);
        localStorage.setItem('googleUserData', JSON.stringify(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [token, userParam]);

  return (
    <>
      {token ? (
        <div className="space-y-4">
          <div className="bg-green-100 text-green-700 p-4 rounded-md">
            <p className="font-medium">You&apos;ve successfully authenticated with Google!</p>
            <p className="text-sm mt-1">Check the console for your user data and token.</p>
          </div>
          <div className="text-sm text-gray-600">
            <p>Your access token and user info have been logged to the console and stored in localStorage.</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-md">
          <p>Waiting for authentication data...</p>
        </div>
      )}
    </>
  );
}