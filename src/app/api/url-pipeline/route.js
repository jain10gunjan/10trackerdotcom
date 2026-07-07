import { proxyMcqCreationJson } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/url-pipeline — URL → optional rewrite → export */
export async function POST(request) {
  const body = await request.text();
  return proxyMcqCreationJson("/api/url-pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
