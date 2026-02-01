import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { theirMessage, myReply, tone } = await request.json();

    if (!theirMessage || !myReply || !tone) {
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
    const imageUrl = `/api/share/image?their=${encodeURIComponent(shareData.theirMessage)}&reply=${encodeURIComponent(shareData.myReply)}&tone=${tone}`;
    
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
