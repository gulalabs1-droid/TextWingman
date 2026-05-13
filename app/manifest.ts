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
      { src: '/icon',        sizes: '32x32',   type: 'image/png' },
      { src: '/apple-icon',  sizes: '180x180', type: 'image/png' },
      { src: '/icon-192',    sizes: '192x192', type: 'image/png' },
      { src: '/icon-192',    sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512',    sizes: '512x512', type: 'image/png' },
      { src: '/icon-512',    sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Open Coach',
        short_name: 'Coach',
        description: 'Jump straight to the AI coach',
        url: '/app',
      },
    ],
  };
}
