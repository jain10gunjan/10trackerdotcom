'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (outside component to avoid reinitialization)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const RazorpayButton = ({
  name,
  email,
  plan,
  amount,
  currency = 'INR',
  buttonText = 'Proceed to Payment',
  buttonClassName = 'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50',
  onSuccess = () => {},
  onError = () => {},
  setError = () => {}, // Added to receive setError from parent
  razorpayOptions = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setLocalError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setLocalError(null);
    setError(null); // Clear parent error state

    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
      const errorMessage = 'Razorpay SDK not loaded. Please try again later.';
      setLocalError(errorMessage);
      setError(errorMessage);
      onError(new Error(errorMessage));
      setLoading(false);
      return;
    }

    try {
      // Create Razorpay order
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          email,
          name,
          amount,
          currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const { orderId, amount: orderAmount, currency: orderCurrency } = await response.json();

      if (!orderId) {
        throw new Error('Failed to create Razorpay order');
      }

      if (orderCurrency !== currency) {
        throw new Error('Currency mismatch between order and configuration');
      }

      // Save order to Supabase
      const { error: supabaseError } = await supabase.from('orders').insert([
        {
          user_email: email,
          plan,
          status: 'pending',
          amount, // Store as number (INTEGER in schema)
          razorpay_order_id: orderId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: orderCurrency,
        name: `${plan} PYQs`,
        description: `${plan} Plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email,
              }),
            });

            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              // Update order status to completed
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'completed',
                  razorpay_payment_id: response.razorpay_payment_id,
                  updated_at: new Date().toISOString(),
                })
                .eq('razorpay_order_id', response.razorpay_order_id);

              if (updateError) {
                throw new Error(updateError.message);
              }

              onSuccess();
            } else {
              throw new Error(verifyResult.error || 'Payment verification failed');
            }
          } catch (err) {
            const errorMessage = err.message || 'Payment verification failed';
            setLocalError(errorMessage);
            setError(errorMessage);
            onError(err);
          }
        },
        prefill: {
          name,
          email,
        },
        methods: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        theme: {
          color: '#4F46E5',
        },
        // Merge only safe Razorpay options
        ...(razorpayOptions.theme ? { theme: { ...razorpayOptions.theme } } : {}),
        ...(razorpayOptions.description ? { description: razorpayOptions.description } : {}),
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        const errorMessage = `Payment failed: ${response.error.description || 'Unknown error'}`;
        setLocalError(errorMessage);
        setError(errorMessage);
        onError(new Error(errorMessage));
      });
      rzp.open();
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setLocalError(errorMessage);
      setError(errorMessage);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <button
        onClick={handlePayment}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
};

export default RazorpayButton;