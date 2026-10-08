import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';

export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.slice(0, 8000) : 'Hello!';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_TITLE || 'cattracker',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-2',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter upstream status:', response.status);
      return NextResponse.json(
        { error: 'Upstream request failed' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('OpenRouter error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
