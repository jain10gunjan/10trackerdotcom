/**
 * 10tracker progress card in YouTube's right column (above related videos).
 */

import browser from '../lib/browser.js';

const ROOT_ID = 'tentracker-progress-card';
const STYLE_ID = 'tentracker-progress-card-style';
const BLUE = '#3F5EB9';
const BLUE_BRIGHT = '#4B6BC7';
const SOFT = '#E8EDF8';

function officialLogoUrl() {
  try {
    return browser.runtime.getURL('public/brand/logo-trim.png');
  } catch {
    return '';
  }
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin: 0 0 12px;
      font-family: "Roboto", "YouTube Noto", "Arial", sans-serif;
      color: var(--yt-spec-text-primary, #0f0f0f);
    }
    html[dark] #${ROOT_ID},
    [dark] #${ROOT_ID},
    ytd-app[dark] #${ROOT_ID} {
      color: var(--yt-spec-text-primary, #f1f1f1);
    }
    #${ROOT_ID}.tt-hidden { display: none !important; }

    #${ROOT_ID} .tt-card {
      box-sizing: border-box;
      width: 100%;
      padding: 12px;
      border-radius: 14px;
      background: linear-gradient(165deg, ${SOFT} 0%, #ffffff 55%);
      border: 1px solid rgba(63,94,185,0.22);
      box-shadow: 0 8px 24px -16px rgba(63,94,185,0.45);
    }
    html[dark] #${ROOT_ID} .tt-card,
    [dark] #${ROOT_ID} .tt-card,
    ytd-app[dark] #${ROOT_ID} .tt-card {
      background: linear-gradient(165deg, rgba(63,94,185,0.22) 0%, #1f1f1f 60%);
      border-color: rgba(63,94,185,0.35);
      box-shadow: none;
    }

    #${ROOT_ID} .tt-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    #${ROOT_ID} .tt-brand-wrap { min-width: 0; flex: 1; }
    #${ROOT_ID} .tt-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      line-height: 1;
    }
    #${ROOT_ID} .tt-logo {
      height: 18px;
      width: auto;
      max-width: 120px;
      object-fit: contain;
      display: block;
    }
    html[dark] #${ROOT_ID} .tt-logo,
    [dark] #${ROOT_ID} .tt-logo,
    ytd-app[dark] #${ROOT_ID} .tt-logo {
      /* keep official dark wordmark readable on dark YT */
      filter: invert(1) hue-rotate(180deg) brightness(1.15);
    }
    #${ROOT_ID} .tt-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: ${BLUE}; flex-shrink: 0;
    }
    #${ROOT_ID}[data-state="done"] .tt-dot { background: #059669; }
    #${ROOT_ID}[data-state="warn"] .tt-dot { background: #d97706; }

    #${ROOT_ID} .tt-pct {
      font-size: 20px; font-weight: 800; line-height: 1;
      font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
      flex-shrink: 0; color: ${BLUE};
    }
    #${ROOT_ID}[data-state="done"] .tt-pct { color: #059669; }
    #${ROOT_ID}[data-state="warn"] .tt-pct { color: #d97706; }

    #${ROOT_ID} .tt-title {
      margin: 8px 0 0; font-size: 14px; font-weight: 600; line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    #${ROOT_ID} .tt-meta {
      margin: 4px 0 0; font-size: 12px; line-height: 1.4;
      color: var(--yt-spec-text-secondary, #606060);
    }
    #${ROOT_ID} .tt-chips {
      margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;
    }
    #${ROOT_ID} .tt-chip {
      font-size: 11px; font-weight: 600; line-height: 1.2;
      padding: 4px 8px; border-radius: 999px;
      background: rgba(63,94,185,0.12);
      color: ${BLUE};
    }
    html[dark] #${ROOT_ID} .tt-chip,
    [dark] #${ROOT_ID} .tt-chip,
    ytd-app[dark] #${ROOT_ID} .tt-chip {
      background: rgba(63,94,185,0.28); color: #c5d0f5;
    }

    #${ROOT_ID} .tt-nudge {
      margin-top: 10px; padding: 8px 10px; border-radius: 10px;
      background: rgba(63,94,185,0.12); font-size: 12px;
    }
    #${ROOT_ID} .tt-nudge-actions { margin-top: 8px; display: flex; gap: 6px; }

    #${ROOT_ID} .tt-bar {
      margin-top: 12px; height: 4px; border-radius: 999px;
      background: rgba(63,94,185,0.15); overflow: hidden;
    }
    #${ROOT_ID} .tt-bar > i {
      display: block; height: 100%; width: 0%; border-radius: inherit;
      background: ${BLUE}; transition: width 0.35s ease;
    }
    #${ROOT_ID}[data-state="done"] .tt-bar > i { background: #059669; }
    #${ROOT_ID}[data-state="warn"] .tt-bar > i { background: #d97706; }

    #${ROOT_ID} .tt-actions {
      margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;
    }
    #${ROOT_ID} .tt-btn {
      appearance: none; border: 0; border-radius: 18px;
      padding: 8px 12px; font: inherit; font-size: 12px; font-weight: 600;
      line-height: 1.2; cursor: pointer;
      background: rgba(63,94,185,0.1);
      color: ${BLUE};
    }
    html[dark] #${ROOT_ID} .tt-btn,
    [dark] #${ROOT_ID} .tt-btn,
    ytd-app[dark] #${ROOT_ID} .tt-btn {
      background: rgba(63,94,185,0.22); color: #d5ddf7;
    }
    #${ROOT_ID} .tt-btn.primary {
      background: ${BLUE}; color: #fff;
      box-shadow: 0 8px 18px -10px rgba(63,94,185,0.8);
    }
    html[dark] #${ROOT_ID} .tt-btn.primary,
    [dark] #${ROOT_ID} .tt-btn.primary,
    ytd-app[dark] #${ROOT_ID} .tt-btn.primary {
      background: ${BLUE_BRIGHT}; color: #fff;
    }
    #${ROOT_ID} .tt-btn:hover { filter: brightness(1.06); }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function findSecondaryHost() {
  return (
    document.querySelector('ytd-watch-flexy #secondary-inner') ||
    document.querySelector('#columns #secondary-inner') ||
    document.querySelector('#secondary-inner') ||
    document.querySelector('ytd-watch-flexy #secondary') ||
    document.querySelector('#secondary') ||
    null
  );
}

