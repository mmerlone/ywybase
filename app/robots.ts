import type { MetadataRoute } from 'next'

/**
 * Robots.txt Configuration
 *
 * Defines crawling rules for search engines and bots.
 * Allows all user agents to crawl the site, with specific
 * allowances for OG image generation routes.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/og/*'],
      disallow: ['/api/*'],
    },
    sitemap: 'https://ywybase.vercel.app/sitemap.xml',
  }
}
