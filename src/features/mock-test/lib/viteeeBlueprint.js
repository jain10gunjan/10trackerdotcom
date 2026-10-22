/**
 * VITEEE blueprint: 125 MCQs, 500 marks, 150 minutes, +4 / −1.
 * Maths 40, Physics 35, Chemistry 35, Aptitude 10, English 5.
 * Chapter aliases match examtracker chapter/topic slugs (VITEEE, with JEE Main
 * and general-aptitude banks as fallback).
 */

export const VITEEE_SLUG = 'viteee';
export const VITEEE_CREATION_MODE = 'viteee_blueprint';
export const VITEEE_CHAPTER_CREATION_MODE = 'viteee_chapter';

export const VITEEE_INSTRUCTIONS =
  'Marking: +4 for a correct answer, −1 for a wrong answer, 0 if left blank. All questions are single-correct MCQs with four options. Guess only when two options can be eliminated.';

export const VITEEE_STRATEGY =
  'Suggested order: English and Aptitude first (~15 min), Chemistry (~30 min), Physics (~40 min), Mathematics (~55 min), then 10 min review.';

export const VITEEE_PAPER = {
  totalQuestions: 125,
  durationMinutes: 150,
  maxMarks: 500,
  marksCorrect: 4,
  marksWrong: -1,
  difficultyTargets: {
    Mathematics: { easy: 12, medium: 18, hard: 10 },
    Physics: { easy: 12, medium: 16, hard: 7 },
    Chemistry: { easy: 14, medium: 16, hard: 5 },
    Aptitude: { easy: 6, medium: 4, hard: 0 },
    English: { easy: 3, medium: 2, hard: 0 },
  },
};

function slot(key, label, count, aliases, extra = {}) {
  return { key, label, count, aliases, ...extra };
}

