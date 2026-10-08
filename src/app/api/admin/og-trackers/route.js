import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  adminListPaths,
  adminCreatePath,
  OG_TRACKERS_SETUP_HINT,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function GET() {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const result = await adminListPaths();
    return NextResponse.json({
      success: true,
      paths: result.paths,
      setupRequired: result.setupRequired,
      setupHint: result.setupRequired ? OG_TRACKERS_SETUP_HINT : null,
    });
  } catch (err) {
    console.error('admin/og-trackers GET', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const path = await adminCreatePath(body);
    return NextResponse.json({ success: true, path });
  } catch (err) {
    console.error('admin/og-trackers POST', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
