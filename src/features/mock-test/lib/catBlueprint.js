/**
 * CAT blueprint: 68 questions, 204 marks, 120 minutes.
 * VARC 24 (72), DILR 22 (66), QA 22 (66). Each section is 40 minutes.
 * +3 correct. Wrong MCQ −1. Wrong TITA 0. Blank 0.
 * Default types: VARC 20 MCQ + 4 TITA, DILR 14 MCQ + 8 TITA, QA 14 MCQ + 8 TITA.
 */

export const CAT_SLUG = 'cat';
export const CAT_CREATION_MODE = 'cat_blueprint';
export const CAT_CHAPTER_CREATION_MODE = 'cat_topic';

export const CAT_INSTRUCTIONS =
  'Marking: +3 for a correct answer, −1 for a wrong MCQ, 0 for a wrong TITA, 0 if left blank. Do not guess an MCQ unless two options can be eliminated. Each section is 40 minutes. When that time ends the section locks and the next section starts. Unused time does not carry over.';

export const CAT_STRATEGY =
  'VARC: two easier RC passages first, then verbal ability. DILR: spend the first 3–4 minutes choosing sets, attempt 2–3 sets, leave the hardest. QA: easy Arithmetic and Algebra first, long Geometry last.';

export const CAT_SECTION_SECONDS = 40 * 60;

export const CAT_SECTIONS = [
  { label: 'VARC', start: 0, end: 24, seconds: CAT_SECTION_SECONDS, marks: 72 },
  { label: 'DILR', start: 24, end: 46, seconds: CAT_SECTION_SECONDS, marks: 66 },
  { label: 'QA', start: 46, end: 68, seconds: CAT_SECTION_SECONDS, marks: 66 },
];

export const CAT_PAPER = {
  totalQuestions: 68,
  durationMinutes: 120,
  maxMarks: 204,
  marksCorrect: 3,
  mcqWrong: -1,
  titaWrong: 0,
  difficultyTargets: {
    VARC: { easy: 3, medium: 15, hard: 6 },
    DILR: { easy: 4, medium: 12, hard: 6 },
    QA: { easy: 8, medium: 10, hard: 4 },
  },
  typeTargets: {
    VARC: { mcq: 20, tita: 4 },
    DILR: { mcq: 14, tita: 8 },
    QA: { mcq: 14, tita: 8 },
  },
};

function slot(key, label, count, aliases, extra = {}) {
  return { key, label, count, tita: 0, aliases, ...extra };
}

