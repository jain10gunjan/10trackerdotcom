import { NextResponse } from 'next/server';
import { requireVendorApi } from '@/features/vendor-tests/server/requireVendorApi';
import {
  normalizeRollNo,
  assertRollNoUnique,
  validateRollNo,
  enrollmentRulesFromSettings,
} from '@/features/vendor-tests/lib/vendorEnrollment';

/**
 * GET — current member profile for this vendor
 */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  const member = ctx.member;
  if (!member) {
    return NextResponse.json({
      success: true,
      profile: {
        email: ctx.email,
        roll_no: null,
        display_name: null,
        branch: null,
        batch: null,
        year: null,
        role: ctx.role,
      },
      enrollmentComplete: false,
    });
  }

  return NextResponse.json({
    success: true,
    profile: {
      id: member.id,
      email: member.user_email,
      roll_no: member.roll_no,
      display_name: member.display_name,
      branch: member.branch,
      batch: member.batch,
      year: member.year,
      role: member.role,
      status: member.status,
    },
    enrollmentComplete: Boolean(normalizeRollNo(member.roll_no)),
  });
}

/**
 * PATCH — student self-update of enrollment fields
 * Body: { roll_no, display_name?, branch?, batch?, year? }
 */
export async function PATCH(request, { params }) {
  const { slug } = await params;
  const { error, ctx } = await requireVendorApi(slug, 'student');
  if (error) return error;

  try {
    const body = await request.json();
    const format = validateRollNo(
      body.roll_no ?? body.enrollment_number ?? body.rollNo,
      enrollmentRulesFromSettings(ctx.settings)
    );
    if (!format.ok) {
      return NextResponse.json({ success: false, error: format.error }, { status: 400 });
    }
    const rollNo = format.rollNo;

    let member = ctx.member;
    if (!member) {
      // Ensure membership row exists (domain auto-enroll may have raced)
      const { data: created, error: createErr } = await ctx.supabase
        .from('vendor_members')
        .upsert(
          {
            vendor_id: ctx.vendor.id,
            user_email: ctx.email,
            role: ctx.role || 'student',
            status: 'active',
            source: 'domain',
            roll_no: rollNo,
            display_name: body.display_name ? String(body.display_name).trim() : null,
            branch: body.branch ? String(body.branch).trim() : null,
            batch: body.batch ? String(body.batch).trim() : null,
            year: body.year != null && body.year !== '' ? String(body.year).trim() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'vendor_id,user_email' }
        )
        .select('*')
        .maybeSingle();
      if (createErr) {
        if (/unique|duplicate/i.test(createErr.message || '')) {
          return NextResponse.json(
            {
              success: false,
              error: 'This enrollment / roll number is already used by another member',
            },
            { status: 409 }
          );
        }
        return NextResponse.json({ success: false, error: createErr.message }, { status: 500 });
      }
      member = created;
    }

    const unique = await assertRollNoUnique(
      ctx.supabase,
      ctx.vendor.id,
      rollNo,
      member?.id || null
    );
    if (!unique.ok) {
      return NextResponse.json({ success: false, error: unique.error }, { status: 409 });
    }

    const updates = {
      roll_no: unique.rollNo,
      updated_at: new Date().toISOString(),
    };
    if (body.display_name !== undefined) {
      updates.display_name =
        body.display_name === null || body.display_name === ''
          ? null
          : String(body.display_name).trim();
    }
    if (body.branch !== undefined) {
      updates.branch =
        body.branch === null || body.branch === '' ? null : String(body.branch).trim();
    }
    if (body.batch !== undefined) {
      updates.batch =
        body.batch === null || body.batch === '' ? null : String(body.batch).trim();
    }
    if (body.year !== undefined) {
      updates.year =
        body.year === null || body.year === '' ? null : String(body.year).trim();
    }

    const { data, error: upErr } = await ctx.supabase
      .from('vendor_members')
      .update(updates)
      .eq('vendor_id', ctx.vendor.id)
      .eq('user_email', ctx.email)
      .select(
        'id, user_email, roll_no, display_name, branch, batch, year, role, status'
      )
      .maybeSingle();

    if (upErr) {
      if (/unique|duplicate/i.test(upErr.message || '')) {
        return NextResponse.json(
          {
            success: false,
            error: 'This enrollment / roll number is already used by another member',
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: data.id,
        email: data.user_email,
        roll_no: data.roll_no,
        display_name: data.display_name,
        branch: data.branch,
        batch: data.batch,
        year: data.year,
        role: data.role,
        status: data.status,
      },
      enrollmentComplete: true,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
