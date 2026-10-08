import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import {
  listActivePaths,
  getDashboardStats,
  OG_TRACKERS_SETUP_HINT,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function GET() {
  try {
    const session = await requireSessionEmail();
    const email = session.error ? null : session.email;

    const [catalog, stats] = await Promise.all([
      listActivePaths(email),
      email
        ? getDashboardStats(email)
        : Promise.resolve({
            videosCompleted: 0,
            leetcodeSolved: 0,
            codestudioSolved: 0,
            hackerrankSolved: 0,
            isPremium: false,
          }),
    ]);

    if (catalog.setupRequired) {
      return NextResponse.json({
        success: true,
        paths: [],
        stats,
        isPremium: catalog.isPremium,
        setupRequired: true,
        setupHint: OG_TRACKERS_SETUP_HINT,
      });
    }

    return NextResponse.json({
      success: true,
      paths: catalog.paths,
      stats,
      isPremium: catalog.isPremium,
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
