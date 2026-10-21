/**
 * GATE EC (ECE) full-paper blueprint (65Q / 180 min / 100 marks).
 * Based on GATE 2027 EC syllabus weightage (IIT Madras revised).
 * Pattern: 30×1-mark + 35×2-mark (GA 5+5, core 25+30).
 */

export const GATE_EC_SLUG = 'gate-ec';
export const GATE_EC_CREATION_MODE = 'gate_ec_blueprint';
export const GATE_EC_CHAPTER_CREATION_MODE = 'gate_ec_chapter';

export const GATE_EC_PAPER = {
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

export const GATE_EC_BLOCKS = [
  {
    id: 'GA',
    label: 'General Aptitude',
    order: 0,
    slots: [
      {
        key: 'ga_verbal_1',
        count: 3,
        marks: 1,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EC'],
      },
      {
        key: 'ga_quant_1',
        count: 2,
        marks: 1,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EC'],
      },
      {
        key: 'ga_verbal_2',
        count: 2,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EC'],
      },
      {
        key: 'ga_quant_2',
        count: 2,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EC'],
      },
      {
        key: 'ga_reasoning_2',
        count: 1,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
        bankCategories: ['GATE-CSE', 'GATE-EC'],
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
        key: 'vector_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['vector-analysis', 'calculus'],
      },
      {
        key: 'complex_2',
        count: 1,
        marks: 2,
        subjects: ['engineering-mathematics'],
        aliases: ['complex-variables'],
      },
      {
        key: 'numerical_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['numerical-methods'],
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
    ],
  },
  {
    id: 'NET',
    label: 'Networks',
    order: 2,
    // 12 marks: 2×1 + 5×2
    slots: [
      {
        key: 'theorems_1',
        count: 1,
        marks: 1,
        subjects: ['network-theory'],
        aliases: ['network-theorems', 'basics-of-network-analysis'],
      },
      {
        key: 'theorems_2',
        count: 1,
        marks: 2,
        subjects: ['network-theory'],
        aliases: ['network-theorems', 'basics-of-network-analysis'],
      },
      {
        key: 'transients_1',
        count: 1,
        marks: 1,
        subjects: ['network-theory'],
        aliases: ['transient-analysis'],
      },
      {
        key: 'transients_2',
        count: 1,
        marks: 2,
        subjects: ['network-theory'],
        aliases: ['transient-analysis'],
      },
      {
        key: 'ac_steady_2',
        count: 1,
        marks: 2,
        subjects: ['network-theory'],
        aliases: ['sinusoidal-steady-state'],
      },
      {
        key: 'twoport_2',
        count: 1,
        marks: 2,
        subjects: ['network-theory'],
        aliases: ['two-port-networks', 'network-functions'],
      },
      {
        key: 'graphs_filters_2',
        count: 1,
        marks: 2,
        subjects: ['network-theory'],
        aliases: ['graph-theory-and-state-equations', 'network-functions', 'basics-of-network-analysis'],
      },
    ],
  },
  {
    id: 'SS',
    label: 'Signals and Systems',
    order: 3,
    // 10 marks: 4×1 + 3×2
    slots: [
      {
        key: 'lti_2',
        count: 1,
        marks: 2,
        subjects: ['signals-and-systems'],
        aliases: ['lti-systems-continuous-and-discrete', 'basics-of-signals-and-systems'],
      },
      {
        key: 'fourier_2',
        count: 1,
        marks: 2,
        subjects: ['signals-and-systems'],
        aliases: [
          'fourier-series',
          'fourier-transforms-frequency-response-and-correlation',
        ],
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
      {
        key: 'dft_1',
        count: 1,
        marks: 1,
        subjects: ['signals-and-systems'],
        aliases: ['dtfs-dtft-and-dft'],
      },
      {
        key: 'dft_filters_1',
        count: 1,
        marks: 1,
        subjects: ['signals-and-systems'],
        aliases: ['dtfs-dtft-and-dft', 'digital-filters'],
      },
      {
        key: 'correlation_1',
        count: 1,
        marks: 1,
        subjects: ['signals-and-systems'],
        aliases: [
          'fourier-transforms-frequency-response-and-correlation',
          'basics-of-signals-and-systems',
        ],
      },
    ],
  },
  {
    id: 'ED',
    label: 'Electronic Devices',
    order: 4,
    // 7 marks: 3×1 + 2×2
    slots: [
      {
        key: 'semiconductor_2',
        count: 1,
        marks: 2,
        subjects: ['electronic-devices'],
        aliases: ['basic-semiconductor-physics'],
      },
      {
        key: 'pn_diode_1',
        count: 1,
        marks: 1,
        subjects: ['electronic-devices'],
        aliases: ['pn-junction-diodes-and-special-diodes'],
      },
      {
        key: 'bjt_1',
        count: 1,
        marks: 1,
        subjects: ['electronic-devices'],
        aliases: ['bjt-and-fet-basics'],
      },
      {
        key: 'mosfet_2',
        count: 1,
        marks: 2,
        subjects: ['electronic-devices'],
        aliases: ['bjt-and-fet-basics'],
      },
      {
        key: 'opto_ic_1',
        count: 1,
        marks: 1,
        subjects: ['electronic-devices'],
        aliases: ['ic-fabrication', 'pn-junction-diodes-and-special-diodes'],
      },
    ],
  },
  {
    id: 'AC',
    label: 'Analog Circuits',
    order: 5,
    // 8 marks: 2×1 + 3×2
    slots: [
      {
        key: 'diode_circuits_1',
        count: 1,
        marks: 1,
        subjects: ['analog-circuits'],
        aliases: ['diodes-applications'],
      },
      {
        key: 'bias_amp_2',
        count: 1,
        marks: 2,
        subjects: ['analog-circuits'],
        aliases: ['bjt-analysis', 'fet-and-mosfet-analysis'],
      },
      {
        key: 'freq_response_1',
        count: 1,
        marks: 1,
        subjects: ['analog-circuits'],
        aliases: ['frequency-response-of-amplifier'],
      },
      {
        key: 'opamp_2',
        count: 1,
        marks: 2,
        subjects: ['analog-circuits'],
        aliases: ['operational-amplifiers'],
      },
      {
        key: 'feedback_osc_2',
        count: 1,
        marks: 2,
        subjects: ['analog-circuits'],
        aliases: [
          'feedback-amplifiers',
          'oscillator-circuits',
          'multivibrators-and-555-timer',
        ],
      },
    ],
  },
  {
    id: 'DC',
    label: 'Digital Circuits',
    order: 6,
    // 9 marks: 3×1 + 3×2
    slots: [
      {
        key: 'boolean_2',
        count: 1,
        marks: 2,
        subjects: ['digital-circuits'],
        aliases: ['boolean-algebra', 'number-systems', 'logic-gates'],
      },
      {
        key: 'combinational_2',
        count: 1,
        marks: 2,
        subjects: ['digital-circuits'],
        aliases: ['combinational-circuits'],
      },
      {
        key: 'sequential_2',
        count: 1,
        marks: 2,
        subjects: ['digital-circuits'],
        aliases: ['sequential-circuits', 'finite-state-machine-and-miscellaneous'],
      },
      {
        key: 'logic_families_1',
        count: 1,
        marks: 1,
        subjects: ['digital-circuits'],
        aliases: ['logic-families', 'memories'],
      },
      {
        key: 'adc_dac_1',
        count: 1,
        marks: 1,
        subjects: ['digital-circuits'],
        aliases: ['adc-and-dac'],
      },
      {
        key: 'microprocessor_1',
        count: 1,
        marks: 1,
        subjects: ['microprocessors', 'digital-circuits'],
        aliases: [
          'basics-of-8085-microprocessor',
          'instructions-of-8085-microprocessor',
          'microprocessor-8085-programming',
          'interfacing-and-peripheral-devices',
          'finite-state-machine-and-miscellaneous',
        ],
      },
    ],
  },
  {
    id: 'CS',
    label: 'Control Systems',
    order: 7,
    // 5 marks: 1×1 + 2×2
    slots: [
      {
        key: 'tf_block_1',
        count: 1,
        marks: 1,
        subjects: ['control-systems'],
        aliases: ['basics-of-control-systems-block-diagram-and-sfgs'],
      },
      {
        key: 'time_stability_2',
        count: 1,
        marks: 2,
        subjects: ['control-systems'],
        aliases: [
          'time-response-analysis',
          'stability-analysis',
          'root-locus',
        ],
      },
      {
        key: 'freq_state_2',
        count: 1,
        marks: 2,
        subjects: ['control-systems'],
        aliases: [
          'frequency-response-analysis',
          'state-space-analysis',
          'compensators-and-controllers',
        ],
      },
    ],
  },
  {
    id: 'COMM',
    label: 'Communications',
    order: 8,
    // 13 marks: 3×1 + 5×2
    slots: [
      {
        key: 'random_noise_2',
        count: 1,
        marks: 2,
        subjects: ['communication-systems'],
        aliases: ['random-signals-and-noise'],
      },
      {
        key: 'analog_mod_1',
        count: 1,
        marks: 1,
        subjects: ['communication-systems'],
        aliases: ['analog-communication-systems'],
      },
      {
        key: 'analog_mod_2',
        count: 1,
        marks: 2,
        subjects: ['communication-systems'],
        aliases: ['analog-communication-systems'],
      },
      {
        key: 'digital_mod_1',
        count: 1,
        marks: 1,
        subjects: ['communication-systems'],
        aliases: ['digital-communication-systems'],
      },
      {
        key: 'digital_mod_2',
        count: 1,
        marks: 2,
        subjects: ['communication-systems'],
        aliases: ['digital-communication-systems'],
      },
      {
        key: 'pcm_isi_2',
        count: 1,
        marks: 2,
        subjects: ['communication-systems'],
        aliases: ['digital-communication-systems'],
      },
      {
        key: 'info_coding_2',
        count: 1,
        marks: 2,
        subjects: ['communication-systems'],
        aliases: ['information-theory-and-coding'],
      },
      {
        key: 'link_noise_1',
        count: 1,
        marks: 1,
        subjects: ['communication-systems'],
        aliases: ['random-signals-and-noise', 'analog-communication-systems'],
      },
    ],
  },
  {
    id: 'EMAG',
    label: 'Electromagnetics',
    order: 9,
    // 8 marks: 2×1 + 3×2
    slots: [
      {
        key: 'maxwell_waves_1',
        count: 1,
        marks: 1,
        subjects: ['electromagnetics'],
        aliases: ['basics-of-electromagnetics', 'uniform-plane-waves'],
      },
      {
        key: 'maxwell_waves_2',
        count: 1,
        marks: 2,
        subjects: ['electromagnetics'],
        aliases: ['uniform-plane-waves', 'basics-of-electromagnetics'],
      },
      {
        key: 'tlines_2',
        count: 1,
        marks: 2,
        subjects: ['electromagnetics'],
        aliases: ['transmission-lines'],
      },
      {
        key: 'waveguides_1',
        count: 1,
        marks: 1,
        subjects: ['electromagnetics'],
        aliases: ['waveguides'],
      },
      {
        key: 'antennas_2',
        count: 1,
        marks: 2,
        subjects: ['electromagnetics'],
        aliases: ['antennas', 'miscellaneous-topics'],
      },
    ],
  },
];

export function isGateEcExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'gate-ec' || s === 'gateec' || s === 'gate-ece';
}

export function normalizeGateEcToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

export function getGateEcBlock(blockId) {
  return GATE_EC_BLOCKS.find((b) => b.id === blockId) || null;
}

export function listGateEcBlockIds() {
  return GATE_EC_BLOCKS.map((b) => b.id);
}

export function auditGateEcBlueprintTotals() {
  let q = 0;
  let marks = 0;
  let one = 0;
  let two = 0;
  for (const b of GATE_EC_BLOCKS) {
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
      q === GATE_EC_PAPER.totalQuestions &&
      marks === GATE_EC_PAPER.maxMarks &&
      one === GATE_EC_PAPER.oneMarkCount &&
      two === GATE_EC_PAPER.twoMarkCount,
  };
}
