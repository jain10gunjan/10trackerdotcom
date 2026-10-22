/**
 * KCET blueprint: 180 MCQs, 180 marks, 240 minutes (three papers × 80 minutes).
 * Physics 60, Chemistry 60, Mathematics 60. +1 correct, 0 wrong, 0 blank.
 * PUC I/II tags follow the usual Karnataka PUC split of these chapters.
 * The 35–40% / 60–65% band is an estimate and does not block creation.
 */

export const KCET_SLUG = 'kcet';
export const KCET_CREATION_MODE = 'kcet_blueprint';
export const KCET_CHAPTER_CREATION_MODE = 'kcet_chapter';

export const KCET_INSTRUCTIONS =
  'Marking: +1 for a correct answer, 0 for a wrong answer, 0 if left blank. There is no negative marking, so attempt every question. All questions are single-correct MCQs with four options.';

export const KCET_STRATEGY =
  'Suggested order: Chemistry first (about 55 seconds per question), then Physics, then Mathematics. Mark uncertain questions for review and still fill an answer for each. One 240-minute timer covers the three 80-minute papers.';

export const KCET_PAPER = {
  totalQuestions: 180,
  durationMinutes: 240,
  maxMarks: 180,
  marksCorrect: 1,
  marksWrong: 0,
  difficultyTargets: {
    Physics: { easy: 27, medium: 24, hard: 9 },
    Chemistry: { easy: 27, medium: 24, hard: 9 },
    Mathematics: { easy: 21, medium: 27, hard: 12 },
  },
};

function slot(key, label, count, aliases, extra = {}) {
  return { key, label, count, aliases, puc: 2, ...extra };
}

