import { NextResponse } from "next/server";
import apiFetch from "@/lib/apiFetch";
import { verifyAdminAuth } from "@/middleware/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parseUpstreamError(upstream) {
  const text = await upstream.text().catch(() => "");
  let message = text || `MCQ API error (${upstream.status})`;
  try {
    const j = JSON.parse(text);
    message = j.error || j.message || message;
  } catch {
    /* plain text */
  }
  return message;
}

function configErrorStatus(msg) {
  return /INTERNAL_API_SECRET|MCQ_API_URL/i.test(msg) ? 503 : 500;
}

/** @param {string} path @param {RequestInit} [options] */
export async function proxyMcqCreationJson(path, options = {}) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const upstream = await apiFetch(path, options);

    if (!upstream.ok) {
      const message = await parseUpstreamError(upstream);
      return NextResponse.json(
        { success: false, error: message },
        { status: upstream.status }
      );
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error(`[mcq-creation proxy] ${path}`, err);
    const msg = err?.message || "Proxy request failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: configErrorStatus(msg) }
    );
  }
}

/** Forward multipart PDF uploads (buffer body to avoid Node formData issues). */
export async function proxyMcqCreationMultipart(path, request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Expected multipart/form-data PDF upload" },
        { status: 400 }
      );
    }

    const body = await request.arrayBuffer();
    if (!body.byteLength) {
      return NextResponse.json(
        { success: false, error: "Empty upload body" },
        { status: 400 }
      );
    }

    const headers = new Headers();
    headers.set("content-type", ct);

    const upstream = await apiFetch(path, { method: "POST", body, headers });

    if (!upstream.ok) {
      const message = await parseUpstreamError(upstream);
      return NextResponse.json(
        { success: false, error: message },
        { status: upstream.status }
      );
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error(`[mcq-creation multipart] ${path}`, err);
    const msg = err?.message || "Upload proxy failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: configErrorStatus(msg) }
    );
  }
}

/** Stream file download from upstream. */
export async function proxyMcqCreationDownload(path) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: authError || "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const upstream = await apiFetch(path, { method: "GET" });

    if (!upstream.ok) {
      const message = await parseUpstreamError(upstream);
      return NextResponse.json(
        { success: false, error: message },
        { status: upstream.status }
      );
    }

    const headers = new Headers();
    for (const name of [
      "content-type",
      "content-disposition",
      "content-length",
      "cache-control",
    ]) {
      const v = upstream.headers.get(name);
      if (v) headers.set(name, v);
    }
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    console.error(`[mcq-creation download] ${path}`, err);
    const msg = err?.message || "Download proxy failed";
    return NextResponse.json(
      { success: false, error: msg },
      { status: configErrorStatus(msg) }
    );
  }
}
