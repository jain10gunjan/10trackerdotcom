'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Global cache to prevent duplicate calls
const categoriesCache = {
  data: null,
  timestamp: null,
  promise: null,
  TTL: 5 * 60 * 1000, // 5 minutes
};

export function useArticleCategories(options = {}) {
  const { enabled = true, refetch: forceRefetch = false } = options;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCategories([]);
      setLoading(false);
      return;
    }

    // Check cache first
    const now = Date.now();
    if (
      !forceRefetch &&
      categoriesCache.data &&
      categoriesCache.timestamp &&
      now - categoriesCache.timestamp < categoriesCache.TTL
    ) {
      setCategories(categoriesCache.data);
      setLoading(false);
      return;
    }

    // If there's already a pending request, wait for it
    if (categoriesCache.promise && !forceRefetch) {
      setLoading(true);
      categoriesCache.promise
        .then((data) => {
          if (mountedRef.current && data) {
            setCategories(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setError(err);
            setLoading(false);
          }
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/articles/categories');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (!mountedRef.current) return null;

        if (result.success) {
          const data = result.data || [];
          categoriesCache.data = data;
          categoriesCache.timestamp = Date.now();
          if (mountedRef.current) {
            setCategories(data);
            setError(null);
          }
          return data;
        } else {
          throw new Error(result.error || 'Failed to fetch categories');
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          console.error('Error fetching categories:', err);
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        categoriesCache.promise = null;
      }
    };

    categoriesCache.promise = fetchCategories();
  }, [enabled, forceRefetch]);

  const refetch = useCallback(() => {
    clearCategoriesCache();
    setLoading(true);
    setError(null);
    
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/articles/categories');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (!mountedRef.current) return;

        if (result.success) {
          const data = result.data || [];
          categoriesCache.data = data;
          categoriesCache.timestamp = Date.now();
          if (mountedRef.current) {
            setCategories(data);
            setError(null);
          }
        } else {
          throw new Error(result.error || 'Failed to fetch categories');
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          console.error('Error fetching categories:', err);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error, refetch };
}

// Helper function to clear cache (useful after mutations)
export function clearCategoriesCache() {
  categoriesCache.data = null;
  categoriesCache.timestamp = null;
  categoriesCache.promise = null;
}
