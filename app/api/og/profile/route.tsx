import { ImageResponse } from 'next/og'
import { type NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

import { SITE_CONFIG } from '@/config/site'
import { isValidAvatarUrl } from '@/lib/utils/profile-utils'
import { withApiErrorHandler } from '@/lib/error/server'

/**
 * Profile Open Graph Image Generation API Route
 *
 * Generates personalized OG images for user profile pages.
 *
 * Query Parameters:
 * - name: User's display name (required)
 * - avatar: User's avatar URL (optional)
 * - bio: User's bio/tagline (optional, max 150 chars)
 *
 * Example:
 * - /api/og/profile?name=John%20Doe
 * - /api/og/profile?name=John%20Doe&avatar=https://...&bio=Full%20Stack%20Developer
 *
 * Features:
 * - Displays user avatar (or placeholder)
 * - Shows user name and bio
 * - Branded with YwyBase design
 * - Automatic CDN caching
 *
 * @see https://vercel.com/docs/og-image-generation
 */

async function handler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)

  const name = searchParams.get('name')
  if (name === null || name === undefined) {
    return NextResponse.json({ error: 'Missing required parameter: name' }, { status: 400 })
  }

  const avatar = searchParams.get('avatar')
  const validatedAvatar = isValidAvatarUrl(avatar)
  const bio = searchParams.get('bio')?.slice(0, 150)

  // Load Inter font
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-SemiBold.woff')
  const interSemiBold = await readFile(fontPath)

  // ImageResponse is a Response, but Next.js expects NextResponse for API routes
  // So we wrap the ImageResponse in a NextResponse
  const imageResponse = new ImageResponse(
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
      {/* Main Content Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24,
          padding: '60px 80px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
        {/* Avatar */}
        <div
          style={{
            display: 'flex',
            width: 180,
            height: 180,
            borderRadius: 90,
            overflow: 'hidden',
            backgroundColor: '#e2e8f0',
            marginBottom: 32,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
          {validatedAvatar !== null ? (
            // eslint-disable-next-line @next/next/no-img-element -- OG image generation requires basic img tag
            <img
              src={validatedAvatar}
              alt={name}
              width={180}
              height={180}
              style={{
                objectFit: 'cover',
              }}
            />
          ) : (
            // Placeholder avatar with initials
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: 64,
                fontWeight: 600,
                color: 'white',
              }}>
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: '#1e293b',
            marginBottom: bio !== undefined && bio !== null ? 16 : 0,
            textAlign: 'center',
          }}>
          {name}
        </div>

        {/* Bio */}
        {bio !== undefined && bio !== null && (
          <div
            style={{
              fontSize: 24,
              color: '#64748b',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: 1.4,
            }}>
            {bio}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            background: 'linear-gradient(to right, #1e293b, #3b82f6)',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
          {SITE_CONFIG.name}
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#94a3b8',
          }}>
          •
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#64748b',
          }}>
          A Solid Ground to Scale
        </div>
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
  // Copy headers from ImageResponse to NextResponse
  const nextRes = new NextResponse(imageResponse.body, {
    status: imageResponse.status,
    headers: imageResponse.headers,
  })
  return nextRes
}

export const GET = withApiErrorHandler(handler)

/**
 * Runtime configuration
 * Node.js runtime allows cleaner filesystem access for fonts
 */
export const runtime = 'nodejs'
