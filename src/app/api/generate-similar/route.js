import { NextRequest, NextResponse } from "next/server";
import { guardAdminRewrite } from "@/lib/guardRewriteApi";
import { REWRITE_MODES } from "@/lib/rewriteRateLimit";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Detect question type from stem text — drives rewrite rules + token budget
const TYPE = {
  ASSERTION:     /Assertion\s*\(A\)|Reason\s*\(R\)/i,
  MULTI_STMT:    /consider the following|which of the following statements/i,
  MATCH:         /Match.*List|match.*column|match.*following/i,
  PLAIN:         /.*/,   // fallback
};

// Per-type token budgets: assertion/match need more room; plain facts need less
const TOKEN_BUDGET = {
  ASSERTION:  220,
  MULTI_STMT: 260,
  MATCH:      180,  // match stem is short — table stays unchanged
  PLAIN:      140,
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rewrite system prompt.
 *
 * Design principles:
 * - Explicit PRESERVE / CHANGE split so GPT has zero ambiguity
 * - Type-aware rules inline — handles all 4 question types in one prompt
 * - Hard output contract: stem only, no labels, no markdown
 * - Token-efficient: no padding, no examples (few-shot costs tokens we don't need here)
 */
const REWRITE_SYSTEM = `You rewrite Indian competitive exam question stems to avoid copyright while preserving full meaning and testability.

PRESERVE EXACTLY — never alter:
• All proper nouns, person names, place names, organisation names
• All dates, years, centuries, regnal periods
• All numerical values, percentages, measurements, scientific constants
• All acts, treaties, policies, schemes by their official name
• The correct answer (the stem must still have the same answer)
• Difficulty level and cognitive demand
• Question type structure (see TYPE RULES below)

CHANGE — rephrase every sentence:
• Reword the question sentence using different vocabulary and syntax
• Vary interrogative framing ("Which", "Who", "What", "Identify", "Select", etc.)
• Restructure clauses while retaining logical meaning

TYPE RULES:
1. PLAIN: Rewrite the question sentence only.
2. MULTI-STATEMENT (contains "I. II. III." or similar):
   • Rewrite the opening question sentence
   • Rewrite each statement (I, II, III…) — vary wording, keep factual content identical
   • Rewrite the closing question ("Which of the statements above is/are correct?")
   • Keep <br> tags exactly as they appear
3. ASSERTION-REASON (contains "Assertion (A):" and "Reason (R):"):
   • Rewrite each of Assertion and Reason in fresh language, facts unchanged
   • Reproduce the Codes block VERBATIM — do not touch it
   • Keep <br> tags exactly as they appear
4. MATCH (contains "Match List" or "Match Column"):
   • Rewrite the stem sentence only ("Match List I with List II…")
   • Do NOT touch the table — it is provided separately and unchanged
   • Output the rewritten sentence only

OUTPUT CONTRACT:
• Output the rewritten stem ONLY
• No options, no answer key, no labels like "Rewritten:", no markdown, no quotes
• Preserve all <br> tags in their original positions`;

const REWRITE_SOLUTION_SYSTEM = `You rewrite exam solution/explanation text for Indian competitive exams to avoid copyright while keeping facts, steps, and the same conclusion.

PRESERVE: all names, dates, numbers, formulas, and the final answer logic.
CHANGE: rephrase sentences; use different wording; keep HTML tags (<br>, <b>, lists) in equivalent positions.
OUTPUT: rewritten solution only — no labels, no "Rewritten:", no markdown fences.`;

/** Max items per single OpenAI completion (output token safety). */
const BATCH_CHUNK_SIZE = 12;

const BATCH_QUESTION_SUFFIX = `

BATCH MODE:
• You receive multiple items separated by "--- ITEM ---".
• Rewrite each item independently using the same rules as above.
• Return JSON only (no markdown fences): {"items":[{"id":"<id>","rewritten":"<text>"}, ...]}
• Include every input id exactly once, in the same order as input.`;

const BATCH_SOLUTION_SUFFIX = `

BATCH MODE:
• You receive multiple solutions separated by "--- ITEM ---".
• Rewrite each independently using the same rules as above.
• Return JSON only (no markdown fences): {"items":[{"id":"<id>","rewritten":"<text>"}, ...]}
• Include every input id exactly once, in the same order as input.`;

const GENERATE_SYSTEM = `You are a tutor generating a single similar multiple-choice question for Indian competitive exam practice (UPSC/State PSC style). Match the topic, format, and difficulty of the original. Use plain text; use MathJax (\\( \\)) for any math. Provide 4 options (A–D) and the correct answer with a 1–2 line explanation. No external references.`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function detectType(question) {
  if (TYPE.ASSERTION.test(question))  return "ASSERTION";
  if (TYPE.MULTI_STMT.test(question)) return "MULTI_STMT";
  if (TYPE.MATCH.test(question))      return "MATCH";
  return "PLAIN";
}

function buildRewriteUserMessage(question, qType) {
  // For match questions the stem is just the first sentence before <br>
  // For all others send the full stem — GPT knows what to rewrite per type rules
  const label = {
    PLAIN:      "PLAIN question",
    MULTI_STMT: "MULTI-STATEMENT question",
    ASSERTION:  "ASSERTION-REASON question",
    MATCH:      "MATCH question (rewrite stem sentence only)",
  }[qType];

  return `TYPE: ${label}\n\n${question.trim()}`;
}

function buildBatchUserMessage(items, kind) {
  const blocks = items.map((item) => {
    const id = String(item.id ?? "").trim();
    const text = String(item.text ?? "").trim();
    if (kind === "question") {
      const qType = detectType(text);
      const label = {
        PLAIN: "PLAIN",
        MULTI_STMT: "MULTI-STATEMENT",
        ASSERTION: "ASSERTION-REASON",
        MATCH: "MATCH",
      }[qType];
      return `--- ITEM id=${id} TYPE=${label} ---\n${text}`;
    }
    return `--- ITEM id=${id} ---\n${text}`;
  });
  return `${blocks.join("\n\n")}\n\nReturn the JSON object with all ids rewritten.`;
}

function parseBatchJson(content) {
  let t = String(content || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  const parsed = JSON.parse(t);
  const list = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(list)) {
    throw new Error("Batch response is not a JSON array of items");
  }
  const map = new Map();
  for (const row of list) {
    const id = String(row?.id ?? "").trim();
    const rewritten = String(row?.rewritten ?? row?.content ?? "").trim();
    if (id && rewritten) map.set(id, rewritten);
  }
  return map;
}

function mergeUsage(acc, usage) {
  if (!usage) return acc;
  return {
    promptTokens: acc.promptTokens + (usage.promptTokens ?? 0),
    completionTokens: acc.completionTokens + (usage.completionTokens ?? 0),
    cachedTokens: acc.cachedTokens + (usage.cachedTokens ?? 0),
  };
}

function budgetForQuestionBatch(items) {
  const sum = items.reduce(
    (n, item) => n + (TOKEN_BUDGET[detectType(String(item.text ?? ""))] ?? 140),
    0
  );
  return Math.min(4096, Math.max(256, sum + 64));
}

function budgetForSolutionBatch(items) {
  return Math.min(4096, Math.max(256, items.length * 280 + 64));
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function rewriteBatchChunk({
  kind,
  items,
  apiKey,
  fallbackSingle,
}) {
  const isQuestion = kind === "question";
  const system =
    (isQuestion ? REWRITE_SYSTEM : REWRITE_SOLUTION_SYSTEM) +
    (isQuestion ? BATCH_QUESTION_SUFFIX : BATCH_SOLUTION_SUFFIX);
  const user = buildBatchUserMessage(items, kind);
  const maxTokens = isQuestion
    ? budgetForQuestionBatch(items)
    : budgetForSolutionBatch(items);

  try {
    const { content, usage } = await callOpenAI({
      system,
      user,
      maxTokens,
      temperature: 0.35,
      apiKey,
    });
    const map = parseBatchJson(content);
    const results = items.map((item) => {
      const id = String(item.id ?? "").trim();
      const rewritten = map.get(id);
      if (!rewritten) {
        return { id, ok: false, error: "Missing id in batch response" };
      }
      return { id, ok: true, rewritten };
    });
    return { results, usage, openAiCalls: 1, fallback: false };
  } catch (batchErr) {
    console.warn("[rewrite-bulk] batch chunk failed, falling back per item:", batchErr.message);
    let usage = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
    let openAiCalls = 0;
    const results = [];
    for (const item of items) {
      try {
        const single = await fallbackSingle(item);
        results.push({ id: item.id, ok: true, rewritten: single.rewritten });
        usage = mergeUsage(usage, single.usage);
        openAiCalls += 1;
      } catch (e) {
        results.push({ id: item.id, ok: false, error: e.message });
      }
    }
    return { results, usage, openAiCalls, fallback: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENAI CALL — default gpt-4o-mini (override with OPENAI_REWRITE_MODEL)
// ─────────────────────────────────────────────────────────────────────────────

const OPENAI_REWRITE_MODEL =
  process.env.OPENAI_REWRITE_MODEL?.trim() || "gpt-4o-mini";

async function callOpenAI({ system, user, maxTokens, temperature, apiKey }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_REWRITE_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user   },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content?.trim() ?? "";
  const usage = json?.usage ?? null;
  const cachedTokens = usage?.prompt_tokens_details?.cached_tokens ?? 0;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;

  return { content, usage: { promptTokens, completionTokens, cachedTokens } };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { mode, question, prompt, maxTokens } = body;

    if (REWRITE_MODES.has(mode)) {
      const authResult = await guardAdminRewrite(mode);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    // ── Mode: rewrite-question ───────────────────────────────────────────────
    if (mode === "rewrite-question") {
      if (!question || typeof question !== "string" || !question.trim()) {
        return NextResponse.json({ error: "question is required for rewrite mode" }, { status: 400 });
      }

      const qType     = detectType(question);
      const budget    = TOKEN_BUDGET[qType];
      // Respect caller override but cap sensibly
      const tokenCap  = maxTokens
        ? Math.max(64, Math.min(400, Number(maxTokens)))
        : budget;

      const { content, usage } = await callOpenAI({
        system:      REWRITE_SYSTEM,
        user:        buildRewriteUserMessage(question, qType),
        maxTokens:   tokenCap,
        temperature: 0.35,   // low enough for factual faithfulness, slight variation
        apiKey,
      });

      if (!content) {
        return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
      }

      return NextResponse.json({
        content,
        qType,
        model: OPENAI_REWRITE_MODEL,
        usage,
        promptCachingNote:
          usage.cachedTokens > 0
            ? "OpenAI prompt cache hit on repeated prefix"
            : "No cache hit (prompt may be under 1024 tokens or prefix changed)",
      });
    }

    // ── Mode: rewrite-bulk (one HTTP call → 1–2 OpenAI calls, chunked) ───────
    if (mode === "rewrite-bulk") {
      const questions = Array.isArray(body.questions) ? body.questions : [];
      const solutions = Array.isArray(body.solutions) ? body.solutions : [];
      const rewriteQuestions = body.rewriteQuestions !== false;
      const rewriteSolutions = Boolean(body.rewriteSolutions);

      if (!rewriteQuestions && !rewriteSolutions) {
        return NextResponse.json(
          { error: "Enable rewriteQuestions and/or rewriteSolutions" },
          { status: 400 }
        );
      }

      const qItems = rewriteQuestions
        ? questions
            .filter((q) => q?.id && String(q.text ?? "").trim())
            .map((q) => ({ id: String(q.id), text: String(q.text).trim() }))
        : [];

      const sItems = rewriteSolutions
        ? solutions
            .filter((q) => q?.id && String(q.text ?? "").trim())
            .map((q) => ({ id: String(q.id), text: String(q.text).trim() }))
        : [];

      if (!qItems.length && !sItems.length) {
        return NextResponse.json(
          { error: "No non-empty questions or solutions to rewrite" },
          { status: 400 }
        );
      }

      if (qItems.length + sItems.length > 40) {
        return NextResponse.json(
          { error: "Too many items in one bulk request (max 40 total)" },
          { status: 400 }
        );
      }

      let totalUsage = { promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
      let openAiCalls = 0;
      let usedFallback = false;
      const questionResults = {};
      const solutionResults = {};

      const fallbackQuestion = async (item) => {
        const qType = detectType(item.text);
        const budget = TOKEN_BUDGET[qType];
        const { content, usage } = await callOpenAI({
          system: REWRITE_SYSTEM,
          user: buildRewriteUserMessage(item.text, qType),
          maxTokens: budget,
          temperature: 0.35,
          apiKey,
        });
        return { rewritten: content, usage };
      };

      const fallbackSolution = async (item) => {
        const { content, usage } = await callOpenAI({
          system: REWRITE_SOLUTION_SYSTEM,
          user: item.text.trim(),
          maxTokens: 280,
          temperature: 0.35,
          apiKey,
        });
        return { rewritten: content, usage };
      };

      for (const chunk of chunkArray(qItems, BATCH_CHUNK_SIZE)) {
        const { results, usage, fallback, openAiCalls: calls } =
          await rewriteBatchChunk({
            kind: "question",
            items: chunk,
            apiKey,
            fallbackSingle: fallbackQuestion,
          });
        openAiCalls += calls ?? 1;
        if (fallback) usedFallback = true;
        totalUsage = mergeUsage(totalUsage, usage);
        for (const r of results) {
          questionResults[r.id] = r;
        }
      }

      for (const chunk of chunkArray(sItems, BATCH_CHUNK_SIZE)) {
        const { results, usage, fallback, openAiCalls: calls } =
          await rewriteBatchChunk({
            kind: "solution",
            items: chunk,
            apiKey,
            fallbackSingle: fallbackSolution,
          });
        openAiCalls += calls ?? 1;
        if (fallback) usedFallback = true;
        totalUsage = mergeUsage(totalUsage, usage);
        for (const r of results) {
          solutionResults[r.id] = r;
        }
      }

      return NextResponse.json({
        questionResults,
        solutionResults,
        model: OPENAI_REWRITE_MODEL,
        usage: totalUsage,
        openAiCalls,
        usedFallback,
        promptCachingNote:
          totalUsage.cachedTokens > 0
            ? "OpenAI prompt cache hit on shared system prompt"
            : "Batch mode: system prompt sent once per chunk (questions + solutions)",
      });
    }

    if (mode === "rewrite-solution") {
      if (!question || typeof question !== "string" || !question.trim()) {
        return NextResponse.json({ error: "question is required for rewrite-solution" }, { status: 400 });
      }

      const tokenCap = maxTokens
        ? Math.max(64, Math.min(600, Number(maxTokens)))
        : 280;

      const { content, usage } = await callOpenAI({
        system: REWRITE_SOLUTION_SYSTEM,
        user: question.trim(),
        maxTokens: tokenCap,
        temperature: 0.35,
        apiKey,
      });

      if (!content) {
        return NextResponse.json({ error: "Empty response from model" }, { status: 502 });
      }

      return NextResponse.json({
        content,
        model: OPENAI_REWRITE_MODEL,
        usage,
        promptCachingNote:
          usage.cachedTokens > 0
            ? "OpenAI prompt cache hit on repeated prefix"
            : "Solution prompts are often under 1024 tokens — cache rarely applies",
      });
    }

    // ── Mode: generate (default) ─────────────────────────────────────────────
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const tokenCap = maxTokens
      ? Math.max(64, Math.min(800, Number(maxTokens)))
      : 512;

    const { content, usage } = await callOpenAI({
      system:      GENERATE_SYSTEM,
      user:        prompt.trim(),
      maxTokens:   tokenCap,
      temperature: 0.8,
      apiKey,
    });

    return NextResponse.json({
      content: content || "Could not generate a question at this time.",
      model: OPENAI_REWRITE_MODEL,
      usage,
    });

  } catch (err) {
    console.error("[gpt route]", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}