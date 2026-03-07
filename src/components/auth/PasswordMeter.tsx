'use client'

import { CheckCircle, Error } from '@mui/icons-material'
import { Box, List, ListItem, ListItemIcon, Typography } from '@mui/material'
import { useEffect, useMemo } from 'react'

import { SITE_CONFIG } from '@/config/site'

const PASSWORD_REQUIREMENTS = SITE_CONFIG.passwordRequirements

interface PasswordRequirement {
  label: string
  validate: (password: string) => boolean
  key: string
}

const requirements: PasswordRequirement[] = [
  {
    key: 'length',
    label: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    validate: (password: string): boolean => password.length >= PASSWORD_REQUIREMENTS.minLength,
  },
  {
    key: 'number',
    label: 'At least 1 number',
    validate: (password: string): boolean => !PASSWORD_REQUIREMENTS.requireNumber || /\d/.test(password),
  },
  {
    key: 'special',
    label: `At least 1 special character (${PASSWORD_REQUIREMENTS.specialChars})`,
    validate: (password: string): boolean =>
      !PASSWORD_REQUIREMENTS.requireSpecialChar ||
      new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
  },
  {
    key: 'case',
    label: 'At least 1 uppercase and 1 lowercase letter',
    validate: (password: string): boolean =>
      (!PASSWORD_REQUIREMENTS.requireUppercase || /[A-Z]/.test(password)) &&
      (!PASSWORD_REQUIREMENTS.requireLowercase || /[a-z]/.test(password)),
  },
]

interface PasswordMeterProps {
  password: string
  confirmPassword?: string
  onValidationChange?: (isValid: boolean) => void
}

export function PasswordMeter({ password = '', confirmPassword, onValidationChange }: PasswordMeterProps): JSX.Element {
  const effectiveRequirements: PasswordRequirement[] = useMemo(() => {
    const base = [...requirements]
    if (typeof confirmPassword === 'string') {
      base.push({
        key: 'match',
        label: 'Passwords match',
        validate: (pwd: string): boolean => confirmPassword.length > 0 && pwd === confirmPassword,
      })
    }
    return base
  }, [confirmPassword])

  // Compute fulfilled requirements directly
  const fulfilledRequirements = useMemo(() => {
    return effectiveRequirements.reduce(
      (acc, req) => {
        acc[req.key] = req.validate(password)
        return acc
      },
      {} as Record<string, boolean>
    )
  }, [password, effectiveRequirements])

  // Notify parent if all requirements are met
  useEffect(() => {
    if (onValidationChange) {
      const allValid = Object.values(fulfilledRequirements).every(Boolean)
      onValidationChange(allValid)
    }
  }, [fulfilledRequirements, onValidationChange])

  const getPasswordStrength = (): { label: string; color: string } => {
    const fulfilledCount = Object.values(fulfilledRequirements).filter(Boolean).length
    const total = effectiveRequirements.length
    const percentage = (fulfilledCount / total) * 100

    if (percentage < 50) return { label: 'Weak', color: 'error.main' }
    if (percentage < 80) return { label: 'Moderate', color: 'warning.main' }
    return { label: 'Strong', color: 'success.main' }
  }

  const strength = getPasswordStrength()
  const allRequirementsMet = Object.values(fulfilledRequirements).every(Boolean)

  return (
    <Box mt={1} width="100%">
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary">
          Password strength:&nbsp;
          <Typography component="span" color={strength.color} fontWeight="medium">
            {strength.label}
          </Typography>
        </Typography>
        {allRequirementsMet && (
          <Typography variant="caption" color="success.main" fontWeight="medium">
            All requirements met
          </Typography>
        )}
      </Box>

      <List dense disablePadding>
        {effectiveRequirements.map((req) => {
          const isFulfilled = fulfilledRequirements[req.key] ?? false
          return (
            <ListItem key={req.key} disableGutters disablePadding>
              <ListItemIcon sx={{ minWidth: 24, marginRight: 1 }}>
                {isFulfilled ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Error color="error" fontSize="small" />
                )}
              </ListItemIcon>
              <Typography
                variant="body2"
                color={isFulfilled ? 'text.secondary' : 'text.disabled'}
                sx={{
                  textDecoration: isFulfilled ? 'line-through' : 'none',
                }}>
                {req.label}
              </Typography>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}
