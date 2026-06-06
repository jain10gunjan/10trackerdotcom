import { redirect } from "next/navigation";

/** Legacy route → new admin MCQ extractor */
export default function LegacyPdfMcqsRedirect() {
  redirect("/admin/mcq-extractor");
}
