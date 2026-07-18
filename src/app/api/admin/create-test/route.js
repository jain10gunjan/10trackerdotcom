import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const { action, examCategory, testConfig, questionIds, selectedYear, selectedCategory, selectedSubject, selectedTopic } = await request.json();

    if (action === 'create-yearwise-test') {
      if (!examCategory || !testConfig?.testName || !Array.isArray(questionIds) || questionIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'examCategory, testConfig.testName, and questionIds are required' },
          { status: 400 }
        );
      }
      try {
        const supabase = getSupabaseServer(true);
        const category = getCategoryVariants(examCategory)[0] || String(examCategory).toUpperCase();
        const topicMeta = selectedTopic || selectedCategory || 'general';
        const subjectMeta = selectedSubject || 'general';

        const { data: insertData, error: insertError } = await supabase
          .from('mock_tests')
          .insert([{
            name: testConfig.testName,
            description: `Year-wise test for ${selectedYear || 'all years'}`,
            duration: testConfig.duration,
            total_questions: questionIds.length,
            difficulty: 'mixed',
            is_active: true,
            created_by: userEmail || 'admin',
            category,
          }])
          .select();

        if (insertError) {
          console.error('Test insert error:', insertError);
          console.error('Test data being inserted:', {
            name: testData.testName,
            description: `Year-wise test for ${selectedYear || 'all years'}`,
            duration: testData.duration,
            total_questions: testData.questionCount,
            difficulty: 'mixed',
            is_active: true,
            created_by: 'admin',
            category: examCategory.toUpperCase()
          });
          return NextResponse.json({ 
            success: false, 
            error: `Test creation failed: ${insertError.message || insertError.details || 'Unknown database error'}` 
          });
        }

        // Get the inserted test ID
        const insertedTestId = insertData[0].id;

        // Create test questions mapping
        const testQuestions = questionIds.map((questionId, index) => ({
          test_id: insertedTestId,
          question_id: questionId,
          question_order: index + 1,
          subject: subjectMeta,
          topic: topicMeta,
          difficulty: 'medium'
        }));

        // Insert test questions into mock_test_questions table
        const { data: questionsData, error: questionsError } = await supabase
          .from('mock_test_questions')
          .insert(testQuestions)
          .select();

        if (questionsError) {
          console.error('Test questions insert error:', questionsError);
          console.error('First test question being inserted:', testQuestions[0]);
          // Try to delete the test if questions insertion fails
          await supabase.from('mock_tests').delete().eq('id', insertedTestId);
          return NextResponse.json({ 
            success: false, 
            error: `Test questions creation failed: ${questionsError.message || questionsError.details || 'Unknown database error'}` 
          });
        }

        console.log(`Successfully created test "${testConfig.testName}" with ${questionIds.length} questions`);
        
        return NextResponse.json({
          success: true,
          testId: insertedTestId,
          testName: testConfig.testName,
          questionCount: questionIds.length,
          message: `Test "${testConfig.testName}" created successfully with ${questionIds.length} questions`
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
    console.error('Create test API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
