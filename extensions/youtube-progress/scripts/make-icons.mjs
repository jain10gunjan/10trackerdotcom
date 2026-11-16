/**
 * Build extension icons + packaged logos from the official 10tracker.com wordmark.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public/icons');
const brandDir = path.join(root, 'public/brand');

const OFFICIAL = path.resolve(root, '../../public/10tracker.png');
const OFFICIAL_ALT = path.resolve(root, '../../src/assets/10tracker.png');
const FAVICON = path.resolve(root, '../../src/app/favicon-32x32.png');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(brandDir, { recursive: true });

const source = fs.existsSync(OFFICIAL) ? OFFICIAL : OFFICIAL_ALT;
if (!fs.existsSync(source)) {
  throw new Error(`Official logo not found at ${OFFICIAL}`);
}

const logoBuf = fs.readFileSync(source);
fs.writeFileSync(path.join(brandDir, 'logo.png'), logoBuf);

// Transparent wordmark for popup / HUD (trim excess padding)
await sharp(logoBuf)
  .trim({ threshold: 10 })
  .png()
  .toFile(path.join(brandDir, 'logo-trim.png'));

const trimMeta = await sharp(path.join(brandDir, 'logo-trim.png')).metadata();

async function squareWithLogo(size, { bg = '#FFFFFF', padRatio = 0.12 } = {}) {
  const pad = Math.round(size * padRatio);
  const maxW = size - pad * 2;
  const maxH = size - pad * 2;
  const logo = await sharp(path.join(brandDir, 'logo-trim.png'))
    .resize({
      width: maxW,
      height: maxH,
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((size - logo.info.width) / 2);
  const top = Math.round((size - logo.info.height) / 2);

  const r = Math.round(size * 0.18);
  const svgBg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>
    </svg>`
  );

  return sharp(svgBg)
    .composite([{ input: logo.data, left, top }])
    .png()
    .toBuffer();
}

// Full-wordmark icons for toolbar / store
await sharp(await squareWithLogo(128, { bg: '#FFFFFF', padRatio: 0.1 })).toFile(
  path.join(outDir, 'icon128.png')
);
await sharp(await squareWithLogo(48, { bg: '#FFFFFF', padRatio: 0.1 })).toFile(
  path.join(outDir, 'icon48.png')
);

// 16px: crop left "10" from official wordmark (favicon is too soft)
{
  const cropW = Math.min(trimMeta.width, Math.round(trimMeta.height * 1.05));
  const mark = await sharp(path.join(brandDir, 'logo-trim.png'))
    .extract({ left: 0, top: 0, width: cropW, height: trimMeta.height })
    .resize(12, 12, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true });
  const left = Math.round((16 - mark.info.width) / 2);
  const top = Math.round((16 - mark.info.height) / 2);
  await sharp({
    create: {
      width: 16,
      height: 16,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: mark.data, left, top }])
    .png()
    .toFile(path.join(outDir, 'icon16.png'));
}

// Brand-blue badge variants (optional HUD mark)
await sharp(await squareWithLogo(128, { bg: '#E8EDF8', padRatio: 0.12 })).toFile(
  path.join(brandDir, 'logo-badge-128.png')
);
await sharp(await squareWithLogo(48, { bg: '#E8EDF8', padRatio: 0.1 })).toFile(
  path.join(brandDir, 'logo-badge-48.png')
);

console.log('Official branding packaged:', {
  source,
  icons: fs.readdirSync(outDir),
  brand: fs.readdirSync(brandDir),
});
