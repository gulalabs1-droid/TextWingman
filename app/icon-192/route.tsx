import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/lib/brand-icon';

export const dynamic = 'force-static';

// Home-screen icon referenced by app/manifest.ts. Full-bleed with a small
// glyph because the same image is used as the maskable icon.
export function GET() {
  return new ImageResponse(<BrandIcon size={192} glyph={0.5} />, {
    width: 192,
    height: 192,
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
