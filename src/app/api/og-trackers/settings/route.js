import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import {
  getUserPremiumState,
  updateJudgeUsernames,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function GET() {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  try {
    const state = await getUserPremiumState(email);
    return NextResponse.json({
      success: true,
      isPremium: state.isPremium,
      leetcodeUsername: state.leetcodeUsername,
      codestudioUsername: state.codestudioUsername,
      hackerrankUsername: state.hackerrankUsername,
    });
  } catch (err) {
    console.error('og-trackers/settings GET', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const { email, error, status } = await requireSessionEmail();
  if (error) {
    return NextResponse.json({ success: false, error }, { status });
  }

  try {
    const state = await getUserPremiumState(email);
    if (!state.isPremium) {
      return NextResponse.json(
        { success: false, error: 'Premium required to save judge usernames' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const data = await updateJudgeUsernames(email, {
      leetcodeUsername: body.leetcodeUsername,
      codestudioUsername: body.codestudioUsername,
      hackerrankUsername: body.hackerrankUsername,
    });

    return NextResponse.json({
      success: true,
      leetcodeUsername: data.leetcode_username,
      codestudioUsername: data.codestudio_username,
      hackerrankUsername: data.hackerrank_username,
      isPremium: data.is_premium,
    });
  } catch (err) {
    console.error('og-trackers/settings PUT', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
