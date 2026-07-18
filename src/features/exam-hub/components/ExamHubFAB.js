'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUp, Zap } from 'lucide-react';

export default function ExamHubFAB({ quickStartHref }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!scrolled || !quickStartHref || quickStartHref === '#') return null;

  return (
    <motion.div
      className="fixed bottom-20 right-5 sm:bottom-7 sm:right-7 z-40 flex flex-col gap-2 items-end"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className="w-10 h-10 bg-white border border-neutral-300 text-neutral-700 rounded-full flex items-center justify-center shadow-md hover:bg-neutral-50"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      <Link
        href={quickStartHref}
        aria-label="Quick start practice"
        className="bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg"
      >
        <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
      </Link>
    </motion.div>
  );
}
