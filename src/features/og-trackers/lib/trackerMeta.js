/** Allowed Lucide icon names for OG Tracker cards (admin picks from this list). */
export const OG_TRACKER_ICONS = [
  'Map',
  'Code2',
  'Coffee',
  'Globe',
  'Database',
  'Smartphone',
  'Server',
  'Brain',
  'BookOpen',
  'Terminal',
  'Layers',
  'Cpu',
  'FileCode',
  'Braces',
  'Sparkles',
];

export function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return [
      ...new Set(
        tags
          .map((t) => String(t || '').trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 20)
      ),
    ];
  }
  if (typeof tags === 'string') {
    return normalizeTags(tags.split(/[,|]/));
  }
  return [];
}

export function normalizeCategory(category) {
  const c = String(category || 'General').trim();
  return c || 'General';
}

export function normalizeIcon(icon) {
  const name = String(icon || 'Map').trim();
  return OG_TRACKER_ICONS.includes(name) ? name : 'Map';
}
