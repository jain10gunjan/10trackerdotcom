import browser from '../lib/browser.js';
import { MSG } from '../lib/messages.js';

function readCodeFromPage() {
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get('code');
  if (fromQuery) {
    return {
      code: fromQuery,
      apiOrigin: location.origin,
    };
  }

  const el = document.getElementById('tentracker-extension-auth');
  if (el?.dataset?.code) {
    return {
      code: el.dataset.code,
      apiOrigin: el.dataset.apiOrigin || location.origin,
    };
  }
  return null;
}

function showBanner(text, ok) {
  const existing = document.getElementById('tentracker-ext-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'tentracker-ext-banner';
  let logoSrc = '';
  try {
    logoSrc = browser.runtime.getURL('public/brand/logo-trim.png');
  } catch {
    /* ignore */
  }
  banner.innerHTML = `${
    logoSrc
      ? `<img src="${logoSrc}" alt="10tracker.com" style="height:18px;width:auto;display:block;filter:brightness(0) invert(1)" />`
      : '<strong style="font-weight:800">10tracker.com</strong>'
  }<span style="opacity:.95">${String(text).replace(/</g, '')}</span>`;
  banner.style.cssText = `position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:10px;background:${
    ok ? '#3F5EB9' : '#991b1b'
  };color:#fff;padding:12px 16px;border-radius:14px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 12px 32px -12px rgba(63,94,185,.55);max-width:90vw`;
  document.body.appendChild(banner);
}

let delivering = false;

function deliver(auth) {
  if (!auth?.code || delivering) return;
  delivering = true;
  browser.runtime.sendMessage(
    {
      type: MSG.AUTH_CODE,
      code: auth.code,
      apiOrigin: auth.apiOrigin,
    },
    (response) => {
      const err = browser.runtime.lastError;
      delivering = false;
      if (err) {
        showBanner(
          'Extension did not receive the code. Open the 10Tracker popup once to finish.',
          false
        );
        return;
      }
      if (response?.ok) {
        showBanner('10Tracker extension connected. You can close this tab.', true);
        try {
          window.dispatchEvent(new CustomEvent('tt-ext-connected', { detail: { ok: true } }));
          const u = new URL(location.href);
          if (u.searchParams.has('code')) {
            u.searchParams.delete('code');
            u.searchParams.set('status', 'connected');
            history.replaceState({}, '', u.toString());
          }
        } catch {
          /* ignore */
        }
      } else {
        showBanner(
          response?.error ||
            'Could not finish connect. Open the extension popup, then click Authorize again.',
          false
        );
      }
    }
  );
}

function tryDeliver() {
  const auth = readCodeFromPage();
  if (auth) deliver(auth);
}

tryDeliver();
setTimeout(tryDeliver, 500);
setTimeout(tryDeliver, 1500);

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin) return;
  const data = event.data;
  if (data?.source === '10tracker-extension' && data?.type === 'EXTENSION_AUTH_CODE') {
    deliver({ code: data.code, apiOrigin: data.apiOrigin || location.origin });
  }
});
