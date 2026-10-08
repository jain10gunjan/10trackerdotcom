import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import { writeVendorAuditLog } from '@/features/vendor-tests/lib/vendorDb';
import { isPlausibleDomain, normalizeDomain } from '@/features/vendor-tests/lib/vendorDomain';

/** GET allowed domains */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;

  return NextResponse.json({ success: true, domains: ctx.domains || [] });
}

/** POST { domain } — add domain */
export async function POST(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;
  if (!ctx.permissions.manageAccess) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const domain = normalizeDomain(body?.domain);
    if (!isPlausibleDomain(domain)) {
      return NextResponse.json({ success: false, error: 'Invalid domain' }, { status: 400 });
    }

    const { data, error: insertError } = await ctx.supabase
      .from('vendor_allowed_domains')
      .insert({
        vendor_id: ctx.vendor.id,
        domain,
        created_by: ctx.email,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, error: 'Domain already added' }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'domain.added',
      entityType: 'vendor_allowed_domain',
      entityId: data.id,
      details: { domain },
    });

    return NextResponse.json({ success: true, domain: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** DELETE ?domain= or body { domain } / { id } */
export async function DELETE(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'vendor_admin');
  if (error) return error;
  if (!ctx.permissions.manageAccess) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const id = body.id || searchParams.get('id');
    const domain = normalizeDomain(body.domain || searchParams.get('domain') || '');

    let query = ctx.supabase
      .from('vendor_allowed_domains')
      .delete()
      .eq('vendor_id', ctx.vendor.id);

    if (id) query = query.eq('id', id);
    else if (domain) query = query.eq('domain', domain);
    else {
      return NextResponse.json({ success: false, error: 'domain or id required' }, { status: 400 });
    }

    const { error: delError } = await query;
    if (delError) {
      return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
    }

    await writeVendorAuditLog(ctx.supabase, {
      vendorId: ctx.vendor.id,
      actorEmail: ctx.email,
      action: 'domain.removed',
      entityType: 'vendor_allowed_domain',
      entityId: id || domain,
      details: { domain: domain || null, id: id || null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
