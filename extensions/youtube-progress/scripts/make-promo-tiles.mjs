import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'store-listing');
const logoPath = path.join(root, 'public', 'brand', 'logo-trim.png');

async function smallTile() {
  const W = 440;
  const H = 280;
  const logo = await sharp(logoPath)
    .resize({ width: 300, height: 72, fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(logo).metadata();
  const lx = Math.round((W - meta.width) / 2);
  const ly = 78;
  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e8edf8"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="220" y="190" text-anchor="middle" font-family="Segoe UI, Arial" font-size="22" font-weight="700" fill="#0a0a0a">YouTube Progress</text>
    <text x="220" y="230" text-anchor="middle" font-family="Segoe UI, Arial" font-size="13" fill="#64748b">Sync OG Tracker path videos</text>
  </svg>`);
  const base = await sharp(svg).png().toBuffer();
  await sharp(base)
    .composite([{ input: logo, left: lx, top: ly }])
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(out, 'small-promo-tile-440x280.jpg'));
  await sharp(base)
    .composite([{ input: logo, left: lx, top: ly }])
    .flatten({ background: '#f8fafc' })
    .removeAlpha()
    .png()
    .toFile(path.join(out, 'small-promo-tile-440x280.png'));
}

async function marqueeTile() {
  const W = 1400;
  const H = 560;
  const logo = await sharp(logoPath)
    .resize({ width: 420, height: 100, fit: 'inside' })
    .png()
    .toBuffer();
  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="55%" stop-color="#eef2ff"/>
        <stop offset="100%" stop-color="#e8edf8"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="80" y="260" font-family="Segoe UI, Arial" font-size="48" font-weight="800" fill="#0a0a0a">Track YouTube progress</text>
    <text x="80" y="320" font-family="Segoe UI, Arial" font-size="48" font-weight="800" fill="#0a0a0a">on your OG paths</text>
    <text x="80" y="380" font-family="Segoe UI, Arial" font-size="24" fill="#64748b">Catalog videos only — never random YouTube</text>

    <rect x="820" y="140" width="480" height="280" rx="24" fill="#ffffff" stroke="#dbe3f5"/>
    <text x="852" y="190" font-family="Segoe UI, Arial" font-size="14" font-weight="700" fill="#3f5eb9">CURRENT VIDEO</text>
    <text x="852" y="236" font-family="Segoe UI, Arial" font-size="26" font-weight="700" fill="#0a0a0a">Number Systems · Lesson 3</text>
    <text x="852" y="280" font-family="Segoe UI, Arial" font-size="20" fill="#64748b">72% watched · syncing</text>
    <rect x="852" y="310" width="416" height="14" rx="7" fill="#e8edf8"/>
    <rect x="852" y="310" width="300" height="14" rx="7" fill="#3f5eb9"/>
    <rect x="852" y="350" width="200" height="40" rx="12" fill="#3f5eb9"/>
    <text x="892" y="376" font-family="Segoe UI, Arial" font-size="16" font-weight="700" fill="#ffffff">Sync now</text>
  </svg>`);
  const base = await sharp(svg).png().toBuffer();
  await sharp(base)
    .composite([{ input: logo, left: 80, top: 90 }])
    .flatten({ background: '#f8fafc' })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(path.join(out, 'marquee-promo-tile-1400x560.jpg'));
  await sharp(base)
    .composite([{ input: logo, left: 80, top: 90 }])
    .flatten({ background: '#f8fafc' })
    .removeAlpha()
    .png()
    .toFile(path.join(out, 'marquee-promo-tile-1400x560.png'));
}

await smallTile();
await marqueeTile();
console.log('Promo tiles rebuilt with official logo');
