import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { getStaticExamCatalog } from '@/lib/platformExams';
import { fetchQuestionCountsBySlug } from '@/features/exams/lib/fetchExamCatalog';
import { revalidateExamCatalogCache } from '@/features/exams/lib/examCatalogCache';
import { categoryDisplayName, normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function attachQuestionCounts(exams, countsBySlug) {
  return (exams || []).map((exam) => {
    const slug = normalizeCategorySlug(exam.slug);
    const question_count = Number(countsBySlug?.[slug]) || 0;
    return { ...exam, question_count };
  });
}

function buildBankCategories(exams, countsBySlug) {
  const onPlatform = new Set((exams || []).map((exam) => normalizeCategorySlug(exam.slug)));
  return Object.entries(countsBySlug || {})
    .map(([slug, question_count]) => ({
      slug,
      name: categoryDisplayName(slug),
      question_count: Number(question_count) || 0,
      onPlatform: onPlatform.has(slug),
    }))
    .filter((row) => row.slug)
    .sort((a, b) => b.question_count - a.question_count || a.name.localeCompare(b.name));
}

function catalogGroups(exams) {
  return [...new Set((exams || []).map((exam) => String(exam.category || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );
}

function validateImageUrl(image_url) {
  const raw = String(image_url || '').trim();
  if (raw && !/^https?:\/\//i.test(raw)) {
    throw new Error('image_url must be an http(s) URL');
  }
  return raw || null;
}

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
        const staticExams = getStaticExamCatalog();
        const counts = await fetchQuestionCountsBySlug(staticExams.map((exam) => exam.slug));
        const exams = attachQuestionCounts(staticExams, counts);
        return NextResponse.json({
          success: true,
          exams,
          bankCategories: buildBankCategories(exams, counts),
          categories: catalogGroups(exams),
          dbSetupRequired: true,
          setupHint: 'Run supabase/migrations/setup_platform_exams.sql in Supabase SQL Editor',
        });
      }
      throw error;
    }

    const counts = await fetchQuestionCountsBySlug((data || []).map((exam) => exam.slug));
    const exams = attachQuestionCounts(data || [], counts);
    return NextResponse.json({
      success: true,
      exams,
      bankCategories: buildBankCategories(exams, counts),
      categories: catalogGroups(exams),
    });
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
      category,
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
    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      const nextCategory = String(category || '').trim();
      patch.category = nextCategory || null;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'image_url')) {
      try {
        patch.image_url = validateImageUrl(image_url);
      } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
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

    revalidateExamCatalogCache();

    const countSlug = normalizeCategorySlug(data.slug || slug);
    const counts = await fetchQuestionCountsBySlug([countSlug]);
    return NextResponse.json({
      success: true,
      exam: {
        ...data,
        question_count: Number(counts?.[countSlug]) || 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const slug = normalizeCategorySlug(body?.slug);
    const name = String(body?.name || '').trim();
    const description = String(body?.description || '').trim();
    const category = String(body?.category || '').trim();
    const icon = String(body?.icon || '').trim();

    if (!slug || !SLUG_RE.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'slug must be lowercase words separated by hyphens' },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    }

    let image_url = null;
    if (body?.image_url) {
      try {
        image_url = validateImageUrl(body.image_url);
      } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { data: existingRows, error: existingError } = await supabase
      .from('platform_exams')
      .select('sort_order');
    if (existingError) throw existingError;

    const nextOrder =
      (existingRows || []).reduce((max, row) => Math.max(max, Number(row.sort_order) || 0), 0) + 10;

    const { data, error } = await supabase
      .from('platform_exams')
      .insert({
        slug,
        name,
        description: description || null,
        category: category || null,
        image_url,
        icon: icon || null,
        sort_order: nextOrder,
        is_active: body?.is_active === true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'An exam with this slug already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    revalidateExamCatalogCache();
    const counts = await fetchQuestionCountsBySlug([slug]);
    return NextResponse.json({
      success: true,
      exam: {
        ...data,
        question_count: Number(counts?.[slug]) || 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
