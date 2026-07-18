export const SARKARI_CATEGORIES = [
  { value: '', label: 'All Types' },
  { value: 'results', label: 'Results' },
  { value: 'admit_cards', label: 'Admit Cards' },
  { value: 'latest_jobs', label: 'Latest Jobs' },
  { value: 'answer_key', label: 'Answer Key' },
  { value: 'documents', label: 'Documents' },
  { value: 'admission', label: 'Admission' },
];

export const EMPTY_ARTICLE_FORM = {
  title: '',
  content: '',
  excerpt: '',
  category: '',
  tags: '',
  featured_image_url: '',
  is_featured: false,
  social_media_embeds: [],
  status: 'draft',
};

export const ARTICLES_PAGE_SIZE = 50;

export function formatArticleDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