/** @type {Record<string, { label: string, order: number, count: number, bankCategories: string[], slots: object[] }>} */
export const CAT_SUBJECTS = {
  VARC: {
    label: 'VARC',
    order: 0,
    count: 24,
    bankCategories: ['cat', 'general-aptitude'],
    slots: [
      slot('rc_social', 'RC · social science / philosophy', 4, [
        'reading-comprehension',
        'philosophy',
        'social-science',
        'society',
      ], { group: 'Reading Comprehension' }),
      slot('rc_science', 'RC · science / technology', 4, [
        'reading-comprehension',
        'science-and-technology',
        'science',
        'technology',
      ], { group: 'Reading Comprehension' }),
      slot('rc_econ', 'RC · economics / business / history', 4, [
        'reading-comprehension',
        'economics',
        'business',
        'history',
      ], { group: 'Reading Comprehension' }),
      slot('rc_arts', 'RC · arts / literature / culture', 4, [
        'reading-comprehension',
        'literature',
        'arts',
        'culture',
      ], { group: 'Reading Comprehension' }),
      slot('para_jumble', 'Para jumbles', 3, [
        'para-jumbles',
        'parajumbles',
        'sentence-rearrangement',
      ], { group: 'Verbal Ability', tita: 3 }),
      slot('odd_tita', 'Odd sentence out (TITA)', 1, [
        'odd-sentence-out',
        'odd-one-out',
        'odd-sentence',
      ], { group: 'Verbal Ability', tita: 1 }),
      slot('odd_mcq', 'Odd sentence out (MCQ)', 1, [
        'odd-sentence-out',
        'odd-one-out',
        'odd-sentence',
      ], { group: 'Verbal Ability', tita: 0 }),
      slot('para_summary', 'Para summary', 3, [
        'para-summary',
        'paragraph-summary',
        'summary',
      ], { group: 'Verbal Ability', tita: 0 }),
    ],
  },
  DILR: {
    label: 'DILR',
    order: 1,
    count: 22,
    bankCategories: ['cat', 'general-aptitude'],
    slots: [
      slot('arrangements', 'Arrangements, scheduling, selection', 5, [
        'seating-arrangement',
        'linear-arrangement',
        'circular-arrangement',
        'scheduling',
        'selection',
      ], { group: 'Set 1 · Arrangements', tita: 2 }),
      slot('games', 'Games, tournaments, networks, binary logic', 6, [
        'games-and-tournaments',
        'tournaments',
        'binary-logic',
        'networks-and-routes',
        'routes',
      ], { group: 'Set 2 · Games and networks', tita: 2 }),
      slot('di', 'Tables, charts, caselets', 6, [
        'data-interpretation',
        'tables',
        'bar-graph',
        'pie-chart',
        'caselet',
      ], { group: 'Set 3 · Data interpretation', tita: 2 }),
      slot('hybrid', 'Venn, cubes, grids, mixed sets', 5, [
        'venn-diagrams',
        'cubes',
        'grids',
        'puzzles',
        'set-theory',
      ], { group: 'Set 4 · Hybrid', tita: 2 }),
    ],
  },
  QA: {
    label: 'QA',
    order: 2,
    count: 22,
    bankCategories: ['cat', 'general-aptitude', 'jee-main'],
    slots: [
      slot('percent', 'Percentages, profit, ratio, mixtures, averages', 3, [
        'percentages',
        'profit-and-loss',
        'ratio-and-proportion',
        'mixtures-and-alligations',
        'averages',
      ], { group: 'Arithmetic', tita: 1 }),
      slot('tsd', 'Time-speed-distance and time-work', 3, [
        'time-speed-distance',
        'time-and-work',
        'pipes-and-cisterns',
        'boats-and-streams',
        'races',
      ], { group: 'Arithmetic', tita: 1 }),
      slot('interest', 'Interest and partnerships', 1, [
        'simple-interest',
        'compound-interest',
        'partnerships',
      ], { group: 'Arithmetic', tita: 0 }),
      slot('mixed_arith', 'Mixed arithmetic', 2, [
        'arithmetic',
        'mixtures-and-alligations',
        'percentages',
      ], { group: 'Arithmetic', tita: 1 }),
      slot('equations', 'Linear and quadratic equations, inequalities', 2, [
        'linear-equations',
        'quadratic-equations',
        'inequalities',
      ], { group: 'Algebra', tita: 1 }),
      slot('functions', 'Functions and graphs', 1, ['functions-and-graphs'], {
        group: 'Algebra',
        tita: 0,
      }),
      slot('logs', 'Logarithms, surds and indices', 1, [
        'logarithms',
        'surds-and-indices',
        'indices',
      ], { group: 'Algebra', tita: 1 }),
      slot('progressions', 'Progressions', 1, [
        'progressions',
        'sequences-and-series',
        'arithmetic-progression',
      ], { group: 'Algebra', tita: 0 }),
      slot('maxima', 'Maxima, minima, modulus', 1, [
        'maxima-and-minima',
        'modulus',
        'inequalities',
      ], { group: 'Algebra', tita: 0 }),
      slot('geometry', 'Triangles, circles, polygons, coordinate geometry', 3, [
        'triangles',
        'circles',
        'polygons',
        'coordinate-geometry',
      ], { group: 'Geometry and Mensuration', tita: 1 }),
      slot('mensuration', 'Mensuration', 1, ['mensuration'], {
        group: 'Geometry and Mensuration',
        tita: 1,
      }),
      slot('numbers', 'Number system', 2, [
        'number-system',
        'divisibility',
        'remainders',
        'hcf-lcm',
      ], { group: 'Number System', tita: 1 }),
      slot('modern', 'Permutations, probability, sets', 1, [
        'permutations-and-combinations',
        'probability',
        'set-theory',
      ], { group: 'Modern Mathematics', tita: 0 }),
    ],
  },
};

