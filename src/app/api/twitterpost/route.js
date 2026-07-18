// src/app/api/twitterpost/route.js
import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

/**
 * Twitter API v2 POST Tweet Endpoint
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * ===============================
 * 
 * IMPORTANT: Twitter API v2 POST tweets requires User Context authentication.
 * Bearer Token (Application-Only) is NOT supported for posting tweets.
 * 
 * Option 1: OAuth 2.0 User Context (Recommended)
 * - TWITTER_CLIENT_ID: Your Twitter App Client ID
 * - TWITTER_CLIENT_SECRET: Your Twitter App Client Secret
 * - TWITTER_USER_ACCESS_TOKEN: Your User Access Token (from OAuth 2.0 flow)
 * 
 * Option 2: OAuth 1.0a User Context (Alternative)
 * - TWITTER_API_KEY: Your Twitter API Key (Consumer Key)
 * - TWITTER_API_SECRET: Your Twitter API Secret (Consumer Secret)
 * - TWITTER_ACCESS_TOKEN: Your Access Token
 * - TWITTER_ACCESS_TOKEN_SECRET: Your Access Token Secret
 * 
 * HOW TO GET THESE:
 * ================
 * 1. Go to https://developer.twitter.com/
 * 2. Create a new app/project
 * 3. For OAuth 1.0a: Go to "Keys and tokens" → Get your API Key, API Secret, Access Token, Access Token Secret
 * 4. For OAuth 2.0: You need to complete OAuth 2.0 flow to get User Access Token
 * 5. Add them to your .env.local file
 * 
 * REQUEST BODY FORMAT:
 * ===================
 * {
 *   "title": "Your tweet text here",
 *   "link": "https://10tracker.com/articles/your-article",
 *   "hashtags": ["#India", "#News", "#Tech"], // Array of hashtags (optional)
 *   "imageUrl": "https://example.com/image.jpg" // Optional image URL to attach
 * }
 * 
 * OR
 * 
 * {
 *   "title": "Your tweet text here",
 *   "link": "https://10tracker.com/articles/your-article",
 *   "hashtags": "#India #News #Tech", // Space-separated string (optional)
 *   "imageUrl": "https://example.com/image.jpg" // Optional image URL to attach
 * }
 */


// Helper function to format tweet text
function formatTweet(title, link, hashtags) {
  let tweetText = title;
  let hashtagString = '';
  
  // Process hashtags
  if (hashtags) {
    if (Array.isArray(hashtags)) {
      hashtagString = hashtags
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .join(' ');
    } else if (typeof hashtags === 'string') {
      // Convert space-separated string to array and ensure # prefix
      hashtagString = hashtags
        .split(' ')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .join(' ');
    }
  }
  
  // Add link
  if (link) {
    tweetText += ` ${link}`;
  }
  
  // Add hashtags
  if (hashtagString) {
    tweetText += ` ${hashtagString}`;
  }
  
  // Twitter character limit is 280, but URLs count as 23 characters
  const urlLength = link ? 23 : 0;
  const hashtagLength = hashtagString ? hashtagString.length + 1 : 0; // +1 for space
  
  if (tweetText.length > 280) {
    // Truncate title if needed
    const availableLength = 280 - urlLength - hashtagLength - 3; // -3 for "..."
    const truncatedTitle = title.substring(0, Math.max(0, availableLength));
    tweetText = truncatedTitle + '...' + (link ? ` ${link}` : '') + (hashtagString ? ` ${hashtagString}` : '');
  }
  
  return tweetText.trim();
}

