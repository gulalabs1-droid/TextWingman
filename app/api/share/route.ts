import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) || {};
    const { theirMessage, myReply } = body;
    const tone = typeof body.tone === 'string' ? body.tone.replace(/[^a-z_-]/gi, '').slice(0, 24) : '';

    if (typeof theirMessage !== 'string' || typeof myReply !== 'string' || !theirMessage.trim() || !myReply.trim() || !tone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create share data
    const shareData = {
      theirMessage: theirMessage.substring(0, 100),
      myReply: myReply.substring(0, 200),
      tone,
      timestamp: Date.now(),
    };
    
    // Encode to base64 for URL slug
    const slug = Buffer.from(JSON.stringify(shareData)).toString('base64url');
    
    // TODO: Optionally store in database for analytics
    // - Track share counts
    // - Measure viral coefficient
    // - Identify popular tones
    
    // Generate image URL for OG sharing
    const imageUrl = `/api/share/image?their=${encodeURIComponent(shareData.theirMessage)}&reply=${encodeURIComponent(shareData.myReply)}&tone=${encodeURIComponent(tone)}`;
    
    return NextResponse.json({
      slug,
      shareUrl: `/share/${slug}`,
      imageUrl,
    });
  } catch (error) {
    console.error('Error generating share card:', error);
    return NextResponse.json(
      { error: 'Failed to generate share card' },
      { status: 500 }
    );
  }
}
