// app/auth-success/page.js
import Link from 'next/link';
import { Suspense } from 'react';
import AuthSuccessHandler from './AuthSuccessHandler';

export const dynamic = 'force-dynamic'; // Still needed to disable prerendering

export default function AuthSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Authentication Successful</h1>
        <Suspense fallback={<div>Loading authentication data...</div>}>
          <AuthSuccessHandler />
        </Suspense>
        <div className="mt-6">
          <Link href="/" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}