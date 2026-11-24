/** GATE CSE chapters. Keyword hits avoid a model call when the title is already obvious. */
export const GATE_CSE_CHAPTERS = [
  {
    slug: 'discrete-mathematics',
    title: 'Discrete Mathematics',
    keywords: [
      'discrete',
      'graph theory',
      'combinator',
      'set theory',
      'propositional',
      'predicate',
      'pigeonhole',
      'recurrence',
      'generating function',
      'lattice',
      'boolean algebra',
      'relation',
      'group theory',
    ],
  },
  {
    slug: 'digital-logic',
    title: 'Digital Logic',
    keywords: ['digital logic', 'boolean', 'flip flop', 'flip-flop', 'k-map', 'karnaugh', 'number system', 'combinational', 'sequential circuit'],
  },
  {
    slug: 'computer-organization',
    title: 'Computer Organization',
    keywords: ['computer organization', 'computer organisation', 'pipelin', 'cache memory', 'instruction set', 'addressing mode', 'coa'],
  },
  {
    slug: 'programming-ds',
    title: 'Programming & Data Structures',
    keywords: ['data structure', 'linked list', 'stack', 'queue', 'tree', 'heap', 'binary search', 'programming', 'pointer'],
  },
  {
    slug: 'algorithms',
    title: 'Algorithms',
    keywords: ['algorithm', 'dynamic programming', 'greedy', 'shortest path', 'dijkstra', 'sorting', 'complexity', 'divide and conquer', 'dp '],
  },
  {
    slug: 'theory-of-computation',
    title: 'Theory of Computation',
    keywords: ['automata', 'turing', 'regular expression', 'context free', 'decidab', 'theory of computation', 'toc'],
  },
  {
    slug: 'compiler-design',
    title: 'Compiler Design',
    keywords: ['compiler', 'parsing', 'lexer', 'lexical', 'syntax directed', 'code optimization'],
  },
  {
    slug: 'operating-systems',
    title: 'Operating Systems',
    keywords: ['operating system', 'deadlock', 'scheduling', 'paging', 'semaphore', 'process sync', 'os '],
  },
  {
    slug: 'databases',
    title: 'Databases',
    keywords: ['database', 'sql', 'normalization', 'transaction', 'er diagram', 'dbms', 'relational'],
  },
  {
    slug: 'computer-networks',
    title: 'Computer Networks',
    keywords: ['computer network', 'tcp', 'osi', 'routing', 'subnet', 'ip address', 'cn '],
  },
];

const BY_SLUG = new Map(GATE_CSE_CHAPTERS.map((chapter) => [chapter.slug, chapter]));

export function chapterBySlug(slug) {
  return BY_SLUG.get(slug) || null;
}

export function matchGateChapter(title) {
  const text = ` ${String(title || '').toLowerCase()} `;
  let best = null;
  let bestScore = 0;
  for (const chapter of GATE_CSE_CHAPTERS) {
    let score = 0;
    for (const keyword of chapter.keywords) {
      if (text.includes(keyword)) score += keyword.length;
    }
    if (score > bestScore) {
      best = chapter;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}
