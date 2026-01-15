import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

import { SITE_CONFIG } from '@/config/site'
import { serverLogger as logger } from '@/lib/logger'

/**
 * Open Graph Image Generation API Route
 *
 * Generates dynamic OG images for social media sharing.
 * Uses Vercel's @vercel/og library (included in Next.js 15).
 *
 * Query Parameters:
 * - title: Optional custom title (max 100 chars)
 *
 * Example:
 * - /api/og → Default site OG image
 * - /api/og?title=Custom%20Title → Custom title
 *
 * Features:
 * - Automatic CDN caching
 * - 1200x630 optimal size for social media
 * - Uses project's Inter font
 * - Branded with YwyBase design
 *
 * @see https://vercel.com/docs/og-image-generation
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)

    // Get title from query params, with fallback to site config
    const hasTitle = searchParams.has('title')
    const title = hasTitle ? searchParams.get('title')?.slice(0, 100) : SITE_CONFIG.title
    const description = searchParams.get('description')?.slice(0, 200) || SITE_CONFIG.description

    // Load Inter font (matching the project's font)
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-SemiBold.woff')
    const interSemiBold = await readFile(fontPath)

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f3f3',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(59, 130, 246, 0.1) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}>
        {/* Logo/Brand Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 600,
              background: 'linear-gradient(to bottom right, #1e293b, #3b82f6)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
            }}>
            {SITE_CONFIG.name}
          </div>
        </div>

        {/* Title Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 120px',
            textAlign: 'center',
          }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: '#1e293b',
              lineHeight: 1.2,
              marginBottom: 20,
              maxWidth: '960px',
            }}>
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 28,
                color: '#64748b',
                lineHeight: 1.4,
                maxWidth: '800px',
              }}>
              {description}
            </div>
          )}
        </div>

        {/* Footer Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 999,
            fontSize: 20,
            color: '#64748b',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
          A Solid Ground to Scale
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: interSemiBold,
            style: 'normal',
            weight: 600,
          },
        ],
      }
    )
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Failed to generate OG image')
    return new Response('Failed to generate image', { status: 500 })
  }
}

/**
 * Runtime configuration
 * Node.js runtime allows cleaner filesystem access for fonts
 */
export const runtime = 'nodejs'
