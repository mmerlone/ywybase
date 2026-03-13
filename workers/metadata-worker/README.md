# Metadata Proxy Worker

This Cloudflare Worker provides a secure metadata proxy for extracting OpenGraph/Twitter/HTML metadata from arbitrary HTTP(S) pages with SSRF protections, edge caching and rate limiting.

Features

- SSRF protections: blocks loopback, .local, private IPv4 ranges, and common IPv6 literals (loopback, ULA, link-local, IPv4-mapped)
- Safe fetch with timeout and response size limit
- Streaming HTML parsing via `HTMLRewriter` to extract meta tags
- Edge `caches.default` caching with 24-hour TTL
- Rate limiting with Upstash Redis (preferred) and in-memory fallback
- Structured JSON logging to console

Quick start

1. Configure environment variables (see `wrangler.example.toml` for bindings). If using Upstash, set `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. Deploy with Wrangler: use `wrangler deploy --env production` for Wrangler v2+ (older Wrangler v1 used `wrangler publish`). Run `wrangler --version` to check which CLI you have installed.

Endpoints

- `GET /` - smoke endpoint
- `GET /metadata?url=<encoded-url>` - return JSON metadata for the given URL

Security notes

- This worker intentionally limits functionality to metadata extraction only.
- It does not follow redirects to private/internal networks and blocks known risky hosts.
- Note: IPv6 literals (for example `::1`, `fc00::/7`, `fe80::/10`, and IPv4-mapped `::ffff:`) are a potential SSRF bypass vector. The validator in `src/validators.ts` includes checks to block common IPv6 loopback, ULA, link-local and IPv4-mapped literals. Review `src/validators.ts` for exact rules and consider additional IP resolution protections if you require stricter network controls.

Development

- Install Wrangler and configure the `wrangler.toml` (see `wrangler.example.toml` for reference).
- Run locally with `wrangler dev`.

Files of interest

- `src/index.ts` - worker entrypoint and routing
- `src/validators.ts` - SSRF and URL validation
- `src/fetchHtml.ts` - safe fetch implementation
- `src/extract.ts` - metadata extraction via HTMLRewriter
- `src/rateLimit/` - rate limiting stores and adapter (directory)

License

Project follows repository license.
