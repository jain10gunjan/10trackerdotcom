'use client';

import { useMemo, useState } from 'react';

function buildQuery(params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, String(v));
  }
  return qs.toString();
}

async function svgToPngDataUrl(svgText, { width, height, scale }) {
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export default function TextToImagePage() {
  const [text, setText] = useState('New headline\nSecond line here');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(628);
  const [background, setBackground] = useState('#ffffff');
  const [color, setColor] = useState('#111827');
  const [fontSize, setFontSize] = useState(64);
  const [padding, setPadding] = useState(64);
  const [align, setAlign] = useState('center');
  const [pngUrl, setPngUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewSvgUrl = useMemo(() => {
    const qs = buildQuery({
      text,
      width,
      height,
      background,
      color,
      fontSize,
      padding,
      align,
    });
    return `/api/text-to-image?${qs}`;
  }, [text, width, height, background, color, fontSize, padding, align]);

  async function generatePng() {
    setLoading(true);
    setError('');
    setPngUrl('');

    try {
      const res = await fetch(previewSvgUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to generate SVG (HTTP ${res.status})`);
      const svgText = await res.text();

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const scale = Math.min(3, Math.max(1, dpr));

      const dataUrl = await svgToPngDataUrl(svgText, { width, height, scale });
      setPngUrl(dataUrl);
    } catch (e) {
      setError(e?.message || 'Failed to generate PNG');
    } finally {
      setLoading(false);
    }
  }

  function downloadPng() {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'text-image.png';
    a.click();
  }

  function getBase64Only() {
    if (!pngUrl) return '';
    const commaIdx = pngUrl.indexOf(',');
    if (commaIdx === -1) return '';
    return pngUrl.slice(commaIdx + 1);
  }

  async function copyBase64() {
    if (!pngUrl) return;
    const base64 = getBase64Only();
    await navigator.clipboard.writeText(base64);
  }

  function downloadBase64Txt() {
    if (!pngUrl) return;
    const base64 = getBase64Only();
    const blob = new Blob([base64], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'text-image.base64.txt';
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Text → Image</h1>
        <p className="text-sm text-gray-600">
          Generates an SVG via API, converts to PNG in-browser using canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Text</label>
            <textarea
              className="mt-1 w-full border rounded p-2 h-28"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Width</label>
              <input
                className="mt-1 w-full border rounded p-2"
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={200}
                max={2400}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Height</label>
              <input
                className="mt-1 w-full border rounded p-2"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={200}
                max={2400}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Font size</label>
              <input
                className="mt-1 w-full border rounded p-2"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={12}
                max={160}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Padding</label>
              <input
                className="mt-1 w-full border rounded p-2"
                type="number"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                min={0}
                max={200}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Text color</label>
              <input
                className="mt-1 w-full border rounded p-2"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Background</label>
              <input
                className="mt-1 w-full border rounded p-2"
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Align</label>
              <select
                className="mt-1 w-full border rounded p-2"
                value={align}
                onChange={(e) => setAlign(e.target.value)}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              onClick={generatePng}
              disabled={loading}
            >
              {loading ? 'Generating…' : 'Generate PNG'}
            </button>
            <button
              className="px-4 py-2 rounded border disabled:opacity-50"
              onClick={downloadPng}
              disabled={!pngUrl}
            >
              Download PNG
            </button>
            <button
              className="px-4 py-2 rounded border disabled:opacity-50"
              onClick={copyBase64}
              disabled={!pngUrl}
            >
              Copy Base64
            </button>
            <button
              className="px-4 py-2 rounded border disabled:opacity-50"
              onClick={downloadBase64Txt}
              disabled={!pngUrl}
            >
              Download Base64 (.txt)
            </button>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">SVG preview (from API)</div>
            <div className="border rounded overflow-hidden bg-white">
              <img src={previewSvgUrl} alt="SVG preview" className="w-full h-auto" />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">PNG output (canvas)</div>
            <div className="border rounded overflow-hidden bg-white min-h-[120px] flex items-center justify-center">
              {pngUrl ? (
                <img src={pngUrl} alt="PNG output" className="w-full h-auto" />
              ) : (
                <div className="text-sm text-gray-500 px-4 py-10">
                  Click “Generate PNG” to render a clean PNG.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Base64 (PNG)</div>
            <textarea
              className="w-full border rounded p-2 h-28 font-mono text-xs"
              readOnly
              value={pngUrl ? getBase64Only() : ''}
              placeholder="Generate PNG to see base64 here"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

