'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Instagram, Youtube, Video, Image as ImageIcon, X, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { sanitizeEmbedHtml } from '@/features/articles/lib/sanitizeArticleHtml';

const SocialMediaEmbed = ({ embed, onRemove, isEditable = false }) => {
  const [embedHtml, setEmbedHtml] = useState(null);
  const [error, setError] = useState(null);
  const embedContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Define helper functions first
  const extractInstagramId = useCallback((url) => {
    const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }, []);

  const extractYouTubeId = useCallback((url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }, []);

  const extractTwitterId = useCallback((url) => {
    // Match Twitter/X URLs: twitter.com/username/status/123456 or x.com/username/status/123456
    const match = url.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/);
    return match ? { username: match[1], tweetId: match[2] } : null;
  }, []);

  const generateEmbedFromUrl = useCallback((url, type, caption = '') => {
    try {
      if (type === 'instagram' || type === 'reel') {
        // Instagram embed - use proper blockquote format
        const postId = extractInstagramId(url);
        if (postId) {
          // Clean URL - ensure it's the full permalink
          const cleanUrl = url.split('?')[0]; // Remove query params
          const blockquoteHtml = `<blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px auto; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"><a href="${cleanUrl}" style="background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank" rel="noopener noreferrer"></a></div></blockquote>`;
          setEmbedHtml(blockquoteHtml);
          
          // Process embed after a short delay to ensure DOM is updated
          setTimeout(() => {
            if (window.instgrm) {
              window.instgrm.Embeds.process();
            }
          }, 200);
        } else {
          setError('Invalid Instagram URL format');
        }
      } else if (type === 'twitter') {
        // Twitter/X embed - use blockquote format
        const tweetData = extractTwitterId(url);
        if (tweetData) {
          // Clean URL - ensure it's the full permalink
          const cleanUrl = url.split('?')[0]; // Remove query params
          const blockquoteHtml = `<blockquote class="twitter-tweet" data-theme="light"><a href="${cleanUrl}"></a></blockquote>`;
          setEmbedHtml(blockquoteHtml);
          
          // Process embed after a short delay to ensure DOM is updated
          setTimeout(() => {
            if (window.twttr) {
              window.twttr.widgets.load();
            }
          }, 200);
        } else {
          setError('Invalid Twitter/X URL format');
        }
      } else if (type === 'youtube' || type === 'video') {
        // YouTube embed
        const videoId = extractYouTubeId(url);
        if (videoId) {
          setEmbedHtml(
            `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
          );
        }
      } else if (type === 'image') {
        // Image embed
        setEmbedHtml(`<img src="${url}" alt="${caption || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" />`);
      }
    } catch (err) {
      setError('Failed to generate embed');
      console.error('Embed generation error:', err);
    }
  }, [extractInstagramId, extractYouTubeId, extractTwitterId]);

  // Load Instagram embed script
  useEffect(() => {
    if ((embed.type === 'instagram' || embed.type === 'reel') && !scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        // Process embeds after script loads
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script if component unmounts
        const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [embed.type]);

  // Load Twitter embed script
  useEffect(() => {
    if (embed.type === 'twitter' && !document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.onload = () => {
        // Process embeds after script loads
        if (window.twttr) {
          window.twttr.widgets.load();
        }
      };
      document.body.appendChild(script);
    }
  }, [embed.type]);

  useEffect(() => {
    if (embed.embed_code) {
      setEmbedHtml(sanitizeEmbedHtml(embed.embed_code));
      // Process Instagram embeds after setting HTML
      if ((embed.type === 'instagram' || embed.type === 'reel') && window.instgrm) {
        setTimeout(() => {
          window.instgrm?.Embeds?.process();
        }, 100);
      }
      // Process Twitter embeds after setting HTML
      if (embed.type === 'twitter' && window.twttr) {
        setTimeout(() => {
          window.twttr?.widgets?.load();
        }, 100);
      }
    } else if (embed.url) {
      // Try to generate embed code from URL
      generateEmbedFromUrl(embed.url, embed.type, embed.caption);
    }
  }, [embed, generateEmbedFromUrl]);

  // Process Instagram embeds when HTML is set
  useEffect(() => {
    if (embedHtml && (embed.type === 'instagram' || embed.type === 'reel') && window.instgrm) {
      setTimeout(() => {
        window.instgrm?.Embeds?.process();
      }, 100);
    }
    // Process Twitter embeds when HTML is set
    if (embedHtml && embed.type === 'twitter' && window.twttr) {
      setTimeout(() => {
        window.twttr?.widgets?.load();
      }, 100);
    }
  }, [embedHtml, embed.type]);

  const getIcon = () => {
    switch (embed.type) {
      case 'instagram':
      case 'reel':
        return <Instagram className="w-5 h-5" />;
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'youtube':
      case 'video':
        return <Youtube className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (embed.type) {
      case 'instagram':
        return 'Instagram Post';
      case 'reel':
        return 'Instagram Reel';
      case 'twitter':
        return 'Twitter/X Post';
      case 'youtube':
        return 'YouTube Video';
      case 'video':
        return 'Video';
      case 'image':
        return 'Image';
      default:
        return 'Media';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p className="text-red-600 text-sm">Failed to load embed: {error}</p>
        {embed.url && (
          <a href={embed.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-2 block">
            View original
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="my-6 relative group">
      {isEditable && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          aria-label="Remove embed"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-sm text-neutral-600">
          {getIcon()}
          <span className="font-medium">{getTypeLabel()}</span>
        </div>
        
        {embedHtml && (
          <div 
            ref={embedContainerRef}
            className="embed-container"
            dangerouslySetInnerHTML={{ __html: sanitizeEmbedHtml(embedHtml) }}
          />
        )}
        
        {/* Fallback link if embed fails to load */}
        {embed.url && (embed.type === 'instagram' || embed.type === 'reel') && (
          <div className="mt-3 text-center">
            <a 
              href={embed.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View on Instagram
            </a>
          </div>
        )}
        {embed.url && embed.type === 'twitter' && (
          <div className="mt-3 text-center">
            <a 
              href={embed.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View on Twitter/X
            </a>
          </div>
        )}
        
        {embed.caption && (
          <p className="text-sm text-neutral-600 mt-3 italic">{embed.caption}</p>
        )}
      </div>
    </div>
  );
};

export default SocialMediaEmbed;

