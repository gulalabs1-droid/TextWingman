import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #9333EA, #EC4899)',
          borderRadius: '8px',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M15 25 C15 15, 25 10, 40 10 L65 10 C75 10, 85 15, 85 25 L85 55 C85 65, 75 70, 65 70 L45 70 L30 85 L30 70 L25 70 C15 70, 15 65, 15 55 Z"
            fill="white"
          />
          <circle cx="38" cy="38" r="5" fill="#9333EA" />
          <circle cx="52" cy="38" r="5" fill="#A855F7" />
          <circle cx="66" cy="38" r="5" fill="#EC4899" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
