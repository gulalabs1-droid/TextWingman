import type { Metadata } from 'next';
import { decodeShareSlug } from '@/lib/share';

// Shared links unfurl as the reply card itself in iMessage, X, Instagram and
// Slack. They are kept out of search results: they hold someone's message.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = decodeShareSlug(slug);
  const title = 'This reply hit different | Text Wingman';
  const description = data
    ? `“${data.myReply.length > 110 ? `${data.myReply.slice(0, 107)}…` : data.myReply}” Get your own reply in seconds, free.`
    : 'Get the right reply to any text in seconds. Free to try, no signup.';
  const image = data
    ? `/api/share/image?${new URLSearchParams({ their: data.theirMessage || '…', reply: data.myReply, tone: data.tone })}`
    : '/opengraph-image';
  const images = [{ url: image, width: data ? 800 : 1200, height: data ? 600 : 630, alt: 'A reply written with Text Wingman' }];
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, type: 'website', images },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
