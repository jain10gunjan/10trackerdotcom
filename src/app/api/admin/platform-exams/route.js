import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { getStaticExamCatalog } from '@/lib/platformExams';

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
    const { slug, is_active, sort_order, name, description } = await request.json();
    if (!slug) {
      return NextResponse.json({ success: false, error: 'slug is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const patch = { updated_at: new Date().toISOString() };
    if (typeof is_active === 'boolean') patch.is_active = is_active;
    if (sort_order != null) patch.sort_order = Number(sort_order);
    if (name != null) patch.name = String(name).trim();
    if (description != null) patch.description = String(description).trim();

    const { data, error } = await supabase
      .from('platform_exams')
      .update(patch)
      .eq('slug', slug)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, exam: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
