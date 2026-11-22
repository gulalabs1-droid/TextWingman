import { ImageResponse } from 'next/og';
import { BRAND, BrandIcon } from '@/lib/brand-icon';
import { getGuideBySlug, SEO_GUIDES } from '@/lib/seo-guides';

// Each guide shares as its own card: the text they got, and a better reply.
// Without this, guide links share with no image at all, because the guide's
// own Open Graph settings replace the site-wide ones.
export const alt = 'A texting guide from Text Wingman';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return SEO_GUIDES.map(guide => ({ slug: guide.slug }));
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export default async function GuideImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  const title = guide ? clip(guide.title, 60) : 'Texting guides';
  const theirs = guide ? clip(guide.theirMessage, 70) : 'what do I even say to this';
  const reply = guide?.goodReplies.find(r => !r.text.startsWith('(')) ?? guide?.goodReplies[0];
  const better = reply ? clip(reply.text, 80) : 'Get three replies in seconds.';

  return new ImageResponse(
    (
      <div style={{ background: BRAND.ink, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 72px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BrandIcon size={52} radius={15} />
            <div style={{ display: 'flex', fontSize: '32px', letterSpacing: '-0.04em' }}>
              <span style={{ color: BRAND.cream }}>text</span>
              <span style={{ fontWeight: 900, color: BRAND.lime }}>wingman</span>
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: '22px', color: BRAND.sage, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Texting guide</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', fontSize: '24px', color: BRAND.sage }}>They sent</div>
          <div style={{ display: 'flex', alignSelf: 'flex-start', maxWidth: '900px', background: '#232b25', color: BRAND.cream, fontSize: '40px', padding: '20px 30px', borderRadius: '30px 30px 30px 8px' }}>{theirs}</div>
          <div style={{ display: 'flex', fontSize: '24px', color: BRAND.sage, marginTop: '8px' }}>Try this</div>
          <div style={{ display: 'flex', alignSelf: 'flex-start', maxWidth: '980px', background: BRAND.lime, color: BRAND.limeInk, fontSize: '42px', fontWeight: 700, padding: '20px 30px', borderRadius: '30px 30px 8px 30px' }}>{better}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: '30px', fontWeight: 800, color: BRAND.cream, maxWidth: '820px', letterSpacing: '-0.02em' }}>{title}</div>
          <div style={{ display: 'flex', fontSize: '24px', color: BRAND.lime }}>textwingman.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
