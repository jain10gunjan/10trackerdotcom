'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Loader2 } from 'lucide-react';
import { getOgPremiumAmountPaise } from '@/features/og-trackers/lib/constants';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export default function OgPremiumCheckout({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const amountPaise = getOgPremiumAmountPaise();

  useEffect(() => {
    loadRazorpayScript().catch(() => setError('Could not load payment SDK'));
  }, []);

  const startPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadRazorpayScript();
      const res = await fetch('/api/og-trackers/purchase/create-order', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not create order');
      }
      if (data.alreadyPremium) {
        onSuccess?.();
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'OG Trackers Premium',
        description: 'Unlock premium paths + judge sync',
        order_id: data.orderId,
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
        },
        handler: async (response) => {
          const verify = await fetch('/api/og-trackers/purchase/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verify.json();
          if (!verify.ok || !result.success) {
            throw new Error(result.error || 'Verification failed');
          }
          onSuccess?.();
        },
        theme: { color: '#4F46E5' },
      });
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-neutral-200 p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-neutral-900">OG Trackers Premium</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Unlock premium learning paths and automatic LeetCode / HackerRank / CodeStudio progress sync.
        </p>
        <p className="mt-4 text-3xl font-semibold tabular-nums text-neutral-900">
          ₹{(amountPaise / 100).toLocaleString('en-IN')}
        </p>
        {!user ? (
          <p className="mt-4 text-sm text-amber-700">Sign in to purchase.</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          disabled={loading || !user}
          onClick={startPayment}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Pay with Razorpay
        </button>
      </div>
    </div>
  );
}
