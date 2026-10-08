/**
 * Vendor question CSV: UTF-8, header row required.
 * Max 500 data rows per upload (enforced by API).
 */

export const VENDOR_CSV_HEADERS = [
  'topic',
  'category',
  'subject',
  'chapter',
  'difficulty',
  'year',
  'question',
  'options_A',
  'options_B',
  'options_C',
  'options_D',
  'correct_option',
  'solution',
  'directionHTML',
  'questionImage',
];

export const VENDOR_CSV_TEMPLATE = `${VENDOR_CSV_HEADERS.join(',')}
sample-topic,VENDOR-TEST,Mathematics,Algebra,easy,2024,"What is 2+2?",3,4,5,6,B,"2+2=4",,
`;

/** Minimal CSV parser supporting quoted fields with commas. */
export function parseCsvText(text) {
  const input = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => String(c || '').trim() !== ''));
}

export function csvRowsToObjects(rows) {
  if (!rows.length) {
    return { ok: false, error: 'CSV is empty', objects: [], headers: [] };
  }
  const headers = rows[0].map((h) => String(h || '').trim());
  const headerLower = headers.map((h) => h.toLowerCase());
  const required = ['topic', 'category', 'question'];
  for (const req of required) {
    if (!headerLower.includes(req)) {
      return {
        ok: false,
        error: `Missing required column: ${req}`,
        objects: [],
        headers,
      };
    }
  }

  const objects = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const obj = {};
    headers.forEach((h, idx) => {
      const key = h.trim();
      if (!key) return;
      obj[key] = cols[idx] != null ? String(cols[idx]).trim() : '';
    });
    // normalize common aliases
    if (obj.correctOption && !obj.correct_option) obj.correct_option = obj.correctOption;
    objects.push({ rowIndex: i + 1, data: obj });
  }

  return { ok: true, objects, headers };
}
