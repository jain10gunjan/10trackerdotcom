import { proxyMcqCreationDownload } from "@/lib/mcqCreationProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/export/download/:filename — download JSON export */
export async function GET(_request, context) {
  const params = await context.params;
  const filename = params?.filename;
  if (!filename) {
    return Response.json(
      { success: false, error: "Filename required" },
      { status: 400 }
    );
  }
  return proxyMcqCreationDownload(
    `/api/export/download/${encodeURIComponent(filename)}`
  );
}
