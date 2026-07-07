import { proxyMcqCreationJson } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/rewrite — rewrite stems + solutions */
export async function POST(request) {
  const body = await request.text();
  return proxyMcqCreationJson("/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