/** @type {Record<string, { label: string, order: number, count: number, bankCategories: string[], slots: object[] }>} */
export const KCET_SUBJECTS = {
  Physics: {
    label: 'Physics',
    order: 0,
    count: 60,
    bankCategories: ['kcet', 'jee-main'],
    slots: [
      slot('units', 'Units, Dimensions and Errors', 1, [
        'units-and-measurements',
        'units-dimensions-and-errors',
        'errors-and-measurements',
      ], { group: 'Mechanics and Properties of Matter', puc: 1 }),
      slot('kinematics', 'Kinematics', 2, [
        'motion-in-a-straight-line',
        'motion-in-a-plane',
        'kinematics',
      ], { group: 'Mechanics and Properties of Matter', puc: 1 }),
      slot('laws', 'Laws of Motion, Friction and Circular Motion', 2, [
        'laws-of-motion',
        'friction',
        'circular-motion',
      ], { group: 'Mechanics and Properties of Matter', puc: 1 }),
      slot('work', 'Work, Energy, Power and Collisions', 2, [
        'work-energy-and-power',
        'work-energy-power',
        'collisions',
      ], { group: 'Mechanics and Properties of Matter', puc: 1 }),
      slot('rotation', 'System of Particles and Rotational Motion', 2, [
        'system-of-particles-and-rotational-motion',
        'rotational-motion',
      ], { group: 'Mechanics and Properties of Matter', puc: 1 }),
      slot('gravitation', 'Gravitation', 1, ['gravitation'], {
        group: 'Mechanics and Properties of Matter',
        puc: 1,
      }),
      slot('properties', 'Mechanical Properties of Solids and Fluids', 2, [
        'mechanical-properties-of-solids',
        'mechanical-properties-of-fluids',
        'properties-of-matter',
        'elasticity',
      ], { group: 'Mechanics and Properties of Matter', puc: 1 }),
      slot('heat', 'Thermal Properties, Thermodynamics and Kinetic Theory', 3, [
        'thermal-properties-of-matter',
        'thermodynamics',
        'kinetic-theory',
      ], { group: 'Heat and Waves', puc: 1 }),
      slot('shm', 'Oscillations', 2, ['oscillations', 'simple-harmonic-motion'], {
        group: 'Heat and Waves',
        puc: 1,
      }),
      slot('waves', 'Waves', 2, ['waves', 'waves-and-sound', 'sound-waves'], {
        group: 'Heat and Waves',
        puc: 1,
      }),
      slot('electrostatics', 'Electrostatics', 7, [
        'electric-charges-and-fields',
        'electrostatic-potential-and-capacitance',
        'electrostatics',
        'capacitors',
      ], { group: 'Electricity and Magnetism', puc: 2 }),
      slot('current', 'Current Electricity', 5, ['current-electricity'], {
        group: 'Electricity and Magnetism',
        puc: 2,
      }),
      slot('magnetism', 'Moving Charges and Magnetism', 4, [
        'moving-charges-and-magnetism',
        'magnetism-and-matter',
        'magnetic-effects-of-current',
      ], { group: 'Electricity and Magnetism', puc: 2 }),
      slot('emi_ac', 'Electromagnetic Induction and Alternating Current', 4, [
        'electromagnetic-induction',
        'alternating-current',
      ], { group: 'Electricity and Magnetism', puc: 2 }),
      slot('dual_em', 'Dual Nature and EM Waves', 4, [
        'dual-nature-of-radiation-and-matter',
        'electromagnetic-waves',
        'dual-nature',
      ], { group: 'Optics and Modern', puc: 2 }),
      slot('optics', 'Ray Optics and Wave Optics', 7, [
        'ray-optics',
        'ray-optics-and-optical-instruments',
        'wave-optics',
      ], { group: 'Optics and Modern', puc: 2 }),
      slot('atoms', 'Atoms and Nuclei', 6, ['atoms', 'nuclei', 'atoms-and-nuclei'], {
        group: 'Optics and Modern',
        puc: 2,
      }),
      slot('semiconductors', 'Semiconductor Electronics', 4, [
        'semiconductor-electronics',
        'electronic-devices',
        'semiconductors',
      ], { group: 'Optics and Modern', puc: 2 }),
    ],
  },
  Chemistry: {
    label: 'Chemistry',
    order: 1,
    count: 60,
    bankCategories: ['kcet', 'jee-main'],
    slots: [
      slot('mole', 'Some Basic Concepts of Chemistry', 3, [
        'some-basic-concepts-of-chemistry',
        'mole-concept',
        'stoichiometry',
      ], { group: 'Physical', puc: 1 }),
      slot('atomic', 'Structure of Atom', 2, ['structure-of-atom', 'atomic-structure'], {
        group: 'Physical',
        puc: 1,
      }),
      slot('thermo', 'Chemical Thermodynamics', 3, [
        'thermodynamics',
        'chemical-thermodynamics',
      ], { group: 'Physical', puc: 1 }),
      slot('equilibrium', 'Equilibrium', 3, [
        'equilibrium',
        'chemical-equilibrium',
        'ionic-equilibrium',
      ], { group: 'Physical', puc: 1 }),
      slot('redox', 'Redox Reactions', 1, ['redox-reactions', 'redox'], {
        group: 'Physical',
        puc: 1,
      }),
      slot('states', 'States of Matter', 1, ['states-of-matter', 'gaseous-state'], {
        group: 'Physical',
        puc: 1,
      }),
      slot('solid', 'Solid State', 1, ['solid-state', 'the-solid-state'], {
        group: 'Physical',
        puc: 2,
      }),
      slot('solutions', 'Solutions', 3, ['solutions'], { group: 'Physical', puc: 2 }),
      slot('electrochemistry', 'Electrochemistry', 3, ['electrochemistry'], {
        group: 'Physical',
        puc: 2,
      }),
      slot('kinetics', 'Chemical Kinetics', 3, ['chemical-kinetics'], {
        group: 'Physical',
        puc: 2,
      }),
      slot('surface', 'Surface Chemistry', 1, ['surface-chemistry', 'colloids'], {
        group: 'Physical',
        puc: 2,
      }),
      slot('periodic', 'Classification of Elements and Periodicity', 2, [
        'classification-of-elements-and-periodicity-in-properties',
        'periodic-table',
      ], { group: 'Inorganic', puc: 1 }),
      slot('bonding', 'Chemical Bonding and Molecular Structure', 3, [
        'chemical-bonding',
        'chemical-bonding-and-molecular-structure',
      ], { group: 'Inorganic', puc: 1 }),
      slot('s_block', 'Hydrogen and s-Block Elements', 1, [
        'hydrogen',
        's-block-elements',
        'the-s-block-elements',
      ], { group: 'Inorganic', puc: 1 }),
      slot('p_block', 'p-Block Elements', 3, [
        'the-p-block-elements',
        'p-block-elements',
      ], { group: 'Inorganic', puc: 2 }),
      slot('df_block', 'd- and f-Block Elements', 2, [
        'the-d-and-f-block-elements',
        'd-and-f-block-elements',
      ], { group: 'Inorganic', puc: 2 }),
      slot('coordination', 'Coordination Compounds', 3, ['coordination-compounds'], {
        group: 'Inorganic',
        puc: 2,
      }),
      slot('isolation', 'General Principles of Isolation of Elements', 1, [
        'general-principles-and-processes-of-isolation-of-elements',
        'metallurgy',
      ], { group: 'Inorganic', puc: 2 }),
      slot('environment', 'Environmental Chemistry', 1, ['environmental-chemistry'], {
        group: 'Inorganic',
        puc: 1,
      }),
      slot('goc', 'Basic Principles of Organic Chemistry', 3, [
        'organic-chemistry-some-basic-principles-and-techniques',
        'general-organic-chemistry',
        'isomerism',
      ], { group: 'Organic', puc: 1 }),
      slot('hydrocarbons', 'Hydrocarbons', 3, ['hydrocarbons'], { group: 'Organic', puc: 1 }),
      slot('halo', 'Haloalkanes and Haloarenes', 2, ['haloalkanes-and-haloarenes'], {
        group: 'Organic',
        puc: 2,
      }),
      slot('alcohols', 'Alcohols, Phenols and Ethers', 3, ['alcohols-phenols-and-ethers'], {
        group: 'Organic',
        puc: 2,
      }),
      slot('carbonyl', 'Aldehydes, Ketones and Carboxylic Acids', 3, [
        'aldehydes-ketones-and-carboxylic-acids',
      ], { group: 'Organic', puc: 2 }),
      slot('amines', 'Amines', 2, ['amines'], { group: 'Organic', puc: 2 }),
      slot('biomolecules', 'Biomolecules', 2, ['biomolecules'], { group: 'Organic', puc: 2 }),
      slot('polymers', 'Polymers and Chemistry in Everyday Life', 2, [
        'polymers',
        'chemistry-in-everyday-life',
      ], { group: 'Organic', puc: 2 }),
    ],
  },
  Mathematics: {
    label: 'Mathematics',
    order: 2,
    count: 60,
    bankCategories: ['kcet', 'jee-main'],
    slots: [
      slot('limits', 'Limits', 2, ['limits', 'limits-and-derivatives'], {
        group: 'Calculus',
        puc: 1,
      }),
      slot('continuity', 'Continuity and Differentiability', 3, [
        'continuity-and-differentiability',
        'continuity',
      ], { group: 'Calculus', puc: 2 }),
      slot('differentiation', 'Differentiation', 2, [
        'differentiation',
        'methods-of-differentiation',
        'continuity-and-differentiability',
      ], { group: 'Calculus', puc: 2 }),
      slot('aod', 'Applications of Derivatives', 3, [
        'application-of-derivatives',
        'applications-of-derivatives',
      ], { group: 'Calculus', puc: 2 }),
      slot('integrals', 'Integrals', 4, [
        'integrals',
        'indefinite-integrals',
        'definite-integrals',
        'indefinite-integration',
        'definite-integration',
      ], { group: 'Calculus', puc: 2 }),
      slot('area', 'Applications of Integrals', 1, [
        'application-of-integrals',
        'applications-of-integrals',
        'area-under-curves',
      ], { group: 'Calculus', puc: 2 }),
      slot('de', 'Differential Equations', 2, ['differential-equations'], {
        group: 'Calculus',
        puc: 2,
      }),
      slot('sets', 'Sets, Relations and Functions', 2, [
        'sets-relations-and-functions',
        'relations-and-functions',
        'sets',
      ], { group: 'Algebra', puc: 1 }),
      slot('complex', 'Complex Numbers', 2, [
        'complex-numbers',
        'complex-numbers-and-quadratic-equations',
      ], { group: 'Algebra', puc: 1 }),
      slot('quadratic', 'Quadratic Equations', 1, [
        'quadratic-equations',
        'complex-numbers-and-quadratic-equations',
      ], { group: 'Algebra', puc: 1 }),
      slot('sequences', 'Sequences and Series', 2, [
        'sequences-and-series',
        'arithmetic-progression',
        'geometric-progression',
      ], { group: 'Algebra', puc: 1 }),
      slot('permutations', 'Permutations and Combinations', 2, [
        'permutations-and-combinations',
        'permutation-and-combination',
      ], { group: 'Algebra', puc: 1 }),
      slot('binomial', 'Binomial Theorem', 2, [
        'binomial-theorem',
        'binomial-theorem-for-positive-integral-indices',
      ], { group: 'Algebra', puc: 1 }),
      slot('reasoning', 'Mathematical Reasoning and Linear Inequalities', 1, [
        'mathematical-reasoning',
        'linear-inequalities',
      ], { group: 'Algebra', puc: 1 }),
      slot('matrices', 'Matrices and Determinants', 5, [
        'matrices',
        'determinants',
        'matrices-and-determinants',
      ], { group: 'Matrices and Determinants', puc: 2 }),
      slot('straight_lines', 'Straight Lines', 3, ['straight-lines', 'straight-line'], {
        group: 'Coordinate Geometry',
        puc: 1,
      }),
      slot('circles', 'Circles', 2, ['circle', 'circles'], {
        group: 'Coordinate Geometry',
        puc: 1,
      }),
      slot('parabola', 'Parabola', 2, ['parabola'], { group: 'Coordinate Geometry', puc: 2 }),
      slot('ellipse', 'Ellipse', 2, ['ellipse'], { group: 'Coordinate Geometry', puc: 2 }),
      slot('hyperbola', 'Hyperbola', 1, ['hyperbola'], { group: 'Coordinate Geometry', puc: 2 }),
      slot('vectors', 'Vector Algebra', 3, ['vector-algebra', 'vectors'], {
        group: 'Vectors and 3D Geometry',
        puc: 2,
      }),
      slot('three_d', 'Three-Dimensional Geometry', 3, [
        'three-dimensional-geometry',
        'introduction-to-three-dimensional-geometry',
        '3d-geometry',
      ], { group: 'Vectors and 3D Geometry', puc: 2 }),
      slot('trigonometry', 'Trigonometry', 5, [
        'trigonometric-functions',
        'inverse-trigonometric-functions',
        'trigonometric-equations',
        'trigonometry',
      ], { group: 'Trigonometry', puc: 1 }),
      slot('probability', 'Probability and Statistics', 5, [
        'probability',
        'conditional-probability',
        'bayes-theorem',
        'statistics',
        'measures-of-dispersion',
      ], { group: 'Probability and Statistics', puc: 2 }),
    ],
  },
};

