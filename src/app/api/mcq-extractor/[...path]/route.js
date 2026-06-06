import { NextResponse } from "next/server";
import apiFetch from "@/lib/apiFetch";
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

async function proxyGet(request, segments) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const { search } = new URL(request.url);
    const path = upstreamPath(segments);
    const upstream = await apiFetch(`${path}${search}`, { method: "GET" });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      let message = text || `Extractor API error (${upstream.status})`;
      try {
        const j = JSON.parse(text);
        message = j.error || j.message || message;
      } catch {
        /* plain text */
      }
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: forwardHeaders(upstream),
    });
  } catch (err) {
    console.error("[mcq-extractor proxy GET]", err);
    const msg = err?.message || "Proxy request failed";
    const status = /INTERNAL_API_SECRET|MCQ_API_URL/i.test(msg) ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** GET /api/mcq-extractor/outputs, /download/:id, etc. */
export async function GET(request, context) {
  const params = await context.params;
  return proxyGet(request, params.path);
}
