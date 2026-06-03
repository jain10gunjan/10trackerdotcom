'use client';

import { useCallback, useMemo } from 'react';
import { useCredits } from '@/context/CreditsContext';
import {
  isPracticeQuestionAlreadyDone,
  normalizeQuestionId,
} from '@/lib/credits/practiceCreditUtils';
import {
  practiceIdempotencyKey,
  reserveCreditsLocally,
  isCreditAlreadyReserved,
} from '@/lib/credits/creditLocalStore';
import { scheduleCreditSync } from '@/lib/credits/creditSyncManager';
import { CREDIT_COST } from '@/lib/credits/constants';

/**
 * Local-first credit gate: no API per question; batched sync in background.
 */
export function usePracticeCreditGate() {
  const { unlimited, credits, setCreditsBalance, setShowPaywall, loading } = useCredits();

  const canAttemptPractice = useMemo(() => {
    if (loading) return true;
    if (unlimited) return true;
    return credits >= CREDIT_COST.practice_question;
  }, [loading, unlimited, credits]);

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
