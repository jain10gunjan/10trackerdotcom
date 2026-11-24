/** Shared visual tokens with guest homepage (10Tracker brand). */
import { GUEST_BRAND } from '@/features/guest/components/guestMotion';

export { GUEST_BRAND as STUDENT_BRAND, easeOut } from '@/features/guest/components/guestMotion';

export {
  useGuestMotion as useStudentMotion,
  useReveal,
  revealProps,
  staggerContainer,
  staggerItem,
} from '@/features/guest/components/guestMotion';

/** Signed-in home. Same blue as the guest page — no second palette. */
export const HOME = {
  page: '#F8FAFC',
  ink: GUEST_BRAND.ink,
  blue: GUEST_BRAND.blue,
  blueBright: GUEST_BRAND.blueBright,
  soft: GUEST_BRAND.soft,
  line: 'rgba(10, 10, 10, 0.08)',
  muted: '#5E6570',
};

export const homeCard =
  'min-w-0 rounded-2xl border border-neutral-200/90 bg-white shadow-sm';

export const homeFeaturedCard =
  'min-w-0 relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(63,94,185,0.28)]';

export const homeEyebrow =
  'text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3F5EB9]';

export const homePrimaryBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3F5EB9] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3554A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F5EB9]';

export const homeQuietBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#E8EDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F5EB9]';

export const homeTextLink =
  'inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#E8EDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3F5EB9]';