const GROUP_TARGETS = {
  Physics: {
    'Mechanics and Properties of Matter': 12,
    'Heat and Waves': 7,
    'Electricity and Magnetism': 20,
    'Optics and Modern': 21,
  },
  Chemistry: { Physical: 24, Inorganic: 16, Organic: 20 },
  Mathematics: {
    Calculus: 17,
    Algebra: 12,
    'Matrices and Determinants': 5,
    'Coordinate Geometry': 10,
    'Vectors and 3D Geometry': 6,
    Trigonometry: 5,
    'Probability and Statistics': 5,
  },
};

export function normalizeKcetToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function isKcetExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'kcet' || s === 'k-cet';
}

export function getKcetSubjectBlueprint(subject) {
  const key = Object.keys(KCET_SUBJECTS).find(
    (k) => k.toLowerCase() === String(subject || '').toLowerCase()
  );
  return key ? KCET_SUBJECTS[key] : null;
}

export function listKcetSubjectNames() {
  return Object.values(KCET_SUBJECTS)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.label);
}

export function subjectMatchesKcet(rowSubject, subjectLabel) {
  const row = normalizeKcetToken(rowSubject);
  if (!row) return true;
  const rules = {
    Physics: ['phys'],
    Chemistry: ['chem'],
    Mathematics: ['math'],
  };
  const needles = rules[subjectLabel] || [normalizeKcetToken(subjectLabel)];
  return needles.some((needle) => row.includes(needle));
}

