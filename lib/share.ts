type ShareData = { theirMessage?: unknown; myReply?: unknown; tone?: unknown; type?: unknown };

export type SharedReply = { theirMessage: string; myReply: string; tone: string };

/** Reads a /share/<slug> link. Same encoding as /api/share: base64url of UTF-8 JSON. */
export function decodeShareSlug(slug: string): SharedReply | null {
  try {
    const data = JSON.parse(Buffer.from(slug, 'base64url').toString('utf8')) as ShareData;
    if (!data || typeof data.myReply !== 'string' || !data.myReply.trim()) return null;
    const tone = typeof data.type === 'string' ? data.type : typeof data.tone === 'string' ? data.tone : 'best';
    return {
      theirMessage: typeof data.theirMessage === 'string' ? data.theirMessage.slice(0, 100) : '',
      myReply: data.myReply.slice(0, 200),
      tone: tone.replace(/[^a-z_-]/gi, '').slice(0, 24) || 'best',
    };
  } catch {
    return null;
  }
}