// POST - Create a tweet
export async function POST(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const body = await request.json();
    const { title, link, hashtags, imageUrl } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Format the tweet
    const tweetText = formatTweet(title, link, hashtags);

    // Check which authentication method to use
    const userAccessToken = process.env.TWITTER_USER_ACCESS_TOKEN; // OAuth 2.0 User Context
    const apiKey = process.env.TWITTER_API_KEY; // OAuth 1.0a
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    // Debug: Log which credentials are found (without exposing values)
    const hasOAuth2 = !!userAccessToken;
    const hasOAuth1 = !!(apiKey && apiSecret && accessToken && accessTokenSecret);
    const hasPartialOAuth1 = !!(apiKey || apiSecret || accessToken || accessTokenSecret);

    console.log('Twitter Auth Check:', {
      hasOAuth2,
      hasOAuth1,
      hasPartialOAuth1,
      oauth1Parts: {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasAccessToken: !!accessToken,
        hasAccessTokenSecret: !!accessTokenSecret,
      }
    });

    let client;
    let rwClient;

    // Method 1: OAuth 2.0 User Context (Recommended)
    if (userAccessToken) {
      client = new TwitterApi(userAccessToken);
      rwClient = client.readWrite;
    }
    // Method 2: OAuth 1.0a User Context
    else if (apiKey && apiSecret && accessToken && accessTokenSecret) {
      client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessTokenSecret,
      });
      rwClient = client.readWrite;
    } else {
      // Provide detailed error message
      const missingVars = [];
      if (!hasOAuth2) {
        if (hasPartialOAuth1) {
          if (!apiKey) missingVars.push('TWITTER_API_KEY');
          if (!apiSecret) missingVars.push('TWITTER_API_SECRET');
          if (!accessToken) missingVars.push('TWITTER_ACCESS_TOKEN');
          if (!accessTokenSecret) missingVars.push('TWITTER_ACCESS_TOKEN_SECRET');
          return NextResponse.json(
            {
              success: false,
              error: `Missing Twitter OAuth 1.0a credentials. Missing: ${missingVars.join(', ')}. Please add all four variables to your .env.local file.`,
              debug: {
                found: {
                  TWITTER_API_KEY: !!apiKey,
                  TWITTER_API_SECRET: !!apiSecret,
                  TWITTER_ACCESS_TOKEN: !!accessToken,
                  TWITTER_ACCESS_TOKEN_SECRET: !!accessTokenSecret,
                }
              }
            },
            { status: 500 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'Twitter API credentials not configured. Please set either TWITTER_USER_ACCESS_TOKEN (OAuth 2.0) or all four OAuth 1.0a variables (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET) in your .env.local file. Make sure to restart your Next.js server after adding environment variables.',
              debug: {
                note: 'Environment variables are only loaded when the server starts. If you just added them, restart your dev server (npm run dev).'
              }
            },
            { status: 500 }
          );
        }
      }
      return; // Should not reach here without returning above
    }

    // At this point we have a read-write Twitter client
    if (!rwClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Twitter client not initialized for posting.',
        },
        { status: 500 }
      );
    }

    // Optional image upload
    let mediaIds = [];
    if (imageUrl) {
      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });

        const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
        const buffer = Buffer.from(imageResponse.data);

        const mediaId = await rwClient.v1.uploadMedia(buffer, {
          mimeType: contentType,
        });
        mediaIds.push(mediaId);
      } catch (mediaError) {
        console.error('Error uploading media to Twitter:', mediaError.message || mediaError);
        // Continue without media if upload fails
      }
    }

    // Post tweet with or without media
    const tweetPayload =
      mediaIds.length > 0
        ? { text: `🚨${tweetText}`, media: { media_ids: mediaIds } }
        : { text: `🚨${tweetText}` };

    const tweetResponse = await rwClient.v2.tweet(tweetPayload);

    return NextResponse.json({
      success: true,
      message: 'Tweet posted successfully',
      data: {
        tweetId: tweetResponse.data.id,
        text: tweetText,
        fullResponse: tweetResponse.data,
        mediaAttached: mediaIds.length > 0,
      },
    });
  } catch (error) {
    console.error('Twitter API error:', error.response?.data || error.message);

    // Extract error message from Twitter API response
    let errorMessage = 'Failed to post tweet';
    let errorDetails = null;
    const statusCode = error.response?.status || error.code || 500;

    if (error.response?.data) {
      errorDetails = error.response.data;
      errorMessage = error.response.data.detail || error.response.data.title || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle specific error codes
    if (statusCode === 402) {
      errorMessage = 'Twitter API requires a paid subscription. The free tier does not support posting tweets. You need to upgrade to Twitter API Basic ($100/month) or higher to post tweets.';
      errorDetails = {
        ...errorDetails,
        code: 402,
        message: 'Payment Required - Twitter API subscription needed',
        solution: 'Upgrade your Twitter API access at https://developer.twitter.com/en/portal/products'
      };
    } else if (statusCode === 403) {
      errorMessage = 'Twitter API access forbidden. Check your API permissions and ensure your app has write access.';
    } else if (statusCode === 401) {
      errorMessage = 'Twitter API authentication failed. Check your credentials.';
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

// GET - Keep existing functionality (for backward compatibility)
export async function GET(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const url = "http://nitter.net/search?f=tweets&q=IndianTechGuide";

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    return new Response(JSON.stringify({
      status: res.status,
      htmlLength: res.data?.length || 0,
      html: res.data,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Twitterpost API error:", error.message);

    return new Response(JSON.stringify({
      error: "Failed to fetch Nitter page",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
