/** @type {import('next').NextConfig} */
import { withSentryConfig } from '@sentry/nextjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
  },
  transpilePackages: ['@mui/material', '@mui/icons-material'],
  // Prevent webpack from bundling server-only packages where pnpm's virtual
  // store layout causes version-mismatch resolution errors (e.g. entities@4
  // hoisted vs entities@6 needed by parse5). Node.js runtime resolves them
  // correctly through pnpm's symlinks.
  serverExternalPackages: ['cheerio', 'sanitize-html'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
  productionBrowserSourceMaps: false,

  webpack: (config) => {
    // Ignore warnings from Sentry's instrumentation and telemetry
    config.ignoreWarnings = [
      { module: /@opentelemetry/ },
      { module: /require-in-the-middle/ },
      { file: /@sentry\/nextjs/ },
      // @vercel/kv uses Node.js APIs in server runtimes.
      // This is safe because rate limiting already falls back to in-memory store.
      { module: /@vercel\/kv/ },
    ]

    // Required for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }

    // Ensure linked packages (e.g. @mmerlone/mui7-phone-number via link:)
    // resolve shared dependencies from the host's node_modules. Without this,
    // webpack resolves bare imports like 'react' relative to the linked
    // package's real path (outside the project tree) where they don't exist.
    // Using resolve.modules (instead of resolve.alias for react/react-dom)
    // avoids breaking Next.js DevTools, which need their own React resolution.
    const hostModules = path.resolve(__dirname, 'node_modules')
    config.resolve.modules = [hostModules, ...(config.resolve.modules ?? ['node_modules'])]
    config.resolve.alias = {
      ...config.resolve.alias,
      '@emotion/react': path.resolve(hostModules, '@emotion/react'),
      '@emotion/styled': path.resolve(hostModules, '@emotion/styled'),
    }

    // Externalize native and binary modules for server bundles
    if (config.name === 'server') {
      config.externals.push({
        'node:fs': 'commonjs fs',
        pino: 'pino',
        'thread-stream': 'thread-stream',
        'pino-pretty': 'pino-pretty',
      })
    }

    return config
  },
}

const sentryConfig = {
  org: 'mmerlones-org',
  project: 'ywybase',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    disable: process.env.NODE_ENV !== 'production',
    urlPrefix: '~/_next',
  },
}

export default withSentryConfig(nextConfig, sentryConfig)
