const CANONICAL_URL = 'https://textwingman.app';

// Keep the retired domain and local development URLs out of public links.
export function resolveSiteUrl(value: string | undefined): string {
  const configuredUrl = (value || '').trim().replace(/\/+$/, '');
  try {
    const url = new URL(configuredUrl);
    if (!['http:', 'https:'].includes(url.protocol) ||
        ['localhost', '127.0.0.1', '0.0.0.0', 'gula-agents2.vercel.app'].includes(url.hostname.toLowerCase())) {
      return CANONICAL_URL;
    }
    return configuredUrl;
  } catch {
    return CANONICAL_URL;
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_APP_URL);

export const SOCIAL_LINKS = {
  tiktok: 'https://www.tiktok.com/@gulatextwingman',
  youtube: 'https://www.youtube.com/@gulatextwingman',
  instagram: 'https://www.instagram.com/textwingmangula/',
} as const;

// Use one mobile-first destination while keeping each social profile attributable.
const PROFILE_CAMPAIGN = 'profile_bio';

export const SOCIAL_BIO_LINKS = {
  tiktok: `${SITE_URL}/tiktok?utm_source=tiktok&utm_medium=organic_social&utm_campaign=${PROFILE_CAMPAIGN}&utm_content=profile`,
  instagram: `${SITE_URL}/tiktok?utm_source=instagram&utm_medium=organic_social&utm_campaign=${PROFILE_CAMPAIGN}&utm_content=profile`,
  youtube: `${SITE_URL}/tiktok?utm_source=youtube&utm_medium=organic_social&utm_campaign=${PROFILE_CAMPAIGN}&utm_content=profile`,
} as const;
