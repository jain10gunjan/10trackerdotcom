/**
 * MHT-CET PCM blueprint (CET Cell style, Maharashtra State Board Class 11 + 12).
 * 150 single-correct MCQs, 200 marks, 180 minutes, no negative marking.
 * Physics 50×1 + Chemistry 50×1 + Mathematics 50×2.
 * Class split per subject: 10 (Class 11) + 40 (Class 12).
 * Chapter aliases match mhcetquestions.topic and examtracker chapter/topic slugs.
 */

export const MHT_CET_SLUG = 'mht-cet';
export const MHT_CET_CREATION_MODE = 'mht_cet_blueprint';
export const MHT_CET_CHAPTER_CREATION_MODE = 'mht_cet_chapter';

export const MHT_CET_INSTRUCTIONS =
  'No negative marking. Attempt every question. Physics and Chemistry are 1 mark each. Mathematics is 2 marks each. All questions are single-correct MCQs with four options.';

export const MHT_CET_STRATEGY =
  'Paper 1 (first 90 minutes): Chemistry first (~30 min), then Physics (~45 min), then 15 min review. Paper 2: attempt Logic, Matrices, Differentiation and Integration before 3D geometry and Vectors. Never leave a question blank.';

export const MHT_CET_PAPER = {
  totalQuestions: 150,
  questionsPerSubject: 50,
  durationMinutes: 180,
  paperMinutes: 90,
  maxMarks: 200,
  pcmMarks: 1,
  mathsMarks: 2,
  negativeMarking: 0,
  class11PerSubject: 10,
  class12PerSubject: 40,
  /** Answered faster than this counts as a guess on the results pacing check. */
  guessMaxSeconds: { pcm: 12, maths: 20 },
  difficultyTargets: {
    Physics: { easy: 23, medium: 20, hard: 7 },
    Chemistry: { easy: 23, medium: 20, hard: 7 },
    Mathematics: { easy: 18, medium: 22, hard: 10 },
  },
};

/**
 * @typedef {{ key: string, label: string, count: number, classLevel: 11|12, aliases: string[], rotating?: string[][] }} MhtSlot
 */

function slot(key, label, count, classLevel, aliases, extra = {}) {
  return { key, label, count, classLevel, aliases, ...extra };
}

