import crypto from 'crypto';

export const VISITOR_COOKIE_NAME = 'tw_vid';

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const piece of cookieHeader.split(';')) {
    const [key, ...valueParts] = piece.trim().split('=');
    if (key !== name) continue;
    const value = valueParts.join('=');
    try {
      return decodeURIComponent(value).slice(0, 128) || null;
    } catch {
      return value.slice(0, 128) || null;
    }
  }
  return null;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || '127.0.0.1';
}

export function getRequestIdentity(request: Request, visitorIdOverride?: string | null) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const language = request.headers.get('accept-language') || '';
  const ip = getClientIp(request);
  const cookieVisitorId = readCookie(request.headers.get('cookie'), VISITOR_COOKIE_NAME);
  const visitorId = visitorIdOverride || cookieVisitorId;
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}-${language}-${visitorId || ip}`)
    .digest('hex')
    .slice(0, 32);

  return { ip, userAgent, language, visitorId, fingerprint };
}

