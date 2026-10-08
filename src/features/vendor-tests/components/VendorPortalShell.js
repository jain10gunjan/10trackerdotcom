/**
 * Clears the fixed site navbar and applies the same soft wash used on mock-test pages,
 * with teal (institute) instead of emerald.
 */
export default function VendorPortalShell({ children, className = '' }) {
  return (
    <div
      className={`min-h-[70vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/70 via-neutral-50 to-neutral-100 pt-24 pb-12 sm:pb-16 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
