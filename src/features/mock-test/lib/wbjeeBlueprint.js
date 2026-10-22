/**
 * WBJEE blueprint: 155 questions, 200 marks, 240 minutes (two papers × 2 hours).
 * Paper I Mathematics 75 Q / 100 marks.
 * Paper II Physics 40 Q / 50 marks, then Chemistry 40 Q / 50 marks.
 *
 * Category 1: +1, −0.25, single correct.
 * Category 2: +2, −0.5, single correct.
 * Category 3: +2, no negative, one or more correct. Partial credit when every
 * marked option is correct and at least one correct option is missing. 0 if any
 * wrong option is marked.
 */

export const WBJEE_SLUG = 'wbjee';
export const WBJEE_CREATION_MODE = 'wbjee_blueprint';
export const WBJEE_CHAPTER_CREATION_MODE = 'wbjee_chapter';

export const WBJEE_INSTRUCTIONS =
  'Category 1: +1 correct, −0.25 wrong. Category 2: +2 correct, −0.5 wrong. Category 3: +2, no negative marking; one or more options may be correct. Partial credit when only correct options are marked. A wrong option scores 0. Blank scores 0. A wrong Category 2 answer costs 0.5 and gives up the 2 marks.';

export const WBJEE_STRATEGY =
  'Attempt every Category 3 question first (no negative marking), then Category 1. Leave Category 2 numericals until the end. Paper II: Chemistry first (~35 min), Physics (~55 min), then 20 min review.';

export const WBJEE_PAPER = {
  totalQuestions: 155,
  durationMinutes: 240,
  maxMarks: 200,
  difficultyTargets: {
    Mathematics: { easy: 26, medium: 34, hard: 15 },
    Physics: { easy: 14, medium: 18, hard: 8 },
    Chemistry: { easy: 14, medium: 18, hard: 8 },
  },
};

function slot(key, label, count, aliases, extra = {}) {
  return { key, label, count, aliases, cat3: false, ...extra };
}

