import axios from 'axios';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BROWSER_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Referer: 'https://gateoverflow.in/',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export function isCloudflareChallenge(html) {
  if (!html || typeof html !== 'string') return false;
  const lower = html.toLowerCase();
  return (
    lower.includes('just a moment') ||
    lower.includes('cf-browser-verification') ||
    lower.includes('challenge-platform') ||
    lower.includes('attention required')
  );
}

async function fetchDirect(url) {
  const { data, status } = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (s) => s < 500,
    responseType: 'text',
  });
  if (status === 403 || isCloudflareChallenge(data)) {
    return { ok: false, status, html: data };
  }
  if (status < 200 || status >= 300) {
    return { ok: false, status, html: data };
  }
  return { ok: true, status, html: data };
}

async function fetchViaScraperApi(url) {
  const apiKey = process.env.GATEOVERFLOW_SCRAPER_API_KEY?.trim();
  if (!apiKey) return null;

  const endpoint = `https://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}&render=true`;
  const { data, status } = await axios.get(endpoint, {
    timeout: 90000,
    maxRedirects: 5,
    validateStatus: (s) => s < 500,
    responseType: 'text',
  });
  if (status < 200 || status >= 300 || isCloudflareChallenge(data)) {
    return { ok: false, status, html: data };
  }
  return { ok: true, status, html: data };
}

async function fetchViaProxy(url) {
  const proxyUrl = process.env.GATEOVERFLOW_FETCH_PROXY_URL?.trim();
  if (!proxyUrl) return null;

  const secret = process.env.GATEOVERFLOW_FETCH_PROXY_SECRET?.trim();
  const headers = { 'Content-Type': 'application/json' };
  if (secret) headers['x-proxy-secret'] = secret;

  const { data, status } = await axios.post(
    proxyUrl,
    { url },
    { headers, timeout: 90000, validateStatus: (s) => s < 500 }
  );
  const html = typeof data === 'string' ? data : data?.html;
  if (!html || status < 200 || status >= 300 || isCloudflareChallenge(html)) {
    return { ok: false, status, html };
  }
  return { ok: true, status, html };
}

/**
 * Fetch GateOverflow page HTML. Tries direct → ScraperAPI → custom proxy.
 */
export async function fetchGateOverflowHtml(url) {
  const attempts = [];

  try {
    const direct = await fetchDirect(url);
    attempts.push({ method: 'direct', status: direct.status });
    if (direct.ok) return { html: direct.html, method: 'direct' };
  } catch (err) {
    attempts.push({ method: 'direct', error: err?.message });
  }

  try {
    const scraper = await fetchViaScraperApi(url);
    if (scraper) {
      attempts.push({ method: 'scraperapi', status: scraper.status });
      if (scraper.ok) return { html: scraper.html, method: 'scraperapi' };
    }
  } catch (err) {
    attempts.push({ method: 'scraperapi', error: err?.message });
  }

  try {
    const proxy = await fetchViaProxy(url);
    if (proxy) {
      attempts.push({ method: 'proxy', status: proxy.status });
      if (proxy.ok) return { html: proxy.html, method: 'proxy' };
    }
  } catch (err) {
    attempts.push({ method: 'proxy', error: err?.message });
  }

  const hasScraperKey = Boolean(process.env.GATEOVERFLOW_SCRAPER_API_KEY?.trim());
  const hasProxy = Boolean(process.env.GATEOVERFLOW_FETCH_PROXY_URL?.trim());

  let hint =
    'GateOverflow blocks automated server requests (Cloudflare 403). ';
  if (!hasScraperKey && !hasProxy) {
    hint +=
      'Set GATEOVERFLOW_SCRAPER_API_KEY (ScraperAPI) or GATEOVERFLOW_FETCH_PROXY_URL in .env.local, or paste the answer HTML manually in the admin panel.';
  } else if (!hasScraperKey) {
    hint += 'Your fetch proxy failed — check GATEOVERFLOW_FETCH_PROXY_URL is running.';
  } else if (!hasProxy) {
    hint += 'ScraperAPI fetch failed — check your API key and quota.';
  } else {
    hint += 'All fetch methods failed.';
  }

  const err = new Error(hint);
  err.code = 'GATEOVERFLOW_BLOCKED';
  err.attempts = attempts;
  throw err;
}
