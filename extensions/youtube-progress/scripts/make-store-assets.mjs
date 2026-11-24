/**
 * Build Chrome Web Store listing images (exact sizes, JPEG / 24-bit PNG no alpha).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'store-listing');
const assetsDir = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'e-cattracker',
  'assets'
);

const LOGO = path.join(root, 'public', 'brand', 'logo-trim.png');
const ICON = path.join(root, 'public', 'icons', 'icon128-art.png');

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

async function flattenJpeg(input, width, height, outPath) {
  await sharp(input)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function flattenPng24(input, width, height, outPath) {
  await sharp(input)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#f8fafc' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function svgToJpeg(svg, width, height, outPath) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function composePopupScreenshot(outPath) {
  const logo = await sharp(LOGO)
    .resize({ width: 280, height: 68, fit: 'inside' })
    .png()
    .toBuffer();
  const icon = await sharp(ICON).resize(48, 48).png().toBuffer();

  const W = 1280;
  const H = 800;
  const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="55%" stop-color="#eef2ff"/>
      <stop offset="100%" stop-color="#e8edf8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="64" y="72" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#3f5eb9">Extension popup</text>
  <text x="64" y="108" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="800" fill="#0a0a0a">Sync watch % for OG path videos</text>
  <text x="64" y="148" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#64748b">Catalog videos only — random YouTube never syncs</text>

  <!-- fake browser / yt area -->
  <rect x="64" y="200" width="720" height="520" rx="18" fill="#0f172a"/>
  <rect x="64" y="200" width="720" height="44" rx="18" fill="#1e293b"/>
  <rect x="64" y="228" width="720" height="16" fill="#1e293b"/>
  <circle cx="88" cy="222" r="6" fill="#f87171"/>
  <circle cx="110" cy="222" r="6" fill="#fbbf24"/>
  <circle cx="132" cy="222" r="6" fill="#34d399"/>
  <rect x="160" y="212" width="420" height="20" rx="6" fill="#334155"/>
  <text x="172" y="226" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#94a3b8">youtube.com/watch</text>
  <rect x="104" y="280" width="640" height="360" rx="8" fill="#1e293b"/>
  <polygon points="400,430 400,500 460,465" fill="#94a3b8"/>

  <!-- on-page progress card -->
  <g filter="url(#shadow)">
    <rect x="140" y="560" width="280" height="96" rx="14" fill="#ffffff"/>
  </g>
  <text x="158" y="590" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="700" fill="#3f5eb9">IN YOUR OG PATH</text>
  <text x="158" y="618" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#0a0a0a">72% watched</text>
  <rect x="158" y="632" width="244" height="8" rx="4" fill="#e8edf8"/>
  <rect x="158" y="632" width="176" height="8" rx="4" fill="#3f5eb9"/>

  <!-- popup -->
  <g filter="url(#shadow)">
    <rect x="860" y="180" width="360" height="520" rx="20" fill="#ffffff"/>
  </g>
  <rect x="860" y="180" width="360" height="520" rx="20" fill="#ffffff" stroke="#dbe3f5" stroke-width="1"/>
  <rect x="880" y="280" width="320" height="88" rx="14" fill="#ffffff" stroke="#e5e7eb"/>
  <text x="896" y="306" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#3f5eb9">SIGNED IN</text>
  <text x="896" y="332" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" fill="#0a0a0a">you@email.com</text>

  <rect x="880" y="384" width="320" height="120" rx="14" fill="#ffffff" stroke="#e5e7eb"/>
  <text x="896" y="412" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#3f5eb9">CURRENT VIDEO</text>
  <text x="896" y="440" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" fill="#0a0a0a">Number Systems · Lesson 3</text>
  <text x="896" y="468" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#64748b">72% · syncing to path</text>

  <rect x="880" y="520" width="320" height="44" rx="12" fill="#3f5eb9"/>
  <text x="960" y="548" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">Sync now from this tab</text>

  <text x="896" y="600" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#737373">Tracker videos only</text>
  <text x="896" y="624" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#737373">Highest progress wins across devices</text>
</svg>`;

  const base = await sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toBuffer();
  await sharp(base)
    .composite([
      { input: logo, left: 884, top: 204 },
      { input: icon, left: 1160, top: 208 },
    ])
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function composeCatalogScreenshot(outPath) {
  const logo = await sharp(LOGO)
    .resize({ width: 220, height: 52, fit: 'inside' })
    .png()
    .toBuffer();

  const W = 1280;
  const H = 800;
  const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e8edf8"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="80" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#0a0a0a">Catalog-only by design</text>
  <text x="80" y="168" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#64748b">Only videos in your active OG Tracker paths are eligible to sync.</text>

  <rect x="80" y="220" width="540" height="460" rx="20" fill="#ffffff" stroke="#dbe3f5"/>
  <text x="108" y="268" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#3f5eb9">IN CATALOG → SYNCED</text>
  ${[0, 1, 2, 3]
    .map((i) => {
      const y = 300 + i * 84;
      const pct = [100, 72, 45, 0][i];
      const w = Math.round(360 * (pct / 100));
      return `
      <rect x="108" y="${y}" width="484" height="68" rx="12" fill="#f8fafc" stroke="#e5e7eb"/>
      <text x="128" y="${y + 30}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#0a0a0a">Path video ${i + 1}</text>
      <text x="128" y="${y + 52}" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#64748b">${pct}% watched</text>
      <rect x="320" y="${y + 40}" width="240" height="8" rx="4" fill="#e8edf8"/>
      <rect x="320" y="${y + 40}" width="${w}" height="8" rx="4" fill="#3f5eb9"/>
      `;
    })
    .join('')}

  <rect x="660" y="220" width="540" height="460" rx="20" fill="#ffffff" stroke="#dbe3f5"/>
  <text x="688" y="268" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#94a3b8">NOT IN CATALOG → IGNORED</text>
  ${[0, 1, 2]
    .map((i) => {
      const y = 300 + i * 100;
      return `
      <rect x="688" y="${y}" width="484" height="80" rx="12" fill="#f8fafc" stroke="#e5e7eb"/>
      <text x="708" y="${y + 34}" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#64748b">Random YouTube video</text>
      <text x="708" y="${y + 58}" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#94a3b8">No sync · no tracking</text>
      `;
    })
    .join('')}
</svg>`;

  const base = await sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toBuffer();
  await sharp(base)
    .composite([{ input: logo, left: 80, top: 36 }])
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function composeDevicesScreenshot(outPath) {
  const logo = await sharp(LOGO)
    .resize({ width: 220, height: 52, fit: 'inside' })
    .png()
    .toBuffer();

  const W = 1280;
  const H = 800;
  const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e8edf8"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="80" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#0a0a0a">Connected devices</text>
  <text x="80" y="168" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#64748b">Authorize once. Revoke anytime. Highest progress wins.</text>

  <rect x="80" y="220" width="1120" height="120" rx="18" fill="#ffffff" stroke="#dbe3f5"/>
  <circle cx="140" cy="280" r="28" fill="#e8edf8"/>
  <text x="128" y="286" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#3f5eb9">C</text>
  <text x="190" y="268" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#0a0a0a">Chrome · Windows</text>
  <text x="190" y="298" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#64748b">Last sync just now · Active</text>
  <rect x="980" y="258" width="160" height="44" rx="12" fill="#fef2f2" stroke="#fecaca"/>
  <text x="1024" y="286" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#b91c1c">Revoke</text>

  <rect x="80" y="360" width="1120" height="120" rx="18" fill="#ffffff" stroke="#dbe3f5"/>
  <circle cx="140" cy="420" r="28" fill="#e8edf8"/>
  <text x="130" y="426" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#3f5eb9">E</text>
  <text x="190" y="408" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#0a0a0a">Edge · Laptop</text>
  <text x="190" y="438" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#64748b">Last sync 2h ago</text>
  <rect x="980" y="398" width="160" height="44" rx="12" fill="#fef2f2" stroke="#fecaca"/>
  <text x="1024" y="426" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#b91c1c">Revoke</text>

  <rect x="80" y="520" width="1120" height="160" rx="18" fill="#ffffff" stroke="#dbe3f5"/>
  <text x="112" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#0a0a0a">Privacy built in</text>
  <text x="112" y="620" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#64748b">No ads · no remote code · pause sync anytime · catalog videos only</text>
  <text x="112" y="650" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#3f5eb9">www.10tracker.com/privacy-policy#youtube-progress-extension</text>
</svg>`;

  const base = await sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toBuffer();
  await sharp(base)
    .composite([{ input: logo, left: 80, top: 36 }])
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
}

async function main() {
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'screenshots'));

  const promoRef = path.join(assetsDir, 'promo-tile-ref.jpg');
  const marqueeRef = path.join(assetsDir, 'marquee-ref.jpg');
  const shotSync = path.join(assetsDir, 'screenshot-sync-ref.jpg');
  const shotConnect = path.join(assetsDir, 'screenshot-connect-ref.jpg');
  const shotPath = path.join(assetsDir, 'screenshot-path-ref.jpg');

  // Prefer generated refs; fall back to programmatic if missing
  const smallOut = path.join(outDir, 'small-promo-tile-440x280.jpg');
  const marqueeOut = path.join(outDir, 'marquee-promo-tile-1400x560.jpg');

  if (fs.existsSync(promoRef)) {
    await flattenJpeg(promoRef, 440, 280, smallOut);
    await flattenPng24(promoRef, 440, 280, path.join(outDir, 'small-promo-tile-440x280.png'));
  } else {
    throw new Error('Missing promo-tile-ref.jpg');
  }

  if (fs.existsSync(marqueeRef)) {
    await flattenJpeg(marqueeRef, 1400, 560, marqueeOut);
    await flattenPng24(marqueeRef, 1400, 560, path.join(outDir, 'marquee-promo-tile-1400x560.png'));
  }

  // Screenshots: mix of AI refs + brand-accurate composites
  const shots = [];
  if (fs.existsSync(shotSync)) {
    const p = path.join(outDir, 'screenshots', '01-sync-on-youtube-1280x800.jpg');
    await flattenJpeg(shotSync, 1280, 800, p);
    shots.push(p);
  }
  if (fs.existsSync(shotConnect)) {
    const p = path.join(outDir, 'screenshots', '02-connect-account-1280x800.jpg');
    await flattenJpeg(shotConnect, 1280, 800, p);
    shots.push(p);
  }
  if (fs.existsSync(shotPath)) {
    const p = path.join(outDir, 'screenshots', '03-path-progress-1280x800.jpg');
    await flattenJpeg(shotPath, 1280, 800, p);
    shots.push(p);
  }

  const popupShot = path.join(outDir, 'screenshots', '04-extension-popup-1280x800.jpg');
  await composePopupScreenshot(popupShot);
  shots.push(popupShot);

  const catalogShot = path.join(outDir, 'screenshots', '05-catalog-only-1280x800.jpg');
  await composeCatalogScreenshot(catalogShot);
  shots.push(catalogShot);

  // Extra optional devices shot (keep top 5 for store; this is backup)
  const devicesShot = path.join(outDir, 'screenshots', '06-devices-privacy-1280x800.jpg');
  await composeDevicesScreenshot(devicesShot);

  const readme = `# Chrome Web Store — Global assets

Generated for **10tracker YouTube Progress** v1.2.2

## Upload checklist

### Screenshots (required, max 5)
Use these first five (1280×800 JPEG, no alpha):

1. \`screenshots/01-sync-on-youtube-1280x800.jpg\`
2. \`screenshots/02-connect-account-1280x800.jpg\`
3. \`screenshots/03-path-progress-1280x800.jpg\`
4. \`screenshots/04-extension-popup-1280x800.jpg\`
5. \`screenshots/05-catalog-only-1280x800.jpg\`

Backup: \`screenshots/06-devices-privacy-1280x800.jpg\`

### Small promo tile (required)
- \`small-promo-tile-440x280.jpg\` (also \`.png\` 24-bit)

### Marquee promo tile (optional)
- \`marquee-promo-tile-1400x560.jpg\` (also \`.png\` 24-bit)

### Global promo video (YouTube URL)
1. Upload \`promo-video/10tracker-youtube-progress-promo.mp4\` (or the HyperFrames render) as **unlisted** or **public** on YouTube.
2. Paste the watch URL into the Chrome Web Store field, e.g. \`https://www.youtube.com/watch?v=...\`

Privacy URL for listing:
\`https://www.10tracker.com/privacy-policy#youtube-progress-extension\`
`;

  fs.writeFileSync(path.join(outDir, 'README.md'), readme);
  console.log('Wrote store-listing assets:');
  for (const f of [
    smallOut,
    marqueeOut,
    ...shots,
    devicesShot,
  ]) {
    const m = await sharp(f).metadata();
    console.log(`- ${path.relative(root, f)}  ${m.width}x${m.height}  ${m.format}  alpha=${m.hasAlpha}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
