import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { upsertUserProgress } from '@/lib/userProgressUpsert';

// Helper: Merge progress updates
const mergeProgressUpdates = (existing, updates) => {
  const aggregated = updates.reduce((acc, update) => ({
    completed: [...new Set([...acc.completed, ...(update.completed || [])])],
    correct: [...new Set([...acc.correct, ...(update.correct || [])])],
    points: acc.points + (update.points || 0)
  }), { completed: [], correct: [], points: 0 });

  return {
    completed: [...new Set([...existing.completed, ...aggregated.completed])],
    correct: [...new Set([...existing.correct, ...aggregated.correct])],
    points: existing.points + aggregated.points
  };
};

export async function POST(request) {
  try {
    // Parse request body - handle both JSON and Blob (from sendBeacon)
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else {
        // Handle Blob from sendBeacon or other formats
        const text = await request.text();
        body = JSON.parse(text);
      }
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body format' },
        { status: 400 }
      );
    }
    
    const { updates, userId, topic, area, email } = body;

    // Validate required fields
    if (!userId || !topic || !area || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch existing progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from("user_progress")
      .select("completedquestions, correctanswers, points")
      .eq("user_id", userId)
      .eq("topic", topic)
      .eq("area", area)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    // Get existing arrays (or empty if no record exists)
    const existing = {
      completed: Array.isArray(existingProgress?.completedquestions) 
        ? existingProgress.completedquestions 
        : [],
      correct: Array.isArray(existingProgress?.correctanswers) 
        ? existingProgress.correctanswers 
        : [],
      points: typeof existingProgress?.points === 'number' 
        ? existingProgress.points 
        : 0
    };

    // Merge updates
    const merged = mergeProgressUpdates(existing, updates);

    // Prepare data
    const progressData = {
      user_id: userId,
      email: email || null,
      topic: topic,
      completedquestions: merged.completed,
      correctanswers: merged.correct,
      points: merged.points,
      area: area,
      updated_at: new Date().toISOString(),
    };

    let { error: saveError } = await upsertUserProgress(supabase, progressData);

    // If upsert fails, try insert then update
    if (saveError) {
      const { error: insertError } = await supabase
        .from("user_progress")
        .insert(progressData);

      if (insertError) {
        const { error: updateError } = await supabase
          .from("user_progress")
          .update({
            completedquestions: merged.completed,
            correctanswers: merged.correct,
            points: merged.points,
            email: email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("topic", topic)
          .eq("area", area);

        if (updateError) {
          throw updateError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error saving progress:', error);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save progress'
      },
      { status: 500 }
    );
  }
}
