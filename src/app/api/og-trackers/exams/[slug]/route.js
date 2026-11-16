import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getExamBySlug } from '@/features/og-trackers/lib/examHierarchy';
import { OG_TRACKERS_SETUP_HINT } from '@/features/og-trackers/lib/ogTrackerService';

export async function GET(_req, { params }) {
  try {
    const session = await requireSessionEmail();
    const email = session.error ? null : session.email;
    const { slug } = await params;

    const result = await getExamBySlug(slug, email);

    if (result.setupRequired) {
      return NextResponse.json({
        success: true,
        exam: null,
        chapters: [],
        setupRequired: true,
        setupHint: OG_TRACKERS_SETUP_HINT,
        isPremium: result.isPremium,
      });
    }

    if (!result.exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exam: result.exam,
      chapters: result.chapters,
      hierarchyReady: result.hierarchyReady,
      isPremium: result.isPremium,
      setupRequired: false,
    });
  } catch (err) {
    console.error('og-trackers exam GET', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load exam' },
      { status: 500 }
    );
  }
}