/** @type {Record<string, { label: string, order: number, count: number, marks: number, categories: {1:number,2:number,3:number}, bankCategories: string[], slots: object[] }>} */
export const WBJEE_SUBJECTS = {
  Mathematics: {
    label: 'Mathematics',
    order: 0,
    count: 75,
    marks: 100,
    categories: { 1: 50, 2: 15, 3: 10 },
    bankCategories: ['wbjee', 'jee-main'],
    slots: [
      slot('sets_relations', 'Sets, Relations and Functions', 2, [
        'sets-relations-and-functions',
        'relations-and-functions',
        'sets',
      ], { group: 'Algebra', cat3: true }),
      slot('complex', 'Complex Numbers', 3, [
        'complex-numbers',
        'complex-numbers-and-quadratic-equations',
      ], { group: 'Algebra', cat3: true }),
      slot('quadratic', 'Quadratic Equations and Inequalities', 2, [
        'quadratic-equations',
        'quadratic-equations-and-inequalities',
        'complex-numbers-and-quadratic-equations',
      ], { group: 'Algebra' }),
      slot('sequences', 'Sequences and Series', 3, [
        'sequences-and-series',
        'arithmetic-progression',
        'geometric-progression',
      ], { group: 'Algebra' }),
      slot('permutations', 'Permutations and Combinations', 2, [
        'permutations-and-combinations',
        'permutation-and-combination',
      ], { group: 'Algebra' }),
      slot('binomial', 'Binomial Theorem', 2, [
        'binomial-theorem',
        'binomial-theorem-for-positive-integral-indices',
      ], { group: 'Algebra' }),
      slot('matrices', 'Matrices and Determinants', 4, [
        'matrices',
        'determinants',
        'matrices-and-determinants',
      ], { group: 'Algebra', cat3: true }),
      slot('probability', 'Probability', 3, [
        'probability',
        'conditional-probability',
        'bayes-theorem',
      ], { group: 'Algebra', cat3: true }),
      slot('statistics', 'Statistics', 1, [
        'statistics',
        'measures-of-dispersion',
        'mean-variance-standard-deviation',
      ], { group: 'Algebra' }),
      slot('inverse_trig', 'Inverse Trigonometric Functions', 2, [
        'inverse-trigonometric-functions',
      ], { group: 'Trigonometry' }),
      slot('trig_identities', 'Identities, ratios and equations', 3, [
        'trigonometric-functions',
        'trigonometric-equations',
        'trigonometry',
      ], { group: 'Trigonometry' }),
      slot('triangles', 'Properties of Triangles', 2, [
        'properties-of-triangles',
        'solutions-of-triangles',
      ], { group: 'Trigonometry' }),
      slot('heights', 'Heights and Distances', 1, [
        'heights-and-distances',
      ], { group: 'Trigonometry' }),
      slot('trig_graphs', 'Trigonometric functions and graphs', 1, [
        'trigonometric-functions-and-graphs',
        'graphs-of-trigonometric-functions',
      ], { group: 'Trigonometry' }),
      slot('straight_lines', 'Straight Lines', 3, [
        'straight-lines',
        'straight-line',
      ], { group: 'Coordinate Geometry' }),
      slot('pair_lines', 'Pair of Straight Lines', 1, [
        'pair-of-straight-lines',
      ], { group: 'Coordinate Geometry' }),
      slot('circle', 'Circle', 3, ['circle', 'circles'], { group: 'Coordinate Geometry' }),
      slot('parabola', 'Parabola', 2, ['parabola', 'conic-sections'], {
        group: 'Coordinate Geometry',
        cat3: true,
      }),
      slot('ellipse', 'Ellipse', 2, ['ellipse', 'conic-sections'], {
        group: 'Coordinate Geometry',
        cat3: true,
      }),
      slot('hyperbola', 'Hyperbola', 2, ['hyperbola', 'conic-sections'], {
        group: 'Coordinate Geometry',
        cat3: true,
      }),
      slot('locus', 'Locus and Transformation of axes', 1, [
        'locus',
        'transformation-of-axes',
      ], { group: 'Coordinate Geometry' }),
      slot('vectors', 'Vectors', 4, ['vector-algebra', 'vectors'], {
        group: 'Vectors and 3D',
      }),
      slot('three_d', '3D Geometry', 3, [
        'three-dimensional-geometry',
        'introduction-to-three-dimensional-geometry',
        '3d-geometry',
      ], { group: 'Vectors and 3D' }),
      slot('limits', 'Limits', 2, ['limits', 'limits-and-derivatives'], {
        group: 'Calculus',
        cat3: true,
      }),
      slot('continuity', 'Continuity and Differentiability', 3, [
        'continuity-and-differentiability',
        'continuity',
      ], { group: 'Calculus', cat3: true }),
      slot('differentiation', 'Differentiation', 3, [
        'differentiation',
        'methods-of-differentiation',
        'continuity-and-differentiability',
      ], { group: 'Calculus' }),
      slot('aod', 'Applications of Derivatives', 4, [
        'application-of-derivatives',
        'applications-of-derivatives',
      ], { group: 'Calculus', cat3: true }),
      slot('indefinite', 'Indefinite Integration', 3, [
        'indefinite-integrals',
        'integrals',
        'indefinite-integration',
      ], { group: 'Calculus' }),
      slot('definite', 'Definite Integration', 3, [
        'definite-integrals',
        'definite-integration',
        'integrals',
      ], { group: 'Calculus', cat3: true }),
      slot('area', 'Area Under Curves', 2, [
        'area-under-curves',
        'application-of-integrals',
        'applications-of-integrals',
      ], { group: 'Calculus' }),
      slot('de', 'Differential Equations', 3, ['differential-equations'], {
        group: 'Calculus',
      }),
    ],
  },
  Physics: {
    label: 'Physics',
    order: 1,
    count: 40,
    marks: 50,
    categories: { 1: 30, 2: 5, 3: 5 },
    bankCategories: ['wbjee', 'jee-main'],
    slots: [
      slot('units', 'Units, Dimensions and Errors', 1, [
        'units-and-measurements',
        'units-dimensions-and-errors',
        'errors-and-measurements',
      ]),
      slot('kinematics', 'Kinematics', 2, [
        'motion-in-a-straight-line',
        'motion-in-a-plane',
        'kinematics',
      ]),
      slot('laws', 'Laws of Motion and Friction', 2, [
        'laws-of-motion',
        'friction',
      ]),
      slot('work', 'Work, Energy, Power and Collisions', 2, [
        'work-energy-and-power',
        'work-energy-power',
        'collisions',
      ]),
      slot('rotation', 'Rotational Motion', 2, [
        'system-of-particles-and-rotational-motion',
        'rotational-motion',
      ]),
      slot('gravitation', 'Gravitation', 1, ['gravitation']),
      slot('properties', 'Properties of Matter', 2, [
        'mechanical-properties-of-solids',
        'mechanical-properties-of-fluids',
        'properties-of-matter',
        'elasticity',
      ]),
      slot('heat', 'Heat, Thermodynamics and Kinetic Theory', 3, [
        'thermal-properties-of-matter',
        'thermodynamics',
        'kinetic-theory',
      ]),
      slot('shm', 'Oscillations', 2, ['oscillations', 'simple-harmonic-motion']),
      slot('waves', 'Waves and Sound', 2, [
        'waves',
        'waves-and-sound',
        'sound-waves',
      ], { cat3: true }),
      slot('electrostatics', 'Electrostatics and Capacitors', 3, [
        'electric-charges-and-fields',
        'electrostatic-potential-and-capacitance',
        'electrostatics',
        'capacitors',
      ], { cat3: true }),
      slot('current', 'Current Electricity', 3, ['current-electricity'], { cat3: true }),
      slot('magnetism', 'Magnetic Effects of Current and Magnetism', 3, [
        'moving-charges-and-magnetism',
        'magnetism-and-matter',
        'magnetic-effects-of-current',
      ], { cat3: true }),
      slot('emi_ac', 'Electromagnetic Induction and AC', 3, [
        'electromagnetic-induction',
        'alternating-current',
      ]),
      slot('em_waves', 'Electromagnetic Waves', 1, ['electromagnetic-waves']),
      slot('ray_optics', 'Ray Optics', 2, ['ray-optics', 'ray-optics-and-optical-instruments'], {
        cat3: true,
      }),
      slot('wave_optics', 'Wave Optics', 2, ['wave-optics'], { cat3: true }),
      slot('modern', 'Modern Physics', 3, [
        'dual-nature-of-radiation-and-matter',
        'atoms',
        'nuclei',
        'modern-physics',
      ], { cat3: true }),
      slot('electronics', 'Electronic Devices', 1, [
        'semiconductor-electronics',
        'electronic-devices',
        'semiconductors',
      ]),
    ],
  },
  Chemistry: {
    label: 'Chemistry',
    order: 2,
    count: 40,
    marks: 50,
    categories: { 1: 30, 2: 5, 3: 5 },
    bankCategories: ['wbjee', 'jee-main'],
    slots: [
      slot('atomic', 'Atomic Structure', 1, [
        'structure-of-atom',
        'atomic-structure',
      ], { group: 'Physical' }),
      slot('mole', 'Mole Concept and Stoichiometry', 1, [
        'some-basic-concepts-of-chemistry',
        'mole-concept',
        'stoichiometry',
      ], { group: 'Physical' }),
      slot('gaseous', 'Gaseous State', 1, [
        'states-of-matter',
        'gaseous-state',
      ], { group: 'Physical' }),
      slot('thermo', 'Chemical Thermodynamics', 2, [
        'thermodynamics',
        'chemical-thermodynamics',
      ], { group: 'Physical' }),
      slot('equilibrium', 'Chemical Equilibrium', 1, [
        'equilibrium',
        'chemical-equilibrium',
      ], { group: 'Physical' }),
      slot('ionic', 'Ionic Equilibrium', 1, [
        'ionic-equilibrium',
        'equilibrium',
      ], { group: 'Physical' }),
      slot('kinetics', 'Chemical Kinetics', 2, ['chemical-kinetics'], { group: 'Physical' }),
      slot('electrochemistry', 'Electrochemistry', 2, ['electrochemistry'], {
        group: 'Physical',
        cat3: true,
      }),
      slot('solutions', 'Solutions', 1, ['solutions'], { group: 'Physical' }),
      slot('solid', 'Solid State', 1, ['solid-state', 'the-solid-state'], { group: 'Physical' }),
      slot('surface', 'Surface Chemistry and Colloids', 1, [
        'surface-chemistry',
        'colloids',
      ], { group: 'Physical' }),
      slot('periodic', 'Periodic Table and Periodicity', 1, [
        'classification-of-elements-and-periodicity-in-properties',
        'periodic-table',
      ], { group: 'Inorganic' }),
      slot('bonding', 'Chemical Bonding', 3, ['chemical-bonding', 'chemical-bonding-and-molecular-structure'], {
        group: 'Inorganic',
        cat3: true,
      }),
      slot('s_block', 'Hydrogen and s-Block', 1, [
        'hydrogen',
        's-block-elements',
        'the-s-block-elements',
      ], { group: 'Inorganic' }),
      slot('p_block', 'p-Block Elements', 3, [
        'the-p-block-elements',
        'p-block-elements',
      ], { group: 'Inorganic', cat3: true }),
      slot('df_block', 'd- and f-Block Elements', 1, [
        'the-d-and-f-block-elements',
        'd-and-f-block-elements',
      ], { group: 'Inorganic' }),
      slot('coordination', 'Coordination Compounds', 2, ['coordination-compounds'], {
        group: 'Inorganic',
        cat3: true,
      }),
      slot('metallurgy', 'Metallurgy and Environmental Chemistry', 1, [
        'general-principles-and-processes-of-isolation-of-elements',
        'metallurgy',
        'environmental-chemistry',
      ], { group: 'Inorganic' }),
      slot('qualitative', 'Qualitative Analysis', 1, [
        'qualitative-analysis',
        'salt-analysis',
        'practical-inorganic',
      ], { group: 'Inorganic' }),
      slot('goc', 'General Organic Chemistry', 3, [
        'organic-chemistry-some-basic-principles-and-techniques',
        'general-organic-chemistry',
        'isomerism',
      ], { group: 'Organic', cat3: true }),
      slot('hydrocarbons', 'Hydrocarbons', 2, ['hydrocarbons'], { group: 'Organic', cat3: true }),
      slot('halo', 'Haloalkanes and Haloarenes', 1, [
        'haloalkanes-and-haloarenes',
      ], { group: 'Organic', cat3: true }),
      slot('alcohols', 'Alcohols, Phenols and Ethers', 2, [
        'alcohols-phenols-and-ethers',
      ], { group: 'Organic', cat3: true }),
      slot('carbonyl', 'Aldehydes, Ketones and Carboxylic Acids', 2, [
        'aldehydes-ketones-and-carboxylic-acids',
      ], { group: 'Organic', cat3: true }),
      slot('amines', 'Amines and Nitrogen compounds', 1, ['amines'], {
        group: 'Organic',
        cat3: true,
      }),
      slot('biomolecules', 'Biomolecules and Polymers', 1, [
        'biomolecules',
        'polymers',
      ], { group: 'Organic' }),
      slot('practical_organic', 'Practical Organic Chemistry', 1, [
        'chemistry-in-everyday-life',
        'practical-organic-chemistry',
      ], { group: 'Organic' }),
    ],
  },
};

