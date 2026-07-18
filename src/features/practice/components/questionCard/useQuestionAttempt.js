'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  isAnswerCorrect,
  isInlineAnswerQuestion,
} from '@/lib/questionAnswerMode';
import {
  getLinkedQuestionSet,
  resolveLinkedCorrectOptions,
  linkedCorrectKeysComplete,
} from '@/lib/parseLinkedQuestionSet';

/**
 * Shared select → submit → feedback FSM for QuestionCard.
 */
export function useQuestionAttempt({
  question,
  isCompleted,
  isCorrect,
  questionIdProp,
  questionId,
  onAnswer,
  requireAuth,
  user,
  onRequireAuth,
  creditsLocked,
  onRequireCredits,
}) {
  const [state, setState] = useState({
    showSolution: false,
    selectedOption: null,
    selectedLinked: {},
    textAnswer: '',
    isAnswered: isCompleted,
    difficulty: 0,
    showFeedback: false,
    isCorrect: false,
    showReportForm: false,
    reportReason: '',
    editData: {
      question: question.question,
      options_A: question.options_A,
      options_B: question.options_B,
      options_C: question.options_C,
      options_D: question.options_D,
      correct_option: question.correct_option,
      solution: question.solution,
      solutiontext: question.solutiontext,
      difficulty: question.difficulty,
    },
    isSaving: false,
  });

  const linkedSet = useMemo(
    () => getLinkedQuestionSet(question),
    [question.question, question._id, question.id]
  );
  const linkedCorrectLetters = useMemo(
    () => (linkedSet ? resolveLinkedCorrectOptions(question, linkedSet) : null),
    [linkedSet, question.correct_option, question.options_A, question.options_B, question.options_C, question.options_D]
  );
  const isLinkedSet = Boolean(linkedSet);
  const inlineAnswerMode = useMemo(
    () => !isLinkedSet && isInlineAnswerQuestion(question),
    [question, isLinkedSet]
  );

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      selectedOption: null,
      selectedLinked: {},
      textAnswer: '',
      isAnswered: isCompleted,
      isCorrect: typeof isCorrect === 'boolean' ? isCorrect : false,
      showFeedback: isCompleted && typeof isCorrect === 'boolean',
      showSolution: false,
    }));
  }, [question._id, question.id, isCompleted, isCorrect]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      editData: {
        question: question.question,
        options_A: question.options_A,
        options_B: question.options_B,
        options_C: question.options_C,
        options_D: question.options_D,
        correct_option: question.correct_option,
        solution: question.solution,
        solutiontext: question.solutiontext,
        difficulty: question.difficulty,
      },
    }));
  }, [
    question._id,
    question.id,
    question.question,
    question.options_A,
    question.options_B,
    question.options_C,
    question.options_D,
    question.correct_option,
    question.solution,
    question.solutiontext,
    question.difficulty,
  ]);

  useEffect(() => {
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    setState((prev) => ({ ...prev, difficulty: difficultyMap[question.difficulty] || 0 }));
  }, [question.difficulty]);

  const interactionBlocked = creditsLocked && !isCompleted;

  const guardAuth = useCallback(() => {
    if (requireAuth && !user) {
      onRequireAuth?.();
      return true;
    }
    return false;
  }, [requireAuth, user, onRequireAuth]);

  const reportAnswer = useCallback(
    (correct) => {
      if (questionIdProp !== undefined && questionId != null) {
        onAnswer(questionId, correct);
      } else {
        onAnswer(correct);
      }
    },
    [questionIdProp, questionId, onAnswer]
  );

  const linkedAllSelected = useMemo(() => {
    if (!isLinkedSet) return false;
    return linkedSet.subQuestions.every((_, i) => Boolean(state.selectedLinked[i]));
  }, [isLinkedSet, linkedSet, state.selectedLinked]);

  const handleOptionClick = useCallback(
    (option) => {
      if (guardAuth()) return;
      if (interactionBlocked) {
        onRequireCredits?.();
        return;
      }
      if (state.isAnswered) return;
      setState((prev) => ({ ...prev, selectedOption: option }));
    },
    [state.isAnswered, interactionBlocked, onRequireCredits, guardAuth]
  );

  const handleLinkedOptionClick = useCallback(
    (subIndex, option) => {
      if (guardAuth()) return;
      if (interactionBlocked) {
        onRequireCredits?.();
        return;
      }
      if (state.isAnswered) return;
      setState((prev) => ({
        ...prev,
        selectedLinked: { ...prev.selectedLinked, [subIndex]: option },
      }));
    },
    [state.isAnswered, interactionBlocked, onRequireCredits, guardAuth]
  );

  const handleSubmit = useCallback(() => {
    if (guardAuth()) return;
    if (interactionBlocked) {
      onRequireCredits?.();
      return;
    }
    if (state.isAnswered) return;

    if (isLinkedSet && linkedSet) {
      const n = linkedSet.subQuestions.length;
      const allPicked = Array.from({ length: n }, (_, i) => state.selectedLinked[i]).every(Boolean);
      if (!allPicked) return;
      const letters = linkedCorrectLetters || [];
      const keysReady = linkedCorrectKeysComplete(letters, n);
      const correct =
        keysReady && letters.every((expected, i) => state.selectedLinked[i] === expected);
      setState((prev) => ({ ...prev, isCorrect: correct, showFeedback: true, isAnswered: true }));
      setTimeout(() => reportAnswer(correct), 800);
      return;
    }

    const userAnswer = inlineAnswerMode ? state.textAnswer : state.selectedOption;
    if (!userAnswer || (inlineAnswerMode && !String(userAnswer).trim())) return;
    const correct = isAnswerCorrect(userAnswer, question.correct_option, question);
    setState((prev) => ({ ...prev, isCorrect: correct, showFeedback: true, isAnswered: true }));
    setTimeout(() => reportAnswer(correct), 800);
  }, [
    state.selectedOption,
    state.selectedLinked,
    state.textAnswer,
    state.isAnswered,
    question,
    inlineAnswerMode,
    isLinkedSet,
    linkedSet,
    linkedCorrectLetters,
    reportAnswer,
    interactionBlocked,
    onRequireCredits,
    guardAuth,
  ]);

  return {
    state,
    setState,
    linkedSet,
    linkedCorrectLetters,
    isLinkedSet,
    inlineAnswerMode,
    linkedAllSelected,
    interactionBlocked,
    guardAuth,
    handleOptionClick,
    handleLinkedOptionClick,
    handleSubmit,
  };
}
