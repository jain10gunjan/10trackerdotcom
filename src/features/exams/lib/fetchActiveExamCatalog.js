/**
 * Public active exam catalog.
 * Implementation lives in fetchExamCatalog.js — this file keeps existing import paths stable.
 */
export {
  mapExamCatalogRow,
  fetchExamCatalog,
  fetchQuestionCountsBySlug,
  fetchActiveExamCatalog,
} from '@/features/exams/lib/fetchExamCatalog';
