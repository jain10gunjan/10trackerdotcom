import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { getStaticExamCatalog } from '@/lib/platformExams';

function parseOptionalDate(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error('exam_date must be YYYY-MM-DD');
  }
  return raw;
}

export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { data, error } = await supabase
      .from('platform_exams')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          exams: getStaticExamCatalog(),
          dbSetupRequired: true,
          setupHint: 'Run scripts/setup_platform_exams.sql in Supabase SQL Editor',
        });
      }
      throw error;
    }

    return NextResponse.json({ success: true, exams: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      slug,
      is_active,
      sort_order,
      name,
      description,
      image_url,
      icon,
      exam_date,
      exam_date_label,
      exam_date_visible,
    } = body || {};

    if (!slug) {
      return NextResponse.json({ success: false, error: 'slug is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const patch = { updated_at: new Date().toISOString() };
    if (typeof is_active === 'boolean') patch.is_active = is_active;
    if (sort_order != null) patch.sort_order = Number(sort_order);
    if (name != null) patch.name = String(name).trim();
    if (description != null) patch.description = String(description).trim();
    if (Object.prototype.hasOwnProperty.call(body, 'image_url')) {
      const raw = String(image_url || '').trim();
      if (raw && !/^https?:\/\//i.test(raw)) {
        return NextResponse.json(
          { success: false, error: 'image_url must be an http(s) URL' },
          { status: 400 }
        );
      }
      patch.image_url = raw || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'icon')) {
      const iconVal = String(icon || '').trim();
      patch.icon = iconVal || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'exam_date')) {
      patch.exam_date = parseOptionalDate(exam_date);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'exam_date_label')) {
      const label = String(exam_date_label || '').trim();
      patch.exam_date_label = label || null;
    }
    if (typeof exam_date_visible === 'boolean') {
      patch.exam_date_visible = exam_date_visible;
    }

    const { data, error } = await supabase
      .from('platform_exams')
      .update(patch)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      if (
        error.code === 'PGRST204' ||
        /exam_date/i.test(error.message || '')
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Exam date columns missing. Run supabase/migrations/add_platform_exam_dates.sql in Supabase SQL Editor.',
            dbSetupRequired: true,
          },
          { status: 400 }
        );
      }
      throw error;
    }
    return NextResponse.json({ success: true, exam: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
