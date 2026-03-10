'use client'

import React, { useState, useEffect, type ReactElement } from 'react'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  debounceTime?: number
}

export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  debounceTime = 500,
}: SearchInputProps): ReactElement {
  const [localValue, setLocalValue] = useState(value)

  useEffect((): void => {
    setLocalValue(value)
  }, [value])

  useEffect((): (() => void) => {
    const timer = setTimeout((): void => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceTime)

    return (): void => clearTimeout(timer)
  }, [localValue, onChange, value, debounceTime])

  const handleClear = (): void => {
    setLocalValue('')
    onChange('')
  }

  return (
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={localValue}
      onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setLocalValue(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: localValue && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear} edge="end" aria-label="Clear search">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: 'divider',
          },
          '&:hover fieldset': {
            borderColor: 'primary.main',
          },
        },
      }}
    />
  )
}
