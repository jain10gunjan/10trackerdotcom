/**
 * Reusable generation config for any exam already in examtracker.
 *
 * Copy this shape for GATE EE / JEE / etc.:
 * {
 *   category: 'GATE-CSE',
 *   subject: 'computer-networks',
 *   chapters: [{ chapter, topic, aliases? }],
 *   countsByDifficulty: { easy: 5, medium: 5, hard: 5 },
 *   status: 'draft',
 * }
 */

export const DEFAULT_COUNTS_BY_DIFFICULTY = {
  easy: 5,
  medium: 5,
  hard: 5,
};

/** GATE CSE Computer Networks chapters (aligned with gateCseBlueprint aliases). */
export const GATE_CSE_CN_CONFIG = {
  category: 'GATE-CSE',
  subject: 'computer-networks',
  status: 'draft',
  countsByDifficulty: { ...DEFAULT_COUNTS_BY_DIFFICULTY },
  chapters: [
    {
      chapter: 'osi-layer',
      topic: 'Principles of layering',
      generator: 'layering',
    },
    {
      chapter: 'physical-layer',
      topic: 'Switching and performance metrics',
      generator: 'performance',
    },
    {
      chapter: 'data-link-layer',
      topic: 'Error detection and MAC',
      generator: 'datalink',
    },
    {
      chapter: 'network-layer-protocol',
      topic: 'IPv4 CIDR fragmentation NAT',
      generator: 'network',
    },
    {
      chapter: 'transport-layer-protocol',
      topic: 'TCP flow and congestion control',
      generator: 'transport',
    },
    {
      chapter: 'application-layer-protocols',
      topic: 'DNS and HTTP',
      generator: 'application',
    },
    {
      chapter: 'network-security',
      topic: 'Network security basics',
      generator: 'security',
    },
  ],
};

/**
 * Gap-fill pack for CN topics that are thin / missing (routing, MAC, delays, devices, etc.).
 * Insert as drafts only — never replace published rows.
 * Target ~140 moderate GATE/engineering-level items with many numericals.
 */
export const GATE_CSE_CN_GAP_CONFIG = {
  category: 'GATE-CSE',
  subject: 'computer-networks',
  status: 'draft',
  seedOffset: 17,
  countsByDifficulty: { easy: 5, medium: 5, hard: 4 },
  chapters: [
    {
      chapter: 'osi-layer',
      topic: 'Network devices and models',
      generator: 'devices',
      countsByDifficulty: { easy: 6, medium: 5, hard: 4 },
    },
    {
      chapter: 'physical-layer',
      topic: 'Delay bandwidth and throughput',
      generator: 'delays',
      countsByDifficulty: { easy: 8, medium: 8, hard: 6 },
    },
    {
      chapter: 'data-link-layer',
      topic: 'MAC ALOHA and CSMA',
      generator: 'macaccess',
      countsByDifficulty: { easy: 6, medium: 8, hard: 6 },
    },
    {
      chapter: 'network-layer-protocol',
      topic: 'Routing algorithms',
      generator: 'routing',
      countsByDifficulty: { easy: 6, medium: 8, hard: 6 },
    },
    {
      chapter: 'network-layer-protocol',
      topic: 'Subnetting and CIDR practice',
      generator: 'addressing',
      countsByDifficulty: { easy: 8, medium: 8, hard: 4 },
    },
    {
      chapter: 'transport-layer-protocol',
      topic: 'TCP UDP handshake and RTT',
      generator: 'transportExtra',
      countsByDifficulty: { easy: 6, medium: 8, hard: 6 },
    },
    {
      chapter: 'application-layer-protocols',
      topic: 'Email FTP DNS and HTTP',
      generator: 'applicationExtra',
      countsByDifficulty: { easy: 5, medium: 5, hard: 5 },
    },
    {
      chapter: 'network-security',
      topic: 'Crypto firewalls and TLS basics',
      generator: 'securityExtra',
      countsByDifficulty: { easy: 4, medium: 4, hard: 4 },
    },
  ],
};

export function mergeGenerationConfig(base, overrides = {}) {
  return {
    ...base,
    ...overrides,
    countsByDifficulty: {
      ...base.countsByDifficulty,
      ...(overrides.countsByDifficulty || {}),
    },
    chapters: overrides.chapters || base.chapters,
    seedOffset:
      overrides.seedOffset !== undefined ? overrides.seedOffset : base.seedOffset,
  };
}
