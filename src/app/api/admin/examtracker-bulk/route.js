import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { normalizeRow } from "@/lib/examtrackerNormalize";

function parseAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUser(user) {
  const adminEmails = parseAdminEmails();
  if (!user?.email || adminEmails.length === 0) return false;
  return adminEmails.includes(user.email.toLowerCase());
}

/**
 * POST { questions: object[], defaults?: object, mode?: 'upsert' | 'insert' }
 * Max ~200 rows per request recommended; client should chunk larger payloads.
 */
export async function POST(request) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    let list = body.questions ?? body.data ?? body.items;
    if (!Array.isArray(list)) {
      if (Array.isArray(body)) {
        list = body;
      } else {
        return NextResponse.json(
          {
            error:
              "Body must be { questions: [...] } or a JSON array of question objects",
          },
          { status: 400 }
        );
      }
    }

    if (list.length === 0) {
      return NextResponse.json(
        { error: "No questions in payload" },
        { status: 400 }
      );
    }

    if (list.length > 250) {
      return NextResponse.json(
        {
          error:
            "Too many rows in one request (max 250). Send multiple batches from the UI.",
        },
        { status: 400 }
      );
    }

    const defaults = body.defaults && typeof body.defaults === "object"
      ? body.defaults
      : {};
    const mode = body.mode === "insert" ? "insert" : "upsert";

    const rows = [];
    const rowErrors = [];

    for (let i = 0; i < list.length; i++) {
      const n = normalizeRow(list[i], defaults);
      if (!n.ok) {
        rowErrors.push({ index: i, error: n.error });
      } else {
        rows.push(n.row);
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          savedCount: 0,
          errors: rowErrors.slice(0, 50),
          message: "No valid rows to save",
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let dbError;

    if (mode === "insert") {
      const result = await supabase.from("examtracker").insert(rows);
      dbError = result.error;
    } else {
      const result = await supabase
        .from("examtracker")
        .upsert(rows, { onConflict: "_id", ignoreDuplicates: false });
      dbError = result.error;
    }

    if (dbError) {
      console.error("[examtracker-bulk]", dbError);
      return NextResponse.json(
        {
          success: false,
          error: dbError.message,
          hint:
            "Check RLS policies if using anon key; prefer SUPABASE_SERVICE_ROLE_KEY for server imports.",
          partialErrors: rowErrors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      savedCount: rows.length,
      mode,
      skippedInvalid: rowErrors.length,
      errors: rowErrors.slice(0, 30),
    });
  } catch (e) {
    console.error("[examtracker-bulk]", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
