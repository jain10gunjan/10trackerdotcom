/**
 * GATE CSE full-paper blueprint (65Q / 180 min / 100 marks).
 * Slots are question counts with mark weight 1 or 2 (bank has no marks column).
 * Pattern: 30×1-mark + 35×2-mark (GA 5+5, core 25+30).
 */

export const GATE_CSE_SLUG = 'gate-cse';
export const GATE_CSE_CREATION_MODE = 'gate_blueprint';
export const GATE_CHAPTER_CREATION_MODE = 'gate_chapter';

export const GATE_CSE_PAPER = {
  totalQuestions: 65,
  durationMinutes: 180,
  maxMarks: 100,
  gaQuestions: 10,
  coreQuestions: 55,
  oneMarkCount: 30,
  twoMarkCount: 35,
  marksWrongFraction: 1 / 3, // MCQ only; NAT wrong = 0
};

/**
 * @typedef {{ key: string, count: number, marks: 1|2, aliases: string[], subjects?: string[] }} GateSlot
 */

/** Ordered subject blocks for the Continue wizard */
export const GATE_CSE_BLOCKS = [
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
      },
      {
        key: 'ga_quant_1',
        count: 2,
        marks: 1,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
      },
      {
        key: 'ga_verbal_2',
        count: 2,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
      },
      {
        key: 'ga_quant_2',
        count: 2,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
      },
      {
        key: 'ga_reasoning_2',
        count: 1,
        marks: 2,
        subjects: ['general-aptitude'],
        aliases: ['general-aptitude'],
      },
    ],
  },
  {
    id: 'EM',
    label: 'Engineering Mathematics',
    order: 1,
    slots: [
      {
        key: 'discrete_1',
        count: 2,
        marks: 1,
        subjects: ['discrete-mathematics'],
        aliases: [
          'propositional-logic',
          'set-theory',
          'relation',
          'functions',
          'lattice',
          'combination',
          'graph-theory',
          'planar-graph',
        ],
      },
      {
        key: 'discrete_2',
        count: 2,
        marks: 2,
        subjects: ['discrete-mathematics'],
        aliases: [
          'propositional-logic',
          'set-theory',
          'relation',
          'functions',
          'lattice',
          'combination',
          'graph-theory',
          'planar-graph',
        ],
      },
      {
        key: 'linear_algebra_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['linear-algebra'],
      },
      {
        key: 'linear_algebra_2',
        count: 1,
        marks: 2,
        subjects: ['engineering-mathematics'],
        aliases: ['linear-algebra'],
      },
      {
        key: 'calculus_1',
        count: 1,
        marks: 1,
        subjects: ['engineering-mathematics'],
        aliases: ['calculus'],
      },
      {
        key: 'probability_1',
        count: 1,
        marks: 1,
        subjects: ['discrete-mathematics', 'engineering-mathematics'],
        aliases: ['probability-theory'],
      },
      {
        key: 'probability_2',
        count: 1,
        marks: 2,
        subjects: ['discrete-mathematics', 'engineering-mathematics'],
        aliases: ['probability-theory'],
      },
    ],
  },
  {
    id: 'DL',
    label: 'Digital Logic',
    order: 2,
    slots: [
      {
        key: 'boolean_1',
        count: 1,
        marks: 1,
        subjects: ['digital-logic'],
        aliases: ['boolean-algebra', 'number-system'],
      },
      {
        key: 'combinational_2',
        count: 1,
        marks: 2,
        subjects: ['digital-logic'],
        aliases: ['combinational-circuit', 'sequential-circuit'],
      },
    ],
  },
  {
    id: 'COA',
    label: 'Computer Organization',
    order: 3,
    slots: [
      {
        key: 'machine_instr_1',
        count: 1,
        marks: 1,
        subjects: ['computer-organization'],
        aliases: ['machine-instruction', 'addressing-modes'],
      },
      {
        key: 'machine_instr_2',
        count: 1,
        marks: 2,
        subjects: ['computer-organization'],
        aliases: ['machine-instruction', 'addressing-modes'],
      },
      {
        key: 'alu_datapath_2',
        count: 1,
        marks: 2,
        subjects: ['computer-organization'],
        aliases: ['alu-data-path-and-control-unit'],
      },
      {
        key: 'pipeline_1',
        count: 1,
        marks: 1,
        subjects: ['computer-organization'],
        aliases: ['pipeline-processor'],
      },
      {
        key: 'pipeline_2',
        count: 1,
        marks: 2,
        subjects: ['computer-organization'],
        aliases: ['pipeline-processor'],
      },
      {
        key: 'memory_io_2',
        count: 1,
        marks: 2,
        subjects: ['computer-organization'],
        aliases: ['cache-memory', 'secondary-storage', 'io-interface', 'memory-chip-design'],
      },
    ],
  },
  {
    id: 'PDS',
    label: 'Programming & Data Structures',
    order: 4,
    slots: [
      {
        key: 'c_prog_1',
        count: 1,
        marks: 1,
        subjects: ['c-programming'],
        aliases: [
          'function',
          'array-and-pointer',
          'loop',
          'conditional-statement',
          'arithmetic-operation',
        ],
      },
      {
        key: 'c_prog_2',
        count: 1,
        marks: 2,
        subjects: ['c-programming'],
        aliases: [
          'function',
          'array-and-pointer',
          'loop',
          'conditional-statement',
          'arithmetic-operation',
        ],
      },
      {
        key: 'linear_ds_1',
        count: 1,
        marks: 1,
        subjects: ['data-structures'],
        aliases: ['array', 'stack', 'queue', 'link-list'],
      },
      {
        key: 'trees_2',
        count: 2,
        marks: 2,
        subjects: ['data-structures'],
        aliases: ['binary-tree', 'binary-search-tree', 'avl-tree', 'heap-tree', 'n-ary-tree'],
      },
      {
        key: 'hashing_2',
        count: 1,
        marks: 2,
        subjects: ['data-structures'],
        aliases: ['hashing'],
      },
    ],
  },
  {
    id: 'ALGO',
    label: 'Algorithms',
    order: 5,
    slots: [
      {
        key: 'asymptotic_1',
        count: 1,
        marks: 1,
        subjects: ['algorithms'],
        aliases: ['asymptotic-notation', 'recurrence-relation'],
      },
      {
        key: 'sorting_dac_1',
        count: 1,
        marks: 1,
        subjects: ['algorithms'],
        aliases: ['sorting', 'divide-and-conquer'],
      },
      {
        key: 'sorting_dac_2',
        count: 1,
        marks: 2,
        subjects: ['algorithms'],
        aliases: ['sorting', 'divide-and-conquer'],
      },
      {
        key: 'greedy_graph_1',
        count: 1,
        marks: 1,
        subjects: ['algorithms'],
        aliases: [
          'greedy-technique',
          'graph-traversal',
          'minimum-spanning-tree',
          'shortest-path',
        ],
      },
      {
        key: 'greedy_graph_2',
        count: 1,
        marks: 2,
        subjects: ['algorithms'],
        aliases: [
          'greedy-technique',
          'graph-traversal',
          'minimum-spanning-tree',
          'shortest-path',
        ],
      },
      {
        key: 'dp_2',
        count: 1,
        marks: 2,
        subjects: ['algorithms'],
        aliases: ['dynamic-programming'],
      },
    ],
  },
  {
    id: 'TOC',
    label: 'Theory of Computation',
    order: 6,
    slots: [
      {
        key: 'regular_1',
        count: 1,
        marks: 1,
        subjects: ['theory-of-computation'],
        aliases: [
          'finite-automata',
          'regular-language',
          'regular-expression',
          'regular-grammar',
        ],
      },
      {
        key: 'regular_2',
        count: 1,
        marks: 2,
        subjects: ['theory-of-computation'],
        aliases: [
          'finite-automata',
          'regular-language',
          'regular-expression',
          'regular-grammar',
        ],
      },
      {
        key: 'cfl_1',
        count: 1,
        marks: 1,
        subjects: ['theory-of-computation'],
        aliases: ['context-free-language', 'context-free-grammar', 'push-down-automata'],
      },
      {
        key: 'cfl_2',
        count: 1,
        marks: 2,
        subjects: ['theory-of-computation'],
        aliases: ['context-free-language', 'context-free-grammar', 'push-down-automata'],
      },
      {
        key: 'tm_2',
        count: 1,
        marks: 2,
        subjects: ['theory-of-computation'],
        aliases: ['turing-machine', 'undecidability', 'recursive-language'],
      },
    ],
  },
  {
    id: 'CD',
    label: 'Compiler Design',
    order: 7,
    slots: [
      {
        key: 'lexical_1',
        count: 1,
        marks: 1,
        subjects: ['compiler-design'],
        aliases: ['lexical-analysis'],
      },
      {
        key: 'parsing_2',
        count: 1,
        marks: 2,
        subjects: ['compiler-design'],
        aliases: [
          'parsing',
          'syntax-directed-translation',
          'intermediate-code-generation',
          'runtime-environment',
        ],
      },
    ],
  },
  {
    id: 'OS',
    label: 'Operating Systems',
    order: 8,
    slots: [
      {
        key: 'process_1',
        count: 1,
        marks: 1,
        subjects: ['operating-system'],
        aliases: ['process', 'thread', 'system-call'],
      },
      {
        key: 'cpu_sched_2',
        count: 1,
        marks: 2,
        subjects: ['operating-system'],
        aliases: ['cpu-scheduling'],
      },
      {
        key: 'sync_2',
        count: 1,
        marks: 2,
        subjects: ['operating-system'],
        aliases: ['process-synchronization'],
      },
      {
        key: 'deadlock_1',
        count: 1,
        marks: 1,
        subjects: ['operating-system'],
        aliases: ['deadlock'],
      },
      {
        key: 'memory_2',
        count: 2,
        marks: 2,
        subjects: ['operating-system'],
        aliases: ['memory-management'],
      },
      {
        key: 'file_disk_1',
        count: 1,
        marks: 1,
        subjects: ['operating-system'],
        aliases: ['file-systems', 'disk-scheduling'],
      },
    ],
  },
  {
    id: 'DB',
    label: 'Databases',
    order: 9,
    slots: [
      {
        key: 'er_ra_1',
        count: 1,
        marks: 1,
        subjects: ['database-management-system'],
        aliases: ['er-model', 'relational-algebra', 'relational-schema', 'tuple-calculus'],
      },
      {
        key: 'sql_1',
        count: 1,
        marks: 1,
        subjects: ['database-management-system'],
        aliases: ['sql'],
      },
      {
        key: 'sql_2',
        count: 1,
        marks: 2,
        subjects: ['database-management-system'],
        aliases: ['sql'],
      },
      {
        key: 'normalization_1',
        count: 1,
        marks: 1,
        subjects: ['database-management-system'],
        aliases: ['normal-form'],
      },
      {
        key: 'normalization_2',
        count: 1,
        marks: 2,
        subjects: ['database-management-system'],
        aliases: ['normal-form'],
      },
      {
        key: 'txn_index_2',
        count: 1,
        marks: 2,
        subjects: ['database-management-system'],
        aliases: ['transaction', 'file-system', 'b-tree', 'b-plus-tree'],
      },
    ],
  },
  {
    id: 'CN',
    label: 'Computer Networks',
    order: 10,
    slots: [
      {
        key: 'layering_1',
        count: 1,
        marks: 1,
        subjects: ['computer-networks'],
        aliases: ['osi-layer', 'physical-layer'],
      },
      {
        key: 'dll_1',
        count: 1,
        marks: 1,
        subjects: ['computer-networks'],
        aliases: ['data-link-layer'],
      },
      {
        key: 'dll_2',
        count: 1,
        marks: 2,
        subjects: ['computer-networks'],
        aliases: ['data-link-layer'],
      },
      {
        key: 'network_1',
        count: 1,
        marks: 1,
        subjects: ['computer-networks'],
        aliases: ['network-layer-protocol'],
      },
      {
        key: 'network_2',
        count: 1,
        marks: 2,
        subjects: ['computer-networks'],
        aliases: ['network-layer-protocol'],
      },
      {
        key: 'transport_app_2',
        count: 1,
        marks: 2,
        subjects: ['computer-networks'],
        aliases: [
          'transport-layer-protocol',
          'application-layer-protocols',
          'network-security',
        ],
      },
    ],
  },
];

