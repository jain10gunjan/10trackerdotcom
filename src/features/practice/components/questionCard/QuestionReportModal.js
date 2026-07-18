'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function QuestionReportModal({
  open,
  portalMounted,
  reportReason,
  reportSubmitting,
  onReasonChange,
  onClose,
  onSubmit,
}) {
  if (!open || !portalMounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="report-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-question-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
        onClick={() => !reportSubmitting && onClose()}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 id="report-question-title" className="text-base font-bold text-neutral-900">
              Report question
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={reportSubmitting}
              className="p-2 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={reportReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            placeholder="What’s wrong with this question?"
            className="w-full p-3 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400"
          />
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={reportSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={reportSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-900 text-white disabled:opacity-50"
            >
              {reportSubmitting ? 'Sending…' : 'Submit report'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
