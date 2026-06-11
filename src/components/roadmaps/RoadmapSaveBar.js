'use client';

import { CloudUpload, Loader2, RotateCcw } from 'lucide-react';

export default function RoadmapSaveBar({
  dirtyCount,
  saving,
  onSave,
  onDiscard,
  embedded = false,
}) {
  const inner = (
    <div
      className={`flex items-center gap-2 ${
        embedded
          ? 'px-4 py-3 border-t border-neutral-100 bg-white'
          : 'rounded-2xl border border-neutral-200/80 bg-white/95 backdrop-blur-xl shadow-lg shadow-neutral-900/10 px-3 py-2.5 sm:px-4'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900">
          {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
        </p>
        {!embedded ? (
          <p className="text-[11px] text-neutral-500 truncate hidden sm:block">
            Stored on this device · tap Save to sync
          </p>
        ) : (
          <p className="text-[11px] text-neutral-500">Stored locally on this device</p>
        )}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={onDiscard}
        className="shrink-0 p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
        aria-label="Discard changes"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 min-w-[88px] justify-center"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CloudUpload className="w-4 h-4 sm:hidden" />
            <span>Save</span>
          </>
        )}
      </button>
    </div>
  );

  if (embedded) {
    return (
      <div className="shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] max-sm:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {inner}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 z-[55] pointer-events-none max-md:bottom-[4.75rem] md:bottom-0 pb-[env(safe-area-inset-bottom)] max-md:px-3 md:px-4 md:pb-4">
      <div className="pointer-events-auto mx-auto max-w-2xl">{inner}</div>
    </div>
  );
}
