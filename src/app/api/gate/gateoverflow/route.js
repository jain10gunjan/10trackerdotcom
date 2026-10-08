import axios from 'axios';
import { JSDOM } from 'jsdom';
import { verifyAdminAuth } from '@/middleware/adminAuth';
import { normalizeGateOverflowUrl } from '@/lib/gateoverflowUrl';

export async function GET(req) {
  try {
    const { isAdmin, error: authError } = await verifyAdminAuth();
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: authError || 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(req.url);
    const solutionUrl = normalizeGateOverflowUrl(
      searchParams.get('solutionUrl')
    );

    if (!solutionUrl) {
      return new Response(
        JSON.stringify({
          error: 'Valid gateoverflow.in solutionUrl parameter is required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await axios.get(solutionUrl, { timeout: 20000 });
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const pTags = document.querySelectorAll('.qa-q-view-content p');
    let questionText = '';
    pTags.forEach((p) => {
      questionText += p.textContent.trim() + '\n';
    });

    const questionSolution =
      document.querySelector('.qa-a-item-content div')?.innerHTML || null;

    const optionsList = document.querySelectorAll('ol li');

    const result = {
      question: questionText,
      questionSolution: questionSolution,
    };

    const optionLabels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < optionsList.length; i++) {
      if (i < optionLabels.length) {
        result[`options_${optionLabels[i]}`] =
          optionsList[i]?.textContent.trim() || '';
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching solution details:', error?.message || error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch solution details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
