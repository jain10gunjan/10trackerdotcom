import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { getCategoryVariants } from '@/lib/mockTestUtils';
import { insertWithSchemaFallback } from '@/lib/mockTestDb';
import {
  getSupabaseAdmin,
  formatAdminDbError,
  SUPABASE_ADMIN_SETUP_HINT,
} from '@/lib/supabaseAdmin';

export async function POST(request) {
  const { isAdmin, userEmail, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const {
      action,
      examCategory,
      testConfig,
      testData,
      testQuestions,
      questionIds,
      selectedYear,
      selectedCategory,
      selectedSubject,
      selectedTopic,
    } = await request.json();

    if (action === 'create-yearwise-test') {
      if (!examCategory || !testConfig?.testName || !Array.isArray(questionIds) || questionIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'examCategory, testConfig.testName, and questionIds are required' },
          { status: 400 }
        );
      }
      try {
        const supabase = getSupabaseAdmin();
        const category = getCategoryVariants(examCategory)[0] || String(examCategory).toUpperCase();
        const topicMeta = selectedTopic || selectedCategory || 'general';
        const subjectMeta = selectedSubject || 'general';

        // Insert test into mock_tests table
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
            name: testConfig.testName,
            category,
            questionCount: questionIds.length,
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

    if (action === 'create-topic-test') {
      const topic = String(testData?.topic || testData?.scopeTopic || '').trim();
      const subject = String(testData?.subject || testData?.scopeSubject || '').trim();
      const count = Math.min(20, Math.max(1, Number(testData?.questionCount) || 20));
      const duration = Number(testData?.duration) || 30;

      if (!topic) {
        return NextResponse.json(
          { success: false, error: 'topic is required for topic-wise tests' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      const category =
        testData.category ||
        getCategoryVariants(examCategory)[0] ||
        String(examCategory || '').toUpperCase();

      const descParts = ['Topic-wise test'];
      if (subject) descParts.push(`Subject: ${subject}`);
      if (topic) descParts.push(`Topic: ${topic}`);
      const description = descParts.join(' · ');

      const testName =
        (testData?.name && String(testData.name).trim()) ||
        (topic ? `${topic} Topic Test` : 'Topic-wise Test');

      const { data: examRows, error: examError } = await supabase
        .from('examtracker')
        .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject, chapter')
        .eq('category', category)
        .eq('topic', topic)
        .limit(count);

      if (examError) {
        return NextResponse.json({ success: false, error: examError.message }, { status: 500 });
      }

      const rows = examRows || [];
      if (rows.length < count) {
        return NextResponse.json(
          { success: false, error: `Only ${rows.length} questions found for this topic. Add more in examtracker or reduce count.` },
          { status: 400 }
        );
      }

      const testQuestionsPayload = rows.map((q, index) => ({
        question_id: q._id,
        question_order: index + 1,
        subject: q.subject || subject || 'Unknown',
        topic: q.topic || topic,
        difficulty: q.difficulty || 'medium',
      }));

      const insertPayload = {
        name: testName,
        description,
        duration,
        total_questions: testQuestionsPayload.length,
        difficulty: testData?.difficulty || 'mixed',
        category,
        include_general_aptitude: false,
        include_engineering_math: false,
        custom_weightage: false,
        creation_mode: 'topic_auto',
        created_by: userEmail || 'admin',
        is_active: true,
      };

      const { data: savedTest, error: testError } = await insertWithSchemaFallback(
        supabase,
        'mock_tests',
        insertPayload
      );

      if (testError) {
        return NextResponse.json(
          { success: false, error: `Failed to save test: ${testError.message}` },
          { status: 500 }
        );
      }

      const { error: questionsError } = await supabase.from('mock_test_questions').insert(
        testQuestionsPayload.map((q) => ({
          test_id: savedTest.id,
          question_id: q.question_id,
          question_order: q.question_order,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
        }))
      );

      if (questionsError) {
        await supabase.from('mock_tests').delete().eq('id', savedTest.id);
        return NextResponse.json(
          { success: false, error: `Failed to save questions: ${questionsError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        testId: savedTest.id,
        testName: savedTest.name,
        questionCount: testQuestionsPayload.length,
        message: `Topic test "${savedTest.name}" created with ${testQuestionsPayload.length} questions`,
      });
    }

    if (action === 'create-mock-test') {
      if (!testData?.name || !Array.isArray(testQuestions) || testQuestions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'testData.name and a non-empty testQuestions array are required' },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();
      const category =
        testData.category ||
        getCategoryVariants(examCategory)[0] ||
        String(examCategory || '').toUpperCase();

      const desc = String(testData.description || '').trim();
      const isTopicWise =
        desc.toLowerCase().startsWith('topic-wise test') ||
        String(testData.creation_mode || '') === 'topic_auto';

      const payload = {
        ...testData,
        category,
        total_questions: testQuestions.length,
        created_by: testData.created_by || userEmail || 'admin',
        description: desc || (isTopicWise ? 'Topic-wise test' : testData.description),
        creation_mode: isTopicWise ? 'topic_auto' : testData.creation_mode,
      };

      const { data: savedTest, error: testError } = await insertWithSchemaFallback(
        supabase,
        'mock_tests',
        payload
      );

      if (testError) {
        console.error('Error saving test:', testError);
        return NextResponse.json(
          {
            success: false,
            error: formatAdminDbError(testError),
            setupHint: SUPABASE_ADMIN_SETUP_HINT,
          },
          { status: 500 }
        );
      }

      const rows = testQuestions.map((q, index) => ({
        test_id: savedTest.id,
        question_id: q.question_id,
        question_order: q.question_order ?? index + 1,
        subject: q.subject || 'Unknown',
        topic: q.topic || '',
        difficulty: q.difficulty || 'medium',
      }));

      const { error: questionsError } = await supabase.from('mock_test_questions').insert(rows);

      if (questionsError) {
        console.error('Error saving questions:', questionsError);
        await supabase.from('mock_tests').delete().eq('id', savedTest.id);
        return NextResponse.json(
          { success: false, error: `Failed to save questions: ${questionsError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        testId: savedTest.id,
        testName: savedTest.name,
        questionCount: rows.length,
        message: `Test "${savedTest.name}" created successfully with ${rows.length} questions`,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    });

  } catch (error) {
    console.error('Create test API error:', error);
    return NextResponse.json({
      success: false,
      error: formatAdminDbError(error),
      setupHint: SUPABASE_ADMIN_SETUP_HINT,
    }, { status: 500 });
  }
}
