import { examBySlug } from '@/lib/platformExams';
import { normalizeCategorySlug } from '@/features/exam-hub/lib/categoryKey';
import { getCategoryVariants } from '@/features/mock-test/lib/mockTestUtils';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidExamSlug(slug) {
  return SLUG_RE.test(String(slug || '').trim().toLowerCase());
}

export function parseTargetExams(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((s) => String(s).trim().toLowerCase()).filter(isValidExamSlug))];
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t || t === '[]' || t === '{}') return [];
    if (t.startsWith('{') && t.endsWith('}')) {
      const inner = t.slice(1, -1);
      if (!inner.trim()) return [];
      return [
        ...new Set(
          inner
            .split(',')
            .map((s) => s.replace(/^"|"$/g, '').trim().toLowerCase())
            .filter(isValidExamSlug)
        ),
      ];
    }
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((s) => String(s).trim().toLowerCase()).filter(isValidExamSlug))];
      }
    } catch {
      return isValidExamSlug(t) ? [t.toLowerCase()] : [];
    }
  }
  return [];
}

export function normalizeTargetExamsPayload(body = {}) {
  const fromArray = parseTargetExams(body.target_exams ?? body.targetExams);
  const primary = String(body.target_exam ?? body.targetExam ?? '').trim().toLowerCase();
  let slugs = fromArray.length ? fromArray : primary && isValidExamSlug(primary) ? [primary] : [];

  if (primary && isValidExamSlug(primary) && !slugs.includes(primary)) {
    slugs = [primary, ...slugs];
  }

  if (!slugs.length) {
    return { error: 'Select at least one exam you are preparing for' };
  }

  const activePrimary = primary && slugs.includes(primary) ? primary : slugs[0];

  return {
    target_exams: slugs,
    target_exam: activePrimary,
  };
}

/** Legacy free-text target_exam that is not a known slug */
export function profileNeedsExamRefresh(profile, activeSlugs = []) {
  if (!profile) return false;
  const slugs = parseTargetExams(profile.target_exams);
  const primary = String(profile.target_exam || '').trim().toLowerCase();

  if (slugs.length === 0) {
    if (!primary) return true;
    if (!isValidExamSlug(primary)) return true;
    if (activeSlugs.length && !activeSlugs.includes(primary)) return true;
    return true;
  }

  if (!primary || !slugs.includes(primary)) return true;
  if (activeSlugs.length && slugs.some((s) => !activeSlugs.includes(s))) return false;
  return false;
}

export function practiceAreaMatchesSlug(area, slug) {
  if (!area || !slug) return false;
  const normalizedArea = normalizeCategorySlug(area);
  const normalizedSlug = normalizeCategorySlug(slug);
  if (normalizedArea === normalizedSlug) return true;
  const variants = getCategoryVariants(slug).map((v) =>
    normalizeCategorySlug(v)
  );
  return variants.includes(normalizedArea);
}

export function sortPracticeByPrimary(practiceAreas, primarySlug) {
  const primary = normalizeCategorySlug(primarySlug);
  const list = [...(practiceAreas || [])];
  list.sort((a, b) => {
    const aPri = practiceAreaMatchesSlug(a.area, primary);
    const bPri = practiceAreaMatchesSlug(b.area, primary);
    if (aPri && !bPri) return -1;
    if (!aPri && bPri) return 1;
    return (b.totalCompleted || 0) - (a.totalCompleted || 0);
  });
  return list;
}

export function enrichExamsFromCatalog(slugs, catalog) {
  return slugs.map((slug) => {
    const meta = examBySlug(slug, catalog);
    return {
      slug,
      name: meta?.name || slug,
      isPrimary: false,
    };
  });
}
