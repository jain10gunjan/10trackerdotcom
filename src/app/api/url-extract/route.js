import { proxyMcqCreationJson } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/url-extract — URL(s) → OpenAI web search → copyright-free MCQs */
export async function POST(request) {
  const body = await request.text();
  return proxyMcqCreationJson("/api/url-extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
