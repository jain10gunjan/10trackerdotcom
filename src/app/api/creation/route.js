import { proxyMcqCreationJson } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/creation — MCQ Creation API health / index */
export async function GET() {
  return proxyMcqCreationJson("/api/creation", { method: "GET" });
}