/** @type {Record<string, { label: string, order: number, count: number, bankCategories: string[], slots: object[] }>} */
export const VITEEE_SUBJECTS = {
  Mathematics: {
    label: 'Mathematics',
    order: 0,
    count: 40,
    bankCategories: ['viteee', 'jee-main'],
    slots: [
      slot('matrices', 'Matrices & Determinants', 4, [
        'matrices',
        'determinants',
        'matrices-and-determinants',
      ]),
      slot('differential_calculus', 'Differential Calculus', 3, [
        'limits-and-derivatives',
        'continuity-and-differentiability',
        'limits',
        'continuity',
      ]),
      slot('aod', 'Applications of Derivatives', 2, [
        'application-of-derivatives',
        'applications-of-derivatives',
      ]),
      slot('integrals', 'Integral Calculus', 4, [
        'integrals',
        'indefinite-integrals',
        'definite-integrals',
        'application-of-integrals',
        'area-under-curves',
      ]),
      slot('de', 'Differential Equations', 3, ['differential-equations']),
      slot('vectors', 'Vector Algebra', 3, ['vector-algebra', 'vectors']),
      slot('three_d', 'Three-Dimensional Geometry', 3, [
        'three-dimensional-geometry',
        'introduction-to-three-dimensional-geometry',
        '3d-geometry',
      ]),
      slot('coordinate', 'Coordinate Geometry', 2, [
        'straight-lines',
        'straight-line',
        'circles',
        'pair-of-straight-lines',
      ]),
      slot('conics', 'Analytical Geometry of Two Dimensions', 2, [
        'conic-sections',
        'parabola',
        'ellipse',
        'hyperbola',
      ]),
      slot('complex', 'Complex Numbers', 3, [
        'complex-numbers',
        'complex-numbers-and-quadratic-equations',
      ]),
      slot('probability', 'Probability and Distributions', 4, [
        'probability',
        'conditional-probability',
        'bayes-theorem',
        'binomial-distribution',
      ]),
      slot('statistics', 'Statistics', 2, ['statistics', 'measures-of-dispersion']),
      slot('trigonometry', 'Trigonometry', 3, [
        'trigonometric-functions',
        'inverse-trigonometric-functions',
        'trigonometry',
      ]),
      slot('algebra_misc', 'Sequences, Binomial Theorem, Permutations', 2, [
        'sequences-and-series',
        'binomial-theorem',
        'permutations-and-combinations',
      ]),
    ],
  },
  Physics: {
    label: 'Physics',
    order: 1,
    count: 35,
    bankCategories: ['viteee', 'jee-main'],
    slots: [
      slot('kinematics', 'Units, Measurements and Kinematics', 2, [
        'units-and-measurements',
        'motion-in-a-straight-line',
        'motion-in-a-plane',
        'kinematics',
      ]),
      slot('laws', 'Laws of Motion', 2, ['laws-of-motion']),
      slot('work', 'Work, Energy and Power', 2, [
        'work-energy-and-power',
        'work-energy-power',
      ]),
      slot('rotation_grav', 'Rotational Motion and Gravitation', 2, [
        'rotational-motion',
        'gravitation',
        'system-of-particles-and-rotational-motion',
      ]),
      slot('properties', 'Properties of Matter', 2, [
        'mechanical-properties-of-solids',
        'mechanical-properties-of-fluids',
        'elasticity',
        'fluid-mechanics',
      ]),
      slot('oscillations', 'Oscillations and Waves', 3, [
        'oscillations',
        'waves',
        'sound',
        'simple-harmonic-motion',
      ]),
      slot('thermal', 'Thermal Physics and Kinetic Theory', 2, [
        'thermal-properties-of-matter',
        'kinetic-theory-of-gases',
        'kinetic-theory',
      ]),
      slot('thermodynamics', 'Thermodynamics', 1, ['thermodynamics']),
      slot('electrostatics', 'Electrostatics', 3, [
        'electric-charges-and-fields',
        'electrostatic-potential-and-capacitance',
        'electrostatics',
      ]),
      slot('current', 'Current Electricity', 3, ['current-electricity']),
      slot('magnetism', 'Magnetic Effects of Current and Magnetism', 3, [
        'moving-charges-and-magnetism',
        'magnetism-and-matter',
        'magnetic-effects-of-current-and-magnetism',
      ]),
      slot('emi_ac', 'Electromagnetic Induction and Alternating Current', 2, [
        'electromagnetic-induction',
        'alternating-current',
        'alternating-currents',
      ]),
      slot('optics', 'Optics', 3, [
        'ray-optics',
        'wave-optics',
        'ray-optics-and-optical-instruments',
      ]),
      slot('modern', 'Dual Nature, Atomic and Nuclear Physics', 3, [
        'dual-nature-of-radiation-and-matter',
        'atoms',
        'nuclei',
        'atoms-and-nuclei',
      ]),
      slot('semiconductors', 'Semiconductors and Communication Systems', 2, [
        'semiconductor-electronics',
        'semiconductors',
        'communication-systems',
      ]),
    ],
  },
  Chemistry: {
    label: 'Chemistry',
    order: 2,
    count: 35,
    bankCategories: ['viteee', 'jee-main'],
    slots: [
      slot('atomic', 'Atomic Structure', 2, ['structure-of-atom', 'atomic-structure']),
      slot('periodic', 'Periodic Properties', 1, [], {
        rotating: [
          ['classification-of-elements-and-periodicity-in-properties', 'periodic-table', 'periodic-properties'],
          ['some-basic-concepts-of-chemistry', 'mole-concept'],
          ['general-principles-and-processes-of-isolation-of-elements', 'metallurgy'],
          ['environmental-chemistry'],
        ],
      }),
      slot('bonding', 'Chemical Bonding and Molecular Structure', 2, [
        'chemical-bonding-and-molecular-structure',
        'chemical-bonding',
      ]),
      slot('thermo', 'Thermodynamics', 2, ['thermodynamics', 'chemical-thermodynamics']),
      slot('equilibrium', 'Chemical and Ionic Equilibrium', 2, [
        'equilibrium',
        'chemical-equilibrium',
        'ionic-equilibrium',
        'ionic-equilibria',
      ]),
      slot('solutions', 'Solutions', 2, ['solutions']),
      slot('electrochemistry', 'Electrochemistry', 3, ['electrochemistry']),
      slot('kinetics', 'Chemical Kinetics', 2, ['chemical-kinetics']),
      slot('surface', 'Surface Chemistry', 1, [], {
        rotateOffset: 2,
        rotating: [
          ['surface-chemistry'],
          ['environmental-chemistry'],
          ['metallurgy', 'general-principles-and-processes-of-isolation-of-elements'],
          ['some-basic-concepts-of-chemistry', 'mole-concept'],
        ],
      }),
      slot('p_block', 'p-Block Elements', 2, ['p-block-elements', 'p-block']),
      slot('df_block', 'd- and f-Block Elements', 2, [
        'd-and-f-block-elements',
        'd-block',
        'f-block',
      ]),
      slot('coordination', 'Coordination Compounds', 3, ['coordination-compounds']),
      slot('goc', 'General Organic Chemistry and Hydrocarbons', 3, [
        'organic-chemistry-some-basic-principles-and-techniques',
        'hydrocarbons',
        'isomerism',
        'general-organic-chemistry',
      ]),
      slot('halo', 'Haloalkanes and Haloarenes', 1, [
        'haloalkanes-and-haloarenes',
        'haloalkanes',
      ]),
      slot('oxygen', 'Organic Compounds Containing Oxygen', 3, [
        'alcohols-phenols-and-ethers',
        'aldehydes-ketones-and-carboxylic-acids',
        'alcohols',
        'phenols',
        'ethers',
      ]),
      slot('nitrogen', 'Organic Compounds Containing Nitrogen', 2, [
        'amines',
        'diazonium-salts',
      ]),
      slot('biomolecules', 'Biomolecules and Polymers', 2, ['biomolecules', 'polymers']),
    ],
  },
  Aptitude: {
    label: 'Aptitude',
    order: 3,
    count: 10,
    bankCategories: ['viteee', 'general-aptitude', 'gate-cse'],
    slots: [
      slot('quant', 'Quantitative aptitude', 4, [
        'percentages',
        'ratio-and-proportion',
        'profit-and-loss',
        'time-and-work',
        'time-speed-distance',
        'averages',
        'quantitative-aptitude',
        'numerical-ability',
      ]),
      slot('reasoning', 'Logical reasoning', 3, [
        'series',
        'number-series',
        'coding-decoding',
        'blood-relations',
        'directions',
        'direction-sense',
        'syllogism',
        'syllogisms',
        'logical-reasoning',
      ]),
      slot('di', 'Data interpretation', 2, [
        'data-interpretation',
        'tables',
        'bar-graph',
        'pie-chart',
      ]),
      slot('puzzles', 'Puzzles and arrangements', 1, [
        'puzzles',
        'seating-arrangement',
        'arrangements',
      ]),
    ],
  },
  English: {
    label: 'English',
    order: 4,
    count: 5,
    bankCategories: ['viteee', 'general-aptitude'],
    slots: [
      slot('rc', 'Reading comprehension', 2, [
        'reading-comprehension',
        'comprehension',
        'passages',
      ]),
      slot('vocab', 'Vocabulary', 2, [
        'synonyms',
        'antonyms',
        'idioms',
        'vocabulary',
        'one-word-substitution',
      ]),
      slot('grammar', 'Grammar', 1, [
        'grammar',
        'sentence-correction',
        'error-spotting',
        'sentence-improvement',
      ]),
    ],
  },
};