/** @type {Record<string, { label: string, order: number, marks: number, slots: MhtSlot[] }>} */
export const MHT_CET_SUBJECTS = {
  Physics: {
    label: 'Physics',
    order: 0,
    marks: 1,
    slots: [
      slot('measurements', 'Measurements and Scalars/Vectors', 1, 11, [
        'measurements',
        'units-and-measurements',
        'scalars-and-vectors',
        'physical-world',
        'vectors',
      ]),
      slot('motion_plane', 'Motion in a Plane', 2, 11, [
        'motion-in-a-plane',
        'projectile-motion',
        'circular-motion',
      ]),
      slot('laws_of_motion', 'Laws of Motion', 1, 11, ['laws-of-motion', 'newton-laws-of-motion']),
      slot('gravitation', 'Gravitation', 1, 11, ['gravitation']),
      slot('solids', 'Mechanical Properties of Solids', 1, 11, [
        'mechanical-properties-of-solids',
        'elasticity',
        'properties-of-solids',
      ]),
      slot('thermal', 'Thermal Properties of Matter', 1, 11, [
        'thermal-properties-of-matter',
        'heat-transfer',
        'thermal-properties',
      ]),
      slot('sound', 'Sound', 1, 11, ['sound', 'waves-and-sound']),
      slot('ray_optics_11', 'Optics (ray optics)', 1, 11, [
        'ray-optics',
        'ray-optics-and-optical-instruments',
      ]),
      slot('phy_rotating', 'Semiconductors / EM Waves', 1, 11, [], {
        rotating: [
          ['semiconductors', 'semiconductor-devices', 'electronic-devices'],
          ['electromagnetic-waves', 'em-waves', 'electromagnetic-wave'],
        ],
      }),
      slot('rotational', 'Rotational Motion', 3, 12, ['rotational-motion', 'rotational-dynamics']),
      slot('fluids', 'Mechanical Properties of Fluids', 2, 12, [
        'mechanical-properties-of-fluids',
        'fluid-mechanics',
        'properties-of-fluids',
      ]),
      slot('ktg_radiation', 'Kinetic Theory of Gases and Radiation', 3, 12, [
        'kinetic-theory-of-gases-and-radiation',
        'kinetic-theory-of-gases',
        'radiation',
        'kinetic-theory',
      ]),
      slot('thermodynamics', 'Thermodynamics', 2, 12, ['thermodynamics']),
      slot('oscillations', 'Oscillations', 3, 12, ['oscillations', 'simple-harmonic-motion', 'shm']),
      slot('superposition', 'Superposition of Waves', 3, 12, [
        'superposition-of-waves',
        'superposition',
        'wave-motion',
      ]),
      slot('wave_optics', 'Wave Optics', 3, 12, ['wave-optics', 'wave-optics-and-interference']),
      slot('electrostatics', 'Electrostatics', 3, 12, ['electrostatics', 'electric-charges-and-fields']),
      slot('current', 'Current Electricity', 3, 12, ['current-electricity']),
      slot('magnetic_fields', 'Magnetic Fields due to Electric Current', 2, 12, [
        'magnetic-fields-due-to-electric-current',
        'magnetic-effects-of-electric-current',
        'magnetic-effect-of-electric-current',
      ]),
      slot('magnetism', 'Magnetism', 1, 12, ['magnetism', 'magnetism-and-matter']),
      slot('emi', 'Electromagnetic Induction', 3, 12, ['electromagnetic-induction']),
      slot('ac_circuits', 'AC Circuits', 2, 12, [
        'ac-circuits',
        'alternating-current',
        'alternating-currents',
      ]),
      slot('dual_nature', 'Dual Nature of Radiation and Matter', 2, 12, [
        'dual-nature-of-radiation-and-matter',
        'dual-nature-of-matter-and-radiation',
        'dual-nature',
      ]),
      slot('atoms_nuclei', 'Structure of Atoms and Nuclei', 3, 12, [
        'structure-of-atoms-and-nuclei',
        'atoms-and-nuclei',
        'structure-of-atom-and-nuclei',
      ]),
      slot('semiconductor_devices', 'Semiconductor Devices', 2, 12, [
        'semiconductor-devices',
        'semiconductors',
        'electronic-devices',
      ]),
    ],
  },
  Chemistry: {
    label: 'Chemistry',
    order: 1,
    marks: 1,
    slots: [
      slot('basic_concepts', 'Some Basic Concepts of Chemistry', 1, 11, [
        'some-basic-concepts-of-chemistry',
        'basic-concepts-of-chemistry',
        'mole-concept',
      ]),
      slot('structure_atom', 'Structure of Atom', 1, 11, ['structure-of-atom', 'atomic-structure']),
      slot('chemical_bonding', 'Chemical Bonding', 2, 11, [
        'chemical-bonding',
        'chemical-bonding-and-molecular-structure',
      ]),
      slot('redox', 'Redox Reactions', 1, 11, ['redox-reactions', 'redox']),
      slot('group_1_2', 'Elements of Group 1 and 2', 1, 11, [
        'elements-of-group-1-and-2',
        's-block-elements',
        's-block',
        'alkali-and-alkaline-earth-metals',
      ]),
      slot('states_matter', 'States of Matter', 1, 11, [
        'states-of-matter',
        'states-of-matter-gases-and-liquids',
        'gaseous-state',
      ]),
      slot('adsorption', 'Adsorption and Colloids', 1, 11, [
        'adsorption-and-colloids',
        'surface-chemistry',
        'colloids',
      ]),
      slot('basic_organic', 'Basic Principles of Organic Chemistry and Hydrocarbons', 2, 11, [
        'basic-principles-of-organic-chemistry',
        'hydrocarbons',
        'organic-chemistry-some-basic-principles-and-techniques',
        'some-basic-principles-of-organic-chemistry',
      ]),
      slot('solid_state', 'Solid State', 2, 12, ['solid-state', 'the-solid-state']),
      slot('solutions', 'Solutions', 3, 12, ['solutions']),
      slot('ionic_equilibria', 'Ionic Equilibria', 2, 12, [
        'ionic-equilibria',
        'ionic-equilibrium',
        'equilibrium',
      ]),
      slot('chem_thermo', 'Chemical Thermodynamics', 3, 12, [
        'chemical-thermodynamics',
        'thermodynamics',
      ]),
      slot('electrochemistry', 'Electrochemistry', 3, 12, ['electrochemistry']),
      slot('kinetics', 'Chemical Kinetics', 3, 12, ['chemical-kinetics']),
      slot('group_16_18', 'Elements of Groups 16, 17 and 18', 2, 12, [
        'elements-of-groups-16-17-and-18',
        'p-block-elements',
        'p-block',
        'group-16-17-and-18',
      ]),
      slot('transition', 'Transition and Inner Transition Elements', 3, 12, [
        'transition-and-inner-transition-elements',
        'd-and-f-block-elements',
        'd-block',
        'transition-elements',
      ]),
      slot('coordination', 'Coordination Compounds', 3, 12, ['coordination-compounds']),
      slot('halogen', 'Halogen Derivatives', 3, 12, [
        'halogen-derivatives',
        'haloalkanes-and-haloarenes',
        'haloalkanes',
      ]),
      slot('alcohols', 'Alcohols, Phenols and Ethers', 3, 12, [
        'alcohols-phenols-and-ethers',
        'alcohols-phenols-ethers',
        'alcohols',
      ]),
      slot('carbonyl', 'Aldehydes, Ketones and Carboxylic Acids', 3, 12, [
        'aldehydes-ketones-and-carboxylic-acids',
        'aldehydes-ketones-carboxylic-acids',
        'carbonyl-compounds',
      ]),
      slot('amines', 'Amines', 2, 12, ['amines']),
      slot('biomolecules', 'Biomolecules', 3, 12, ['biomolecules']),
      slot('polymers', 'Introduction to Polymer Chemistry', 1, 12, [
        'introduction-to-polymer-chemistry',
        'polymers',
        'polymer-chemistry',
      ]),
      slot('green_chem', 'Green Chemistry and Nanochemistry', 1, 12, [
        'green-chemistry-and-nanochemistry',
        'green-chemistry',
        'nanochemistry',
      ]),
    ],
  },
  Mathematics: {
    label: 'Mathematics',
    order: 2,
    marks: 2,
    slots: [
      slot('trigonometry_11', 'Trigonometry', 2, 11, [
        'trigonometry',
        'trigonometric-identities',
        'trigonometric-ratios',
        'trigonometric-equations',
      ]),
      slot('straight_line', 'Straight Line', 1, 11, ['straight-line', 'straight-lines']),
      slot('circle_conic', 'Circle and Conic Sections', 2, 11, [
        'circle',
        'conic-sections',
        'circle-and-conics',
        'circles',
      ]),
      slot('dispersion', 'Measures of Dispersion', 1, 11, [
        'measures-of-dispersion',
        'statistics',
        'dispersion',
      ]),
      slot('probability_11', 'Probability', 1, 11, ['probability']),
      slot('complex', 'Complex Numbers', 1, 11, [
        'complex-numbers',
        'complex-numbers-and-quadratic-equations',
      ]),
      slot('pnc', 'Permutations and Combinations', 1, 11, [
        'permutations-and-combinations',
        'permutation-and-combination',
      ]),
      slot('functions_limits', 'Functions and Limits', 1, 11, [
        'functions-and-limits',
        'limits',
        'limits-and-derivatives',
      ]),
      slot('logic', 'Mathematical Logic', 2, 12, ['mathematical-logic', 'logic']),
      slot('matrices', 'Matrices', 2, 12, ['matrices', 'matrices-and-determinants']),
      slot('trig_12', 'Trigonometric Functions', 2, 12, [
        'trigonometric-functions',
        'inverse-trigonometric-functions',
        'inverse-trigonometric-function',
      ]),
      slot('pair_lines', 'Pair of Straight Lines', 2, 12, [
        'pair-of-straight-lines',
        'pair-of-lines',
      ]),
      slot('vectors', 'Vectors', 4, 12, ['vectors', 'vector-algebra']),
      slot('three_d', 'Three-Dimensional Geometry', 4, 12, [
        'three-dimensional-geometry',
        'line-and-plane',
        '3d-geometry',
        'introduction-to-three-dimensional-geometry',
      ]),
      slot('lpp', 'Linear Programming', 1, 12, [
        'linear-programming',
        'linear-programming-problems',
      ]),
      slot('differentiation', 'Differentiation', 4, 12, [
        'differentiation',
        'continuity-and-differentiability',
        'derivatives',
      ]),
      slot('aod', 'Applications of Derivatives', 3, 12, [
        'applications-of-derivatives',
        'application-of-derivatives',
      ]),
      slot('integration', 'Integration', 3, 12, [
        'integration',
        'indefinite-integration',
        'integrals',
      ]),
      slot('definite', 'Definite Integration', 3, 12, [
        'definite-integration',
        'definite-integrals',
      ]),
      slot('area', 'Application of Definite Integration', 2, 12, [
        'application-of-definite-integration',
        'applications-of-definite-integration',
        'area-under-curves',
        'application-of-integrals',
      ]),
      slot('de', 'Differential Equations', 3, 12, ['differential-equations']),
      slot('prob_dist', 'Probability Distribution', 3, 12, [
        'probability-distribution',
        'probability-distributions',
        'random-variables',
      ]),
      slot('binomial', 'Binomial Distribution', 2, 12, ['binomial-distribution']),
    ],
  },
};