function mountRoot(root) {
  const host = findSecondaryHost();
  if (!host) {
    if (!root.isConnected) document.documentElement.appendChild(root);
    return false;
  }
  if (root.parentElement === host && host.firstElementChild === root) return true;
  if (host.firstChild) host.insertBefore(root, host.firstChild);
  else host.appendChild(root);
  return true;
}

function createRoot() {
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'tt-hidden';
  root.innerHTML = `
    <div class="tt-card">
      <div class="tt-top">
        <div class="tt-brand-wrap">
          <div class="tt-brand">
            <img class="tt-logo" data-logo alt="10tracker.com" />
            <span class="tt-dot" aria-hidden="true"></span>
          </div>
          <p class="tt-title" data-title>Watch progress</p>
          <p class="tt-meta" data-meta></p>
          <div class="tt-chips" data-chips></div>
        </div>
        <div class="tt-pct" data-pct>0%</div>
      </div>
      <div class="tt-nudge tt-hidden" data-nudge>
        <div data-nudge-text></div>
        <div class="tt-nudge-actions">
          <button type="button" class="tt-btn primary" data-resume-seek>Continue</button>
          <button type="button" class="tt-btn" data-resume-dismiss>Dismiss</button>
        </div>
      </div>
      <div class="tt-bar" data-bar><i data-fill></i></div>
      <div class="tt-actions">
        <button type="button" class="tt-btn primary" data-open>Open path</button>
        <button type="button" class="tt-btn" data-next>Next</button>
        <button type="button" class="tt-btn" data-complete>Complete</button>
        <button type="button" class="tt-btn" data-skip>Skip</button>
        <button type="button" class="tt-btn" data-pause>Pause sync</button>
        <button type="button" class="tt-btn" data-hide>Hide</button>
      </div>
    </div>
  `;

  root.querySelector('[data-hide]')?.addEventListener('click', () => {
    root.dataset.userHidden = '1';
    root.classList.add('tt-hidden');
  });

  return root;
}

let observed = false;
let actionHandler = null;
let lastView = null;