const GROUP_TARGETS = {
  Mathematics: {
    Algebra: 22,
    Trigonometry: 9,
    'Coordinate Geometry': 14,
    'Vectors and 3D': 7,
    Calculus: 23,
  },
  Chemistry: { Physical: 14, Inorganic: 13, Organic: 13 },
};

export function normalizeWbjeeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function isWbjeeExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'wbjee' || s === 'wb-jee';
}

export function getWbjeeSubjectBlueprint(subject) {
  const key = Object.keys(WBJEE_SUBJECTS).find(
    (k) => k.toLowerCase() === String(subject || '').toLowerCase()
  );
  return key ? WBJEE_SUBJECTS[key] : null;
}

export function listWbjeeSubjectNames() {
  return Object.values(WBJEE_SUBJECTS)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.label);
}

export function subjectMatchesWbjee(rowSubject, subjectLabel) {
  const row = normalizeWbjeeToken(rowSubject);
  if (!row) return true;
  const rules = {
    Mathematics: ['math'],
    Physics: ['phys'],
    Chemistry: ['chem'],
  };
  const needles = rules[subjectLabel] || [normalizeWbjeeToken(subjectLabel)];
  return needles.some((needle) => row.includes(needle));
}

export function wbjeeChapterDurationMinutes(subject) {
  const row = normalizeWbjeeToken(subject);
  if (row.includes('math')) return 32;
  return 30;
}

