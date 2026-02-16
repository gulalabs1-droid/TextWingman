import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Text Wingman',
    short_name: 'Text Wingman',
    description: 'Your AI texting companion — reads the conversation, coaches the move, writes the reply.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    orientation: 'portrait',
    categories: ['lifestyle', 'utilities', 'social'],
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
