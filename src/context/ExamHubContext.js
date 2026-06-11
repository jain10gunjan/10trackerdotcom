'use client';

import { createContext, useContext } from 'react';

const ExamHubContext = createContext(null);

export function ExamHubProvider({ exam, categorySlug, children }) {
  return (
    <ExamHubContext.Provider value={{ exam, categorySlug }}>
      {children}
    </ExamHubContext.Provider>
  );
}

export function useExamHub() {
  const ctx = useContext(ExamHubContext);
  return ctx;
}
