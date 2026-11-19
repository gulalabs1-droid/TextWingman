import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /x*, /v2 and /admin2 are internal prototypes, not pages for search results.
        disallow: ['/api/', '/admin/', '/admin2', '/auth/', '/profile/', '/billing/', '/dashboard/', '/onboarding/', '/history', '/x', '/v2'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
