# 10Tracker YouTube Progress (Chrome / Edge / Firefox MV3)

Production extension for syncing **catalogued OG Tracker** YouTube watch progress into 10Tracker (`og_progress`).

## Features

- Live **HUD on YouTube** (percent, section chips, path link, next / complete / skip)
- Event-driven player sync + soft safety tick (battery saver)
- Pause sync, offline queue with retry, catalog-only miss cache
- Weekly goal + path progress + last-device label
- Resume nudge when you reopen a mid-watch video
- Share path progress from the popup
- Opaque Bearer tokens (SHA-256 hashed server-side), revocable devices
- Long-video fix: ≥5s watched registers at least 1%

## Prerequisites (server)

Run in Supabase SQL Editor:

1. `supabase/migrations/setup_og_trackers.sql` (if needed)
2. `supabase/migrations/setup_extension_tokens.sql` (**required**)
3. `supabase/migrations/add_og_progress_skipped_and_device.sql` (**SKIPPED** status + device stamp)
4. `supabase/migrations/seed_og_trackers_demo.sql` (optional demo path)

Deploy the Next.js app with Google Auth + Supabase service role configured.

## Build

```bash
cd extensions/youtube-progress
npm install
npm run build
```

- Chrome / Edge: load unpacked `dist/chrome`
- Firefox: load temporary add-on from `dist/firefox` (or zip for AMO)

For Chrome Web Store: zip the **contents** of `dist/chrome`.

## Connect (users)

1. Install extension
2. Popup → **Connect account** (production `www.10tracker.com`)
3. Sign in with Google → **Authorize extension**
4. Watch a catalogued video on YouTube — HUD appears; dashboard updates

Local dogfood: popup → Developer → **Connect (localhost:3000)**

Manage tokens: `/extension/devices`

## APIs

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/extension/auth/code` | Session |
| POST | `/api/extension/auth/exchange` | One-time code |
| POST | `/api/extension/auth/revoke` | Bearer or session |
| GET | `/api/extension/auth/devices` | Session |
| GET | `/api/extension/og/by-youtube?v=` | Bearer |
| POST | `/api/extension/og/progress` | Bearer |

`by-youtube` also returns `siblings`, `pathProgress`, and `weekGoal`.  
`progress` accepts optional `status`: `IN_PROGRESS` | `SKIPPED` | `COMPLETED`.

Debug progress logs: set `EXTENSION_PROGRESS_DEBUG=1` on the server.

## Web app detection

A lightweight `presence.js` content script runs on `10tracker.com` / localhost and sets `data-tt-ext`. The OG path viewer uses this to show an install/connect setup modal when videos exist and the extension is missing or not authorized.

Optional Store CTA: set `NEXT_PUBLIC_CHROME_EXTENSION_URL` (or `NEXT_PUBLIC_EXTENSION_STORE_URL`) in the Next.js env.

## Privacy / Store notes

- Single purpose: sync progress for 10Tracker learning-path YouTube videos
- Hosts: `youtube.com`, `10tracker.com` only
- Does not track arbitrary browsing; uncatalogued videos are miss-cached and HUD stays hidden
- Conflict rule: **highest progress wins** across devices
- Link privacy policy on Store listing before publish
