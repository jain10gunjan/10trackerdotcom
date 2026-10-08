import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/middleware/adminAuth';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 120000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildAutofillData(data = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, { type: 'text', text: value }];
      }
      return [key, value];
    })
  );
}

async function canvaRequest(path, token, { method = 'GET', body } = {}) {
  const response = await fetch(`${CANVA_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || `Canva API error (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function pollJob({ token, pathBuilder, jobId, timeoutMs, pollIntervalMs, getStatus }) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const payload = await canvaRequest(pathBuilder(jobId), token);
    const status = getStatus(payload);

    if (status === 'success' || status === 'failed') {
      return payload;
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out while waiting for Canva job ${jobId}`);
}

/**
 * POST /api/canva/render
 * Body:
 * {
 *   "brandTemplateId": "DAxxxxxxxxx",
 *   "data": { "headline": "Hello", "subhead": "World" },
 *   "designTitle": "My generated copy",
 *   "exportFormat": { "type": "png" },
 *   "timeoutMs": 120000,
 *   "pollIntervalMs": 2000
 * }
 */
export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const token = process.env.CANVA_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing CANVA_ACCESS_TOKEN environment variable',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      brandTemplateId,
      data = {},
      designTitle,
      exportFormat = { type: 'png' },
      timeoutMs = DEFAULT_TIMEOUT_MS,
      pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    } = body || {};

    if (!brandTemplateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: brandTemplateId',
        },
        { status: 400 }
      );
    }

    const autofillPayload = {
      brand_template_id: brandTemplateId,
      data: buildAutofillData(data),
      ...(designTitle ? { title: designTitle } : {}),
    };

    const autofillCreate = await canvaRequest('/autofills', token, {
      method: 'POST',
      body: autofillPayload,
    });
    const autofillJobId = autofillCreate?.job?.id;

    if (!autofillJobId) {
      throw new Error('Autofill job ID missing in Canva response');
    }

    const autofillResult = await pollJob({
      token,
      jobId: autofillJobId,
      timeoutMs,
      pollIntervalMs,
      pathBuilder: (id) => `/autofills/${id}`,
      getStatus: (payload) => payload?.job?.status,
    });

    if (autofillResult?.job?.status !== 'success') {
      return NextResponse.json(
        {
          success: false,
          stage: 'autofill',
          error: autofillResult?.job?.error || 'Autofill failed',
          job: autofillResult?.job || null,
        },
        { status: 422 }
      );
    }

    const newDesign = autofillResult?.job?.result?.design;
    const newDesignId = newDesign?.id;
    if (!newDesignId) {
      throw new Error('Autofill succeeded but design ID is missing');
    }

    const exportCreate = await canvaRequest('/exports', token, {
      method: 'POST',
      body: {
        design_id: newDesignId,
        format: exportFormat,
      },
    });
    const exportJobId = exportCreate?.job?.id;
    if (!exportJobId) {
      throw new Error('Export job ID missing in Canva response');
    }

    const exportResult = await pollJob({
      token,
      jobId: exportJobId,
      timeoutMs,
      pollIntervalMs,
      pathBuilder: (id) => `/exports/${id}`,
      getStatus: (payload) => payload?.job?.status,
    });

    if (exportResult?.job?.status !== 'success') {
      return NextResponse.json(
        {
          success: false,
          stage: 'export',
          error: exportResult?.job?.error || 'Export failed',
          design: newDesign,
          job: exportResult?.job || null,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Design autofilled and exported successfully',
      design: {
        id: newDesign.id,
        title: newDesign.title,
        url: newDesign.url,
        editUrl: newDesign?.urls?.edit_url || null,
        viewUrl: newDesign?.urls?.view_url || null,
      },
      export: {
        jobId: exportResult?.job?.id,
        urls: exportResult?.job?.urls || [],
      },
    });
  } catch (error) {
    console.error('Canva render error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to render Canva design',
        details: error?.payload || null,
      },
      { status: error?.status || 500 }
    );
  }
}
