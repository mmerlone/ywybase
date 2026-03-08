'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { logger as clientLogger } from '@/lib/logger/client'

// Theme constants for consistent styling
const CLOCK_CONTAINER_SX = {
  position: 'relative' as const,
  display: 'inline-flex',
  flexDirection: 'column',
  gap: 0.25,
  px: 1.5,
  py: 1,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
  width: 'fit-content',
  transition: 'border-color 0.2s ease',
  '&:hover': {
    borderColor: 'primary.main',
  },
}

const TIMEZONE_BADGE_SX = {
  fontSize: '0.65rem',
  fontWeight: 600,
  color: 'primary.main',
  bgcolor: 'primary.contrastText',
  border: '1px solid',
  borderColor: 'primary.light',
  borderRadius: 0.75,
  px: 0.75,
  py: 0.125,
  lineHeight: 1.4,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

const TIME_DISPLAY_SX = {
  fontFamily: 'monospace',
  fontSize: '1rem',
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'text.primary',
  letterSpacing: '0.02em',
}

const SECONDS_DISPLAY_SX = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'text.secondary',
  lineHeight: 1.2,
  minWidth: 18,
  transition: 'opacity 0.3s ease',
}

const LIVE_INDICATOR_SX = {
  position: 'absolute' as const,
  bottom: 6,
  right: 6,
  width: 6,
  height: 6,
  borderRadius: '50%',
  bgcolor: 'success.main',
  animation: 'tzClockPulse 2s ease-in-out infinite',
  '@keyframes tzClockPulse': {
    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
    '50%': { opacity: 0.4, transform: 'scale(0.8)' },
  },
}

interface TzClockDateUxProps {
  /** IANA timezone identifier (e.g. "America/New_York"). Falls back to local timezone. */
  timezone?: string
  /** Whether to display the date alongside the time */
  showDate?: boolean
}

interface ClockState {
  /** HH:MM portion (before seconds) */
  timePre: string
  seconds: string
  /** Day period suffix (" AM", " PM", or empty for 24h) */
  timePost: string
  tzAbbr: string
  date: string
  offsetLabel: string
}

/**
 * Compute the short timezone abbreviation (e.g. "PST", "EST") using Intl API
 */
function getTimezoneAbbr(tz?: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch (error) {
    clientLogger.error({ error, timezone: tz }, 'Failed to compute timezone abbreviation')
    return ''
  }
}

/**
 * Compute the hour offset between the target timezone and the viewer's local timezone,
 * returning a human-readable label like "3h ahead of you" or "Same time as you".
 */
function computeOffsetLabel(tz?: string): string {
  if (!tz) return ''

  try {
    const now = new Date()

    // Get UTC offset for target timezone (in minutes)
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    })
    const localFormatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'longOffset',
    })

    const extractOffset = (formatter: Intl.DateTimeFormat): number => {
      const parts = formatter.formatToParts(now)
      const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
      // Parse "GMT+5:30" or "GMT-8" or "GMT" patterns
      const match = tzPart.match(/GMT([+-]\d{1,2}(?::(\d{2}))?)/)
      if (!match?.[1]) return 0
      const hours = parseInt(match[1], 10)
      const minuteStr = match[2]
      const minutes = minuteStr ? parseInt(minuteStr, 10) * Math.sign(hours ?? 1) : 0
      return hours * 60 + minutes
    }

    const targetOffsetMin = extractOffset(targetFormatter)
    const localOffsetMin = extractOffset(localFormatter)
    const diffMin = targetOffsetMin - localOffsetMin

    if (diffMin === 0) return 'Same time as you'

    const absDiffHours = Math.abs(diffMin) / 60
    const isWholeHour = absDiffHours === Math.floor(absDiffHours)
    const label = isWholeHour ? `${Math.floor(absDiffHours)}h` : `${absDiffHours.toFixed(1)}h`

    return diffMin > 0 ? `${label} ahead of you` : `${label} behind you`
  } catch (error) {
    clientLogger.error({ error, timezone: tz }, 'Failed to compute timezone offset')
    return ''
  }
}

