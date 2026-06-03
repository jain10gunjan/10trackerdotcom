import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const { action, examCategory } = await request.json();

    if (action === 'fetch-all-questions') {
      try {
        const { getSupabaseServer } = require('@/lib/supabaseServer');
        const supabase = getSupabaseServer(true);

        // Fetch questions from examtracker table
        let query = supabase
          .from('examtracker')
          .select('*')
          .order('year', { ascending: false });

        // If examCategory is specified, filter by it
        if (examCategory && examCategory !== 'all') {
          query = query.eq('category', examCategory.toUpperCase());
        }

        const { data: questions, error: fetchError } = await query;

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
          return NextResponse.json({ 
            success: false, 
            error: `Database fetch failed: ${fetchError.message}` 
          });
        }

        console.log(`Successfully fetched ${questions?.length || 0} questions from database`);
        
        return NextResponse.json({
          success: true,
          questions: questions || [],
          count: questions?.length || 0
        });

      } catch (dbError) {
        console.error('Database operation error:', dbError);
        return NextResponse.json({ 
          success: false, 
          error: `Database operation failed: ${dbError.message}` 
        });
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    });

  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
