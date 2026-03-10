'use client'

import { Box, FormControl, FormHelperText, FormLabel, Radio, RadioGroup, FormControlLabel } from '@mui/material'
import React, { forwardRef, useId, useMemo, useState, type ReactElement } from 'react'

import { logger } from '@/lib/logger/client'
import { cn } from '@/lib/utils'
import type { LabelledToggleOption } from '@/types/components.types'
import { carvedShadow, extrudedShadow } from '@/theme'

export interface LabelledToggleProps<T extends string | number> {
  id?: string
  name?: string
  label?: React.ReactNode
  ariaLabel?: string
  options: ReadonlyArray<LabelledToggleOption<T>>
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  helperText?: React.ReactNode
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
  className?: string
  reduceMotion?: boolean
}

function LabelledToggleInner<T extends string | number>(
  {
    id,
    name,
    label,
    ariaLabel,
    options,
    value,
    defaultValue,
    onChange,
    helperText,
    disabled,
    required,
    fullWidth,
    className,
    reduceMotion = false,
  }: LabelledToggleProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
): ReactElement {
  const instanceId = useId()
  const groupId = id ?? instanceId
  const generatedId = useId()
  const [internalValue, setInternalValue] = useState<T | undefined>(value ?? defaultValue)
  const uniqueId = id ?? `labelled-toggle-${generatedId}`
  const uniqueName = name ?? uniqueId

  // Sync internal value with controlled value without using effects
  const effectiveValue = value ?? internalValue

  const selectedIndex = useMemo(() => {
    if (effectiveValue === undefined) return -1
    return options.findIndex((o) => o.value === effectiveValue)
  }, [effectiveValue, options])

  const segmentsCount = options.length
  const indicatorStyle: React.CSSProperties = {
    width: `${100 / Math.max(1, segmentsCount)}%`,
    transform: `translateX(${Math.max(0, selectedIndex) * 100}%)`,
    display: selectedIndex === -1 ? 'none' : 'block',
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const rawValue = event.target.value

    // Optimized validation: Only validate if value is not in options
    // Since this is a controlled component, most values should be valid
    const isValidOption = options.some((opt) => opt.value === rawValue)

    if (!isValidOption) {
      logger.error(
        {
          rawValue,
          validOptions: options.map((opt) => opt.value),
          component: 'LabelledToggle',
        },
        `Invalid value "${rawValue}" not found in options`
      )
      return
    }

    // Type-safe assignment - we know it's valid since it's in options
    const validatedValue = rawValue as T
    setInternalValue(validatedValue)
    onChange?.(validatedValue)
  }

  return (
    <FormControl
      ref={ref}
      id={uniqueId}
      fullWidth={fullWidth}
      disabled={disabled}
      required={required}
      className="rounded-full"
      sx={carvedShadow}>
      {label ? (
        <FormLabel id={`${groupId}-label`} className="mb-2">
          {label}
        </FormLabel>
      ) : null}

      <RadioGroup
        row
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-label={ariaLabel}
        name={uniqueName}
        value={effectiveValue !== undefined ? String(effectiveValue) : ''}
        onChange={handleChange}
        className={cn('w-full rounded-full')}>
        <Box
          className={cn('relative inline-grid w-full select-none rounded-full m-1', className)}
          sx={{
            gridTemplateColumns: `repeat(${segmentsCount}, minmax(0, 1fr))`,
          }}>
          <Box aria-hidden className={cn('pointer-events-none absolute inset-0 rounded-full', 'backdrop-blur-[2px]')} />

          <Box
            aria-hidden
            className={cn(
              'absolute top-0 bottom-0 left-0 rounded-full',
              !reduceMotion && 'transition-transform duration-200 ease-out'
            )}
            style={indicatorStyle}
            sx={[extrudedShadow, { bgcolor: 'background.paper' }]}
          />

          {options.map((opt, idx) => {
            const optionId = `${groupId}-opt-${idx}`

            return (
              <FormControlLabel
                key={optionId}
                value={String(opt.value)}
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                disabled={disabled || opt.disabled}
                control={
                  <Radio
                    id={optionId}
                    disableRipple
                    icon={<span />}
                    checkedIcon={<span />}
                    sx={{
                      p: 0,
                      m: 0,
                      position: 'absolute',
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                    slotProps={{ input: { 'aria-label': opt.ariaLabel } }}
                  />
                }
                label={
                  <Box
                    component="span"
                    className={cn('relative z-10 m-2')}
                    sx={{ fontWeight: effectiveValue === opt.value ? 600 : 400 }}>
                    {opt.label}
                  </Box>
                }
                className={cn(
                  'relative z-1 cursor-pointer',
                  'flex items-center justify-center w-full h-full',
                  opt.disabled || disabled ? 'opacity-50 cursor-not-allowed' : undefined
                )}
                sx={{
                  m: 0,
                  flex: 1,
                  pl: 0,
                  ml: 0,
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  columnGap: 0,
                  minHeight: 0,
                  '& .MuiFormControlLabel-label': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    margin: 0,
                  },
                }}
              />
            )
          })}
        </Box>
      </RadioGroup>

      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  )
}

const LabelledToggle = forwardRef(LabelledToggleInner) as <T extends string | number>(
  props: LabelledToggleProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => ReturnType<typeof LabelledToggleInner<T>>

export default LabelledToggle
