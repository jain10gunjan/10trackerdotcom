/**
 * HackerRank REST client.
 * Sync path: paginate recent challenges until tracker slugs are found (early exit).
 */

import axios from 'axios';

const CACHE_TTL_MS = 5 * 60 * 1000;
const PAGE_SIZE = 50;
const MAX_PAGES = 6;

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

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^challenges\//, '');
}

function hrHeaders(username) {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    Referer: `https://www.hackerrank.com/${encodeURIComponent(username)}`,
  };
}

function slugFromChallenge(model) {
  if (!model) return null;
  if (model.slug) return normalizeSlug(model.slug);
  if (model.ch_slug) return normalizeSlug(model.ch_slug);
  if (model.challenge_slug) return normalizeSlug(model.challenge_slug);

  const url = model.ch_url || model.url || model.challenge_url || '';
  const match = String(url).match(/\/challenges\/([^/?#]+)/i);
  if (match?.[1]) return normalizeSlug(match[1]);

  if (model.name) {
    return normalizeSlug(
      String(model.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  }
  return null;
}

export class HackerRankService {
  /**
   * Check only tracker question slugs. Stops paging once all are found.
   * @param {string} username
   * @param {string[]} slugs
   * @returns {Promise<Map<string, 'SOLVED'|'NOT_STARTED'>>}
   */
  async checkProblems(username, slugs = []) {
    const needed = [...new Set(slugs.map(normalizeSlug).filter(Boolean))];
    const result = new Map(needed.map((s) => [s, 'NOT_STARTED']));
    if (!username || !needed.length) return result;

    const neededSet = new Set(needed);
    const cacheKey = `check:${normalizeSlug(username)}:${needed.slice().sort().join(',')}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const user = String(username).trim();
    const headers = hrHeaders(user);
    let remaining = neededSet.size;

    for (let page = 0; page < MAX_PAGES && remaining > 0; page += 1) {
      const offset = page * PAGE_SIZE;
      const url = `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(
        user
      )}/recent_challenges?offset=${offset}&limit=${PAGE_SIZE}&response_version=v2`;

      let data;
      try {
        const res = await axios.get(url, { headers, timeout: 15000 });
        data = res.data;
      } catch (err) {
        if (err.response?.status === 404) {
          throw new Error(`HackerRank user not found: ${user}`);
        }
        throw new Error(err.response?.data?.message || err.message || 'HackerRank fetch failed');
      }

      const models = data?.models || data?.data || [];
      if (!Array.isArray(models) || models.length === 0) break;

      for (const model of models) {
        const slug = slugFromChallenge(model);
        if (!slug || !neededSet.has(slug)) continue;
        if (result.get(slug) === 'SOLVED') continue;
        result.set(slug, 'SOLVED');
        remaining -= 1;
        if (remaining <= 0) break;
      }

      if (models.length < PAGE_SIZE) break;
    }

    cacheSet(cacheKey, result);
    return result;
  }

  async getSolvedProblems(username) {
    if (!username) return [];
    // Broad fetch for batch jobs — prefer checkProblems for tracker sync
    const map = await this.checkProblems(username, []);
    return [...map.entries()]
      .filter(([, status]) => status === 'SOLVED')
      .map(([slug]) => ({ slug }));
  }

  async getProblemStatus(username, slug) {
    if (!username || !slug) return 'NOT_STARTED';
    try {
      const map = await this.checkProblems(username, [slug]);
      return map.get(normalizeSlug(slug)) || 'NOT_STARTED';
    } catch (err) {
      console.error('[hackerrank] getProblemStatus', err.message);
      return 'NOT_STARTED';
    }
  }

  async getProfile(username) {
    if (!username) return null;
    const user = String(username).trim();
    const key = `profile:${normalizeSlug(user)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const headers = hrHeaders(user);
    try {
      const [badgeResponse, certificateResponse] = await Promise.all([
        axios.get(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(user)}/badges`, {
          headers,
          timeout: 15000,
        }),
        axios.get(
          `https://www.hackerrank.com/community/v1/test_results/hacker_certificate?username=${encodeURIComponent(
            user
          )}`,
          { headers, timeout: 15000 }
        ),
      ]);

      const profile = {
        badges: badgeResponse.data,
        certificates: certificateResponse.data,
      };
      cacheSet(key, profile);
      return profile;
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error(`HackerRank user not found: ${user}`);
      }
      throw new Error(err.response?.data?.message || err.message || 'HackerRank profile failed');
    }
  }
}

export const hackerrankService = new HackerRankService();
