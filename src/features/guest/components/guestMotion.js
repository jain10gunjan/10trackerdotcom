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
  const prefersReduced = useReducedMotion();
  const animate = mounted && !prefersReduced;
  return { mounted, prefersReduced, animate };
}

export function useReveal(ref, { once = true, amount = 0.25, animate = true } = {}) {
  const inView = useInView(ref, { once, amount });
  const show = animate ? inView : true;
  return show;
}

export function revealProps(show, animate, delay = 0) {
  if (!animate) {
    return { initial: false, animate: { opacity: 1, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 18 },
    animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.5, delay, ease: easeOut },
  };
}

export function staggerContainer(show, animate) {
  if (!animate) {
    return { initial: false, animate: 'show' };
  }
  return {
    initial: 'hidden',
    animate: show ? 'show' : 'hidden',
  };
}

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.06 * i, ease: easeOut },
  }),
};
