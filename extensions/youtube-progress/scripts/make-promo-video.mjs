import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'store-listing', 'promo-video');
fs.mkdirSync(outDir, { recursive: true });

const logo = await sharp(path.join(root, 'public', 'brand', 'logo-trim.png'))
  .resize({ width: 720, fit: 'inside' })
  .png()
  .toBuffer();

async function card(file, title, sub) {
  const svg = Buffer.from(`<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e8edf8"/>
    </linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#g)"/>
    <text x="960" y="620" text-anchor="middle" font-family="Segoe UI, Arial" font-size="48" font-weight="800" fill="#0a0a0a">${title}</text>
    <text x="960" y="680" text-anchor="middle" font-family="Segoe UI, Arial" font-size="28" fill="#64748b">${sub}</text>
  </svg>`);
  await sharp(svg)
    .composite([{ input: logo, top: 320, left: 600 }])
    .jpeg({ quality: 95 })
    .toFile(file);
}

await card(path.join(outDir, 'card-title.jpg'), 'YouTube Progress', 'Sync watch % for OG Tracker path videos');
await card(path.join(outDir, 'card-catalog.jpg'), 'Catalog videos only', 'Random YouTube is never synced');
await card(path.join(outDir, 'card-end.jpg'), 'Install on Chrome', '10tracker.com');

const shots = [
  '01-sync-on-youtube-1280x800.jpg',
  '04-extension-popup-1280x800.jpg',
  '05-catalog-only-1280x800.jpg',
];
for (let i = 0; i < shots.length; i++) {
  const src = path.join(root, 'store-listing', 'screenshots', shots[i]);
  const dest = path.join(outDir, `shot${i + 1}.jpg`);
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-i',
      src,
      '-vf',
      'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#f8fafc',
      dest,
    ],
    { stdio: 'inherit' }
  );
  if (r.status !== 0) process.exit(r.status || 1);
}

const list = `file 'card-title.jpg'
duration 3
file 'shot1.jpg'
duration 4
file 'shot2.jpg'
duration 4
file 'card-catalog.jpg'
duration 3
file 'shot3.jpg'
duration 4
file 'card-end.jpg'
duration 3
file 'card-end.jpg'
`;
fs.writeFileSync(path.join(outDir, 'list.txt'), list);

const mp4 = path.join(outDir, '10tracker-youtube-progress-promo.mp4');
const r2 = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    'list.txt',
    '-vf',
    'fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-movflags',
    '+faststart',
    '10tracker-youtube-progress-promo.mp4',
  ],
  { cwd: outDir, stdio: 'inherit' }
);
if (r2.status !== 0) process.exit(r2.status || 1);

const st = fs.statSync(mp4);
console.log(`Wrote ${mp4} (${Math.round(st.size / 1024)} KB)`);
