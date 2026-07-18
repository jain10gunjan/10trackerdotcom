const PRESET_STYLES = {
  Java: { accent: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-800', ring: 'ring-emerald-200' },
  DSA: { accent: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-800', ring: 'ring-violet-200' },
  Aptitude: { accent: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
  'Computer Networks': { accent: 'bg-sky-500', light: 'bg-sky-50', text: 'text-sky-800', ring: 'ring-sky-200' },
  'Operating System': { accent: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-800', ring: 'ring-orange-200' },
  DBMS: { accent: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-800', ring: 'ring-rose-200' },
};

const FALLBACKS = [
  { accent: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-800', ring: 'ring-emerald-200' },
  { accent: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-800', ring: 'ring-violet-200' },
  { accent: 'bg-sky-500', light: 'bg-sky-50', text: 'text-sky-800', ring: 'ring-sky-200' },
  { accent: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
];

export function focusAreaStyle(name) {
  if (PRESET_STYLES[name]) return PRESET_STYLES[name];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % FALLBACKS.length;
  }
  return FALLBACKS[hash] || FALLBACKS[0];
}

export function resourceHostname(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