export function kcetChapterDurationMinutes() {
  return 27;
}

/** Answered faster than a worked PUC solution counts as a guess. */
export function kcetGuessThresholdSeconds(subject) {
  if (String(subject || '').toLowerCase().includes('math')) return 20;
  return 15;
}

export function auditKcetBlueprint() {
  const subjects = [];
  const errors = [];
  for (const bp of Object.values(KCET_SUBJECTS)) {
    const total = bp.slots.reduce((n, s) => n + s.count, 0);
    const puc1 = bp.slots.filter((s) => s.puc === 1).reduce((n, s) => n + s.count, 0);
    const puc2 = bp.slots.filter((s) => s.puc === 2).reduce((n, s) => n + s.count, 0);
    const diff = KCET_PAPER.difficultyTargets[bp.label];
    const diffSum = diff ? diff.easy + diff.medium + diff.hard : 0;
    const groups = {};
    bp.slots.forEach((s) => {
      if (!s.group) return;
      groups[s.group] = (groups[s.group] || 0) + s.count;
    });
    if (total !== bp.count) errors.push(`${bp.label} slots sum to ${total}, expected ${bp.count}`);
    if (puc1 + puc2 !== bp.count) {
      errors.push(`${bp.label} PUC tags sum to ${puc1 + puc2}, expected ${bp.count}`);
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
    const puc1Share = bp.count ? puc1 / bp.count : 0;
    subjects.push({
      subject: bp.label,
      total,
      marks: total,
      puc: { 1: puc1, 2: puc2 },
      puc1Share: Math.round(puc1Share * 1000) / 10,
      groups,
    });
  }
  const questions = subjects.reduce((n, s) => n + s.total, 0);
  const marks = questions * KCET_PAPER.marksCorrect;
  if (questions !== KCET_PAPER.totalQuestions) {
    errors.push(`Paper has ${questions} questions, expected ${KCET_PAPER.totalQuestions}`);
  }
  if (marks !== KCET_PAPER.maxMarks) {
    errors.push(`Paper has ${marks} marks, expected ${KCET_PAPER.maxMarks}`);
  }
  return { ok: errors.length === 0, errors, subjects, questions, marks };
}
