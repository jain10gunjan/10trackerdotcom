import { isMotdCreationMode, isMotdTest } from '@/features/mock-test/lib/mockOfTheDay';

/**
 * Shared classifier for topic-wise mocks across dashboard + mock hub.
 * Matches topic_auto / topic_wise / *topic* creation modes and common name/desc heuristics.
 */
export function isTopicWiseCreationMode(mode, description = '', name = '') {
  if (isMotdCreationMode(mode, description, name)) return false;

  const normalizedMode = String(mode || '').trim().toLowerCase();
  if (
    normalizedMode === 'topic_auto' ||
    normalizedMode === 'topic_wise' ||
    normalizedMode === 'gate_chapter' ||
    normalizedMode.endsWith('_chapter') ||
    normalizedMode.includes('topic')
  ) {
    return true;
  }

  const desc = String(description || '').trim().toLowerCase();
  if (desc.startsWith('topic-wise test') || desc.includes('topic-wise test')) {
    return true;
  }

  const normalizedName = String(name || '').trim().toLowerCase();
  if (normalizedName.includes('topic test') || normalizedName.includes('topic-wise')) {
    return true;
  }

  return false;
}

export function isTopicWiseTest(test) {
  if (!test || isMotdTest(test)) return false;
  return isTopicWiseCreationMode(test.creation_mode, test.description, test.name);
}
