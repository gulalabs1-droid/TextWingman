'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

export default function GuideCta({ guide, className, children }: {
  guide: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href="/tiktok" className={className} onClick={() => track('guide_cta_click', { guide_slug: guide })}>
      {children}
    </Link>
  );
}
