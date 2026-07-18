'use client'

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Prevent static rendering of this page
export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a separate component that uses the searchParams hook
function AuthProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    async function processAuth() {
      try {
        const userParam = searchParams.get('user');
        const token = searchParams.get('token');
        
        if (userParam && token) {
          const userData = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('google_user', JSON.stringify(userData));
          localStorage.setItem('google_token', token);
          console.log('Authentication successful:', userData);
          
          // Save user data to Supabase
          await saveUserToSupabase(userData);
          
          const redirectPath = localStorage.getItem('auth_redirect') || '/';
          // Use window.location.href to force a full page reload when redirecting
          window.location.href = redirectPath;
          // router.push(redirectPath);
        } else {
          console.error('Missing authentication data');
          router.push('/');
        }
      } catch (error) {
        console.error('Error processing authentication:', error);
        router.push('/');
      }
    }
    
    processAuth();
  }, [router, searchParams]);
  
  // Function to save user data to Supabase
  async function saveUserToSupabase(userData) {
    try {
      // Extract necessary fields from userData
      const { email, name, id } = userData; // Assuming the Google auth provides these fields
      const timestamp = new Date().toISOString();
      
      // Insert or update user in Supabase
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: id,
            email: email,
            display_name: name || null,
            created_at: timestamp,
            leetcode_username: null,
            geeksforgeeks_username: null
          },
          { onConflict: 'id', ignoreDuplicates: false }
        );

      if (error) {
        console.error('Error saving user to Supabase:', error);
      } else {
        console.log('User saved to Supabase:', data);
      }
    } catch (err) {
      console.error('Failed to save user to Supabase:', err);
    }
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <p>Processing authentication...</p>
    </div>
  );
}

// Main component with Suspense boundary
export default function AuthHandler() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={
        <div className="p-4 bg-gray-100 rounded-md">
          <p>Loading authentication...</p>
        </div>
      }>
        <AuthProcessor />
      </Suspense>
    </div>
  );
}