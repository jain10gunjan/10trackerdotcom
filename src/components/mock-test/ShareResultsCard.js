'use client';

import { useCallback, useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareResultsCard({
  testName,
  scoreLabel,
  percentage,
  examcategory,
  attemptId,
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' && attemptId
      ? `${window.location.origin}/mock-test/${examcategory}/results/${attemptId}`
      : '';

  const shareText = `I scored ${scoreLabel}${percentage != null ? ` (${Math.round(percentage)}%)` : ''} on "${testName}" — ${examcategory?.replace(/-/g, ' ').toUpperCase()} mock test on 10Tracker.`;

  const handleCopy = useCallback(async () => {
    const text = `${shareText}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  }, [shareText, shareUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: testName,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    handleCopy();
  }, [testName, shareText, shareUrl, handleCopy]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <p className="text-sm font-semibold text-neutral-900 mb-1">Share your result</p>
      <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{shareText}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 text-sm font-medium hover:bg-neutral-50"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
