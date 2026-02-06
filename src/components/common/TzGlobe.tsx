'use client'

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { MyLocation as ResetIcon } from '@mui/icons-material'
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  geoCircle,
  type GeoProjection,
  type GeoPermissibleObjects,
} from 'd3-geo'
import { select } from 'd3-selection'
import { drag } from 'd3-drag'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection } from 'geojson'

import { getTimezoneCenter } from '@/lib/utils/timezoneCoordinates'
import { mapToCanonicalTz, getUtcOffsetHour, utcOffsetToLongitude } from '@/lib/utils/timezoneMapping'

// ── Types ─────────────────────────────────────────────────────────

interface TzGlobeProps {
  /** IANA timezone identifier (e.g. "America/New_York"). Falls back to UTC. */
  timezone?: string | null
  /** Globe diameter in pixels. Defaults to 200. */
  size?: number
}

/** Cached geographic data to avoid re-fetching on every render */
interface GeoData {
  land: FeatureCollection
  countries: FeatureCollection
  tzBoundaries: FeatureCollection | null
}

interface DragState {
  startRotation: [number, number, number]
  startX: number
  startY: number
}

/** Size threshold (px) for showing detailed tz boundary polygons vs simple UTC bands */
const DETAIL_THRESHOLD = 300

/** Globe axial tilt in degrees (Earth's obliquity ≈ 23.44°) */
const TILT = -23.44

/** Sensitivity factor for drag-to-rotate (degrees per pixel) */
const DRAG_SENSITIVITY = 0.4

/** Inertia friction factor (0–1, lower = more friction) */
const INERTIA_FRICTION = 0.92

/** Minimum velocity to continue inertia animation (degrees/frame) */
const INERTIA_MIN_VELOCITY = 0.1

// ── Sun position helper ──────────────────────────────────────────

/**
 * Compute the subsolar point (latitude/longitude where the sun is directly overhead)
 * for the current moment in time. Uses a simplified astronomical formula.
 *
 * @returns [latitude, longitude] of the subsolar point in degrees
 */
function getSubsolarPoint(): [number, number] {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000)

  // Solar declination (angle of sun relative to equator), ≈ ±23.44°
  const declination = -23.44 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365.25)

  // Hour angle: the sun is overhead at solar noon (12:00 UTC at 0° longitude)
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600
  const solarLng = -((utcHours - 12) * 15) // 15° per hour, negative because Earth rotates east

  return [declination, solarLng]
}

// ── Colors ──────────────────────────────────────────────────────

/**
 * Single color scheme used regardless of system dark/light mode.
 * Based on a natural light-theme globe appearance.
 */
const COLORS = {
  ocean: '#3d8ce0',
  land: '#b3ddb1',
  landStroke: '#4b555e',
  border: '#327843',
  graticule: 'rgba(0,0,0,0.06)',
  rim: 'rgba(0,0,0,0.08)',
} as const

// ── Component ─────────────────────────────────────────────────────

/**
 * Interactive 3D globe rendered on a canvas element using D3-geo orthographic projection.
 *
 * Displays continent silhouettes with the user's timezone highlighted and real-time
 * day/night terminator based on the current sun position. Supports mouse-drag
 * rotation with inertia. Uses a unified natural color scheme in all themes.
 *
 * - **Large globes** (≥300px): loads real timezone boundary polygons from
 *   `public/data/tz-boundaries.json` for accurate region highlighting.
 * - **Small globes** (<300px): uses procedural 15°-wide UTC offset bands
 *   for lightweight rendering without additional data fetching.
 *
 * @param props - Component props
 * @returns A canvas-based interactive globe wrapped in a Box
 *
 * @example
 * ```tsx
 * <TzGlobe timezone="America/New_York" size={200} />
 * <TzGlobe timezone={profile.timezone} size={400} />
 * ```
 */
