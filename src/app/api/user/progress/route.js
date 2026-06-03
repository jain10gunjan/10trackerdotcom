import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cached function to get user progress
const getCachedUserProgress = unstable_cache(
  async (userId) => {
    try {
      // Fetch all user progress grouped by area (exam category)
      const { data, error } = await supabase
        .from('user_progress')
        .select('area, topic, completedquestions, correctanswers, points')
        .or(`user_id.eq.${userId},email.eq.${userId}`)
        .not('area', 'is', null);

      if (error) throw error;

      // Group by area (exam category)
      const progressByArea = {};
      
      (data || []).forEach((item) => {
        const area = item.area?.toLowerCase();
        if (!area) return;

        if (!progressByArea[area]) {
          progressByArea[area] = {
            area: area,
            topics: {},
            totalCompleted: 0,
            totalCorrect: 0,
            totalPoints: 0,
            topicsCount: 0,
          };
        }

        const completedCount = Array.isArray(item.completedquestions) 
          ? item.completedquestions.length 
          : 0;
        const correctCount = Array.isArray(item.correctanswers) 
          ? item.correctanswers.length 
          : 0;
        const points = item.points || 0;

        progressByArea[area].topics[item.topic] = {
          topic: item.topic,
          completedQuestions: completedCount,
          correctAnswers: correctCount,
          points: points,
          accuracy: completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0,
        };

        progressByArea[area].totalCompleted += completedCount;
        progressByArea[area].totalCorrect += correctCount;
        progressByArea[area].totalPoints += points;
        progressByArea[area].topicsCount += 1;
      });

      // Convert to array and calculate overall stats
      const result = Object.values(progressByArea).map((areaData) => ({
        ...areaData,
        topics: Object.values(areaData.topics),
        overallAccuracy: areaData.totalCompleted > 0
          ? Math.round((areaData.totalCorrect / areaData.totalCompleted) * 100)
          : 0,
      }));

      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching user progress:', error);
      }
      return [];
    }
  },
  (userId) => [`user-progress-${userId}`], // Dynamic cache key per user
  {
    revalidate: 60, // 1 minute cache
    tags: ['user-progress'],
  }
);

export async function GET(request) {
  try {
    // Get userId from query parameter (passed from client)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid user ID is required' },
        { status: 401 }
      );
    }

    // Use userId in cache key for per-user caching
    const progress = await getCachedUserProgress(userId.trim());

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error in user progress API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch user progress',
      },
      { status: 500 }
    );
  }
}

