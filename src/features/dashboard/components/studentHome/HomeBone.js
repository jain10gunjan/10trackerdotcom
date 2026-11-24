'use client';

/** Loading block in the signed-in home palette (soft brand wash, not a gray pulse). */
export default function HomeBone({ className = '' }) {
  return (
    <div
      className={`rounded-xl bg-[#E8EDF8] ${className}`}
      aria-hidden
    />
  );
}
