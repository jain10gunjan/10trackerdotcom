"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import { MathJaxUtils } from '@/lib/mathjaxConfig';

const MathJaxWrapper = ({ 
  children, 
  inline = false, 
  dynamic = true, 
  className = "",
  onRenderComplete = null,
  key = null, // Add key prop for forcing re-render
  fallback = null // Fallback content for rendering errors
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Force re-render when key changes (useful for question transitions)
    setIsRendered(false);
    setHasError(false);
    
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      setIsRendered(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (isRendered && MathJaxUtils.isLoaded()) {
      // Clear any existing MathJax content
      if (contentRef.current) {
        MathJaxUtils.clearCache(contentRef.current);
      }

      // Force MathJax to re-render
      MathJaxUtils.typeset().then(() => {
        setHasError(false);
        if (onRenderComplete) {
          onRenderComplete();
        }
      }).catch((error) => {
        console.warn('MathJax rendering error:', error);
        setHasError(true);
        if (onRenderComplete) {
          onRenderComplete();
        }
      });
    }
  }, [isRendered, onRenderComplete]);

  // Show fallback content if there's an error
  if (hasError && fallback) {
    return (
      <div className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={contentRef} className={className}>
      <MathJax 
        hideUntilTypeset="first" 
        inline={inline} 
        dynamic={dynamic}
        key={key}
      >
        {children}
      </MathJax>
    </div>
  );
};

export default MathJaxWrapper;
