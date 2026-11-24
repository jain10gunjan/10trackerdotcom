'use client';

import { useEffect, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export const GUEST_BRAND = {
  blue: '#3F5EB9',
  blueBright: '#4B6BC7',
  soft: '#E8EDF8',
  ink: '#0a0a0a',
};

export const easeOut = [0.22, 1, 0.36, 1];

const REVEAL_Y = 12;
const REVEAL_DURATION = 0.45;
const ITEM_DURATION = 0.42;
/** 50ms per item — under the 60ms stagger cap. */
const STAGGER_STEP = 0.05;

/**
 * Set only after a mounted guest/student tree confirms the OS setting.
 * Unmounted callers must not clear it — a late section's first render
 * would otherwise turn translates back on for reduced-motion users.
 */
let reducedMotionActive = false;

function systemReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function itemIndex(i) {
  return typeof i === 'number' && Number.isFinite(i) ? i : 0;
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** Hydration-safe motion gate: animate only after mount and when motion is allowed. */
export function useGuestMotion() {
  const mounted = useMounted();
  const preference = useReducedMotion();
  // useReducedMotion stays null through hydration (server state). After mount,
  // read the media query so a hydrated null does not keep motion on.
  const prefersReduced =
    preference === true || (mounted && preference == null && systemReducedMotion());
  const animate = Boolean(mounted && !prefersReduced);
  if (mounted) reducedMotionActive = prefersReduced;
  return { mounted, prefersReduced, animate };
}

export function useReveal(ref, { once = true, amount = 0.25, animate = true } = {}) {
  const inView = useInView(ref, { once, amount });
  const show = animate ? inView : true;
  return show;
}

export function revealProps(show, animate, delay = 0) {
  if (!animate) {
    return {
      initial: false,
      animate: { opacity: 1 },
      transition: { duration: 0 },
    };
  }
  const hidden = { opacity: 0, y: REVEAL_Y };
  return {
    initial: hidden,
    animate: show ? { opacity: 1, y: 0 } : hidden,
    transition: { duration: REVEAL_DURATION, delay, ease: easeOut },
  };
}

export function staggerContainer(show, animate) {
  const step = show && animate ? STAGGER_STEP : 0;
  if (!animate) {
    return {
      hidden: { opacity: 1 },
      show: {
        opacity: 1,
        transition: { duration: 0, staggerChildren: 0, delayChildren: 0 },
      },
    };
  }
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: step, delayChildren: 0 },
    },
  };
}

export const staggerItem = {
  hidden: () => (reducedMotionActive ? { opacity: 1 } : { opacity: 0, y: REVEAL_Y }),
  show: (i) => {
    if (reducedMotionActive) {
      return { opacity: 1, transition: { duration: 0 } };
    }
    return {
      opacity: 1,
      y: 0,
      transition: {
        duration: ITEM_DURATION,
        delay: STAGGER_STEP * itemIndex(i),
        ease: easeOut,
      },
    };
  },
};
