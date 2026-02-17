import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Text Wingman — Your sharp friend for every conversation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 40%, #0a0a0f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ✨
          </div>
          <span style={{ fontSize: '36px', fontWeight: 800, color: 'white' }}>
            Text Wingman
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '20px',
            maxWidth: '900px',
          }}
        >
          Your sharp friend for{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #6ee7b7, #67e8f9)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            every conversation.
          </span>
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            maxWidth: '700px',
            marginBottom: '40px',
          }}
        >
          AI reads your conversation, coaches the move, writes the reply, and checks your vibe before you send.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: '🟢 Vibe Check', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7' },
            { label: '🎭 Tone Translator', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', color: '#c4b5fd' },
            { label: '🎯 Strategy Coach', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', color: '#67e8f9' },
            { label: '📸 Screenshot AI', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', color: '#f9a8d4' },
          ].map((pill) => (
            <div
              key={pill.label}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                background: pill.bg,
                border: `1px solid ${pill.border}`,
                color: pill.color,
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              {pill.label}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Free · No card required · textwingman.com
        </div>
      </div>
    ),
    { ...size }
  );
}
