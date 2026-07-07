import { proxyMcqCreationMultipart } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/text-extract — PDF upload → extract MCQs */
export async function POST(request) {
  return proxyMcqCreationMultipart("/api/text-extract", request);
}
