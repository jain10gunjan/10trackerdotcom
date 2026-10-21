/**
 * GATE EE full-paper blueprint (65Q / 180 min / 100 marks).
 * Based on GATE 2027 EE syllabus weightage (IIT Madras style).
 * Pattern: 30×1-mark + 35×2-mark (GA 5+5, core 25+30).
 */

export const GATE_EE_SLUG = 'gate-ee';
export const GATE_EE_CREATION_MODE = 'gate_ee_blueprint';
export const GATE_EE_CHAPTER_CREATION_MODE = 'gate_ee_chapter';

export const GATE_EE_PAPER = {
  totalQuestions: 65,
  durationMinutes: 180,
  maxMarks: 100,
  gaQuestions: 10,
  coreQuestions: 55,
  oneMarkCount: 30,
  twoMarkCount: 35,
  marksWrongFraction: 1 / 3,
};

/**
 * @typedef {{ key: string, count: number, marks: 1|2, aliases: string[], subjects?: string[], bankCategories?: string[] }} GateSlot
 */

export const GATE_EE_BLOCKS = [
  {
    id: 'GA',
    label: 'General Aptitude',
    order: 0,
    slots: [
      // GATE-EE bank has no GA — pull from GATE-CSE general-aptitude
      {
        key: 'ga_verbal_1',
        count: 3,
        marks: 1,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EE'],
      },
      {
        key: 'ga_quant_1',
        count: 2,
        marks: 1,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EE'],
      },
      {
        key: 'ga_verbal_2',
        count: 2,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EE'],
      },
      {
        key: 'ga_quant_2',
        count: 2,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EE'],
      },
      {
        key: 'ga_reasoning_2',
        count: 1,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EE'],
      },
    ],
  },
  {
    id: 'EM',
    label: 'Engineering Mathematics',
    order: 1,
    // 13 marks: 5×1 + 4×2
    slots: [
      {
        key: 'linear_algebra_1',
        count: 2,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['linear-algebra'],
      },
      {
        key: 'calculus_2',
        count: 1,
        marks: 2,
        subjects: ['engineering-mathematics'],
        aliases: ['calculus'],
      },
      {
        key: 'diff_eq_2',
        count: 1,
        marks: 2,
        subjects: ['engineering-mathematics'],
        aliases: ['differential-equations'],
      },
      {
        key: 'complex_2',
        count: 1,
        marks: 2,
        subjects: ['engineering-mathematics'],
        aliases: ['complex-variables'],
      },
      {
        key: 'probability_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['probability-and-statistics'],
      },
      {
        key: 'probability_2',
        count: 1,
        marks: 2,
        subjects: ['engineering-mathematics'],
        aliases: ['probability-and-statistics'],
      },
      {
        key: 'numerical_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['numerical-methods'],
      },
      {
        key: 'transform_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        // no dedicated chapter — Laplace/DE + complex as nearest
        aliases: ['differential-equations', 'complex-variables', 'calculus'],
      },
    ],
  },
  {
    id: 'CIR',
    label: 'Electric Circuits',
    order: 2,
    // 9 marks: 3×1 + 3×2
    slots: [
      {
        key: 'network_theorems_1',
        count: 1,
        marks: 1,
        subjects: ['electric-circuits'],
        aliases: ['network-theorems'],
      },
      {
        key: 'network_theorems_2',
        count: 1,
        marks: 2,
        subjects: ['electric-circuits'],
        aliases: ['network-theorems'],
      },
      {
        key: 'transients_2',
        count: 1,
        marks: 2,
        subjects: ['electric-circuits'],
        aliases: ['transients-and-steady-state-response'],
      },
      {
        key: 'ac_steady_2',
        count: 1,
        marks: 2,
        subjects: ['electric-circuits'],
        aliases: ['steady-state-ac-analysis', 'resonance-and-locus-diagrams'],
      },
      {
        key: 'twoport_graphs_1',
        count: 1,
        marks: 1,
        subjects: ['electric-circuits'],
        aliases: [
          'magnetically-coupled-circuits-network-topology-and-filters',
          'network-theorems',
        ],
      },
      {
        key: 'three_phase_1',
        count: 1,
        marks: 1,
        subjects: ['electric-circuits'],
        aliases: ['three-phase-circuits'],
      },
    ],
  },
  {
    id: 'EMF',
    label: 'Electromagnetic Fields',
    order: 3,
    // 5 marks: 1×1 + 2×2
    slots: [
      {
        key: 'electrostatics_2',
        count: 1,
        marks: 2,
        subjects: ['electromagnetic-theory'],
        aliases: ['electrostatic-fields', 'coordinate-systems-and-vector-calculus'],
      },
      {
        key: 'magnetostatics_2',
        count: 1,
        marks: 2,
        subjects: ['electromagnetic-theory'],
        aliases: ['magnetostatic-fields'],
      },
      {
        key: 'time_varying_1',
        count: 1,
        marks: 1,
        subjects: ['electromagnetic-theory'],
        aliases: ['time-varying-fields'],
      },
    ],
  },
  {
    id: 'SS',
    label: 'Signals and Systems',
    order: 4,
    // 7 marks: 1×1 + 3×2
    slots: [
      {
        key: 'lti_2',
        count: 1,
        marks: 2,
        subjects: ['signals-and-systems'],
        aliases: ['linear-time-invariant-systems', 'introduction-of-c-t-and-d-t-signals'],
      },
      {
        key: 'fourier_2',
        count: 1,
        marks: 2,
        subjects: ['signals-and-systems'],
        aliases: ['fourier-series', 'fourier-transform'],
      },
      {
        key: 'laplace_z_2',
        count: 1,
        marks: 2,
        subjects: ['signals-and-systems'],
        aliases: ['laplace-transform', 'z-transform'],
      },
      {
        key: 'sampling_1',
        count: 1,
        marks: 1,
        subjects: ['signals-and-systems'],
        aliases: ['sampling'],
      },
    ],
  },
  {
    id: 'MACH',
    label: 'Electrical Machines',
    order: 5,
    // 12 marks: 4×1 + 4×2 — no transformer chapter; use machines pool for XFMR slots
    slots: [
      {
        key: 'transformers_1',
        count: 1,
        marks: 1,
        subjects: ['electrical-machines'],
        aliases: ['electrical-machines'],
      },
      {
        key: 'transformers_2',
        count: 1,
        marks: 2,
        subjects: ['electrical-machines'],
        aliases: ['electrical-machines'],
      },
      {
        key: 'dc_machines_2',
        count: 1,
        marks: 2,
        subjects: ['electrical-machines'],
        aliases: ['dc-machines'],
      },
      {
        key: 'induction_1',
        count: 1,
        marks: 1,
        subjects: ['electrical-machines'],
        aliases: ['three-phase-induction-machines'],
      },
      {
        key: 'induction_2',
        count: 1,
        marks: 2,
        subjects: ['electrical-machines'],
        aliases: ['three-phase-induction-machines'],
      },
      {
        key: 'sync_1',
        count: 1,
        marks: 1,
        subjects: ['electrical-machines'],
        aliases: ['synchronous-machines'],
      },
      {
        key: 'sync_2',
        count: 1,
        marks: 2,
        subjects: ['electrical-machines'],
        aliases: ['synchronous-machines'],
      },
      {
        key: 'special_machines_1',
        count: 1,
        marks: 1,
        subjects: ['electrical-machines'],
        aliases: [
          'single-phase-induction-motors-special-purpose-machines-and-electromechanical-energy-conversion-syste',
        ],
      },
    ],
  },
  {
    id: 'PS',
    label: 'Power Systems',
    order: 6,
    // 10 marks: 2×1 + 4×2
    slots: [
      {
        key: 'transmission_2',
        count: 1,
        marks: 2,
        subjects: ['power-systems'],
        aliases: [
          'performance-of-transmission-lines-line-parameters-and-corona',
          'distribution-systems-cables-and-insulators',
        ],
      },
      {
        key: 'load_flow_2',
        count: 1,
        marks: 2,
        subjects: ['power-systems'],
        aliases: ['load-flow-studies', 'per-unit-system'],
      },
      {
        key: 'fault_2',
        count: 1,
        marks: 2,
        subjects: ['power-systems'],
        aliases: ['fault-analysis'],
      },
      {
        key: 'stability_1',
        count: 1,
        marks: 1,
        subjects: ['power-system-stability', 'power-systems'],
        aliases: ['power-system-stability'],
      },
      {
        key: 'protection_2',
        count: 1,
        marks: 2,
        subjects: ['power-systems'],
        aliases: ['switch-gear-and-protection'],
      },
      {
        key: 'generation_econ_1',
        count: 1,
        marks: 1,
        subjects: ['power-systems'],
        aliases: [
          'economic-power-generation-and-load-dispatch',
          'generating-power-stations',
          'high-voltage-dc-transmission',
          'compensation-techniques-and-voltage-profile-control',
        ],
      },
    ],
  },
  {
    id: 'CS',
    label: 'Control Systems',
    order: 7,
    // 9 marks: 3×1 + 3×2
    slots: [
      {
        key: 'tf_block_2',
        count: 1,
        marks: 2,
        subjects: ['control-systems'],
        aliases: [
          'mathematical-models-of-physical-systems',
          'feedback-characteristics-of-control-systems',
        ],
      },
      {
        key: 'time_response_1',
        count: 1,
        marks: 1,
        subjects: ['control-systems'],
        aliases: ['time-response-analysis'],
      },
      {
        key: 'stability_rl_2',
        count: 1,
        marks: 2,
        subjects: ['control-systems'],
        aliases: ['concepts-of-stability', 'root-locus-techniques'],
      },
      {
        key: 'freq_response_2',
        count: 1,
        marks: 2,
        subjects: ['control-systems'],
        aliases: ['frequency-response-analysis'],
      },
      {
        key: 'compensators_1',
        count: 1,
        marks: 1,
        subjects: ['control-systems'],
        aliases: ['design-of-control-systems'],
      },
      {
        key: 'state_space_1',
        count: 1,
        marks: 1,
        subjects: ['control-systems'],
        aliases: ['state-variable-analysis'],
      },
    ],
  },
  {
    id: 'PE',
    label: 'Power Electronics',
    order: 8,
    // 9 marks: 3×1 + 3×2
    slots: [
      {
        key: 'devices_1',
        count: 1,
        marks: 1,
        subjects: ['power-electronics'],
        aliases: ['power-semiconductor-devices-and-commutation-techniques'],
      },
      {
        key: 'rectifiers_1',
        count: 1,
        marks: 1,
        subjects: ['power-electronics'],
        aliases: ['phase-controlled-rectifiers'],
      },
      {
        key: 'rectifiers_2',
        count: 1,
        marks: 2,
        subjects: ['power-electronics'],
        aliases: ['phase-controlled-rectifiers'],
      },
      {
        key: 'choppers_2',
        count: 1,
        marks: 2,
        subjects: ['power-electronics'],
        aliases: ['choppers'],
      },
      {
        key: 'inverters_2',
        count: 1,
        marks: 2,
        subjects: ['power-electronics'],
        aliases: ['inverters'],
      },
      {
        key: 'drives_ac_1',
        count: 1,
        marks: 1,
        subjects: ['power-electronics'],
        aliases: ['electrical-drives', 'pe-miscellaneous'],
      },
    ],
  },
  {
    id: 'MEAS',
    label: 'Electrical & Electronic Measurements',
    order: 9,
    // 3 marks: 1×1 + 1×2
    slots: [
      {
        key: 'analog_instruments_2',
        count: 1,
        marks: 2,
        subjects: ['electrical-and-electronic-measurements'],
        aliases: [
          'galvanometers-voltmeters-and-ammeters',
          'a-c-bridges',
          'instrument-transformers',
          'measurement-of-resistance-and-potentiometers',
          'characteristics-of-instruments-and-measurement-systems',
        ],
      },
      {
        key: 'digital_cro_1',
        count: 1,
        marks: 1,
        subjects: ['electrical-and-electronic-measurements'],
        aliases: ['cro-and-electronic-measurements', 'measurement-of-energy-and-power'],
      },
    ],
  },
  {
    id: 'ADE',
    label: 'Analog & Digital Electronics',
    order: 10,
    // 8 marks: 2×1 + 3×2
    slots: [
      {
        key: 'diodes_1',
        count: 1,
        marks: 1,
        subjects: ['analog-electronics'],
        aliases: ['diodes-and-their-applications'],
      },
      {
        key: 'bjt_amp_2',
        count: 1,
        marks: 2,
        subjects: ['analog-electronics'],
        aliases: [
          'bjt-fet-and-their-biasing-circuits',
          'small-signal-analysis',
          'oscillators-and-feedback-amplifiers',
        ],
      },
      {
        key: 'opamp_2',
        count: 1,
        marks: 2,
        subjects: ['analog-electronics'],
        aliases: ['operational-amplifiers'],
      },
      {
        key: 'combinational_1',
        count: 1,
        marks: 1,
        subjects: ['digital-electronics'],
        aliases: [
          'combinational-logic-circuits',
          'boolean-algebra-and-minimization',
          'logic-gates',
        ],
      },
      {
        key: 'seq_adc_2',
        count: 1,
        marks: 2,
        subjects: ['digital-electronics'],
        aliases: [
          'sequential-logic-circuits',
          'a-d-and-d-a-converters',
          'microprocessors',
        ],
      },
    ],
  },
];

export function isGateEeExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'gate-ee' || s === 'gateee';
}

export function normalizeGateEeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

export function getGateEeBlock(blockId) {
  return GATE_EE_BLOCKS.find((b) => b.id === blockId) || null;
}

export function listGateEeBlockIds() {
  return GATE_EE_BLOCKS.map((b) => b.id);
}

export function auditGateEeBlueprintTotals() {
  let q = 0;
  let marks = 0;
  let one = 0;
  let two = 0;
  for (const b of GATE_EE_BLOCKS) {
    for (const s of b.slots) {
      q += s.count;
      marks += s.count * s.marks;
      if (s.marks === 1) one += s.count;
      else two += s.count;
    }
  }
  return {
    questions: q,
    marks,
    oneMark: one,
    twoMark: two,
    ok:
      q === GATE_EE_PAPER.totalQuestions &&
      marks === GATE_EE_PAPER.maxMarks &&
      one === GATE_EE_PAPER.oneMarkCount &&
      two === GATE_EE_PAPER.twoMarkCount,
  };
}
