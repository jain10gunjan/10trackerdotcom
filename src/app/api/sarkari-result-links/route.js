import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map category names to database category values
const categoryMap = {
  'results': 'results',
  'admitCards': 'admit_cards',
  'latestJobs': 'latest_jobs',
  'answerKey': 'answer_key',
  'documents': 'documents',
  'admission': 'admission'
};

export async function GET(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'scrape';

    // Paginated listing mode for admin UI
    if (mode === 'list') {
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const limit = Math.min(
        Math.max(parseInt(searchParams.get('limit') || '20', 10), 1),
        50
      );
      const categoryFilter = searchParams.get('category') || null;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('sarkari_result_links')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching paginated Sarkari links:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'Failed to fetch Sarkari links',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 1,
        },
      });
    }

    const url = 'https://sarkariresult.com.cm/';
    
    // Fetch the HTML content
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Initialize result object
    const result = {
      results: [],
      admitCards: [],
      latestJobs: [],
      answerKey: [],
      documents: [],
      admission: []
    };

    // Helper function to extract links from a section by heading text
    const extractLinksFromSection = (sectionHeading) => {
      const links = [];
      
      // Find all heading elements and check their text
      $('p.gb-headline').each((index, element) => {
        const headingText = $(element).text().trim();
        
        // Check if this heading matches our target section
        if (headingText.toLowerCase().includes(sectionHeading.toLowerCase())) {
          // Find the parent grid column or container
          const $column = $(element).closest('.gb-grid-column');
          
          // Find all links in this column
          $column.find('a.wp-block-latest-posts__post-title').each((i, linkElement) => {
            const href = $(linkElement).attr('href');
            const text = $(linkElement).text().trim();
            
            if (href && text) {
              links.push({
                title: text,
                url: href
              });
            }
          });
        }
      });
      
      return links;
    };

    // Extract links for each category (limit to top 5 per category)
    result.results = extractLinksFromSection('Results').slice(0, 5);
    result.admitCards = extractLinksFromSection('Admit Cards').slice(0, 5);
    result.latestJobs = extractLinksFromSection('Latest Jobs').slice(0, 5);
    result.answerKey = extractLinksFromSection('Answer Key').slice(0, 5);
    result.documents = extractLinksFromSection('Documents').slice(0, 5);
    result.admission = extractLinksFromSection('Admission').slice(0, 5);

    // Save links to database and track what was saved vs already exists
    const saveResults = {
      saved: {},
      alreadyExists: {},
      errors: {}
    };

    // Process each category with batch queries for efficiency
    for (const [categoryKey, categoryValue] of Object.entries(categoryMap)) {
      const links = result[categoryKey] || [];
      saveResults.saved[categoryKey] = [];
      saveResults.alreadyExists[categoryKey] = [];
      saveResults.errors[categoryKey] = [];

      if (links.length === 0) continue;

      try {
        // Batch query: Get all existing URLs for this category in one query
        const urls = links.map(link => link.url);
        const { data: existingLinks, error: checkError } = await supabase
          .from('sarkari_result_links')
          .select('id, url')
          .eq('category', categoryValue)
          .in('url', urls);

        if (checkError) {
          console.error(`Error checking existing links for ${categoryKey}:`, checkError);
          // Fallback to individual processing if batch query fails
          for (const link of links) {
            saveResults.errors[categoryKey].push({
              title: link.title,
              url: link.url,
              error: checkError.message
            });
          }
          continue;
        }

        // Create a Set of existing URLs for fast lookup
        const existingUrls = new Set(existingLinks?.map(link => link.url) || []);

        // Separate new links from existing ones
        const newLinks = [];
        const existingLinksMap = new Map();

        for (const link of links) {
          if (existingUrls.has(link.url)) {
            // Find the existing link data
            const existingLink = existingLinks.find(el => el.url === link.url);
            saveResults.alreadyExists[categoryKey].push({
              title: link.title,
              url: link.url,
              id: existingLink?.id
            });
            existingLinksMap.set(link.url, existingLink);
          } else {
            newLinks.push({
              category: categoryValue,
              title: link.title,
              url: link.url
            });
          }
        }

        // Batch insert all new links in one query
        if (newLinks.length > 0) {
          const { data: insertedLinks, error: insertError } = await supabase
            .from('sarkari_result_links')
            .insert(newLinks)
            .select();

          if (insertError) {
            console.error(`Error inserting links for ${categoryKey}:`, insertError);
            // Track errors for all failed inserts
            for (const link of newLinks) {
              saveResults.errors[categoryKey].push({
                title: link.title,
                url: link.url,
                error: insertError.message
              });
            }
          } else {
            // Track successfully inserted links
            for (const insertedLink of insertedLinks || []) {
              saveResults.saved[categoryKey].push({
                title: insertedLink.title,
                url: insertedLink.url,
                id: insertedLink.id
              });
            }
          }
        }
      } catch (error) {
        console.error(`Unexpected error processing category ${categoryKey}:`, error);
        for (const link of links) {
          saveResults.errors[categoryKey].push({
            title: link.title,
            url: link.url,
            error: error.message
          });
        }
      }
    }

    // Prepare response message
    const responseMessage = [];

    for (const categoryKey of Object.keys(categoryMap)) {
      const savedCount = saveResults.saved[categoryKey].length;
      const existingCount = saveResults.alreadyExists[categoryKey].length;

      if (savedCount > 0) {
        responseMessage.push(`${savedCount} new ${categoryKey} link(s) saved to database`);
      }
      if (existingCount > 0) {
        responseMessage.push(`${existingCount} ${categoryKey} link(s) already exist in database`);
      }
    }

    if (responseMessage.length === 0) {
      responseMessage.push('No links to process');
    }

    return NextResponse.json({
      success: true,
      message: responseMessage.join('. '),
      data: result,
      counts: {
        results: result.results.length,
        admitCards: result.admitCards.length,
        latestJobs: result.latestJobs.length,
        answerKey: result.answerKey.length,
        documents: result.documents.length,
        admission: result.admission.length
      },
      database: {
        saved: saveResults.saved,
        alreadyExists: saveResults.alreadyExists,
        errors: saveResults.errors
      }
    });

  } catch (error) {
    console.error('Error fetching Sarkari Result links:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Failed to fetch links from Sarkari Result homepage'
      },
      { status: 500 }
    );
  }
}
