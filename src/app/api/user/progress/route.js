import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getProgressUserId, applyProgressUserFilter } from '@/lib/progressIdentity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkApiRateLimit, rateLimitResponse } from '@/lib/apiRateLimit';

export async function GET() {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const limit = checkApiRateLimit(email, 'user-progress-get', {
      windowMs: 60_000,
      max: 60,
    });
    if (!limit.ok) {
      const r = rateLimitResponse(limit);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const userId = getProgressUserId({ email });
    const supabase = getSupabaseAdmin();

    let q = supabase
      .from('user_progress')
      .select('area, topic, completedquestions, correctanswers, points')
      .not('area', 'is', null);
    q = applyProgressUserFilter(q, { email, id: userId });

    const { data, error: pe } = await q;
    if (pe && pe.code !== 'PGRST116') throw pe;

    const progressByArea = {};

    (data || []).forEach((item) => {
      const area = item.area?.toLowerCase();
      if (!area) return;

      if (!progressByArea[area]) {
        progressByArea[area] = {
          area,
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
        points,
        accuracy:
          completedCount > 0
            ? Math.round((correctCount / completedCount) * 100)
            : 0,
      };

      progressByArea[area].totalCompleted += completedCount;
      progressByArea[area].totalCorrect += correctCount;
      progressByArea[area].totalPoints += points;
      progressByArea[area].topicsCount += 1;
    });

    const result = Object.values(progressByArea).map((areaData) => ({
      ...areaData,
      topics: Object.values(areaData.topics),
      overallAccuracy:
        areaData.totalCompleted > 0
          ? Math.round(
              (areaData.totalCorrect / areaData.totalCompleted) * 100
            )
          : 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in user progress API:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user progress',
      },
      { status: 500 }
    );
  }
}
