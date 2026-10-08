import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  adminUpdateResource,
  adminDeleteResource,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function PATCH(request, { params }) {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const { resourceId } = await params;
    const body = await request.json();
    const resource = await adminUpdateResource(resourceId, body);
    return NextResponse.json({ success: true, resource });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const { resourceId } = await params;
    await adminDeleteResource(resourceId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
