/**
 * CodeStudio judge client (mock until real API is wired).
 * Same checkProblems contract as LeetCode / HackerRank.
 */

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase();
}

export class CodeStudioService {
  /**
   * @param {string} username
   * @param {string[]} slugs
   * @returns {Promise<Map<string, 'SOLVED'|'NOT_STARTED'>>}
   */
  async checkProblems(username, slugs = []) {
    const needed = [...new Set(slugs.map(normalizeSlug).filter(Boolean))];
    const result = new Map(needed.map((s) => [s, 'NOT_STARTED']));
    if (!username || !needed.length) return result;
    console.warn('[codestudio] MOCK checkProblems for', username, needed.length, 'slugs');
    return result;
  }

  async getSolvedProblems(username) {
    if (!username) return [];
    console.warn('[codestudio] MOCK getSolvedProblems for', username);
    return [];
  }

  async getProblemStatus(username, slug) {
    if (!username || !slug) return 'NOT_STARTED';
    console.warn('[codestudio] MOCK getProblemStatus', username, slug);
    return 'NOT_STARTED';
  }
}

export const codestudioService = new CodeStudioService();
