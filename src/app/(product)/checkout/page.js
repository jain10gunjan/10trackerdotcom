'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import  Navbar  from '@/components/layout/Navbar';
import RazorpayButton from '@/features/billing/components/RazorpayButton';

export default function CheckoutPage() {
  const { user, googleSignIn, logOut } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: 'unlimited_practice',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hardcoded GATE CSE plan data
  const planData = useMemo(
    () => ({
      plan: 'unlimited_practice',
      amount: 99900, // ₹999 in paise
      description: 'GATE CSE Unlimited Practice Plan',
    }),
    []
  );

  // Update formData with user info from Google OAuth
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateInputs = useCallback(() => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!nameRegex.test(formData.name)) {
      setError('Please enter a valid name (2-50 characters, letters only)');
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Component */}
      <Navbar user={user} googleSignIn={googleSignIn} logOut={logOut} />

      {/* Checkout Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Progress Steps */}
          <ol className="flex items-center w-full max-w-2xl mx-auto text-center text-sm font-medium text-gray-500 sm:text-base mb-12">
            <li className="flex items-center text-indigo-600 after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:mx-6 sm:after:inline-block">
              <span className="flex items-center after:content-['/'] after:mx-2 after:text-gray-200 sm:after:hidden">
                <svg className="w-4 h-4 me-2 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Cart
              </span>
            </li>
            <li className="flex items-center text-indigo-600 after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:mx-6 sm:after:inline-block">
              <span className="flex items-center after:content-['/'] after:mx-2 after:text-gray-200 sm:after:hidden">
                <svg className="w-4 h-4 me-2 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Checkout
              </span>
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 me-2 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Order summary
            </li>
          </ol>

          <div className="lg:flex lg:items-start lg:gap-12 xl:gap-16">
            {/* Form Section */}
            <div className="flex-1 space-y-8">
              <div className="space-y-6 bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-gray-900">Checkout - GATE CSE Practice</h2>
                <p className="text-gray-600 text-base leading-relaxed">
                  Unlock the GATE CSE Unlimited Practice Plan for ₹999 and gain access to a comprehensive suite of resources designed to boost your preparation. Practice with topic-wise MCQs, chapter-wise tests, and year-wise mock exams, all tailored to the GATE Computer Science syllabus. Our platform offers unlimited attempts, detailed solutions, and performance analytics to help you excel in the GATE exam.
                </p>

                {!user ? (
                  <div className="space-y-4">
                    <p className="text-gray-500 text-sm">Please sign in to proceed with your purchase.</p>
                    <button
                      onClick={googleSignIn}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.564,9.505-11.622H12.545z"/>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                ) : (
                  <>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email address
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                          placeholder="Email address"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={loading}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                          Plan
                        </label>
                        <select
                          id="plan"
                          name="plan"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                          value={formData.plan}
                          onChange={handleInputChange}
                          disabled={loading}
                        >
                          <option value="unlimited_practice">Unlimited Practice (₹999)</option>
                        </select>
                      </div>
                    </div>
                    <RazorpayButton
                      name={formData.name}
                      email={formData.email}
                      plan={formData.plan}
                      amount={planData.amount}
                      buttonText="Pay Now with Razorpay"
                      buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md w-full transition"
                      onSuccess={() => {
                        alert('Payment successful! Redirecting to your transactions.');
                        router.push('/my-transactions');
                      }}
                      onError={(err) => {
                        setError(err.message);
                      }}
                      razorpayOptions={{
                        theme: { color: '#4F46E5' },
                        description: planData.description,
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 w-full lg:max-w-xs xl:max-w-md space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
                <div className="divide-y divide-gray-200">
                  <dl className="flex justify-between py-3">
                    <dt className="text-gray-500">Plan</dt>
                    <dd className="text-gray-900">Unlimited Practice</dd>
                  </dl>
                  <dl className="flex justify-between py-3">
                    <dt className="text-gray-500">Price</dt>
                    <dd className="text-gray-900">₹999</dd>
                  </dl>
                  <dl className="flex justify-between py-3">
                    <dt className="font-bold text-gray-900">Total</dt>
                    <dd className="font-bold text-gray-900">₹999</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </div>
  );
}