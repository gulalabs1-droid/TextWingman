// Shared public URLs. Keep local development values from leaking into production metadata.
const configuredUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
const isLocalUrl = /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(configuredUrl);

export const SITE_URL = configuredUrl && /^https?:\/\//i.test(configuredUrl) && !isLocalUrl
  ? configuredUrl
  : 'https://gula-agents2.vercel.app';

export const SOCIAL_LINKS = {
  tiktok: 'https://www.tiktok.com/@gulatextwingman',
  youtube: 'https://www.youtube.com/@gulatextwingman',
  instagram: 'https://www.instagram.com/textwingmangula/',
} as const;
