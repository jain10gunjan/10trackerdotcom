'use client';

export default function AuthCard({ children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="relative p-6 sm:p-8">{children}</div>
    </div>
  );
}
