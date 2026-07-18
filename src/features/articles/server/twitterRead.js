// src/app/api/twitter-read/route.js
import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Remove t.co URLs from tweet text and normalize leftover whitespace
function cleanTweetText(text = '') {
  return String(text)
    .replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Server-side Supabase client (prefers service role if present)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Twitter API v2 - Read Tweets from User IDs
 * 
 * This endpoint reads tweets from specific Twitter user IDs.
 * Reading tweets is available on the FREE tier (unlike posting).
 * 
 * REQUEST BODY FORMAT:
 * ===================
 * {
 *   "userIds": ["123456789", "987654321"], // Array of Twitter user IDs
 *   "limit": 10 // Optional: number of tweets per user (default: 10, max: 100)
 * }
 * 
 * OR with usernames:
 * {
 *   "usernames": ["elonmusk", "twitter"], // Array of Twitter usernames (without @)
 *   "limit": 10
 * }
 * 
 * RESPONSE FORMAT:
 * ===============
 * {
 *   "success": true,
 *   "data": {
 *     "users": [
 *       {
 *         "userId": "123456789",
 *         "username": "elonmusk",
 *         "tweets": [
 *           {
 *             "id": "tweet_id",
 *             "text": "Tweet content...",
 *             "created_at": "2024-01-01T00:00:00.000Z",
 *             "public_metrics": { ... },
 *             "media": [
 *               {
 *                 "type": "photo",
 *                 "url": "https://...",
 *                 "preview_image_url": "https://...",
 *                 "alt_text": "...",
 *                 "width": 1200,
 *                 "height": 675
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */

// Helper function to initialize Twitter client
function getTwitterClient() {
  const userAccessToken = process.env.TWITTER_USER_ACCESS_TOKEN; // OAuth 2.0 User Context
  const apiKey = process.env.TWITTER_API_KEY; // OAuth 1.0a
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  // Method 1: OAuth 2.0 User Context
  if (userAccessToken) {
    return new TwitterApi(userAccessToken);
  }
  // Method 2: OAuth 1.0a User Context
  else if (apiKey && apiSecret && accessToken && accessTokenSecret) {
    return new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });
  } else {
    return null;
  }
}

// Helper function to get user ID from username
async function getUserIdFromUsername(client, username) {
  try {
    const user = await client.v2.userByUsername(username.replace('@', ''), {
      'user.fields': ['id', 'username', 'name']
    });
    return user.data?.id;
  } catch (error) {
    console.error(`Error getting user ID for ${username}:`, error.message);
    return null;
  }
}

// Helper function to fetch tweets for a user
async function fetchUserTweets(client, userId, limit = 10) {
  try {
    const tweets = await client.v2.userTimeline(userId, {
      max_results: Math.min(limit, 100), // Twitter API max is 100
      'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'text', 'id', 'attachments'],
      expansions: ['author_id', 'attachments.media_keys'],
      'user.fields': ['username', 'name', 'profile_image_url'],
      'media.fields': ['type', 'url', 'preview_image_url', 'alt_text', 'width', 'height']
    });

    // Map media keys to media objects
    const mediaMap = {};
    if (tweets.data?.includes?.media) {
      tweets.data.includes.media.forEach(media => {
        mediaMap[media.media_key] = media;
      });
    }

    // Attach media to tweets
    const tweetsWithMedia = (tweets.data?.data || []).map(tweet => {
      const media = [];
      if (tweet.attachments?.media_keys) {
        tweet.attachments.media_keys.forEach(mediaKey => {
          if (mediaMap[mediaKey]) {
            media.push(mediaMap[mediaKey]);
          }
        });
      }
      return {
        ...tweet,
        media: media
      };
    });

    return {
      userId: userId,
      tweets: tweetsWithMedia,
      userInfo: tweets.data?.includes?.users?.[0] || null,
      meta: tweets.data?.meta || {}
    };
  } catch (error) {
    console.error(`Error fetching tweets for user ${userId}:`, error.message);
    return {
      userId: userId,
      tweets: [],
      error: error.message,
      userInfo: null
    };
  }
}

// POST - Fetch tweets from user IDs or usernames
export async function POST(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const body = await request.json();
    const { userIds, usernames, limit = 10 } = body;

    // Validate input
    if (!userIds && !usernames) {
      return NextResponse.json(
        { success: false, error: 'Please provide either userIds or usernames array' },
        { status: 400 }
      );
    }

    if (userIds && !Array.isArray(userIds)) {
      return NextResponse.json(
        { success: false, error: 'userIds must be an array' },
        { status: 400 }
      );
    }

    if (usernames && !Array.isArray(usernames)) {
      return NextResponse.json(
        { success: false, error: 'usernames must be an array' },
        { status: 400 }
      );
    }

    // Validate limit
    const tweetLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);

    // Initialize Twitter client
    const client = getTwitterClient();
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Twitter API credentials not configured. Please set your Twitter API credentials in .env.local file.',
        },
        { status: 500 }
      );
    }

    const readClient = client.readOnly; // Use read-only client for fetching tweets

    let finalUserIds = [];

    // If usernames provided, convert to user IDs
    if (usernames && usernames.length > 0) {
      const userIdPromises = usernames.map(username => 
        getUserIdFromUsername(readClient, username)
      );
      const resolvedUserIds = await Promise.all(userIdPromises);
      finalUserIds = resolvedUserIds.filter(id => id !== null);
      
      if (finalUserIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Could not resolve any usernames to user IDs. Please check the usernames are correct.' },
          { status: 400 }
        );
      }
    } else {
      finalUserIds = userIds.map(id => String(id)); // Convert to strings
    }

    // Fetch tweets for each user
    const tweetPromises = finalUserIds.map(userId => 
      fetchUserTweets(readClient, userId, tweetLimit)
    );
    const results = await Promise.all(tweetPromises);

    // Pre-format (clean + simplify) so we can both return & store consistently
    const formattedResults = results.map(result => {
      const tweets = result.tweets.map(tweet => {
        const media = (tweet.media || []).map(m => ({
          type: m.type,
          url: m.url || m.preview_image_url || null,
        }));

        return {
          id: tweet.id,
          text: cleanTweetText(tweet.text),
          media,
          // internal fields for DB (not harmful if present, but we won't return them)
          __tweet_created_at: tweet.created_at || null,
        };
      });

      return {
        userId: result.userId,
        username: result.userInfo?.username || null,
        name: result.userInfo?.name || null,
        profileImageUrl: result.userInfo?.profile_image_url || null,
        tweets,
        tweetCount: tweets.length,
        error: result.error || null,
      };
    });

    // Save tweets + mark new/existing (single DB check for all tweet IDs)
    const supabase = getSupabaseClient();
    if (supabase) {
      const allTweetIds = formattedResults
        .flatMap(u => u.tweets.map(t => t.id))
        .filter(Boolean);

      if (allTweetIds.length > 0) {
        const { data: existingRows, error: existingErr } = await supabase
          .from('twitter_tweets')
          .select('id')
          .in('id', allTweetIds);

        if (existingErr) {
          console.error('Supabase existing tweet check error:', existingErr);
        } else {
          const existingSet = new Set((existingRows || []).map(r => String(r.id)));

          const rowsToInsert = [];
          for (const user of formattedResults) {
            for (const tweet of user.tweets) {
              const exists = existingSet.has(String(tweet.id));
              tweet.isNew = !exists;
              if (!exists) {
                rowsToInsert.push({
                  id: String(tweet.id),
                  user_id: String(user.userId),
                  username: user.username,
                  name: user.name,
                  profile_image_url: user.profileImageUrl,
                  text: tweet.text,
                  media: tweet.media,
                  tweet_created_at: tweet.__tweet_created_at,
                });
              }
            }
            user.newTweetCount = user.tweets.filter(t => t.isNew).length;
          }

          if (rowsToInsert.length > 0) {
            const { error: insertErr } = await supabase
              .from('twitter_tweets')
              .insert(rowsToInsert);

            if (insertErr) {
              console.error('Supabase tweet insert error:', insertErr);
            }
          }
        }
      }
    }

    // Strip internal fields from output
    const outputResults = formattedResults.map(user => ({
      userId: user.userId,
      username: user.username,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      tweets: user.tweets.map(t => ({
        id: t.id,
        text: t.text,
        media: t.media,
        isNew: Boolean(t.isNew),
      })),
      tweetCount: user.tweetCount,
      newTweetCount: user.newTweetCount ?? 0,
      error: user.error || null,
    }));

    // Return only the "users" object as requested (no extra wrappers)
    return NextResponse.json({
      users: outputResults,
    });

  } catch (error) {
    console.error('Twitter Read API error:', error.response?.data || error.message);

    let errorMessage = 'Failed to fetch tweets';
    let errorDetails = null;
    const statusCode = error.response?.status || error.code || 500;

    if (error.response?.data) {
      errorDetails = error.response.data;
      errorMessage = error.response.data.detail || error.response.data.title || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle specific error codes
    if (statusCode === 401) {
      errorMessage = 'Twitter API authentication failed. Check your credentials.';
    } else if (statusCode === 403) {
      errorMessage = 'Twitter API access forbidden. Check your API permissions.';
    } else if (statusCode === 429) {
      errorMessage = 'Twitter API rate limit exceeded. Please try again later.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        statusCode: statusCode,
      },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}

// GET - Simple endpoint to test (optional)
export async function GET(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }
  return NextResponse.json({
    message: 'Twitter Read API - Use POST method to fetch tweets',
    usage: {
      method: 'POST',
      body: {
        userIds: ['123456789', '987654321'],
        limit: 10
      },
      or: {
        usernames: ['elonmusk', 'twitter'],
        limit: 10
      }
    }
  });
}
