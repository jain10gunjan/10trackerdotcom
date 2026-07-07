/** True when examtracker category is a GATE exam (GATE-CSE, GATE-EC, etc.). */
export function isGateCategory(category) {
  if (category == null || category === '') return false;
  return String(category).toUpperCase().includes('GATE');
}
