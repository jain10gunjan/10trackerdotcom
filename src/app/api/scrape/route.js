import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAdminOrAutomationSecret(request);
    if (!authResult.ok) {
      return forbiddenArticlesWriteResponse(authResult.error);
    }
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Extract data from the page
    const scrapedData = {
      title: $('h1.entry-title').text().trim(),
      publishedDate: $('time.entry-date.published').text().trim(),
      author: $('span.author-name').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content'),
      
      // Extract main content
      content: $('.entry-content').text().trim(),
      
      // Extract tables if present
      tables: [],
      
      // Extract links
      importantLinks: [],
      
      // Extract structured data (JSON-LD)
      structuredData: null
    };

    // Extract tables
    $('.entry-content table').each((index, element) => {
      const tableData = {
        headers: [],
        rows: []
      };

      // Extract headers
      $(element).find('th').each((i, th) => {
        tableData.headers.push($(th).text().trim());
      });

      // Extract rows
      $(element).find('tr').each((i, tr) => {
        const row = [];
        $(tr).find('td').each((j, td) => {
          row.push($(td).text().trim());
        });
        if (row.length > 0) {
          tableData.rows.push(row);
        }
      });

      scrapedData.tables.push(tableData);
    });

    // Extract important links
    $('.entry-content a').each((index, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      if (href && text) {
        scrapedData.importantLinks.push({
          text,
          url: href
        });
      }
    });

    // Extract JSON-LD structured data
    const jsonLdScript = $('script[type="application/ld+json"]').html();
    if (jsonLdScript) {
      try {
        scrapedData.structuredData = JSON.parse(jsonLdScript);
      } catch (e) {
        console.error('Error parsing JSON-LD:', e);
      }
    }

    // Extract FAQ data if present
    const faqData = scrapedData.structuredData?.mainEntity || [];
    scrapedData.faqs = faqData.map(item => ({
      question: item.name,
      answer: item.acceptedAnswer?.text
    }));

    return NextResponse.json({
      success: true,
      data: scrapedData
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }
  return NextResponse.json({ 
    message: 'POST a URL to scrape',
    example: {
      url: 'https://sarkariresult.com.im/ongc-apprentice-recruitment/'
    }
  });
}