export function normalizeViteeeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function isViteeeExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'viteee' || s === 'vit-eee';
}

export function resolveViteeeSlotAliases(slotDef, dayIndex = 0) {
  if (Array.isArray(slotDef.rotating) && slotDef.rotating.length > 0) {
    const offset = Number(slotDef.rotateOffset) || 0;
    const idx = Math.abs((Number(dayIndex) || 0) + offset) % slotDef.rotating.length;
    return slotDef.rotating[idx].map(normalizeViteeeToken);
  }
  return (slotDef.aliases || []).map(normalizeViteeeToken);
}

export function getViteeeSubjectBlueprint(subject) {
  const key = Object.keys(VITEEE_SUBJECTS).find(
    (k) => k.toLowerCase() === String(subject || '').toLowerCase()
  );
  return key ? VITEEE_SUBJECTS[key] : null;
}

export function listViteeeSubjectNames() {
  return Object.values(VITEEE_SUBJECTS)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.label);
}

export function subjectMatchesViteee(rowSubject, subjectLabel) {
  const row = normalizeViteeeToken(rowSubject);
  if (!row) return true;
  const rules = {
    Mathematics: ['math'],
    Physics: ['phys'],
    Chemistry: ['chem'],
    Aptitude: ['aptitude', 'quant', 'reason'],
    English: ['english', 'verbal', 'grammar', 'aptitude'],
  };
  const needles = rules[subjectLabel] || [normalizeViteeeToken(subjectLabel)];
  return needles.some((needle) => row.includes(needle));
}

export function viteeeChapterDurationMinutes() {
  return 25;
}

export function auditViteeeBlueprint() {
  const subjects = [];
  const errors = [];
  for (const bp of Object.values(VITEEE_SUBJECTS)) {
    const total = bp.slots.reduce((n, s) => n + s.count, 0);
    const diff = VITEEE_PAPER.difficultyTargets[bp.label];
    const diffSum = diff ? diff.easy + diff.medium + diff.hard : 0;
    if (total !== bp.count) {
      errors.push(`${bp.label} slots sum to ${total}, expected ${bp.count}`);
    }
    if (diff && diffSum !== bp.count) {
      errors.push(`${bp.label} difficulty targets sum to ${diffSum}, expected ${bp.count}`);
    }
    subjects.push({ subject: bp.label, total, marks: total * VITEEE_PAPER.marksCorrect });
  }
  const questions = subjects.reduce((n, s) => n + s.total, 0);
  const marks = questions * VITEEE_PAPER.marksCorrect;
  if (questions !== VITEEE_PAPER.totalQuestions) {
    errors.push(`Paper has ${questions} questions, expected ${VITEEE_PAPER.totalQuestions}`);
  }
  if (marks !== VITEEE_PAPER.maxMarks) {
    errors.push(`Paper has ${marks} marks, expected ${VITEEE_PAPER.maxMarks}`);
  }
  return { ok: errors.length === 0, errors, subjects, questions, marks };
}
