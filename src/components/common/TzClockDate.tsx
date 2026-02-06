'use client'

import React, { useState, useEffect } from 'react'
import { Typography } from '@mui/material'
import moment from 'moment-timezone'

interface TzClockProps {
  timezone?: string
  showDate?: boolean
}

/**
 * A real-time clock component that displays current time and optionally date
 * in a specified timezone, using the user's locale for 12/24 hour format preference
 */
export function TzClockDate({ timezone, showDate = false }: TzClockProps): JSX.Element {
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = (): void => {
      // Detect user's 12/24 hour preference from their locale
      const is24Hour = !new Intl.DateTimeFormat(navigator.language, {
        hour: 'numeric',
      })
        .formatToParts(new Date())
        .find((part) => part.type === 'dayPeriod')

      // Format string based on user preference and showDate prop
      let formatString: string
      if (showDate) {
        formatString = is24Hour ? 'MMMM Do YYYY, HH:mm:ss z' : 'MMMM Do YYYY, h:mm:ss a z'
      } else {
        formatString = is24Hour ? 'HH:mm:ss z' : 'h:mm:ss a z'
      }

      // Get current time in specified timezone or local time
      const time = timezone ? moment().tz(timezone).format(formatString) : moment().format(formatString)
      setCurrentTime(time)
    }

    // Update immediately and then every second
    updateTime()
    const interval = setInterval(updateTime, 1000)

    // Cleanup interval on unmount
    return (): void => clearInterval(interval)
  }, [timezone, showDate])

  return (
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
      {showDate ? 'Current time: ' : ''}
      {currentTime}
    </Typography>
  )
}