export function wbjeeMarksForCategory(category) {
  return Number(category) === 1 ? 1 : 2;
}

export function wbjeeNegativeForCategory(category) {
  const cat = Number(category);
  if (cat === 2) return 0.5;
  if (cat === 3) return 0;
  return 0.25;
}

/** Topic prefix so attempt scoring can read the category without weightage_config. */
export function encodeWbjeeTopic(category, topic) {
  const cat = Number(category) === 2 ? 2 : Number(category) === 3 ? 3 : 1;
  const cleaned = String(topic || '').replace(/^wbc[123]\|/, '');
  return `wbc${cat}|${cleaned}`;
}

export function parseWbjeeTopic(topic) {
  const raw = String(topic || '');
  const match = raw.match(/^wbc([123])\|([\s\S]*)$/);
  if (!match) return { category: null, marks: null, negative: null, topic: raw };
  const category = Number(match[1]);
  return {
    category,
    marks: wbjeeMarksForCategory(category),
    negative: wbjeeNegativeForCategory(category),
    topic: match[2] || '',
  };
}

/**
 * Full-paper order: Maths Cat1, Cat2, Cat3, then Physics, then Chemistry.
 * Index is 0-based.
 */
export function wbjeeCategoryForPaperIndex(index) {
  const blocks = [
    { start: 0, counts: [50, 15, 10] },
    { start: 75, counts: [30, 5, 5] },
    { start: 115, counts: [30, 5, 5] },
  ];
  const i = Number(index);
  for (const block of blocks) {
    const span = block.counts[0] + block.counts[1] + block.counts[2];
    if (i >= block.start && i < block.start + span) {
      const local = i - block.start;
      if (local < block.counts[0]) return 1;
      if (local < block.counts[0] + block.counts[1]) return 2;
      return 3;
    }
  }
  return 1;
}