export function isGateCseExamSlug(examCategory) {
  const s = String(examCategory || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return s === 'gate-cse' || s === 'gatecse';
}

export function normalizeGateToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

export function getGateBlock(blockId) {
  return GATE_CSE_BLOCKS.find((b) => b.id === blockId) || null;
}

export function listGateBlockIds() {
  return GATE_CSE_BLOCKS.map((b) => b.id);
}

/** Encode mark weight into mock_test_questions.topic (no marks column). */
export function encodeGateTopic(marks, topic) {
  const m = Number(marks) === 2 ? 2 : 1;
  const t = String(topic || '').replace(/^gm[12]\|/, '');
  return `gm${m}|${t}`;
}

export function parseGateTopic(topic) {
  const raw = String(topic || '');
  const match = raw.match(/^gm([12])\|(.*)$/s);
  if (match) {
    return { marks: Number(match[1]), topic: match[2] || '' };
  }
  return { marks: 1, topic: raw };
}

/** Validate slot totals match paper pattern */
export function auditBlueprintTotals() {
  let q = 0;
  let marks = 0;
  let one = 0;
  let two = 0;
  for (const b of GATE_CSE_BLOCKS) {
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
      q === GATE_CSE_PAPER.totalQuestions &&
      marks === GATE_CSE_PAPER.maxMarks &&
      one === GATE_CSE_PAPER.oneMarkCount &&
      two === GATE_CSE_PAPER.twoMarkCount,
  };
}
