import Link from 'next/link';

const BRAND_BLUE = '#3F5EB9';

/**
 * Pure CSS wordmark — no PNG, no white-box artifacts.
 */
export default function BrandLogo({
  href = '/',
  compact = false,
  className = '',
  tone = 'dark',
}) {
  const textColor = tone === 'light' ? 'text-white' : 'text-neutral-950';

  return (
    <Link
      href={href}
      className={`group inline-flex items-end bg-transparent ${className}`}
      aria-label="10tracker.com home"
    >
      <span
        className={`font-black tracking-tight leading-none bg-transparent ${textColor} ${
          compact ? 'text-[1.4rem]' : 'text-[1.55rem]'
        }`}
      >
        10tracker
      </span>
      <span
        className={`mb-0.5 ml-0.5 inline-flex items-center justify-center rounded-[3px] px-1 font-bold uppercase leading-none text-white ${
          compact ? 'h-[14px] text-[7.5px]' : 'h-[15px] text-[8px]'
        }`}
        style={{ backgroundColor: BRAND_BLUE }}
      >
        .com
      </span>
    </Link>
  );
}
