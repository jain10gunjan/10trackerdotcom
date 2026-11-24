import { GATE_CSE_BLOCKS, normalizeGateToken } from '../../../mock-test/lib/gateCseBlueprint';

/** Lexicon chapter → GATE paper block. Discrete stays on discrete-mathematics only. */
const BLOCK_BY_LEXICON = {
  'discrete-mathematics': 'EM',
  'digital-logic': 'DL',
  'computer-organization': 'COA',
  'programming-ds': 'PDS',
  algorithms: 'ALGO',
  'theory-of-computation': 'TOC',
  'compiler-design': 'CD',
  'operating-systems': 'OS',
  databases: 'DB',
  'computer-networks': 'CN',
};

const ACRONYMS = new Set(['cpu', 'sql', 'alu', 'os', 'cn', 'er', 'avl', 'b']);

export function labelFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((word) => {
      if (ACRONYMS.has(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function practiceStepsFor(lexiconSlug) {
  const block = GATE_CSE_BLOCKS.find((item) => item.id === BLOCK_BY_LEXICON[lexiconSlug]);
  if (!block) return [];
  const seen = new Set();
  const steps = [];
  for (const slot of block.slots) {
    const subject = slot.subjects?.[0];
    if (!subject) continue;
    if (lexiconSlug === 'discrete-mathematics' && subject !== 'discrete-mathematics') continue;
    for (const alias of slot.aliases || []) {
      const chapter = normalizeGateToken(alias);
      const key = `${subject}:${chapter}`;
      if (!chapter || seen.has(key)) continue;
      seen.add(key);
      steps.push({
        subject,
        chapter,
        title: `Practice: ${labelFromSlug(chapter)}`,
      });
    }
  }
  return steps;
}

export function videoMatchesChapter(title, chapter) {
  const text = ` ${normalizeGateToken(title).replace(/-/g, ' ')} `;
  const words = ` ${String(chapter || '').replace(/-/g, ' ')} `;
  return words.trim().length >= 3 && text.includes(words);
}

function splitContiguous(items, parts) {
  const out = Array.from({ length: parts }, () => []);
  if (!parts || !items.length) return out;
  const size = Math.ceil(items.length / parts);
  items.forEach((item, index) => {
    out[Math.min(parts - 1, Math.floor(index / size))].push(item);
  });
  return out;
}

/**
 * Playlist order is kept. Lectures are split across the practice chapters
 * so each block is lectures, then that chapter's practice — not every
 * lecture first and every practice set at the bottom.
 */
export function layoutLearningBlocks(videos, steps) {
  if (!steps.length) {
    return [{ step: null, label: null, videos: videos.slice() }];
  }
  const matched = steps.map(() => []);
  const unmatched = [];
  videos.forEach((video, index) => {
    const step = bestPracticeStep(video.title, steps);
    const item = { video, index };
    if (!step) {
      unmatched.push(item);
      return;
    }
    const at = steps.findIndex((candidate) => candidate.chapter === step.chapter);
    if (at < 0) unmatched.push(item);
    else matched[at].push(item);
  });
  const slices = splitContiguous(unmatched, steps.length);
  const raw = steps.map((step, index) => ({
    step,
    extraSteps: [],
    label: `${index + 1} · ${labelFromSlug(step.chapter)}`,
    videos: [...slices[index], ...matched[index]]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.video),
  }));
  const folded = [];
  for (const block of raw) {
    if (!block.videos.length && folded.length) {
      folded[folded.length - 1].extraSteps.push(block.step);
      continue;
    }
    folded.push(block);
  }
  return folded.map((block, index) => ({
    ...block,
    label: block.step ? `${index + 1} · ${labelFromSlug(block.step.chapter)}` : block.label,
  }));
}

export function bestPracticeStep(title, steps) {
  let best = null;
  for (const step of steps) {
    if (!videoMatchesChapter(title, step.chapter)) continue;
    if (!best || step.chapter.length > best.chapter.length) best = step;
  }
  return best;
}

export async function fetchGateCseMocks(supabase) {
  const { data, error } = await supabase
    .from('mock_tests')
    .select('id, name, category, is_active, total_questions')
    .eq('is_active', true)
    .in('category', ['GATE-CSE', 'GATE CSE', 'gate-cse', 'GATE_CSE'])
    .order('total_questions', { ascending: false })
    .limit(200);
  if (error) return [];
  return data || [];
}

export function pickSubjectMock(mocks, { label, chapters, used }) {
  const labelToken = normalizeGateToken(label);
  let best = null;
  let bestScore = 0;
  for (const mock of mocks) {
    if (!mock?.id || used.has(mock.id)) continue;
    const name = normalizeGateToken(mock.name);
    if (name.includes('mock-of-the-day')) continue;
    let score = 0;
    for (const chapter of chapters) {
      const token = normalizeGateToken(chapter);
      if (token.length >= 4 && name.includes(token)) score = Math.max(score, 4);
    }
    if (labelToken.length >= 4 && name.includes(labelToken)) score = Math.max(score, 3);
    if (score > bestScore) {
      best = mock;
      bestScore = score;
    }
  }
  return bestScore >= 3 ? best : null;
}

export function pickFullMock(mocks, used) {
  return (
    mocks.find((mock) => {
      if (!mock?.id || used.has(mock.id)) return false;
      const name = normalizeGateToken(mock.name);
      if (name.includes('mock-of-the-day')) return false;
      const questions = Number(mock.total_questions) || 0;
      return questions >= 30 && (name.includes('full') || name.includes('mock-test'));
    }) || null
  );
}
