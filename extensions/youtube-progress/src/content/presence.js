/**
 * Announces extension presence on 10Tracker so the web app can detect install/connect.
 * Optimized: mark installed synchronously; signed-in status via async ping.
 */
import browser from '../lib/browser.js';
import { MSG } from '../lib/messages.js';

const ATTR = 'data-tt-ext';
const PONG = 'tt-ext-pong';
const PING = 'tt-ext-ping';
const VERSION = '1.2.2';

let lastSignedIn = null;
let inFlight = false;

function markInstalled() {
  try {
    document.documentElement.setAttribute(ATTR, '1');
    document.documentElement.setAttribute('data-tt-ext-version', VERSION);
  } catch {
    /* ignore */
  }
}

function publish(detail) {
  window.dispatchEvent(new CustomEvent(PONG, { detail }));
  window.postMessage({ source: 'tt-ext', type: PONG, ...detail }, '*');
}

async function getSignedIn() {
  try {
    const res = await browser.runtime.sendMessage({ type: MSG.GET_STATUS });
    return Boolean(res?.signedIn);
  } catch {
    return false;
  }
}

async function reply(source = 'attribute', { force = false } = {}) {
  if (inFlight && !force) return;
  inFlight = true;
  try {
    // Instant install signal; only echo signedIn when we already know it
    const early = {
      installed: true,
      version: VERSION,
      source: `${source}:install`,
      pendingAuth: lastSignedIn == null,
    };
    if (lastSignedIn != null) early.signedIn = lastSignedIn;
    publish(early);

    const signedIn = await getSignedIn();
    lastSignedIn = signedIn;
    try {
      document.documentElement.setAttribute(
        'data-tt-ext-signed-in',
        signedIn ? '1' : '0'
      );
    } catch {
      /* ignore */
    }
    publish({
      installed: true,
      signedIn,
      version: VERSION,
      source,
      pendingAuth: false,
    });
  } finally {
    inFlight = false;
  }
}

markInstalled();
// Install-only announce — omit signedIn so web doesn't flash "needs connect"
publish({
  installed: true,
  version: VERSION,
  source: 'boot:sync',
  pendingAuth: true,
});
void reply('boot', { force: true });

window.addEventListener(PING, () => {
  void reply('event', { force: true });
});

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (data?.source === 'tt-web' && data?.type === PING) {
    void reply('postMessage', { force: true });
  }
});

document.addEventListener(
  'visibilitychange',
  () => {
    if (document.visibilityState === 'visible') void reply('visible', { force: true });
  },
  { passive: true }
);