function watchSecondary() {
  if (observed) return;
  observed = true;
  const obs = new MutationObserver(() => {
    const root = document.getElementById(ROOT_ID);
    if (!root || root.classList.contains('tt-hidden')) return;
    mountRoot(root);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

function ensureRoot() {
  ensureStyles();
  watchSecondary();
  let root = document.getElementById(ROOT_ID);
  if (!root) root = createRoot();
  const logo = root.querySelector('[data-logo]');
  const src = officialLogoUrl();
  if (logo && src && logo.getAttribute('src') !== src) {
    logo.setAttribute('src', src);
  }
  mountRoot(root);
  return root;
}

function wireActions(root) {
  const bind = (sel, action) => {
    const el = root.querySelector(sel);
    if (!el || el.dataset.bound === '1') return;
    el.dataset.bound = '1';
    el.addEventListener('click', () => {
      if (typeof actionHandler === 'function') actionHandler(action, lastView);
    });
  };
  bind('[data-pause]', 'pause');
  bind('[data-complete]', 'complete');
  bind('[data-skip]', 'skip');
  bind('[data-next]', 'next');
  bind('[data-resume-seek]', 'resume-seek');
  bind('[data-resume-dismiss]', 'resume-dismiss');
}

/**
 * @param {object|null} view
 */
export function renderOverlay(view) {
  const root = ensureRoot();
  lastView = view;
  if (view?.onAction) actionHandler = view.onAction;
  wireActions(root);

  if (!view || view.hide) {
    root.classList.add('tt-hidden');
    return;
  }

  if (root.dataset.userHidden === '1' && view.forceShow !== true) {
    root.classList.add('tt-hidden');
    return;
  }

  if (view.videoId && root.dataset.videoId !== view.videoId) {
    root.dataset.userHidden = '0';
    root.dataset.videoId = view.videoId;
  }

  mountRoot(root);
  root.classList.remove('tt-hidden');
  root.dataset.state = view.state || 'tracking';

  const pct = Math.max(0, Math.min(100, Number(view.percent) || 0));
  const pctEl = root.querySelector('[data-pct]');
  const titleEl = root.querySelector('[data-title]');
  const metaEl = root.querySelector('[data-meta]');
  const chipsEl = root.querySelector('[data-chips]');
  const bar = root.querySelector('[data-bar]');
  const fill = root.querySelector('[data-fill]');
  const openBtn = root.querySelector('[data-open]');
  const nextBtn = root.querySelector('[data-next]');
  const pauseBtn = root.querySelector('[data-pause]');
  const nudge = root.querySelector('[data-nudge]');
  const nudgeText = root.querySelector('[data-nudge-text]');

  if (pctEl) pctEl.textContent = `${pct}%`;
  if (titleEl) titleEl.textContent = view.title || 'Tracked video';
  if (metaEl) metaEl.textContent = view.meta || '';
  if (fill) fill.style.width = `${pct}%`;
  if (bar) bar.classList.toggle('done', pct >= 90);

  if (chipsEl) {
    const chips = [];
    if (view.sectionLabel) chips.push(view.sectionLabel);
    if (view.pathTitle) chips.push(view.pathTitle);
    if (view.pathProgress?.total) {
      chips.push(`${view.pathProgress.completed}/${view.pathProgress.total} videos`);
    }
    if (view.weekGoal?.weeklyGoal) {
      chips.push(
        `${view.weekGoal.weeklyCompleted}/${view.weekGoal.weeklyGoal} this week`
      );
    }
    chipsEl.innerHTML = chips
      .map((c) => `<span class="tt-chip">${String(c).replace(/</g, '')}</span>`)
      .join('');
  }

  if (nudge && nudgeText) {
    if (view.resumeNudge?.percent) {
      nudge.classList.remove('tt-hidden');
      nudgeText.textContent = `Continue at ${view.resumeNudge.percent}%?`;
    } else {
      nudge.classList.add('tt-hidden');
    }
  }

  if (openBtn) {
    if (view.pathUrl) {
      openBtn.style.display = '';
      openBtn.onclick = () => window.open(view.pathUrl, '_blank', 'noopener');
    } else {
      openBtn.style.display = 'none';
    }
  }

  if (nextBtn) {
    nextBtn.style.display = view.nextVideoId ? '' : 'none';
  }

  if (pauseBtn) {
    pauseBtn.textContent = view.syncPaused ? 'Resume sync' : 'Pause sync';
  }
}

export function hideOverlay() {
  const root = document.getElementById(ROOT_ID);
  if (root) root.classList.add('tt-hidden');
}
