'use client';

import { useState } from 'react';
import {
  Loader2,
  Twitter,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwitterComposePanel() {
  const [tweetForm, setTweetForm] = useState({
    title: '',
    link: '',
    hashtags: '',
    imageUrl: '',
    scheduledAt: ''
  });
  const [tweetPosting, setTweetPosting] = useState(false);
  const [tweetPostError, setTweetPostError] = useState(null);
  const [tweetPostSuccess, setTweetPostSuccess] = useState(null);
  const [scheduledTweets, setScheduledTweets] = useState([]);

  const handleTweetFormChange = (field, value) => {
    setTweetForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const postTweetNow = async (payload) => {
    try {
      setTweetPosting(true);
      setTweetPostError(null);
      setTweetPostSuccess(null);

      const response = await fetch('/api/twitterpost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to post tweet');
      }

      setTweetPostSuccess('Tweet posted successfully');
      toast.success('Tweet posted successfully');
      return data;
    } catch (error) {
      console.error('Error posting tweet:', error);
      setTweetPostError(error.message || 'Failed to post tweet');
      toast.error(error.message || 'Failed to post tweet');
      throw error;
    } finally {
      setTweetPosting(false);
    }
  };

  const handlePostTweetNow = async () => {
    if (!tweetForm.title.trim()) {
      setTweetPostError('Tweet text (title) is required');
      return;
    }

    const payload = {
      title: tweetForm.title.trim(),
      link: tweetForm.link.trim() || undefined,
      hashtags: tweetForm.hashtags.trim() || undefined,
      imageUrl: tweetForm.imageUrl.trim() || undefined
    };

    await postTweetNow(payload);
  };

  const handleScheduleTweet = () => {
    if (!tweetForm.title.trim()) {
      setTweetPostError('Tweet text (title) is required');
      return;
    }

    if (!tweetForm.scheduledAt) {
      setTweetPostError('Please select a scheduled date & time');
      return;
    }

    const scheduledTime = new Date(tweetForm.scheduledAt);
    if (Number.isNaN(scheduledTime.getTime())) {
      setTweetPostError('Invalid scheduled date & time');
      return;
    }

    const now = new Date();
    if (scheduledTime <= now) {
      setTweetPostError('Scheduled time must be in the future');
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      title: tweetForm.title.trim(),
      link: tweetForm.link.trim() || undefined,
      hashtags: tweetForm.hashtags.trim() || undefined,
      imageUrl: tweetForm.imageUrl.trim() || undefined
    };

    const delay = scheduledTime.getTime() - now.getTime();
    const timeoutId = setTimeout(async () => {
      try {
        await postTweetNow(payload);
        setScheduledTweets((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'sent', sentAt: new Date().toISOString() } : item
          )
        );
      } catch (e) {
        setScheduledTweets((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'failed', error: e.message } : item
          )
        );
      }
    }, delay);

    setScheduledTweets((prev) => [
      ...prev,
      {
        id,
        payload,
        scheduledAt: scheduledTime.toISOString(),
        status: 'scheduled',
        timeoutId
      }
    ]);

    toast.success('Tweet scheduled (browser must stay open)');
  };

  const cancelScheduledTweet = (id) => {
    setScheduledTweets((prev) => {
      const found = prev.find((t) => t.id === id);
      if (found && found.timeoutId) {
        clearTimeout(found.timeoutId);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="w-full lg:w-80 border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div className="flex items-center gap-2 mb-3">
            <Twitter className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Compose / Schedule Tweet
            </h3>
          </div>

          {tweetPostError && (
            <div className="mb-2 p-2 rounded-md bg-red-50 border border-red-200 text-[11px] text-red-700">
              {tweetPostError}
            </div>
          )}
          {tweetPostSuccess && (
            <div className="mb-2 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
              {tweetPostSuccess}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Tweet text (title) *
              </label>
              <textarea
                rows={3}
                value={tweetForm.title}
                onChange={(e) => handleTweetFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 resize-none"
                placeholder="Write tweet text here..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Link (optional)
              </label>
              <input
                type="url"
                value={tweetForm.link}
                onChange={(e) => handleTweetFormChange('link', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                placeholder="https://10tracker.com/articles/..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Hashtags (space separated, optional)
              </label>
              <input
                type="text"
                value={tweetForm.hashtags}
                onChange={(e) => handleTweetFormChange('hashtags', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                placeholder="#India #News #Infra"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={tweetForm.imageUrl}
                onChange={(e) => handleTweetFormChange('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                placeholder="Paste media URL from tweets above"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Schedule (optional, browser must stay open)
              </label>
              <input
                type="datetime-local"
                value={tweetForm.scheduledAt}
                onChange={(e) => handleTweetFormChange('scheduledAt', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              />
              <p className="mt-1 text-[10px] text-neutral-500">
                Scheduling runs only while this admin page is open. For guaranteed scheduling,
                move this logic to a server/cron later.
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={handlePostTweetNow}
                disabled={tweetPosting || !tweetForm.title.trim()}
                className="w-full px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {tweetPosting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Twitter className="w-3 h-3" />
                    Post now
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleScheduleTweet}
                disabled={tweetPosting || !tweetForm.title.trim() || !tweetForm.scheduledAt}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3 h-3" />
                Schedule
              </button>
            </div>

            {scheduledTweets.length > 0 && (
              <div className="mt-3 border-t border-neutral-200 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-neutral-700">
                    Scheduled tweets ({scheduledTweets.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {scheduledTweets.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-[10px] py-1"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-neutral-800">
                          {item.payload.title}
                        </div>
                        <div className="text-neutral-500">
                          {new Date(item.scheduledAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                            item.status === 'scheduled'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.status === 'scheduled' && (
                          <button
                            type="button"
                            onClick={() => cancelScheduledTweet(item.id)}
                            className="text-[10px] text-neutral-500 hover:text-neutral-900"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
