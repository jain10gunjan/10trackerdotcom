'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const useIsoLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useGsapReady() {
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    setReady(true);
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  return { ready, reduceMotion, animate: ready && !reduceMotion };
}

/**
 * Premium hero timeline — clear staggered entrance + ambient orbs + light sweep.
 */
export function useOgHeroTimeline(playKey = 'default') {
  const rootRef = useRef(null);
  const { animate, ready } = useGsapReady();

  useIsoLayout(() => {
    const root = rootRef.current;
    if (!root || !ready || !playKey) return undefined;

    const reveal = root.querySelectorAll('[data-og-reveal]');
    if (!reveal.length) return undefined;

    const orbs = root.querySelectorAll('[data-og-orb]');
    const sweep = root.querySelector('[data-og-sweep]');
    const accent = root.querySelector('[data-og-accent]');

    root.setAttribute('data-og-pending', '1');

    if (!animate) {
      root.removeAttribute('data-og-pending');
      root.setAttribute('data-og-done', '1');
      gsap.set(reveal, { clearProps: 'all', opacity: 1, y: 0, scale: 1 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(reveal, { opacity: 0, y: 40, scale: 0.96 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onStart: () => root.removeAttribute('data-og-pending'),
        onComplete: () => {
          root.setAttribute('data-og-done', '1');
          gsap.set(reveal, { clearProps: 'transform' });
        },
      });

      tl.to(reveal, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        stagger: 0.12,
      });

      if (accent) {
        tl.fromTo(
          accent,
          { backgroundSize: '0% 100%' },
          { backgroundSize: '100% 100%', duration: 0.7, ease: 'power2.out' },
          '-=0.45'
        );
      }

      if (sweep) {
        gsap.fromTo(
          sweep,
          { xPercent: -45, opacity: 0 },
          {
            xPercent: 55,
            opacity: 0.65,
            duration: 1.7,
            ease: 'power2.out',
            delay: 0.05,
          }
        );
        gsap.to(sweep, {
          opacity: 0,
          duration: 1,
          delay: 1.4,
          ease: 'power1.in',
        });
      }

      if (orbs.length) {
        orbs.forEach((orb, i) => {
          gsap.fromTo(
            orb,
            { x: 0, y: 0, scale: 1 },
            {
              x: i % 2 === 0 ? 48 : -36,
              y: i % 2 === 0 ? -28 : 34,
              scale: i % 2 === 0 ? 1.12 : 0.92,
              duration: 4.2 + i * 0.9,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            }
          );
        });
      }

      // Soft breathing on primary CTA so motion stays visible after entrance
      const cta = root.querySelector('[data-og-cta-primary]');
      if (cta) {
        gsap.to(cta, {
          boxShadow: `0 18px 42px -10px ${'#3F5EB9'}cc`,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, root);

    return () => ctx.revert();
  }, [ready, animate, playKey]);

  return rootRef;
}

/** Animate metric values when they flip from loading → real numbers. */
export function useOgMetricPulse(loading) {
  const rootRef = useRef(null);
  const { animate, ready } = useGsapReady();
  const wasLoading = useRef(loading);

  useIsoLayout(() => {
    const root = rootRef.current;
    if (!root || !ready) return undefined;

    if (wasLoading.current && !loading && animate) {
      const vals = root.querySelectorAll('[data-og-metric-value]');
      const ctx = gsap.context(() => {
        gsap.fromTo(
          vals,
          { y: 10, opacity: 0.35 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            stagger: 0.06,
            ease: 'power2.out',
            clearProps: 'transform',
          }
        );
      }, root);
      wasLoading.current = loading;
      return () => ctx.revert();
    }

    wasLoading.current = loading;
    return undefined;
  }, [loading, ready, animate]);

  return rootRef;
}

/**
 * Stagger cards when they mount / filter changes. Always ends visible.
 */
export function useOgStagger(deps = [], itemSelector = '[data-gsap-item]') {
  const rootRef = useRef(null);
  const { animate, ready } = useGsapReady();

  useIsoLayout(() => {
    const root = rootRef.current;
    if (!root || !ready) return undefined;

    const items = root.querySelectorAll(itemSelector);
    if (!items.length) return undefined;

    if (!animate) {
      gsap.set(items, { clearProps: 'all', opacity: 1, y: 0 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform',
          overwrite: 'auto',
        }
      );
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, animate, ...deps]);

  return rootRef;
}
