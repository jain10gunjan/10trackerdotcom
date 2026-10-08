import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  adminUpdatePath,
  adminDeletePath,
  adminListResources,
  adminCreateResource,
} from '@/features/og-trackers/lib/ogTrackerService';

export async function GET(_request, { params }) {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const { pathId } = await params;
    const resources = await adminListResources(pathId);
    return NextResponse.json({ success: true, resources });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const { pathId } = await params;
    const body = await request.json();
    const path = await adminUpdatePath(pathId, body);
    return NextResponse.json({ success: true, path });
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
    const { pathId } = await params;
    await adminDeletePath(pathId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function POST(request, { params }) {
  const { isAdmin, error } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error }, { status: 403 });
  }

  try {
    const { pathId } = await params;
    const body = await request.json();
    const resource = await adminCreateResource(pathId, body);
    return NextResponse.json({ success: true, resource });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
