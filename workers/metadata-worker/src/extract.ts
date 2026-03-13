// Cloudflare Workers types
/// <reference types="@cloudflare/workers-types" />
/**
 * Normalized metadata extracted from an HTML document.
 */
export type Metadata = {
  url: string
  title?: string | null
  description?: string | null
  image?: string | null
  siteName?: string | null
}

/**
 * Extract OpenGraph/Twitter/meta/title metadata from an HTML string.
 * Prioritizes `og:*` values, then `twitter:*`, then generic `meta[name=description]` and `title`.
 *
 * @param html HTML document as string
 * @param baseUrl Base URL used to resolve canonical if present
 */
export async function extractMetadata(html: string, baseUrl: URL): Promise<Metadata> {
  const og: Record<string, string> = {}
  const twitter: Record<string, string> = {}
  let titleTag: string | null = null
  let metaDescription: string | null = null
  let canonical: string | null = null

  // Quick-safe title extraction without relying on HTMLRewriter element.text()
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch && typeof titleMatch[1] === 'string') {
    titleTag = titleMatch[1].trim()
  }

  // Define handler interfaces for HTMLRewriter
  const rewriter = new HTMLRewriter()
    .on('meta[property^="og:"]', {
      element(el) {
        const prop = el.getAttribute('property')
        const content = el.getAttribute('content')
        if (typeof prop === 'string' && typeof content === 'string') {
          og[prop.replace(/^og:/, '')] = content
        }
      },
    })
    .on('meta[name^="twitter:"]', {
      element(el) {
        const name = el.getAttribute('name')
        const content = el.getAttribute('content')
        if (typeof name === 'string' && typeof content === 'string') {
          twitter[name.replace(/^twitter:/, '')] = content
        }
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        const content = el.getAttribute('content')
        if (typeof content === 'string') metaDescription = content
      },
    })
    // title handled via a quick regex above to avoid unsafe casts
    .on('link[rel="canonical"]', {
      element(el) {
        const href = el.getAttribute('href')
        if (typeof href === 'string') canonical = href
      },
    })

  // Run the rewriter against the HTML string
  await rewriter.transform(new Response(html)).text()

  // Compose normalized result with priority og -> twitter -> meta -> title
  const result: Metadata = {
    url: canonical ? new URL(canonical, baseUrl).toString() : baseUrl.toString(),
    title: og.title ?? twitter.title ?? titleTag ?? null,
    description: og.description ?? twitter.description ?? metaDescription ?? null,
    image: (og.image ?? twitter.image) ? new URL(og.image ?? twitter.image!, baseUrl).toString() : null,
    siteName: og.site_name ?? null,
  }

  return result
}
