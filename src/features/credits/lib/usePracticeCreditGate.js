'use client';

import { useCallback, useMemo } from 'react';
import { useCredits } from '@/context/CreditsContext';
import {
  isPracticeQuestionAlreadyDone,
  normalizeQuestionId,
} from '@/features/credits/lib/practiceCreditUtils';
import {
  practiceIdempotencyKey,
  reserveCreditsLocally,
  isCreditAlreadyReserved,
} from '@/features/credits/lib/creditLocalStore';
import { scheduleCreditSync } from '@/features/credits/lib/creditSyncManager';
import { CREDIT_COST } from '@/features/credits/lib/constants';

/**
 * Local-first credit gate: no API per question; batched sync in background.
 */
export function usePracticeCreditGate() {
  const { unlimited, credits, costs, setCreditsBalance, setShowPaywall, loading } = useCredits();
  const practiceCost = costs?.practice_question ?? CREDIT_COST.practice_question;

  const canAttemptPractice = useMemo(() => {
    if (loading) return true;
    if (unlimited) return true;
    return credits >= practiceCost;
  }, [loading, unlimited, credits, practiceCost]);

  const chargeForQuestion = useCallback(
    ({ user, questionId, completedIds, area, topic }) => {
      if (!user) {
        return { ok: false, reason: 'not_authenticated' };
      }

      const qid = normalizeQuestionId(questionId);
      if (!qid) {
        return { ok: false, reason: 'invalid_question' };
      }

      const idempotencyKey = practiceIdempotencyKey(user.id, qid);

      if (
        isPracticeQuestionAlreadyDone({
          questionId: qid,
          completedIds,
          userId: user.id,
          area,
          topic,
        })
      ) {
        return { ok: true, skipped: true, alreadyDone: true };
      }

      if (unlimited) {
        return { ok: true, unlimited: true };
      }

      if (!canAttemptPractice) {
        setShowPaywall(true);
        return { ok: false, reason: 'insufficient_credits' };
      }

      if (isCreditAlreadyReserved(user.id, idempotencyKey)) {
        return { ok: true, skipped: true, duplicate: true };
      }

      const local = reserveCreditsLocally(user.id, {
        type: 'practice_question',
        referenceId: qid,
        idempotencyKey,
      });

      if (!local.ok) {
        if (local.reason === 'insufficient_credits') {
          setShowPaywall(true);
        }
        return { ok: false, reason: local.reason };
      }

      if (local.duplicate) {
        return { ok: true, skipped: true, duplicate: true };
      }

      setCreditsBalance(local.balance);
      scheduleCreditSync(user.id);

      return { ok: true, balance: local.balance };
    },
    [unlimited, canAttemptPractice, setCreditsBalance, setShowPaywall]
  );

  return { chargeForQuestion, unlimited, canAttemptPractice };
}
