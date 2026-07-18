import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { isAllowedExternalApiUrl } from '@/features/mock-test/lib/mockTestUtils';

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
  }

  try {
    const { action, questionsApiUrl, solutionsApiUrl, apiKey, questions, solutions } = await request.json();

    if (action === 'fetch-questions') {
      if (!isAllowedExternalApiUrl(questionsApiUrl)) {
        return NextResponse.json({
          success: false,
          error: 'URL not allowed. Set MOCK_TEST_API_ALLOWLIST env (comma-separated hostnames).',
        }, { status: 400 });
      }
      // Fetch questions from external API
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      try {
        console.log('Fetching from:', questionsApiUrl);
        const response = await fetch(questionsApiUrl, { 
          headers,
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        // Check if we have the expected structure
        if (!data.success) {
          return NextResponse.json({ 
            success: false, 
            error: data.message || 'API response indicates failure' 
          });
        }

        // Transform the data to match our schema
        const transformedQuestions = transformQuestionsData(data.data || data);
        
        return NextResponse.json({
          success: true,
          questions: transformedQuestions,
          count: transformedQuestions.length
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to fetch from API: ${fetchError.message}` 
        });
      }
    }

    if (action === 'fetch-solutions') {
      if (!isAllowedExternalApiUrl(solutionsApiUrl)) {
        return NextResponse.json({
          success: false,
          error: 'URL not allowed. Set MOCK_TEST_API_ALLOWLIST env (comma-separated hostnames).',
        }, { status: 400 });
      }
      // Fetch solutions from external API
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      try {
        console.log('Fetching solutions from:', solutionsApiUrl);
        const response = await fetch(solutionsApiUrl, { 
          headers,
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Solutions API Response:', data);

        if (!data.success && !data.data) {
          return NextResponse.json({ 
            success: false, 
            error: data.message || 'API response format not recognized' 
          });
        }

        return NextResponse.json({
          success: true,
          solutions: data.data || data,
          count: Object.keys(data.data || data).length
        });
      } catch (fetchError) {
        console.error('Fetch solutions error:', fetchError);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to fetch solutions: ${fetchError.message}` 
        });
      }
    }

    if (action === 'save-to-database') {
      // Save questions to Supabase examtracker table
      try {
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'No questions provided to save' 
          });
        }

        const { getSupabaseServer } = require('@/lib/supabaseServer');
        const supabase = getSupabaseServer(true);

        // Prepare questions for database insertion
        const questionsToInsert = questions.map(q => ({
          _id: q._id,
          topic: q.topic,
          category: q.category,
          difficulty: q.difficulty,
          year: q.year,
          subject: q.subject,
          question: q.question,
          options_A: q.options_A,
          options_B: q.options_B,
          options_C: q.options_C,
          options_D: q.options_D,
          correct_option: q.correct_option,
          solution: q.solution,
          questionCode: q.questionCode,
          questionImage: q.questionImage,
          solutiontext: q.solutiontext,
          topicList: q.topicList,
          topic_list: q.topic_list
        }));

        // Upsert questions into examtracker table (insert or update if exists)
        const { data: insertData, error: insertError } = await supabase
          .from('examtracker')
          .upsert(questionsToInsert, { 
            onConflict: '_id',
            ignoreDuplicates: false 
          })
          .select();

        if (insertError) {
          console.error('Supabase insert error:', insertError);
          return NextResponse.json({ 
            success: false, 
            error: `Database insert failed: ${insertError.message}` 
          });
        }

        console.log(`Successfully saved ${questionsToInsert.length} questions to database`);
        
        return NextResponse.json({
          success: true,
          savedCount: questionsToInsert.length,
          message: `Successfully saved ${questionsToInsert.length} questions to database`
        });

      } catch (dbError) {
        console.error('Database save error:', dbError);
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
    console.error('API Integration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

// Transform questions data to match our schema
function transformQuestionsData(data) {
  console.log('Transforming data:', JSON.stringify(data, null, 2));
  const transformed = [];
  
  // Helper function to transform fields to lowercase, hyphenated format
  const transformField = (value) => {
    if (!value) return '';
    return value
      .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
      .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase() // Convert to lowercase
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Helper function to transform category field to uppercase, hyphenated format
  const transformCategoryField = (value) => {
    if (!value) return '';
    return value
      .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
      .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toUpperCase() // Convert to uppercase
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Helper function to decode HTML entities
  const decodeHtml = (html) => {
    if (!html) return '';
    
    // First, handle double-encoded entities (common issue)
    let decoded = html
      .replace(/&amp;lt;/g, '<')
      .replace(/&amp;gt;/g, '>')
      .replace(/&amp;amp;/g, '&')
      .replace(/&amp;quot;/g, '"')
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;nbsp;/g, ' ');
    
    // Then handle regular HTML entities
    decoded = decoded
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x60;/g, '`')
      .replace(/&#x3D;/g, '=')
      .replace(/&#x2B;/g, '+');
    
    return decoded;
  };
  
  // Handle different data structures
  if (Array.isArray(data)) {
    // If data is an array of questions
    data.forEach(q => {
      if (q._id) {

        transformed.push({
          _id: q._id,
          topic: transformField(q.topic || q.globalConcept?.[0]?.t?.title || ''),
                     category: transformCategoryField(q.course || q.category || ''),
          difficulty: q.difficulty || 'medium',
          year: transformField(q.title || q.year || ''),
          subject: q.globalConcept?.[0]?.c?.title || q.subject || '',
          question: decodeHtml((() => {
            const value = q.en?.value || '';
            const comp = q.en?.comp || '';
            if (value && comp) {
              return `${value} ${comp}`;
            }
            return value || comp || q.question || '';
          })()),
          options_A: decodeHtml(q.en?.options?.[0]?.value || q.options_A || ''),
          options_B: decodeHtml(q.en?.options?.[1]?.value || q.options_B || ''),
          options_C: decodeHtml(q.en?.options?.[2]?.value || q.options_C || ''),
          options_D: decodeHtml(q.en?.options?.[3]?.value || q.options_D || ''),
          correct_option: q.correctOption || q.correct_option || '',
          solution: q.solution || '',
          questionCode: q.questionCode || null,
          questionImage: q.questionImage || null,
          solutiontext: decodeHtml(q.sol?.en?.value || q.solutiontext || ''),
          topicList: q.topicList || null,
          topic_list: q.globalConcept?.[0] ? [
            q.globalConcept[0].s?.title || 'Home',
            q.globalConcept[0].c?.title || '',
            q.globalConcept[0].t?.title || '',
            q.globalConcept[0].st?.title || ''
          ].filter(Boolean) : null
        });
      }
    });
  } else if (data.sections) {
    // If data has sections with questions (Testbook API format)
    console.log('Processing sections structure, found', data.sections.length, 'sections');
    data.sections.forEach((section, sectionIndex) => {
      console.log(`Section ${sectionIndex}:`, section.title, 'with', section.questions?.length || 0, 'questions');
      if (section.questions && Array.isArray(section.questions)) {
        section.questions.forEach((q, qIndex) => {
          console.log(`Question ${qIndex}:`, q._id, q.en?.value?.substring(0, 50) + '...');
          if (q._id) {

            transformed.push({
              _id: q._id,
              topic: transformField(q.topic || section.title || ''),
              category: transformCategoryField(data.course || data.category || ''),
              difficulty: q.difficulty || 'medium',
              year: transformField(data.title || data.year || ''),
              subject: section.title || q.subject || '',
              question: decodeHtml((() => {
                const value = q.en?.value || '';
                const comp = q.en?.comp || '';
                if (value && comp) {
                  return `${value} ${comp}`;
                }
                return value || comp || q.question || '';
              })()),
              options_A: decodeHtml(q.en?.options?.[0]?.value || q.options_A || ''),
              options_B: decodeHtml(q.en?.options?.[1]?.value || q.options_B || ''),
              options_C: decodeHtml(q.en?.options?.[2]?.value || q.options_C || ''),
              options_D: decodeHtml(q.en?.options?.[3]?.value || q.options_D || ''),
              correct_option: q.correctOption || q.correct_option || '',
              solution: q.solution || '',
              questionCode: q.questionCode || null,
              questionImage: q.questionImage || null,
              solutiontext: decodeHtml(q.sol?.en?.value || q.solutiontext || ''),
              topicList: q.topicList || null,
              topic_list: [section.title, q.topic].filter(Boolean)
            });
          }
        });
      }
    });
  } else if (data._id) {
    // Single question object

    transformed.push({
      _id: data._id,
      topic: transformField(data.topic || data.globalConcept?.[0]?.t?.title || ''),
      category: transformCategoryField(data.course || data.category || ''),
      difficulty: data.difficulty || 'medium',
      year: transformField(data.title || data.year || ''),
      subject: data.globalConcept?.[0]?.c?.title || data.subject || '',
      question: decodeHtml((() => {
        const value = data.en?.value || '';
        const comp = data.en?.comp || '';
        if (value && comp) {
          return `${value} ${comp}`;
        }
        return value || comp || data.question || '';
      })()),
      options_A: decodeHtml(data.en?.options?.[0]?.value || data.options_A || ''),
      options_B: decodeHtml(data.en?.options?.[1]?.value || data.options_B || ''),
      options_C: decodeHtml(data.en?.options?.[2]?.value || data.options_C || ''),
      options_D: decodeHtml(data.en?.options?.[3]?.value || data.options_D || ''),
      correct_option: data.correctOption || data.correct_option || '',
      solution: data.solution || '',
      questionCode: data.questionCode || null,
      questionImage: data.questionImage || null,
      solutiontext: decodeHtml(data.sol?.en?.value || data.solutiontext || ''),
      topicList: data.topicList || null,
      topic_list: data.globalConcept?.[0] ? [
        data.globalConcept[0].s?.title || 'Home',
        data.globalConcept[0].c?.title || '',
        data.globalConcept[0].t?.title || '',
        data.globalConcept[0].st?.title || ''
      ].filter(Boolean) : null
    });
  }

  console.log('Transformed questions:', transformed.length);
  
  // If no questions were transformed, log the data structure for debugging
  if (transformed.length === 0) {
    console.log('No questions transformed. Data structure:', {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      hasSections: data && !!data.sections,
      sectionsCount: data && data.sections ? data.sections.length : 0,
      dataKeys: data ? Object.keys(data) : []
    });
  }
  
  return transformed;
}
