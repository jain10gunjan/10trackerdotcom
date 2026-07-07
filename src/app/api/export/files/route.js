import { proxyMcqCreationJson } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/export/files — list saved exports */
export async function GET() {
  return proxyMcqCreationJson("/api/export/files", { method: "GET" });
}
