/**
 * Vendor question JSON import helpers.
 * Accepts: array of objects, or { questions: [...] }.
 */

export const VENDOR_JSON_TEMPLATE = {
  questions: [
    {
      topic: 'sample-topic',
      category: 'VENDOR-TEST',
      subject: 'Mathematics',
      chapter: 'Algebra',
      difficulty: 'easy',
      year: 2024,
      question: '<p>What is 2+2?</p>',
      options_A: '3',
      options_B: '4',
      options_C: '5',
      options_D: '6',
      correct_option: 'B',
      solution: '<p>2+2=4</p>',
      directionHTML: null,
      questionImage: null,
    },
  ],
};

/**
 * Normalize raw JSON body into an array of question-like objects.
 */
export function parseVendorQuestionsJson(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { ok: false, error: 'JSON is empty', objects: [] };
    }
    try {
      data = JSON.parse(trimmed);
    } catch (err) {
      return { ok: false, error: `Invalid JSON: ${err.message}`, objects: [] };
    }
  }

  if (Array.isArray(data)) {
    return {
      ok: true,
      objects: data.map((item, i) => ({ rowIndex: i + 1, data: item })),
    };
  }

  if (data && typeof data === 'object') {
    const list = data.questions || data.items || data.rows;
    if (Array.isArray(list)) {
      return {
        ok: true,
        objects: list.map((item, i) => ({ rowIndex: i + 1, data: item })),
      };
    }
  }

  return {
    ok: false,
    error: 'JSON must be an array of questions, or { "questions": [ ... ] }',
    objects: [],
  };
}
