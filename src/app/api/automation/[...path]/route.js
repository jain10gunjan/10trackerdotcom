import { NextResponse } from "next/server";
import automationFetch from "@/lib/automationFetch";
import { verifyAdminAuth } from "@/middleware/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upstreamPath(segments) {
  const joined = (segments || []).filter(Boolean).join("/");
  return `/api/${joined}`;
}

function forwardHeaders(upstream) {
  const headers = new Headers();
  for (const name of ["content-type", "content-disposition", "content-length", "cache-control"]) {
    const v = upstream.headers.get(name);
    if (v) headers.set(name, v);
  }
  return headers;
}

async function parseUpstreamError(upstream) {
  const text = await upstream.text().catch(() => "");
  let message = text || `Automation API error (${upstream.status})`;
  try {
    const j = JSON.parse(text);
    message = j.error || j.message || message;
  } catch {
    /* plain text */
  }
  return { message, text };
}

async function proxyRequest(request, segments, method) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const { search } = new URL(request.url);
    const path = upstreamPath(segments);
    const init = { method };

    if (method !== "GET" && method !== "HEAD") {
      const contentType = request.headers.get("content-type");
      const body = await request.text();
      if (body) {
        init.body = body;
        init.headers = contentType ? { "Content-Type": contentType } : undefined;
      }
    }

    const upstream = await automationFetch(`${path}${search}`, init);

    if (!upstream.ok) {
      const { message } = await parseUpstreamError(upstream);
      return NextResponse.json(
        { success: false, error: message },
        { status: upstream.status }
      );
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: forwardHeaders(upstream),
    });
  } catch (err) {
    console.error(`[automation proxy ${method}]`, err);
    const msg = err?.message || "Proxy request failed";
    const status = /AUTOMATION_API_URL/i.test(msg) ? 503 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

/** GET /api/automation/services/fetch/gktoday, /gktoday/rewrite, etc. */
export async function GET(request, context) {
  const params = await context.params;
  return proxyRequest(request, params.path, "GET");
}

/** POST /api/automation/articles/publish, etc. */
export async function POST(request, context) {
  const params = await context.params;
  return proxyRequest(request, params.path, "POST");
}
