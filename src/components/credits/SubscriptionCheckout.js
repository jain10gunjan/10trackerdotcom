'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useCredits } from '@/context/CreditsContext';
import { SUBSCRIPTION_PLANS } from '@/lib/credits/constants';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function SubscriptionCheckout({ planId, termsAccepted = false, className = '' }) {
  const { user, isAuthenticated } = useAuth();
  const { refreshWallet, plans: walletPlans } = useCredits();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plan = walletPlans?.[planId] || SUBSCRIPTION_PLANS[planId];
  if (!plan) return null;

  const handleCheckout = async () => {
    if (!termsAccepted) {
      setError('Please accept the Terms and Privacy Policy above.');
      return;
    }

    if (!isAuthenticated || !user?.email) {
      router.push(`/sign-in?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = await toastPromise(
        async () => {
          await loadRazorpayScript();
          const orderRes = await fetch('/api/subscriptions/create-order', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, termsAccepted: true }),
          });
          const data = await parseJsonResponse(orderRes);
          if (!data.success) {
            throw new Error(data.error || 'Could not start checkout');
          }
          return data;
        },
        {
          loading: 'Preparing checkout…',
          success: 'Opening payment…',
          error: (err) => err?.message || 'Could not start checkout',
        }
      );

      const sellerName = orderData.legal?.businessName || '10Tracker';

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: sellerName,
        description: plan.name,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
        },
        theme: { color: '#171717' },
        handler: async (response) => {
          try {
            await toastPromise(
              async () => {
                const verifyRes = await fetch('/api/subscriptions/verify', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    planId,
                  }),
                });
                const verifyData = await parseJsonResponse(verifyRes);
                if (!verifyData.success) {
                  throw new Error(verifyData.error || 'Verification failed');
                }
                await refreshWallet();
              },
              {
                loading: 'Verifying payment…',
                success: 'Payment successful!',
                error: (err) => err?.message || 'Payment verification failed',
              }
            );
            router.push('/?subscribed=1');
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !termsAccepted;

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled}
        title={!termsAccepted ? 'Accept terms above to subscribe' : undefined}
        className={
          className ||
          'w-full px-4 py-3 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening checkout…
          </>
        ) : (
          <>Subscribe — ₹{plan.priceInr}</>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