export function normalizeMhtChapterToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function isMhtCetExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'mht-cet' || s === 'mhcet' || s === 'mhtcet';
}

export function mhtCetMarksForSubject(subject) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('math')) return MHT_CET_PAPER.mathsMarks;
  return MHT_CET_PAPER.pcmMarks;
}

export function mhtCetGuessMaxSeconds(subject, marks) {
  const m = Number(marks);
  if (m === MHT_CET_PAPER.mathsMarks || String(subject || '').toLowerCase().includes('math')) {
    return MHT_CET_PAPER.guessMaxSeconds.maths;
  }
  return MHT_CET_PAPER.guessMaxSeconds.pcm;
}

export function mhtCetChapterDurationMinutes(subject) {
  return mhtCetMarksForSubject(subject) === MHT_CET_PAPER.mathsMarks ? 36 : 20;
}

export function resolveMhtSlotAliases(slotDef, dayIndex = 0) {
  if (Array.isArray(slotDef.rotating) && slotDef.rotating.length > 0) {
    const idx = Math.abs(Number(dayIndex) || 0) % slotDef.rotating.length;
    return slotDef.rotating[idx].map(normalizeMhtChapterToken);
  }
  return (slotDef.aliases || []).map(normalizeMhtChapterToken);
}

export function getMhtSubjectBlueprint(subject) {
  const key = Object.keys(MHT_CET_SUBJECTS).find(
    (k) => k.toLowerCase() === String(subject || '').toLowerCase()
  );
  return key ? MHT_CET_SUBJECTS[key] : null;
}