export function wbjeeOptionLetters(value) {
  const letters = String(value || '')
    .toUpperCase()
    .match(/[ABCD]/g);
  return [...new Set(letters || [])];
}

/**
 * Category 3: 0 if any marked letter is wrong.
 * Full 2 when the marked set equals the key.
 * Partial (marked/correct)*2 when the marked set is a non-empty subset.
 * Single-correct keys use isCorrect for +2 / 0.
 */
export function scoreWbjeeAnswer({ category, isCorrect, userAnswer, correctOption } = {}) {
  const cat = Number(category) === 2 ? 2 : Number(category) === 3 ? 3 : 1;
  if (cat === 1) return isCorrect ? 1 : -0.25;
  if (cat === 2) return isCorrect ? 2 : -0.5;
  const keys = wbjeeOptionLetters(correctOption);
  const marked = wbjeeOptionLetters(userAnswer);
  if (keys.length > 1) {
    if (!marked.length) return 0;
    if (marked.some((letter) => !keys.includes(letter))) return 0;
    if (marked.length === keys.length) return 2;
    return Math.round(((2 * marked.length) / keys.length) * 100) / 100;
  }
  return isCorrect ? 2 : 0;
}

export function resolveWbjeeCategory(row) {
  const direct = Number(row?.wbjeeCategory);
  if (direct === 1 || direct === 2 || direct === 3) return direct;
  const fromTopic = parseWbjeeTopic(row?.topic);
  if (fromTopic.category) return fromTopic.category;
  return 1;
}

