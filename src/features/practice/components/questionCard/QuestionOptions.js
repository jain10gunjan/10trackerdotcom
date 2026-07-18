'use client';

/**
 * MCQ / NAT options surface for QuestionCard composition.
 * Linked sets and inline NAT keep using their dedicated components;
 * this module documents the options slot for the split architecture.
 */
export { default as InlineAnswerInput } from '@/features/practice/components/InlineAnswerInput';
export { default as LinkedQuestionSetView } from '@/features/practice/components/LinkedQuestionSetView';