const GROUP_TARGETS = {
  VARC: { 'Reading Comprehension': 16, 'Verbal Ability': 8 },
  DILR: {
    'Set 1 · Arrangements': 5,
    'Set 2 · Games and networks': 6,
    'Set 3 · Data interpretation': 6,
    'Set 4 · Hybrid': 5,
  },
  QA: {
    Arithmetic: 9,
    Algebra: 6,
    'Geometry and Mensuration': 4,
    'Number System': 2,
    'Modern Mathematics': 1,
  },
};

export function normalizeCatToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function isCatExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'cat';
}

export function getCatSubjectBlueprint(subject) {
  const key = Object.keys(CAT_SUBJECTS).find(
    (k) => k.toLowerCase() === String(subject || '').toLowerCase()
  );
  return key ? CAT_SUBJECTS[key] : null;
}

export function listCatSubjectNames() {
  return Object.values(CAT_SUBJECTS)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.label);
}

export function subjectMatchesCat(rowSubject, subjectLabel) {
  const row = normalizeCatToken(rowSubject);
  if (!row) return true;
  const rules = {
    VARC: ['varc', 'verbal', 'english', 'reading'],
    DILR: ['dilr', 'data', 'logical', 'reason', 'aptitude'],
    QA: ['quant', 'math', 'arithmetic', 'algebra', 'qa'],
  };
  const needles = rules[subjectLabel] || [normalizeCatToken(subjectLabel)];
  return needles.some((needle) => row.includes(needle));
}

export function catTopicDurationMinutes() {
  return 35;
}

export function catSectionByIndex(sectionIndex) {
  const idx = Math.min(CAT_SECTIONS.length - 1, Math.max(0, Number(sectionIndex) || 0));
  return CAT_SECTIONS[idx];
}

export function auditCatBlueprint() {
  const subjects = [];
  const errors = [];
  for (const bp of Object.values(CAT_SUBJECTS)) {
    const total = bp.slots.reduce((n, s) => n + s.count, 0);
    const tita = bp.slots.reduce((n, s) => n + (Number(s.tita) || 0), 0);
    const mcq = total - tita;
    const types = CAT_PAPER.typeTargets[bp.label];
    const diff = CAT_PAPER.difficultyTargets[bp.label];
    const diffSum = diff ? diff.easy + diff.medium + diff.hard : 0;
    const groups = {};
    bp.slots.forEach((s) => {
      if (!s.group) return;
      groups[s.group] = (groups[s.group] || 0) + s.count;
      if ((Number(s.tita) || 0) > s.count) {
        errors.push(`${bp.label} ${s.label} asks for ${s.tita} TITA out of ${s.count}`);
      }
    });
    if (total !== bp.count) errors.push(`${bp.label} slots sum to ${total}, expected ${bp.count}`);
    if (types && (types.mcq !== mcq || types.tita !== tita)) {
      errors.push(`${bp.label} types are ${mcq} MCQ / ${tita} TITA, expected ${types.mcq} / ${types.tita}`);
    }
    if (diff && diffSum !== bp.count) {
      errors.push(`${bp.label} difficulty targets sum to ${diffSum}, expected ${bp.count}`);
    }
    const expectedGroups = GROUP_TARGETS[bp.label];
    if (expectedGroups) {
      for (const [name, target] of Object.entries(expectedGroups)) {
        if (groups[name] !== target) {
          errors.push(`${bp.label} ${name} sums to ${groups[name] || 0}, expected ${target}`);
        }
      }
    }
    subjects.push({ subject: bp.label, total, marks: total * 3, mcq, tita, groups });
  }
  const questions = subjects.reduce((n, s) => n + s.total, 0);
  const marks = questions * CAT_PAPER.marksCorrect;
  if (questions !== CAT_PAPER.totalQuestions) {
    errors.push(`Paper has ${questions} questions, expected ${CAT_PAPER.totalQuestions}`);
  }
  if (marks !== CAT_PAPER.maxMarks) {
    errors.push(`Paper has ${marks} marks, expected ${CAT_PAPER.maxMarks}`);
  }
  const sectionSum = CAT_SECTIONS.reduce((n, s) => n + (s.end - s.start), 0);
  if (sectionSum !== CAT_PAPER.totalQuestions) {
    errors.push(`Section windows cover ${sectionSum} questions`);
  }
  return { ok: errors.length === 0, errors, subjects, questions, marks };
}
