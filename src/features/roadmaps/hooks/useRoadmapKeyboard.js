'use client';

import { useEffect, useRef } from 'react';

/**
 * Keyboard shortcuts for roadmap viewer.
 * / — focus search (when not in input)
 * j — next day in nav list
 * k — previous day in nav list
 * Escape — close modal
 */
export function useRoadmapKeyboard({
  enabled = true,
  searchInputRef,
  onFocusSearch,
  onPrevDay,
  onNextDay,
  onCloseModal,
  modalOpen = false,
}) {
  const handlersRef = useRef({ onFocusSearch, onPrevDay, onNextDay, onCloseModal });
  handlersRef.current = { onFocusSearch, onPrevDay, onNextDay, onCloseModal };

  useEffect(() => {
    if (!enabled) return;

    const isEditable = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement;
      const inField = isEditable(active);

      if (e.key === 'Escape' && modalOpen) {
        e.preventDefault();
        handlersRef.current.onCloseModal?.();
        return;
      }

      if (inField && e.key !== '/') return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          handlersRef.current.onFocusSearch?.();
          searchInputRef?.current?.focus();
          break;
        case 'j':
        case 'J':
          if (!modalOpen) {
            e.preventDefault();
            handlersRef.current.onNextDay?.();
          }
          break;
        case 'k':
        case 'K':
          if (!modalOpen) {
            e.preventDefault();
            handlersRef.current.onPrevDay?.();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, modalOpen, searchInputRef]);
}
