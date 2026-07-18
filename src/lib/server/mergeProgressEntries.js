import { POINTS_PER_CORRECT_ANSWER } from '@/lib/progressBuffer';
import { upsertUserProgress } from '@/lib/userProgressUpsert';

const progressQuestionId = (id) => (id == null ? '' : String(id));

/**
 * Server-side merge of buffered practice entries into user_progress.
 * @param {object} supabase - admin/server client
 * @param {string} userId - progress user id (email)
 * @param {string|null} email
 * @param {Record<string, object>} entries - buffer.entries
 */
export async function mergeProgressEntriesToSupabase(supabase, userId, email, entries) {
  const entriesObj = entries ?? {};
  const qids = Object.keys(entriesObj);
  if (!qids.length) return { saved: 0 };

  const groups = new Map();
  for (const qidRaw of qids) {
    const e = entriesObj[qidRaw];
    if (!e || typeof e !== 'object') continue;
    const area = String(e.area ?? '').trim().toLowerCase();
    const topic = String(e.topic ?? '').trim();
    if (!area || !topic) continue;
    const qid = progressQuestionId(qidRaw);
    const key = `${area}::${topic}`;
    if (!groups.has(key)) groups.set(key, { area, topic, qids: new Set(), updates: new Map() });
    const g = groups.get(key);
    g.qids.add(qid);
    g.updates.set(qid, e);
  }

  if (!groups.size) return { saved: 0 };

  const byArea = new Map();
  for (const g of groups.values()) {
    if (!byArea.has(g.area)) byArea.set(g.area, new Map());
    byArea.get(g.area).set(g.topic, g);
  }

  let savedRows = 0;

  for (const [area, topicMap] of byArea.entries()) {
    const topics = [...topicMap.keys()];
    const { data: existing, error: fetchErr } = await supabase
      .from('user_progress')
      .select('topic, completedquestions, correctanswers, points')
      .eq('user_id', userId)
      .eq('area', area)
      .in('topic', topics);
    if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

    const existingMap = new Map((existing ?? []).map((r) => [String(r.topic ?? '').trim(), r]));

    const upsertRows = topics.map((topic) => {
      const group = topicMap.get(topic);
      const prev = existingMap.get(topic);
      const prevCompleted = (Array.isArray(prev?.completedquestions) ? prev.completedquestions : [])
        .map(progressQuestionId);
      const prevCorrect = (Array.isArray(prev?.correctanswers) ? prev.correctanswers : [])
        .map(progressQuestionId);
      const prevPoints = typeof prev?.points === 'number' ? prev.points : 0;
      const prevCompletedSet = new Set(prevCompleted);

      const deltaCompleted = [...group.qids].map(progressQuestionId);
      const mergedCompleted = [...new Set([...prevCompleted, ...deltaCompleted])];

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
        const pts =
          typeof u?.points === 'number'
            ? u.points
            : u?.correct === true
              ? POINTS_PER_CORRECT_ANSWER
              : 0;
        return sum + (typeof pts === 'number' ? pts : 0);
      }, 0);

      return {
        user_id: userId,
        email: email || userId,
        topic,
        area,
        completedquestions: mergedCompleted,
        correctanswers: mergedCorrect,
        points: prevPoints + pointsToAdd,
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
    if (upsertErr) throw upsertErr;
    savedRows += upsertRows.length;
  }

  return { saved: savedRows };
}
