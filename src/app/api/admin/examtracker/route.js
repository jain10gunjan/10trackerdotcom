import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { verifyAdminAuth } from "@/middleware/adminAuth";
import { getSupabaseServer, isValidServiceRoleKey } from "@/lib/supabaseServer";
import { normalizeRow } from "@/lib/examtrackerNormalize";
import {
  EXAMTRACKER_LIST_COLUMNS,
  applyCategoryFilter,
  applyChapterFilter,
  applyDifficultyFilter,
  applySubjectFilter,
  fetchFilterScope,
} from "@/lib/examtrackerFilters";
import { applyPublishLifecycleFilter, statusFromVerification } from "@/lib/examtrackerStatus";

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

    const category = searchParams.get("category");
    const subject = searchParams.get("subject");
    const chapter = searchParams.get("chapter");
    const topic = searchParams.get("topic");
    const status = searchParams.get("status");
    const difficulty = searchParams.get("difficulty");

    let q = supabase
      .from("examtracker")
      .select(EXAMTRACKER_LIST_COLUMNS, includeCount ? { count: "exact" } : undefined)
      .order("year", { ascending: false, nullsFirst: false })
      .order("_id", { ascending: true });

    if (category) q = applyCategoryFilter(q, category);
    if (subject) q = applySubjectFilter(q, subject);
    if (chapter) q = applyChapterFilter(q, chapter);
    if (topic) q = q.eq("topic", topic);
    // Prefer verification_status mirror — PostgREST may not expose `status` yet.
    if (status) q = applyPublishLifecycleFilter(q, status);
    if (difficulty) q = applyDifficultyFilter(q, difficulty);

    const { data, error, count } = await q.range(offset, offset + limit - 1);
    // PostgREST PGRST103: offset past end (e.g. UI kept page 3 after filter shrank).
    if (error) {
      const code = error.code || error.details || "";
      const msg = String(error.message || "");
      if (
        code === "PGRST103" ||
        /Requested range not satisfiable/i.test(msg) ||
        /offset of \d+ was requested/i.test(String(error.details || ""))
      ) {
        return NextResponse.json({
          success: true,
          questions: [],
          count: includeCount ? count ?? 0 : undefined,
          limit,
          offset,
        });
      }
      throw error;
    }

    const questions = (data ?? []).map((row) => ({
      ...row,
      status: statusFromVerification(row.verification_status, row.status),
    }));

    return NextResponse.json({
      success: true,
      questions,
      count: includeCount ? count ?? questions.length : undefined,
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
    // Preserve existing status on edit unless the payload sets it explicitly.
    const n = normalizeRow(raw, body?.defaults || {}, { defaultStatus: null });
    if (!n.ok) {
      return NextResponse.json({ success: false, error: n.error }, { status: 400 });
    }

    const supabase = getSupabaseServer(isValidServiceRoleKey());
    // PostgREST may not expose `status` / published_* yet — strip before upsert.
    const {
      status: _status,
      published_at: _publishedAt,
      published_by: _publishedBy,
      ...restRow
    } = n.row;
    const { error } = await supabase
      .from("examtracker")
      .upsert([restRow], { onConflict: "_id", ignoreDuplicates: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      question: { ...restRow, status: _status || statusFromVerification(restRow.verification_status) },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
