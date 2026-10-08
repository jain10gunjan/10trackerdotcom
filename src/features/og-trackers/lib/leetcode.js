/**
 * LeetCode GraphQL client.
 * Sync path: check ONLY the slugs on your OG tracker (not a full dump).
 */

const GRAPHQL_URL = 'https://leetcode.com/graphql';
const CACHE_TTL_MS = 5 * 60 * 1000;
const AC_LIMIT = 100;

const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Referer: 'https://leetcode.com',
  Origin: 'https://leetcode.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const RECENT_AC_QUERY = `
  query recentAc($username: String!, $limit: Int!) {
    matchedUser(username: $username) {
      username
    }
    recentAcSubmissionList(username: $username, limit: $limit) {
      titleSlug
      timestamp
    }
  }
`;

async function leetcodeGraphql(query, variables) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || 'LeetCode GraphQL error');
  }
  return json.data;
}

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase();
}

export class LeetCodeService {
  /** @returns {Promise<Set<string>>} */
  async #solvedSlugSet(username) {
    const key = `ac-set:${normalizeSlug(username)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const data = await leetcodeGraphql(RECENT_AC_QUERY, {
      username: String(username).trim(),
      limit: AC_LIMIT,
    });

    if (!data?.matchedUser) {
      throw new Error(`LeetCode user not found: ${username}`);
    }

    const set = new Set();
    for (const row of data.recentAcSubmissionList || []) {
      const slug = normalizeSlug(row.titleSlug);
      if (slug) set.add(slug);
    }
    cacheSet(key, set);
    return set;
  }

  /**
   * Check only the tracker question slugs (one GraphQL call, cached).
   * @param {string} username
   * @param {string[]} slugs
   * @returns {Promise<Map<string, 'SOLVED'|'NOT_STARTED'>>}
   */
  async checkProblems(username, slugs = []) {
    const needed = [...new Set(slugs.map(normalizeSlug).filter(Boolean))];
    const result = new Map(needed.map((s) => [s, 'NOT_STARTED']));
    if (!username || !needed.length) return result;

    const solved = await this.#solvedSlugSet(username);
    for (const slug of needed) {
      if (solved.has(slug)) result.set(slug, 'SOLVED');
    }
    return result;
  }

  async getSolvedProblems(username) {
    if (!username) return [];
    const set = await this.#solvedSlugSet(username);
    return [...set].map((slug) => ({ slug }));
  }

  async getProblemStatus(username, slug) {
    if (!username || !slug) return 'NOT_STARTED';
    try {
      const map = await this.checkProblems(username, [slug]);
      return map.get(normalizeSlug(slug)) || 'NOT_STARTED';
    } catch (err) {
      console.error('[leetcode] getProblemStatus', err.message);
      return 'NOT_STARTED';
    }
  }
}

export const leetcodeService = new LeetCodeService();
