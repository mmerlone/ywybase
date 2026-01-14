/** @type {import('next').NextConfig} */
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
  },
  transpilePackages: ['@mui/material', '@mui/icons-material'],
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
      // @vercel/kv (via @upstash/redis) uses Node.js APIs for performance
      // This is safe because we use dynamic import() with fallback to memory store
      { module: /@upstash\/redis/ },
    ]

    // Required for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
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
