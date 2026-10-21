/**
 * JEE Main full-paper blueprint (75Q / 180 min / +4 −1).
 * Chapter keys map to examtracker.chapter / chapter_slug / topic aliases (lowercase).
 */

export const JEE_MAIN_SLUG = 'jee-main';
export const JEE_MAIN_CREATION_MODE = 'jee_blueprint';

export const JEE_MAIN_PAPER = {
  totalQuestions: 75,
  durationMinutes: 180,
  maxMarks: 300,
  marksCorrect: 4,
  marksWrong: -1,
  subjects: ['Physics', 'Chemistry', 'Mathematics'],
  mcqPerSubject: 20,
  nvqPerSubject: 5,
  /** Soft targets per subject of 25 */
  difficultyTargets: { easy: 8, medium: 12, hard: 5 },
};

/**
 * @typedef {{ key: string, count: number, aliases: string[], rotating?: string[][] }} ChapterSlot
 */

/** @type {Record<string, { label: string, order: number, mcqSlots: ChapterSlot[], nvqChapterKeys: string[] }>} */
export const JEE_MAIN_SUBJECTS = {
  Physics: {
    label: 'Physics',
    order: 0,
    mcqSlots: [
      { key: 'kinematics', count: 1, aliases: ['motion-in-a-straight-line', 'motion-in-a-plane', 'kinematics'] },
      { key: 'laws_of_motion', count: 1, aliases: ['laws-of-motion'] },
      {
        key: 'work_energy',
        count: 1,
        aliases: ['work-energy-and-power', 'work-energy-power'],
      },
      {
        key: 'com_collisions',
        count: 1,
        aliases: ['rotational-motion', 'centre-of-mass', 'system-of-particles'],
      },
      { key: 'rotational', count: 2, aliases: ['rotational-motion', 'rotational-mechanics'] },
      {
        key: 'properties_matter',
        count: 1,
        aliases: ['properties-of-solids-and-liquids', 'fluid-mechanics', 'elasticity', 'surface-tension'],
      },
      {
        key: 'physics_rotating',
        count: 1,
        aliases: [],
        rotating: [
          ['units-and-measurements', 'units-and-measurement', 'dimensional-analysis'],
          ['gravitation'],
          ['electromagnetic-waves'],
        ],
      },
      {
        key: 'thermodynamics_ktg',
        count: 2,
        aliases: ['thermodynamics', 'kinetic-theory-of-gases', 'the-kinetic-theory-of-gases'],
      },
      { key: 'shm', count: 1, aliases: ['simple-harmonic-motion', 'waves-and-oscillations'] },
      { key: 'waves_sound', count: 1, aliases: ['waves', 'waves-and-sound'] },
      {
        key: 'electrostatics_capacitors',
        count: 2,
        aliases: [
          'electric-charges-and-fields',
          'electrostatic-potential-and-capacitance',
          'electrostatics',
          'capacitors',
        ],
      },
      { key: 'current_electricity', count: 2, aliases: ['current-electricity'] },
      {
        key: 'magnetism',
        count: 2,
        aliases: ['magnetic-effects-of-current-and-magnetism', 'magnetism'],
      },
      {
        key: 'emi_ac',
        count: 2,
        aliases: [
          'electromagnetic-induction-and-alternating-currents',
          'electromagnetic-induction',
          'alternating-current',
        ],
      },
      { key: 'ray_optics', count: 1, aliases: ['ray-optics', 'ray-optics-and-optical-instruments'] },
      { key: 'wave_optics', count: 1, aliases: ['wave-optics'] },
      {
        key: 'modern_physics',
        count: 2,
        aliases: [
          'atoms-and-nuclei',
          'dual-nature-of-matter-and-radiation',
          'dual-nature',
          'modern-physics',
        ],
      },
      {
        key: 'semiconductors',
        count: 1,
        aliases: ['electronic-devices', 'semiconductors', 'semiconductor-electronics'],
      },
    ],
    nvqChapterKeys: [
      'current_electricity',
      'rotational',
      'com_collisions',
      'thermodynamics_ktg',
      'wave_optics',
      'modern_physics',
      'electrostatics_capacitors',
    ],
  },
  Chemistry: {
    label: 'Chemistry',
    order: 1,
    mcqSlots: [
      {
        key: 'mole_concept',
        count: 1,
        aliases: ['some-basic-concepts-of-chemistry', 'mole-concept'],
      },
      { key: 'atomic_structure', count: 1, aliases: ['structure-of-atom', 'atomic-structure'] },
      { key: 'chem_thermodynamics', count: 1, aliases: ['thermodynamics'] },
      { key: 'equilibrium', count: 2, aliases: ['equilibrium', 'chemical-equilibrium', 'ionic-equilibrium'] },
      {
        key: 'electrochemistry',
        count: 1,
        aliases: ['electrochemistry', 'redox-reactions'],
      },
      { key: 'chemical_kinetics', count: 1, aliases: ['chemical-kinetics'] },
      { key: 'solutions', count: 1, aliases: ['solutions'] },
      {
        key: 'periodic_table',
        count: 1,
        aliases: [
          'classification-of-elements-and-periodicity-in-properties',
          'periodic-table',
          'periodicity',
        ],
      },
      {
        key: 'chemical_bonding',
        count: 2,
        aliases: ['chemical-bonding-and-molecular-structure', 'chemical-bonding'],
      },
      { key: 'coordination', count: 2, aliases: ['coordination-compounds'] },
      { key: 'df_block', count: 1, aliases: ['d-and-f-block-elements', 'd-block', 'f-block'] },
      { key: 'p_block', count: 1, aliases: ['p-block-elements', 'p-block'] },
      {
        key: 'chem_rotating',
        count: 1,
        aliases: [],
        rotating: [
          ['s-block-elements', 's-block'],
          ['hydrogen'],
          [
            'general-principles-and-processes-of-isolation-of-elements',
            'metallurgy',
            'isolation-of-elements',
          ],
          ['environmental-chemistry'],
        ],
      },
      {
        key: 'goc',
        count: 2,
        aliases: [
          'organic-chemistry-some-basic-principles-and-techniques',
          'goc',
          'general-organic-chemistry',
        ],
      },
      { key: 'hydrocarbons', count: 1, aliases: ['hydrocarbons'] },
      {
        key: 'haloalkanes',
        count: 1,
        aliases: ['haloalkanes-and-haloarenes', 'haloalkanes', 'haloarenes'],
      },
      {
        key: 'alcohols_phenols',
        count: 1,
        aliases: ['alcohols-phenols-and-ethers', 'alcohols', 'phenols', 'ethers'],
      },
      {
        key: 'carbonyl_acids',
        count: 1,
        aliases: [
          'aldehydes-ketones-and-carboxylic-acids',
          'aldehydes',
          'ketones',
          'carboxylic-acids',
        ],
      },
      { key: 'amines', count: 1, aliases: ['amines'] },
      {
        key: 'biomolecules_polymers',
        count: 1,
        aliases: ['biomolecules', 'polymers'],
      },
      {
        key: 'practical_organic',
        count: 1,
        aliases: [
          'principles-of-practical-chemistry',
          'practical-organic-chemistry',
          'salt-analysis',
        ],
      },
    ],
    nvqChapterKeys: [
      'mole_concept',
      'equilibrium',
      'electrochemistry',
      'chemical_kinetics',
      'chem_thermodynamics',
      'solutions',
    ],
  },
  Mathematics: {
    label: 'Mathematics',
    order: 2,
    mcqSlots: [
      {
        key: 'complex_quadratic',
        count: 2,
        aliases: ['complex-numbers-and-quadratic-equations', 'complex-numbers', 'quadratic-equations'],
      },
      {
        key: 'matrices_determinants',
        count: 2,
        aliases: ['matrices', 'determinants'],
      },
      {
        key: 'permutations_combinations',
        count: 1,
        aliases: ['permutations-and-combinations'],
      },
      { key: 'binomial', count: 1, aliases: ['binomial-theorem'] },
      { key: 'sequences_series', count: 1, aliases: ['sequences-and-series'] },
      {
        key: 'limits_continuity',
        count: 2,
        aliases: [
          'limits-and-derivatives',
          'continuity-and-differentiability',
          'limits',
          'continuity',
        ],
      },
      {
        key: 'application_derivatives',
        count: 1,
        aliases: ['application-of-derivatives'],
      },
      {
        key: 'integration',
        count: 2,
        aliases: ['integrals', 'indefinite-integrals', 'definite-integrals', 'calculus'],
      },
      { key: 'differential_equations', count: 1, aliases: ['differential-equations'] },
      {
        key: 'area_under_curves',
        count: 1,
        aliases: ['application-of-integrals', 'area-under-curves'],
      },
      { key: 'straight_lines', count: 1, aliases: ['straight-lines'] },
      { key: 'circles', count: 1, aliases: ['conic-sections', 'circles', 'geometry'] },
      {
        key: 'conic_sections',
        count: 2,
        aliases: ['conic-sections', 'parabola', 'ellipse', 'hyperbola'],
      },
      { key: 'vector_algebra', count: 2, aliases: ['vector-algebra', 'vectors'] },
      {
        key: 'three_d',
        count: 2,
        aliases: [
          'three-dimensional-geometry',
          'introduction-to-three-dimensional-geometry',
          '3d-geometry',
        ],
      },
      {
        key: 'probability_statistics',
        count: 2,
        aliases: ['probability', 'statistics'],
      },
      {
        key: 'trigonometry',
        count: 1,
        aliases: [
          'trigonometric-functions',
          'inverse-trigonometric-functions',
          'trigonometry',
        ],
      },
    ],
    nvqChapterKeys: [
      'integration',
      'limits_continuity',
      'matrices_determinants',
      'probability_statistics',
      'three_d',
      'vector_algebra',
      'permutations_combinations',
      'binomial',
    ],
  },
};

