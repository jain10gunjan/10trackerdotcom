'use client';

import { useProfileGate } from '@/context/ProfileGateContext';

/** @deprecated Prefer useProfileGate() — kept for mock-test pages */
export function useMockTestProfile(_user) {
  return useProfileGate();
}
