import {
  proxyMcqCreationJson,
  proxyMcqCreationMultipart,
} from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/pipeline — PDF (multipart) or URL (JSON) → optional rewrite → export */
export async function POST(request) {
  const ct = request.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    return proxyMcqCreationMultipart("/api/pipeline", request);
  }

  const body = await request.text();
  return proxyMcqCreationJson("/api/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
