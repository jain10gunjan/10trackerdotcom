import { NextResponse } from "next/server";
import apiFetch from "@/lib/apiFetch";
import { verifyAdminAuth } from "@/middleware/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — proxy PDF extract SSE stream to the MCQ API (admin only). */
export async function POST(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { error: authError || "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data PDF upload" },
        { status: 400 }
      );
    }

    // Buffer the upload: request.formData() can fail in Node, and streaming
    // request.body with a forwarded content-length causes UND_ERR_REQ_CONTENT_LENGTH_MISMATCH.
    const body = await request.arrayBuffer();
    if (!body.byteLength) {
      return NextResponse.json({ error: "Empty upload body" }, { status: 400 });
    }

    const headers = new Headers();
    headers.set("content-type", ct);

    const upstream = await apiFetch("/api/extract", {
      method: "POST",
      body,
      headers,
    });

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

    const respHeaders = new Headers();
    const upstreamCt = upstream.headers.get("content-type");
    if (upstreamCt) respHeaders.set("Content-Type", upstreamCt);
    respHeaders.set("Cache-Control", "no-cache, no-transform");
    respHeaders.set("Connection", "keep-alive");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    console.error("[mcq-extractor/extract]", err);
    const msg = err?.message || "Extract proxy failed";
    const status = /INTERNAL_API_SECRET|MCQ_API_URL/i.test(msg) ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
