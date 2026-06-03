import { getProgressUserId } from "@/lib/progressIdentity";

const PROGRESS_BUFFER_VERSION = 1;

export const POINTS_PER_CORRECT_ANSWER = 100;

export const getProgressBufferKey = (userId) =>
  `pyq-progress-buffer:v${PROGRESS_BUFFER_VERSION}:${userId ?? "anon"}`;

const safeJsonParse = (s, fallback) => {
  try { return JSON.parse(s); } catch (_) { return fallback; }
};

export const readProgressBuffer = (userId) => {
  if (typeof window === "undefined") return { v: PROGRESS_BUFFER_VERSION, entries: {} };
  const raw = window.localStorage.getItem(getProgressBufferKey(userId));
  const parsed = safeJsonParse(raw, null);
  if (!parsed || typeof parsed !== "object") return { v: PROGRESS_BUFFER_VERSION, entries: {} };
  if (parsed.v !== PROGRESS_BUFFER_VERSION || !parsed.entries || typeof parsed.entries !== "object")
    return { v: PROGRESS_BUFFER_VERSION, entries: {} };
  return parsed;
};

export const writeProgressBuffer = (userId, buffer) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getProgressBufferKey(userId),
    JSON.stringify({ ...buffer, v: PROGRESS_BUFFER_VERSION, updatedAt: Date.now() })
  );
};

export const clearProgressBuffer = (userId) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getProgressBufferKey(userId));
};

export const getUnsavedCount = (userId) => {
  const buffer = readProgressBuffer(userId);
  return Object.keys(buffer.entries ?? {}).length;
};

const progressQuestionId = (id) => (id == null ? "" : String(id));

/**
 * Saves *all* buffered entries for the given user, grouped by area+topic.
 * Minimizes roundtrips by doing:
 * - one SELECT per area (with topic IN (...))
 * - one UPSERT per area (multi-row)
 */
export async function saveProgressBufferToSupabase({
  supabase,
  upsertUserProgress,
  user,
  onMissingTopic,
} = {}) {
  const userId = getProgressUserId(user);
  if (!supabase || !upsertUserProgress) throw new Error("Missing supabase or upsertUserProgress");
  if (!userId) throw new Error("Missing user");

  const buffer = readProgressBuffer(userId);
  const entriesObj = buffer.entries ?? {};
  const qids = Object.keys(entriesObj);
  if (!qids.length) return { saved: 0, cleared: false };

  // Group buffered question updates by area+topic
  const groups = new Map(); // key: `${area}::${topic}` -> { area, topic, qids:Set, updates:Map<qid, entry> }
  for (const qidRaw of qids) {
    const e = entriesObj[qidRaw];
    if (!e || typeof e !== "object") continue;
    const area = String(e.area ?? "").trim().toLowerCase();
    const topic = String(e.topic ?? "").trim();
    if (!area || !topic) {
      if (typeof onMissingTopic === "function") onMissingTopic({ qid: qidRaw, entry: e });
      continue;
    }
    const qid = progressQuestionId(qidRaw);
    const key = `${area}::${topic}`;
    if (!groups.has(key)) groups.set(key, { area, topic, qids: new Set(), updates: new Map() });
    const g = groups.get(key);
    g.qids.add(qid);
    g.updates.set(qid, e);
  }

  if (!groups.size) return { saved: 0, cleared: false };

  // Group by area to reduce queries
  const byArea = new Map(); // area -> Map(topic -> group)
  for (const g of groups.values()) {
    if (!byArea.has(g.area)) byArea.set(g.area, new Map());
    byArea.get(g.area).set(g.topic, g);
  }

  let savedRows = 0;

  for (const [area, topicMap] of byArea.entries()) {
    const topics = [...topicMap.keys()];

    const { data: existing, error: fetchErr } = await supabase
      .from("user_progress")
      .select("topic, completedquestions, correctanswers, points")
      .eq("user_id", userId)
      .eq("area", area)
      .in("topic", topics);
    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

    const existingMap = new Map((existing ?? []).map((r) => [String(r.topic ?? "").trim(), r]));

    const upsertRows = topics.map((topic) => {
      const group = topicMap.get(topic);
      const prev = existingMap.get(topic);

      const prevCompleted = (Array.isArray(prev?.completedquestions) ? prev.completedquestions : [])
        .map(progressQuestionId);
      const prevCorrect = (Array.isArray(prev?.correctanswers) ? prev.correctanswers : [])
        .map(progressQuestionId);
      const prevPoints = typeof prev?.points === "number" ? prev.points : 0;
      const prevCompletedSet = new Set(prevCompleted);

      const deltaCompleted = [...group.qids].map(progressQuestionId);
      const mergedCompleted = [...new Set([...prevCompleted, ...deltaCompleted])];

      // Correct answers are "last write wins" for touched ids in this buffer
      let mergedCorrect = [...prevCorrect];
      for (const qid of group.qids) {
        const u = group.updates.get(qid);
        if (!u) continue;
        if (u.correct === true) {
          if (!mergedCorrect.includes(qid)) mergedCorrect.push(qid);
        } else {
          mergedCorrect = mergedCorrect.filter((id) => id !== qid);
        }
      }

      const newlyCompleted = deltaCompleted.filter((id) => !prevCompletedSet.has(id));
      const pointsToAdd = newlyCompleted.reduce((sum, id) => {
        const u = group.updates.get(id);
        const pts = typeof u?.points === "number" ? u.points : (u?.correct === true ? POINTS_PER_CORRECT_ANSWER : 0);
        return sum + (typeof pts === "number" ? pts : 0);
      }, 0);

      return {
        user_id: userId,
        email: user?.email ?? user?.primaryEmailAddress?.emailAddress ?? userId,
        topic,
        area,
        completedquestions: mergedCompleted,
        correctanswers: mergedCorrect,
        points: prevPoints + pointsToAdd,
      };
    });

    const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
    if (upsertErr) throw upsertErr;

    savedRows += upsertRows.length;
  }

  clearProgressBuffer(userId);
  return { saved: savedRows, cleared: true };
}

