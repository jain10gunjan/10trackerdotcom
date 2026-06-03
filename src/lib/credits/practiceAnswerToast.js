import toast from 'react-hot-toast';

/** Instant feedback when a practice question is submitted (admin practice style). */
export function showPracticeAnswerToast(isCorrect) {
  toast.success(isCorrect ? '🎉 Correct!' : '❌ Try again', { duration: 2000 });
}