export function TzGlobe({ timezone, size = 200 }: TzGlobeProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const geoDataRef = useRef<GeoData | null>(null)
  const rotationRef = useRef<[number, number, number]>([0, 0, TILT])
  const velocityRef = useRef<[number, number]>([0, 0])
  const inertiaFrameRef = useRef<number>(0)
  const dragStateRef = useRef<DragState | null>(null)
  const renderFrameRef = useRef<number>(0)
  const projectionRef = useRef<GeoProjection | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const animateInertiaRef = useRef<(p: GeoProjection, c: CanvasRenderingContext2D) => void>(() => {})
  const renderRef = useRef<(p: GeoProjection, c: CanvasRenderingContext2D) => void>(() => {})
  const flyToFrameRef = useRef<number>(0)

  // Resolve the timezone to use
  const tz = timezone ?? 'UTC'
  const useDetailedBoundaries = size >= DETAIL_THRESHOLD

  // ── Highlight colors derived from theme primary ───────────────
  const highlightColors = useMemo(
    () => ({
      fill: 'rgba(248, 253, 181, 0.61)', // Warm orange for strong contrast against blue ocean & green land
      stroke: 'rgba(230,81,0,0.85)', // Deep orange border
      marker: 'rgba(191,54,12,0.9)', // Dark orange-red dot
    }),
    []
  )

  // ── Render function ───────────────────────────────────────────
  const render = useCallback(
    (projection: GeoProjection, ctx: CanvasRenderingContext2D): void => {
      const data = geoDataRef.current
      if (!data) return

      const w = size
      const h = size
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

      ctx.clearRect(0, 0, w * dpr, h * dpr)
      ctx.save()
      ctx.scale(dpr, dpr)

      const pathGen = geoPath(projection, ctx)

      // ── Ocean ─────────────────────────────────────────────
      ctx.beginPath()
      pathGen({ type: 'Sphere' } as GeoPermissibleObjects)
      ctx.fillStyle = COLORS.ocean
      ctx.fill()

      // ── Graticule ─────────────────────────────────────────
      const graticuleData = geoGraticule().step([15, 15])()
      ctx.beginPath()
      pathGen(graticuleData)
      ctx.strokeStyle = COLORS.graticule
      ctx.lineWidth = 0.5
      ctx.stroke()

      // ── Land masses ───────────────────────────────────────
      ctx.beginPath()
      pathGen(data.land as GeoPermissibleObjects)
      ctx.fillStyle = COLORS.land
      ctx.fill()
      ctx.strokeStyle = COLORS.landStroke
      ctx.lineWidth = 0.5
      ctx.stroke()

      // ── Timezone highlight ────────────────────────────────
      if (useDetailedBoundaries && data.tzBoundaries) {
        // Detailed mode: render the matching boundary polygon
        const canonicalTz = mapToCanonicalTz(tz)
        const matchingFeature = data.tzBoundaries.features.find((f) => f.properties?.tzid === canonicalTz)
        if (matchingFeature) {
          ctx.beginPath()
          pathGen(matchingFeature as GeoPermissibleObjects)
          ctx.fillStyle = highlightColors.fill
          ctx.fill()
          ctx.strokeStyle = highlightColors.stroke
          ctx.lineWidth = 1
          ctx.stroke()
        }
      } else {
        // Simple mode: render a 15°-wide UTC offset band as a filled polygon
        const utcHour = getUtcOffsetHour(tz)
        const centerLng = utcOffsetToLongitude(utcHour)
        const bandHalfWidth = 7.5
        const bandPolygon: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [centerLng - bandHalfWidth, -90],
              [centerLng - bandHalfWidth, -60],
              [centerLng - bandHalfWidth, -30],
              [centerLng - bandHalfWidth, 0],
              [centerLng - bandHalfWidth, 30],
              [centerLng - bandHalfWidth, 60],
              [centerLng - bandHalfWidth, 90],
              [centerLng + bandHalfWidth, 90],
              [centerLng + bandHalfWidth, 60],
              [centerLng + bandHalfWidth, 30],
              [centerLng + bandHalfWidth, 0],
              [centerLng + bandHalfWidth, -30],
              [centerLng + bandHalfWidth, -60],
              [centerLng + bandHalfWidth, -90],
              [centerLng - bandHalfWidth, -90],
            ],
          ],
        }
        ctx.beginPath()
        pathGen(bandPolygon as GeoPermissibleObjects)
        ctx.fillStyle = highlightColors.fill
        ctx.fill()
      }

      // ── Country borders (on top of highlight) ─────────────
      ctx.beginPath()
      pathGen(data.countries as GeoPermissibleObjects)
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 0.3
      ctx.stroke()

      // ── Night shadow (day/night terminator) ───────────────
      // Render concentric circles with increasing opacity to simulate
      // a smooth twilight gradient (penumbra) at the terminator edge.
      const [sunLat, sunLng] = getSubsolarPoint()
      const nightCenter: [number, number] = [sunLng + 180, -sunLat]
      const twilightBands: Array<{ radius: number; opacity: number }> = [
        { radius: 83, opacity: 0.23 },
        { radius: 85, opacity: 0.15 },
        { radius: 87, opacity: 0.1 },
        { radius: 89, opacity: 0.1 },
        { radius: 90, opacity: 0.16 },
      ]

      for (const band of twilightBands) {
        const circle = geoCircle().center(nightCenter).radius(band.radius)()
        ctx.beginPath()
        pathGen(circle as GeoPermissibleObjects)
        ctx.fillStyle = `rgba(0,0,20,${band.opacity})`
        ctx.fill()
      }

      // ── Timezone center marker ────────────────────────────
      const [lat, lng] = getTimezoneCenter(tz)
      if (lat !== 0 || lng !== 0) {
        const markerCircle = geoCircle().center([lng, lat]).radius(1.5)()
        ctx.beginPath()
        pathGen(markerCircle as GeoPermissibleObjects)
        ctx.fillStyle = highlightColors.marker
        ctx.fill()
      }

      // ── Rim/sphere outline ────────────────────────────────
      ctx.beginPath()
      pathGen({ type: 'Sphere' } as GeoPermissibleObjects)
      ctx.strokeStyle = COLORS.rim
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.restore()
    },
    [size, highlightColors, tz, useDetailedBoundaries]
  )

  // Keep renderRef always pointing to the latest render function
  useEffect(() => {
    renderRef.current = render
  }, [render])

  /** Duration of the fly-to animation in milliseconds */
  const FLY_DURATION = 600

  /**
   * Smoothly animate rotation from the current position to a target timezone center.
   * Uses ease-in-out cubic easing for natural deceleration.
   */
  const flyTo = useCallback(
    (targetTz: string): void => {
      // Cancel any ongoing inertia or previous fly-to
      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current)
        inertiaFrameRef.current = 0
      }
      if (flyToFrameRef.current) {
        cancelAnimationFrame(flyToFrameRef.current)
        flyToFrameRef.current = 0
      }
      velocityRef.current = [0, 0]

      const projection = projectionRef.current
      const ctx = ctxRef.current
      if (!projection || !ctx) return

      const [lat, lng] = getTimezoneCenter(targetTz)
      const targetRotation: [number, number, number] = [-lng, -lat, TILT]
      const startRotation: [number, number, number] = [...rotationRef.current]

      // Normalize longitude delta to take the shortest path around the globe
      let dLng = targetRotation[0] - startRotation[0]
      if (dLng > 180) dLng -= 360
      if (dLng < -180) dLng += 360

      const dLat = targetRotation[1] - startRotation[1]
      const dTilt = targetRotation[2] - startRotation[2]

      const startTime = performance.now()

      const animate = (now: number): void => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / FLY_DURATION, 1)
        // Ease-in-out cubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        rotationRef.current = [
          startRotation[0] + dLng * ease,
          startRotation[1] + dLat * ease,
          startRotation[2] + dTilt * ease,
        ]

        projection.rotate(rotationRef.current)
        // Use renderRef to always call the latest render (with current tz)
        renderRef.current(projection, ctx)

        if (t < 1) {
          flyToFrameRef.current = requestAnimationFrame(animate)
        } else {
          flyToFrameRef.current = 0
          rotationRef.current = targetRotation
          projection.rotate(targetRotation)
          renderRef.current(projection, ctx)
        }
      }

      flyToFrameRef.current = requestAnimationFrame(animate)
    },
    [] // stable — reads everything from refs
  )

  // ── Reset view to timezone center ─────────────────────────────
  const handleReset = useCallback((): void => {
    flyTo(tz)
  }, [tz, flyTo])

  // ── Re-center globe when timezone changes ─────────────────────
  const prevTzRef = useRef(tz)
  useEffect(() => {
    if (prevTzRef.current === tz) return
    prevTzRef.current = tz
    // Delay slightly so the main effect (if it runs) can set up the projection first
    const id = requestAnimationFrame(() => flyTo(tz))
    return (): void => {
      cancelAnimationFrame(id)
    }
  }, [tz, flyTo])

  // ── Inertia animation (via ref to allow self-scheduling) ──────
  useEffect(() => {
    animateInertiaRef.current = (projection: GeoProjection, ctx: CanvasRenderingContext2D): void => {
      const [vx, vy] = velocityRef.current

      if (Math.abs(vx) < INERTIA_MIN_VELOCITY && Math.abs(vy) < INERTIA_MIN_VELOCITY) {
        velocityRef.current = [0, 0]
        return
      }

      const [curLng, curLat, curTilt] = rotationRef.current
      rotationRef.current = [curLng + vx, Math.max(-60, Math.min(60, curLat - vy)), curTilt]
      velocityRef.current = [vx * INERTIA_FRICTION, vy * INERTIA_FRICTION]

      projection.rotate(rotationRef.current)
      renderRef.current(projection, ctx)

      inertiaFrameRef.current = requestAnimationFrame(() => animateInertiaRef.current(projection, ctx))
    }
  })

  // ── Main effect: setup projection, load data, attach drag ─────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const projection = geoOrthographic()
      .fitSize([size, size], { type: 'Sphere' } as GeoPermissibleObjects)
      .precision(0.5)

    // Store refs for reset button access
    projectionRef.current = projection
    ctxRef.current = ctx

    // Set initial rotation to center on the target timezone
    const [lat, lng] = getTimezoneCenter(tz)
    rotationRef.current = [-lng, -lat, TILT]
    projection.rotate(rotationRef.current)

    // ── Load geographic data ──────────────────────────────
    const loadData = async (): Promise<void> => {
      // Only reload if not cached
      if (!geoDataRef.current) {
        const worldResponse = await fetch('/data/world-110m.json')
        const worldTopo = (await worldResponse.json()) as Topology<{
          land: GeometryCollection
          countries: GeometryCollection
        }>

        const landGeo = feature(worldTopo, worldTopo.objects.land) as FeatureCollection
        const countriesGeo = feature(worldTopo, worldTopo.objects.countries) as FeatureCollection

        let tzGeo: FeatureCollection | null = null
        if (useDetailedBoundaries) {
          try {
            const tzResponse = await fetch('/data/tz-boundaries.json')
            tzGeo = (await tzResponse.json()) as FeatureCollection
          } catch {
            // Fall back to simple bands if tz data fails to load
            tzGeo = null
          }
        }

        geoDataRef.current = {
          land: landGeo,
          countries: countriesGeo,
          tzBoundaries: tzGeo,
        }
      }

      renderRef.current(projection, ctx)
    }

    loadData()

    // ── Drag behavior ───────────────────────────────────────
    const canvasSelection = select(canvas)

    const dragBehavior = drag<HTMLCanvasElement, unknown>()
      .on('start', (event) => {
        // Cancel any ongoing inertia or fly-to animation
        if (inertiaFrameRef.current) {
          cancelAnimationFrame(inertiaFrameRef.current)
          inertiaFrameRef.current = 0
        }
        if (flyToFrameRef.current) {
          cancelAnimationFrame(flyToFrameRef.current)
          flyToFrameRef.current = 0
        }
        velocityRef.current = [0, 0]
        dragStateRef.current = {
          startRotation: [...rotationRef.current],
          startX: event.x,
          startY: event.y,
        }
      })
      .on('drag', (event) => {
        const ds = dragStateRef.current
        if (!ds) return

        const dx = (event.x - ds.startX) * DRAG_SENSITIVITY
        const dy = (event.y - ds.startY) * DRAG_SENSITIVITY

        const newRotation: [number, number, number] = [
          ds.startRotation[0] + dx,
          Math.max(-60, Math.min(60, ds.startRotation[1] - dy)),
          ds.startRotation[2],
        ]

        rotationRef.current = newRotation
        velocityRef.current = [dx * 0.1, dy * 0.1]
        projection.rotate(newRotation)

        // Cancel pending render frame and schedule a new one
        if (renderFrameRef.current) {
          cancelAnimationFrame(renderFrameRef.current)
        }
        renderFrameRef.current = requestAnimationFrame(() => renderRef.current(projection, ctx))
      })
      .on('end', () => {
        dragStateRef.current = null
        // Start inertia animation
        animateInertiaRef.current(projection, ctx)
      })

    canvasSelection.call(dragBehavior)

    // Cleanup
    return (): void => {
      if (inertiaFrameRef.current) {
        cancelAnimationFrame(inertiaFrameRef.current)
      }
      if (flyToFrameRef.current) {
        cancelAnimationFrame(flyToFrameRef.current)
      }
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current)
      }
      canvasSelection.on('.drag', null)
    }
    // tz changes are handled by the flyTo re-center effect, not here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, useDetailedBoundaries])

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}>
        <canvas
          ref={canvasRef}
          style={{
            width: size,
            height: size,
            display: 'block',
            touchAction: 'none',
          }}
        />
      </Box>
      <Tooltip title="Reset to timezone center" placement="left" arrow>
        <IconButton
          onClick={handleReset}
          size="small"
          aria-label="Reset globe to timezone center"
          role="button"
          tabIndex={0}
          sx={{
            position: 'absolute',
            bottom: Math.max(4, size * 0.03),
            right: Math.max(4, size * 0.03),
            bgcolor: 'rgba(255,255,255,0.88)',
            color: 'rgba(0,0,0,0.55)',
            width: Math.min(36, Math.max(24, size * 0.1)),
            height: Math.min(36, Math.max(24, size * 0.1)),
            border: '1px solid rgba(0,0,0,0.08)',
            backdropFilter: 'blur(4px)',
            transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.96)',
              color: 'rgba(0,0,0,0.8)',
              transform: 'scale(1.08)',
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
          <ResetIcon sx={{ fontSize: Math.min(20, Math.max(14, size * 0.06)) }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
