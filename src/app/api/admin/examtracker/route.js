import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { verifyAdminAuth } from "@/middleware/adminAuth";
import { getSupabaseServer, isValidServiceRoleKey } from "@/lib/supabaseServer";
import { normalizeRow } from "@/lib/examtrackerNormalize";
import {
  EXAMTRACKER_LIST_COLUMNS,
  applyCategoryFilter,
  applyChapterFilter,
  applySubjectFilter,
  fetchFilterScope,
} from "@/lib/examtrackerFilters";

const PAGE_SIZE_MAX = 500;

const getCachedCategories = unstable_cache(
  async () => {
    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { categories } = await fetchFilterScope(supabase, "categories");
    return categories;
  },
  ["admin-examtracker-categories"],
  { revalidate: 300, tags: ["examtracker-filters"] }
);

/** GET ?action=filters&scope=categories|subjects|chapters|topics|all */
export async function GET(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || "Admin required" }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "filters") {
      const scope = searchParams.get("scope") || "all";
      const category = searchParams.get("category") || undefined;
      const subject = searchParams.get("subject") || undefined;
      const chapter = searchParams.get("chapter") || undefined;

      let filters;
      if (scope === "categories") {
        const categories = await getCachedCategories();
        filters = { categories, subjects: [], chapters: [], topics: [] };
      } else {
        filters = await fetchFilterScope(supabase, scope, {
          category,
          subject,
          chapter,
        });
        if (scope === "all") {
          filters = {
            categories: filters.categories ?? [],
            subjects: filters.subjects ?? [],
            chapters: filters.chapters ?? [],
            topics: filters.topics ?? [],
          };
        }
      }

      return NextResponse.json({
        success: true,
        filters,
        scope,
        rpcRecommended: true,
        setupHint:
          "For fastest filters, run scripts/add_examtracker_filter_rpc.sql in Supabase SQL Editor.",
      });
    }

    const limit = Math.min(
      PAGE_SIZE_MAX,
      Math.max(1, Number(searchParams.get("limit")) || 100)
    );
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
    const includeCount = searchParams.get("includeCount") !== "false";

    let q = supabase
      .from("examtracker")
      .select(EXAMTRACKER_LIST_COLUMNS, includeCount ? { count: "exact" } : undefined)
      .order("year", { ascending: false, nullsFirst: false })
      .order("_id", { ascending: true });

    const category = searchParams.get("category");
    const subject = searchParams.get("subject");
    const chapter = searchParams.get("chapter");
    const topic = searchParams.get("topic");

    if (category) q = applyCategoryFilter(q, category);
    if (subject) q = applySubjectFilter(q, subject);
    if (chapter) q = applyChapterFilter(q, chapter);
    if (topic) q = q.eq("topic", topic);

    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      questions: data ?? [],
      count: includeCount ? count ?? data?.length ?? 0 : undefined,
      limit,
      offset,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** PUT — upsert single question */
export async function PUT(request) {
  const { isAdmin, error: authError } = await verifyAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: authError || "Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const raw = body?.question ?? body;
    const n = normalizeRow(raw, body?.defaults || {});
    if (!n.ok) {
      return NextResponse.json({ success: false, error: n.error }, { status: 400 });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    const { error } = await supabase
      .from("examtracker")
      .upsert([n.row], { onConflict: "_id", ignoreDuplicates: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, question: n.row });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