export function summarizeWbjeeAttempt({ questions = [], answers = [] } = {}) {
  const byId = new Map();
  (answers || []).forEach((answer) => {
    const id = answer?.questionId ?? answer?.id;
    if (id != null) byId.set(String(id), answer);
  });
  const categories = {
    1: { correct: 0, wrong: 0, blank: 0, penalty: 0 },
    2: { correct: 0, wrong: 0, blank: 0, penalty: 0 },
    3: { correct: 0, wrong: 0, blank: 0, partial: 0, penalty: 0 },
  };
  for (const question of questions) {
    const cat = resolveWbjeeCategory(question);
    const bucket = categories[cat] || categories[1];
    const answer = byId.get(String(question.id ?? question.questionId));
    const userAnswer = answer?.userAnswer ?? answer?.a ?? '';
    if (!answer || String(userAnswer).trim() === '') {
      bucket.blank += 1;
      continue;
    }
    const score = Number.isFinite(Number(answer.wbjeeScore))
      ? Number(answer.wbjeeScore)
      : scoreWbjeeAnswer({
          category: cat,
          isCorrect: answer.isCorrect === true,
          userAnswer,
          correctOption: answer.correctAnswer || question.correct_option,
        });
    if (score < 0) {
      bucket.wrong += 1;
      bucket.penalty = Math.round((bucket.penalty + -score) * 100) / 100;
    } else if (cat === 3 && score > 0 && score < 2) {
      bucket.partial += 1;
    } else if (score > 0) {
      bucket.correct += 1;
    } else {
      bucket.wrong += 1;
    }
  }
  const penalty = Math.round((categories[1].penalty + categories[2].penalty) * 100) / 100;
  return {
    categories,
    penalty,
    cat2Wrong: categories[2].wrong,
    cat2Opportunity: Math.round(categories[2].wrong * 2.5 * 100) / 100,
  };
}

export function auditWbjeeBlueprint() {
  const subjects = [];
  const errors = [];
  for (const bp of Object.values(WBJEE_SUBJECTS)) {
    const total = bp.slots.reduce((n, s) => n + s.count, 0);
    const cat3Pool = bp.slots.filter((s) => s.cat3).reduce((n, s) => n + s.count, 0);
    const catMarks =
      bp.categories[1] * 1 + bp.categories[2] * 2 + bp.categories[3] * 2;
    const catSum = bp.categories[1] + bp.categories[2] + bp.categories[3];
    const diff = WBJEE_PAPER.difficultyTargets[bp.label];
    const diffSum = diff ? diff.easy + diff.medium + diff.hard : 0;
    const groups = {};
    bp.slots.forEach((s) => {
      if (!s.group) return;
      groups[s.group] = (groups[s.group] || 0) + s.count;
    });
    if (total !== bp.count) errors.push(`${bp.label} slots sum to ${total}, expected ${bp.count}`);
    if (catSum !== bp.count) errors.push(`${bp.label} categories sum to ${catSum}, expected ${bp.count}`);
    if (catMarks !== bp.marks) errors.push(`${bp.label} category marks ${catMarks}, expected ${bp.marks}`);
    if (cat3Pool < bp.categories[3]) {
      errors.push(`${bp.label} Category 3 chapters have ${cat3Pool}, need ${bp.categories[3]}`);
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
    subjects.push({
      subject: bp.label,
      total,
      marks: catMarks,
      categories: bp.categories,
      cat3Pool,
      groups,
    });
  }
  const questions = subjects.reduce((n, s) => n + s.total, 0);
  const marks = subjects.reduce((n, s) => n + s.marks, 0);
  if (questions !== WBJEE_PAPER.totalQuestions) {
    errors.push(`Paper has ${questions} questions, expected ${WBJEE_PAPER.totalQuestions}`);
  }
  if (marks !== WBJEE_PAPER.maxMarks) {
    errors.push(`Paper has ${marks} marks, expected ${WBJEE_PAPER.maxMarks}`);
  }
  return { ok: errors.length === 0, errors, subjects, questions, marks };
}
