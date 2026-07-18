// GATE CSE Subject Weightage (2026 example)
export const SUBJECT_WEIGHTAGE = [
  { subject: "Data Structures", percent: 12 },
  { subject: "Computer Organization", percent: 16 },
  { subject: "Operating Systems", percent: 15 },
  { subject: "Discrete Mathematics", percent: 15 },
  { subject: "Theory of Computation", percent: 10 },
  { subject: "Database Management System", percent: 12 },
  { subject: "Algorithms", percent: 6 },
  { subject: "Computer Networks", percent: 6 },
  { subject: "Digital Logic", percent: 4 },
  { subject: "Compiler Design", percent: 4 },
  // { subject: "General Aptitude", percent: 15 },
  // { subject: "Engineering Mathematics", percent: 5 }
];

export const QUESTION_TYPE_DISTRIBUTION = {
  MCQ: 0.6,
  MSQ: 0.2,
  NAT: 0.2
};

export function computeQuestionDistribution(totalQuestions = 65) {
  // Distribute by subject weightage
  return SUBJECT_WEIGHTAGE.map(s => ({
    subject: s.subject,
    count: Math.round((s.percent / 100) * totalQuestions)
  }));
}
