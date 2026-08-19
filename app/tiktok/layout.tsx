import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

const landingUrl = `${SITE_URL}/tiktok`;

export const metadata: Metadata = {
  title: 'Text Wingman | Turn Their Text Into Your Best Reply',
  description: 'Paste the text they sent or upload the thread. Get the read and a confident reply in seconds. Try Text Wingman free with no card.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: landingUrl },
  openGraph: {
    title: 'Turn Their Text Into Your Best Reply | Text Wingman',
    description: 'Paste the text they sent. Get the read and a confident reply in seconds. No card required.',
    type: 'website',
    url: landingUrl,
    siteName: 'Text Wingman',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Text Wingman reply coach' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turn Their Text Into Your Best Reply | Text Wingman',
    description: 'Paste the text they sent. Get the read and a confident reply in seconds.',
    images: ['/opengraph-image'],
  },
};

export default function TikTokLayout({ children }: { children: React.ReactNode }) {
  return children;
}