export function normalizeJeeChapterToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

export function normalizeDifficulty(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase();
  if (!s) return 'medium';
  if (s === 'e' || s.startsWith('easy')) return 'easy';
  if (s === 'h' || s.startsWith('hard') || s.includes('difficult')) return 'hard';
  return 'medium';
}

export function isJeeMainExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'jee-main' || s === 'jee' || s === 'jeemain';
}

/** Resolve rotating slot aliases for a given IST day index. */
export function resolveSlotAliases(slot, dayIndex = 0) {
  if (Array.isArray(slot.rotating) && slot.rotating.length > 0) {
    const idx = Math.abs(Number(dayIndex) || 0) % slot.rotating.length;
    return slot.rotating[idx].map(normalizeJeeChapterToken);
  }
  return (slot.aliases || []).map(normalizeJeeChapterToken);
}

export function getSubjectBlueprint(subject) {
  const key = Object.keys(JEE_MAIN_SUBJECTS).find(
    (k) => k.toLowerCase() === String(subject || '').toLowerCase()
  );
  return key ? JEE_MAIN_SUBJECTS[key] : null;
}

export function subjectQuestionOffset(subject) {
  const bp = getSubjectBlueprint(subject);
  if (!bp) return 0;
  return bp.order * 25;
}
