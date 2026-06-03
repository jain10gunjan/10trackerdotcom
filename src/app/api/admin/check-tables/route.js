import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';

export async function GET() {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase configuration missing' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if tables exist
    const { data: mockTests, error: mockTestsError } = await supabase
      .from('mock_tests')
      .select('id')
      .limit(1);

    const { data: mockTestQuestions, error: mockTestQuestionsError } = await supabase
      .from('mock_test_questions')
      .select('id')
      .limit(1);

    const { data: examtracker, error: examtrackerError } = await supabase
      .from('examtracker')
      .select('_id')
      .limit(1);

    return NextResponse.json({
      success: true,
      tables: {
        mock_tests: {
          exists: !mockTestsError,
          error: mockTestsError?.message
        },
        mock_test_questions: {
          exists: !mockTestQuestionsError,
          error: mockTestQuestionsError?.message
        },
        examtracker: {
          exists: !examtrackerError,
          error: examtrackerError?.message
        }
      }
    });

  } catch (error) {
    console.error('Check tables error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}