/**
 * Enhanced real-time clock widget that displays current time, date, and timezone
 * with a polished card-like layout, pulsing live indicator, and relative offset.
 *
 * Uses native Intl APIs — zero external dependencies (no moment-timezone).
 */
export function TzClockDateUx({ timezone, showDate = false }: TzClockDateUxProps): JSX.Element {
  const [clock, setClock] = useState<ClockState>({
    timePre: '',
    seconds: '',
    timePost: '',
    tzAbbr: '',
    date: '',
    offsetLabel: '',
  })

  // Compute offset label once (doesn't change while mounted)
  const offsetLabel = useMemo(() => computeOffsetLabel(timezone), [timezone])

  // Memoize Intl formatters for performance
  const timeFormatters = useMemo(() => {
    // Use 'en-US' as fallback for SSR; client will have navigator.language
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'

    const is24Hour = !new Intl.DateTimeFormat(locale, { hour: 'numeric' })
      .formatToParts(new Date())
      .find((part) => part.type === 'dayPeriod')

    return {
      fullTime: new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour,
      }),
      date: new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      tzAbbr: getTimezoneAbbr(timezone),
    }
  }, [timezone])

  useEffect(() => {
    const updateClock = (): void => {
      const now = new Date()
      const parts = timeFormatters.fullTime.formatToParts(now)

      // Extract individual part values by type
      const hour = parts.find((p) => p.type === 'hour')?.value ?? ''
      const minute = parts.find((p) => p.type === 'minute')?.value ?? ''
      const second = parts.find((p) => p.type === 'second')?.value ?? ''
      const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? ''

      setClock({
        timePre: `${hour}:${minute}`,
        seconds: second,
        timePost: dayPeriod ? ` ${dayPeriod}` : '',
        tzAbbr: timeFormatters.tzAbbr,
        date: showDate ? timeFormatters.date.format(now) : '',
        offsetLabel,
      })
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return (): void => clearInterval(interval)
  }, [timezone, showDate, offsetLabel, timeFormatters])

  if (!clock.timePre) return <Box sx={{ height: 40 }} />

  return (
    <Box
      sx={CLOCK_CONTAINER_SX}
      role="timer"
      aria-live="polite"
      aria-label={`Current time in ${timezone ?? 'local'} timezone`}>
      {/* Main time row */}
      <Stack direction="row" alignItems="baseline" spacing={1}>
        {/* Timezone badge */}
        {clock.tzAbbr && (
          <Typography component="span" sx={TIMEZONE_BADGE_SX} aria-label={`Timezone: ${clock.tzAbbr}`}>
            {clock.tzAbbr}
          </Typography>
        )}
        <Box sx={{ display: 'inline-flex', alignItems: 'baseline' }}>
          {/* HH:MM */}
          <Typography component="span" sx={TIME_DISPLAY_SX} aria-label="Hours and minutes">
            {clock.timePre}
          </Typography>

          {/* :SS — smaller, dimmer */}
          <Typography component="span" sx={SECONDS_DISPLAY_SX} aria-label="Seconds">
            :{clock.seconds}
          </Typography>

          {/* AM/PM (empty for 24h locales) */}
          {clock.timePost && (
            <Typography component="span" m={1} sx={TIME_DISPLAY_SX} aria-label="Time period">
              {clock.timePost}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Pulsing live dot — bottom-right corner */}
      <Box sx={LIVE_INDICATOR_SX} aria-label="Live indicator" title="Live updating clock" />

      {/* Date row */}
      {showDate && clock.date && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.3,
            fontSize: '0.75rem',
          }}
          aria-label="Date">
          {clock.date}
        </Typography>
      )}

      {/* Offset row */}
      {clock.offsetLabel && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            lineHeight: 1.3,
            fontSize: '0.7rem',
            fontStyle: 'italic',
          }}
          aria-label="Time offset from your timezone">
          {clock.offsetLabel}
        </Typography>
      )}
    </Box>
  )
}
