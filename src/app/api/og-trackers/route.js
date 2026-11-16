import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import {
  listExamHub,
  listPublicPaths,
} from '@/features/og-trackers/lib/examHierarchy';
import {
  getDashboardStats,
  OG_TRACKERS_SETUP_HINT,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function GET() {
  try {
    const session = await requireSessionEmail();
    const email = session.error ? null : session.email;

    const [hub, catalog, stats] = await Promise.all([
      listExamHub(email),
      listPublicPaths(email),
      email
        ? getDashboardStats(email)
        : Promise.resolve({
            videosCompleted: 0,
            leetcodeSolved: 0,
            codestudioSolved: 0,
            hackerrankSolved: 0,
            practiceCompleted: 0,
            mocksCompleted: 0,
            isPremium: false,
          }),
    ]);

    if (hub.setupRequired || catalog.setupRequired) {
      return NextResponse.json({
        success: true,
        exams: [],
        paths: [],
        stats,
        isPremium: hub.isPremium ?? catalog.isPremium,
        hierarchyReady: false,
        setupRequired: true,
        setupHint: OG_TRACKERS_SETUP_HINT,
      });
    }

    return NextResponse.json({
      success: true,
      exams: hub.exams || [],
      paths: catalog.paths || [],
      stats,
      isPremium: hub.isPremium,
      hierarchyReady: Boolean(hub.hierarchyReady),
      setupRequired: false,
    });
  } catch (err) {
    console.error('og-trackers GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load paths' },
      { status: 500 }
    );
  }
}
