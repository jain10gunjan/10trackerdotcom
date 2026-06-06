'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { parseJsonResponse, toastPromise } from '@/lib/toastAsync';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
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

export default function RoadmapCheckout({
  roadmapSlug,
  roadmapTitle,
  priceInr,
  termsAccepted = false,
  onSuccess,
  className = '',
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    if (!termsAccepted) {
      setError('Please accept the Terms and Privacy Policy above.');
      return;
    }
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/roadmaps/${roadmapSlug}`)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = await toastPromise(
        async () => {
          await loadRazorpayScript();
          const res = await fetch('/api/roadmaps/purchase/create-order', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roadmapSlug, termsAccepted: true }),
          });
          const data = await parseJsonResponse(res);
          if (!data.success) throw new Error(data.error || 'Could not start checkout');
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
        description: roadmapTitle || orderData.roadmapTitle,
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
                const verifyRes = await fetch('/api/roadmaps/purchase/verify', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    roadmapSlug,
                  }),
                });
                const verifyData = await parseJsonResponse(verifyRes);
                if (!verifyData.success) {
                  throw new Error(verifyData.error || 'Verification failed');
                }
              },
              {
                loading: 'Verifying payment…',
                success: 'Purchase complete — full roadmap unlocked!',
                error: (err) => err?.message || 'Payment verification failed',
              }
            );
            onSuccess?.();
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
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

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || !termsAccepted}
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
          <>Unlock full roadmap — ₹{priceInr}</>
        )}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600 text-center">{error}</p> : null}
      <p className="mt-2 text-[11px] text-neutral-500 text-center leading-relaxed">
        One-time purchase · lifetime access while 10Tracker operates · all sales final (no refunds)
      </p>
    </div>
  );
}
