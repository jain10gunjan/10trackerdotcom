import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getStaticExamCatalog } from '@/lib/platformExams';

export async function GET() {
  try {
    const supabase = getSupabaseServer(false);
    const { data, error } = await supabase
      .from('platform_exams')
      .select('slug, name, description, category, image_url, icon, color_gradient, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        const fallback = getStaticExamCatalog().filter((e) => e.is_active);
        return NextResponse.json({ success: true, exams: fallback, source: 'static' });
      }
      throw error;
    }

    const exams = (data || []).length ? data : getStaticExamCatalog().filter((e) => e.is_active);

    return NextResponse.json({ success: true, exams, source: 'database' });
  } catch (err) {
    console.error('exams/active', err);
    const fallback = getStaticExamCatalog().filter((e) => e.is_active);
    return NextResponse.json({ success: true, exams: fallback, source: 'static_fallback' });
  }
}
