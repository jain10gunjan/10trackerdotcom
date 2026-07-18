'use client';

import Image from 'next/image';
import logo from '@/assets/10tracker.png';

export default function AuthBrandMark() {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <Image
        src={logo}
        alt="10Tracker"
        priority
        width={853}
        height={205}
        className="h-14 sm:h-16 w-[224px] sm:w-[256px] object-contain"
      />
    </div>
  );
}
