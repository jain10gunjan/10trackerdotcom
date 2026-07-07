import { proxyMcqCreationJson } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/export — save MCQs to disk */
export async function POST(request) {
  const body = await request.text();
  return proxyMcqCreationJson("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
