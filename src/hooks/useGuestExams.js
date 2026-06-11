'use client';

import { useEffect, useState } from 'react';
import { examData } from '@/data/examData';

function mapApiRow(row) {
  return {
    slug: row.slug,
    name: row.name,
    image: row.image_url || row.image || null,
    icon: row.icon || '📚',
    color: row.color_gradient || row.color || 'from-neutral-500 to-neutral-600',
    description: row.description || 'Topic-wise practice with solutions',
    category: row.category || 'General',
    count: row.question_count ?? row.count ?? 0,
    active: row.is_active !== false,
  };
}

/** Active exams from API only — static data enriches images/counts, never re-adds hidden exams. */
export function buildGuestExamList(apiRows) {
  const staticBySlug = new Map(examData.map((e) => [e.slug, e]));

  return (apiRows || [])
    .map((api) => {
      const staticExam = staticBySlug.get(api.slug);
      const mapped = mapApiRow({ ...api, is_active: api.is_active ?? true });
      if (!staticExam) return mapped;
      return {
        ...staticExam,
        ...mapped,
        active: true,
        count: mapped.count || staticExam.count,
        image: mapped.image || staticExam.image,
      };
    })
    .sort((a, b) => (b.count || 0) - (a.count || 0));
}

export function useGuestExams() {
  const [exams, setExams] = useState([]);
  const [hydratedFromApi, setHydratedFromApi] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/exams/active', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled || !data?.success || !Array.isArray(data.exams)) return;
        setExams(buildGuestExamList(data.exams));
        setHydratedFromApi(true);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('useGuestExams refresh', e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { exams, hydratedFromApi };
}