export function listMhtSubjectNames() {
  return Object.values(MHT_CET_SUBJECTS)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.label);
}

export function subjectMatchesMht(rowSubject, subjectLabel) {
  const row = String(rowSubject || '').toLowerCase();
  const want = String(subjectLabel || '').toLowerCase();
  if (!row) return true;
  if (want.startsWith('phys')) return row.includes('phys');
  if (want.startsWith('chem')) return row.includes('chem');
  if (want.startsWith('math')) return row.includes('math');
  return row === want;
}

/** Fail if a subject is not 10 + 40 = 50. Used by tests and the generator. */
export function auditMhtCetBlueprint() {
  const subjects = [];
  const errors = [];
  for (const bp of Object.values(MHT_CET_SUBJECTS)) {
    const class11 = bp.slots
      .filter((s) => s.classLevel === 11)
      .reduce((n, s) => n + s.count, 0);
    const class12 = bp.slots
      .filter((s) => s.classLevel === 12)
      .reduce((n, s) => n + s.count, 0);
    const total = class11 + class12;
    const diff = MHT_CET_PAPER.difficultyTargets[bp.label];
    const diffSum = diff ? diff.easy + diff.medium + diff.hard : 0;
    if (class11 !== MHT_CET_PAPER.class11PerSubject) {
      errors.push(`${bp.label} Class 11 is ${class11}, expected ${MHT_CET_PAPER.class11PerSubject}`);
    }
    if (class12 !== MHT_CET_PAPER.class12PerSubject) {
      errors.push(`${bp.label} Class 12 is ${class12}, expected ${MHT_CET_PAPER.class12PerSubject}`);
    }
    if (total !== MHT_CET_PAPER.questionsPerSubject) {
      errors.push(`${bp.label} total is ${total}, expected ${MHT_CET_PAPER.questionsPerSubject}`);
    }
    if (diff && diffSum !== MHT_CET_PAPER.questionsPerSubject) {
      errors.push(`${bp.label} difficulty targets sum to ${diffSum}`);
    }
    subjects.push({
      subject: bp.label,
      class11,
      class12,
      total,
      marks: bp.marks,
      slotCount: bp.slots.length,
    });
  }
  const questions = subjects.reduce((n, s) => n + s.total, 0);
  const marks = subjects.reduce((n, s) => n + s.total * s.marks, 0);
  if (questions !== MHT_CET_PAPER.totalQuestions) {
    errors.push(`Paper has ${questions} questions, expected ${MHT_CET_PAPER.totalQuestions}`);
  }
  if (marks !== MHT_CET_PAPER.maxMarks) {
    errors.push(`Paper has ${marks} marks, expected ${MHT_CET_PAPER.maxMarks}`);
  }
  return { ok: errors.length === 0, errors, subjects, questions, marks };
}
