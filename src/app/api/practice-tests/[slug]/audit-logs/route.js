import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';

/** GET recent audit logs — vendor admin */
export async function GET(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50));

  const { data, error: listError } = await ctx.supabase
    .from('vendor_audit_logs')
    .select('id, actor_email, action, entity_type, entity_id, details, created_at')
    .eq('vendor_id', ctx.vendor.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (listError) {
    return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, logs: data || [] });
}
