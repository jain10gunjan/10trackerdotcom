import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// GET - Fetch all article categories (public)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('article_categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return Response.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a category (admin or automation secret)
export async function POST(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }

  try {
    const body = await request.json();
    const name = (body?.name || '').trim();
    const slug = (
      body?.slug ||
      name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    ).trim();
    const color = (body?.color || '#3B82F6').trim();

    if (!name || !slug) {
      return Response.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('article_categories')
      .insert({ name, slug, color })
      .select('*')
      .single();

    if (error) throw error;

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}

// DELETE - Delete a category by slug (admin or automation secret)
export async function DELETE(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return Response.json({ success: false, error: 'slug is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('article_categories').delete().eq('slug', slug);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}
