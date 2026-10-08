import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import {
  verifyAdminOrAutomationSecret,
  forbiddenArticlesWriteResponse,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Helper function to get Supabase client (prefers service role for admin operations)
function getSupabaseClient(useServiceRole = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(url, key);
}

const supabase = getSupabaseClient();

// GET - Fetch one unposted entry (marks it as posted automatically)
export async function GET(request) {
  try {
    const auth = await verifyAdminOrAutomationSecret(request);
    if (!auth.ok) {
      return forbiddenArticlesWriteResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const markAsPosted = searchParams.get('mark_as_posted') !== 'false'; // Default true
    
    // Use service role key for update operations to ensure it works
    const adminSupabase = getSupabaseClient(true);
    
    // Fetch the oldest unposted entry
    const { data, error } = await supabase
      .from('postable_entries')
      .select('*')
      .eq('is_posted', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      // If no entry found, return appropriate response
      if (error.code === 'PGRST116') {
        return Response.json({
          success: false,
          message: 'No unposted entries available',
          data: null
        });
      }
      throw error;
    }

    // If entry found and markAsPosted is true, mark it as posted automatically
    if (data && markAsPosted) {
      let updateSuccess = false;
      
      // Method 1: Try using database function (most reliable, bypasses RLS)
      try {
        const { data: functionResult, error: functionError } = await supabase.rpc(
          'mark_postable_entry_as_posted',
          { entry_id: data.id }
        );
        
        if (!functionError && functionResult) {
          updateSuccess = true;
          data.is_posted = true;
        } else if (functionError) {
          console.log('Database function not available, trying direct update...');
        }
      } catch (functionErr) {
        console.log('Database function call failed, trying direct update...', functionErr.message);
      }

      // Method 2: Try direct update with service role key
      if (!updateSuccess) {
        const updateResult = await adminSupabase
          .from('postable_entries')
          .update({ is_posted: true })
          .eq('id', data.id)
          .eq('is_posted', false)
          .select()
          .single();

        if (!updateResult.error) {
          updateSuccess = true;
          data.is_posted = true;
        } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('Service role update failed:', updateResult.error);
        }
      }

      // Method 3: Fallback to anon key update
      if (!updateSuccess) {
        const fallbackResult = await supabase
          .from('postable_entries')
          .update({ is_posted: true })
          .eq('id', data.id)
          .eq('is_posted', false)
          .select()
          .single();
        
        if (!fallbackResult.error) {
          updateSuccess = true;
          data.is_posted = true;
        } else {
          console.error('All update methods failed:', fallbackResult.error);
          console.error('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
          console.warn('Entry fetched but could not be marked as posted. It will be fetched again.');
        }
      }
    }

    return Response.json({
      success: true,
      data: data,
      message: data ? (markAsPosted ? 'Entry fetched and marked as posted' : 'Entry fetched successfully') : 'No unposted entries available'
    });
  } catch (error) {
    console.error('Error fetching postable entry:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch postable entry',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new postable entry (admin only)
export async function POST(request) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, image_url, category } = body;

    // Validate required fields
    if (!title || !image_url || !category) {
      return Response.json(
        { success: false, error: 'Title, image_url, and category are required' },
        { status: 400 }
      );
    }

    // Use service role key for admin operations if available
    const adminSupabase = getSupabaseClient(true);
    
    // Insert new entry
    const { data, error } = await adminSupabase
      .from('postable_entries')
      .insert({
        title: title.trim(),
        image_url: image_url.trim(),
        category: category.trim(),
        is_posted: false
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data,
      message: 'Entry created successfully'
    });
  } catch (error) {
    console.error('Error creating postable entry:', error);
    return Response.json(
      { success: false, error: 'Failed to create entry', message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update an entry (admin only)
export async function PUT(request) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, title, image_url, category, is_posted } = body;

    if (!id) {
      return Response.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (image_url !== undefined) updateData.image_url = image_url.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (is_posted !== undefined) updateData.is_posted = is_posted;

    // Use service role key for admin operations if available
    const adminSupabase = getSupabaseClient(true);

    const { data, error } = await adminSupabase
      .from('postable_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      data,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating postable entry:', error);
    return Response.json(
      { success: false, error: 'Failed to update entry', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an entry (admin only)
export async function DELETE(request) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth(request);
    
    if (!isAdmin) {
      return Response.json(
        { success: false, error: authError || 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Use service role key for admin operations if available
    const adminSupabase = getSupabaseClient(true);

    const { error } = await adminSupabase
      .from('postable_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting postable entry:', error);
    return Response.json(
      { success: false, error: 'Failed to delete entry', message: error.message },
      { status: 500 }
    );
  }
}
