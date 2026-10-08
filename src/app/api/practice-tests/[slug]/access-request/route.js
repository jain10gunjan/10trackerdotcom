import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { normalizeEmail } from '@/lib/normalizeEmail';
import {
  fetchVendorBySlug,
  getVendorSupabase,
  writeVendorAuditLog,
  VENDOR_DB_SETUP_HINT,
} from '@/features/vendor-tests/lib/vendorDb';

/**
 * POST /api/practice-tests/[slug]/access-request
 * Body: { message?: string }
 * Signed-in users can request access without seeing vendor test data.
 */
export async function POST(request, { params }) {
  const { slug } = await params;
  const session = await auth();
  const email = normalizeEmail(session?.user?.email);
  if (!email) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const message = String(body?.message || '').trim().slice(0, 1000);

  try {
    const supabase = getVendorSupabase();
    const { vendor, error } = await fetchVendorBySlug(supabase, slug);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || VENDOR_DB_SETUP_HINT },
        { status: 503 }
      );
    }
    if (!vendor || vendor.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Institute not found' }, { status: 404 });
    }

    const { data, error: insertError } = await supabase
      .from('vendor_access_requests')
      .insert({
        vendor_id: vendor.id,
        user_email: email,
        message: message || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    await writeVendorAuditLog(supabase, {
      vendorId: vendor.id,
      actorEmail: email,
      action: 'access_request.created',
      entityType: 'vendor_access_request',
      entityId: data?.id,
      details: { message: message || null },
    });

    return NextResponse.json({
      success: true,
      message: 'Access request submitted. Your institute admin will review it.',
      id: data?.id,
    });
  } catch (err) {
    if (err?.code === 'VENDOR_SERVICE_ROLE_REQUIRED') {
      return NextResponse.json({ success: false, error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit request' },
      { status: 500 }
    );
  }
}
