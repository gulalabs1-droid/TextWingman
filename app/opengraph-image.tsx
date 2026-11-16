import { ImageResponse } from 'next/og';
import { BRAND, BrandIcon } from '@/lib/brand-icon';

export const alt = 'Text Wingman. Say less. Text better. Three replies, your call.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: BRAND.ink,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <BrandIcon size={64} radius={18} />
          <div style={{ display: 'flex', fontSize: '38px', letterSpacing: '-0.04em' }}>
            <span style={{ color: BRAND.cream }}>text</span>
            <span style={{ fontWeight: 900, color: BRAND.lime }}>wingman</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: '132px', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.07em', color: BRAND.cream }}>
            SAY LESS.
          </div>
          <div style={{ display: 'flex', fontSize: '132px', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.07em', color: BRAND.lime }}>
            TEXT BETTER.
          </div>
          <div style={{ display: 'flex', marginTop: '28px', fontSize: '30px', lineHeight: 1.35, color: BRAND.sage, maxWidth: '860px' }}>
            Paste their text or drop a screenshot. Get three replies that sound like you.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Free to try', 'No signup', 'You press send'].map(label => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  border: `1px solid ${BRAND.line}`,
                  background: BRAND.panel,
                  color: BRAND.cream,
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: '22px', fontWeight: 700, color: BRAND.sage }}>textwingman.app</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
