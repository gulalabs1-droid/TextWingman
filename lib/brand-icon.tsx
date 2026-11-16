// The Text Wingman mark for generated images (favicon, home-screen icons,
// link previews): a lime tile with a dark paper plane, matching the homepage
// header. Written with inline styles only so it renders inside ImageResponse.
export const BRAND = {
  ink: '#0b0f0c',
  panel: '#141c16',
  line: '#344036',
  cream: '#f5f7ec',
  sage: '#abb7aa',
  lime: '#d3ff68',
  limeInk: '#10180e',
} as const;

/** `radius` is 0 for icons the platform masks itself (iOS, maskable PWA icons). */
export function BrandIcon({ size, radius = 0, glyph = 0.56 }: { size: number; radius?: number; glyph?: number }) {
  const plane = Math.round(size * glyph);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND.lime,
        borderRadius: radius,
      }}
    >
      <svg width={plane} height={plane} viewBox="0 0 24 24" fill="none" stroke={BRAND.limeInk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    </div>
  );
}
