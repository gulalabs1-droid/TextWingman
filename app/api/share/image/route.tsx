import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theirMessage = searchParams.get('their') || 'Hey, what are you up to?';
  const myReply = searchParams.get('reply') || 'Just thinking about you';
  const tone = searchParams.get('tone') || 'spicier';

  try {

    const toneConfig: Record<string, { color: string; emoji: string; label: string }> = {
      shorter: { color: '#3B82F6', emoji: '⚡', label: 'Shorter' },
      spicier: { color: '#EC4899', emoji: '🔥', label: 'Spicier' },
      softer: { color: '#10B981', emoji: '💚', label: 'Softer' },
    };

    const config = toneConfig[tone] || toneConfig.spicier;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #581C87 0%, #7C3AED 50%, #A855F7 100%)',
            padding: '40px',
          }}
        >
          {/* Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              borderRadius: '32px',
              padding: '40px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Their message */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: '#6B7280', fontSize: '14px' }}>
                💬 They said:
              </div>
              <div
                style={{
                  background: '#F3F4F6',
                  borderRadius: '16px',
                  padding: '20px',
                  fontSize: '18px',
                  color: '#374151',
                  borderLeft: '4px solid #D1D5DB',
                }}
              >
                "{theirMessage.substring(0, 100)}"
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
              <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, #E5E7EB, transparent)' }} />
              <span style={{ margin: '0 16px', fontSize: '20px' }}>✨</span>
              <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, #E5E7EB, transparent)' }} />
            </div>

            {/* My reply */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', color: '#6B7280', fontSize: '14px' }}>
                <span style={{ marginRight: '8px' }}>{config.emoji}</span>
                My reply ({config.label}):
              </div>
              <div
                style={{
                  background: config.color,
                  borderRadius: '16px',
                  padding: '24px',
                  fontSize: '20px',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                "{myReply.substring(0, 150)}"
              </div>
            </div>

            {/* Watermark */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #E5E7EB',
              }}
            >
              <span style={{ fontSize: '16px', color: '#9333EA', fontWeight: 700 }}>
                ✨ Text Wingman
              </span>
              <span style={{ fontSize: '14px', color: '#9CA3AF', marginLeft: '8px' }}>
                • AI-powered replies
              </span>
            </div>
          </div>

          {/* Bottom CTA */}
          <div
            style={{
              display: 'flex',
              marginTop: '24px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Get perfect replies → textwingman.com
          </div>
        </div>
      ),
      {
        width: 800,
        height: 600,
      }
    );
  } catch (e: unknown) {
    console.error('Share image error:', e);
    // Return a simple fallback image with error info
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#7C3AED',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div>Text Wingman</div>
            <div style={{ fontSize: '18px', marginTop: '10px', opacity: 0.8 }}>
              {myReply.substring(0, 50)}
            </div>
          </div>
        </div>
      ),
      { width: 800, height: 600 }
    );
  }
}
