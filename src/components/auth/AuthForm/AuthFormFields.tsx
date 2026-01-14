'use client'

import { Box, Checkbox, FormControlLabel, Link, TextField, Typography, IconButton, InputAdornment } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFormContext } from 'react-hook-form'
import { useState } from 'react'

import { uiText } from './config/uiText'
import { AuthOperationsEnum } from '@/types/auth.types'
import { AuthOperations } from '@/types'

type AuthFormFieldsProps = {
  operation: AuthOperations
  isLoading?: boolean
}

export function AuthFormFields({ operation, isLoading = false }: AuthFormFieldsProps): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  const { fields, links } = uiText
  const [acceptTermsPrefix = '', afterTermsRaw = ''] = fields.acceptTerms.split(links.termsOfService)
  const [betweenTermsAndPrivacy = '', acceptTermsSuffix = ''] = afterTermsRaw.split(links.privacyPolicy)

  const renderEmailField = (): JSX.Element => (
    <motion.div
      layout
      key="email-field"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <TextField
        label={fields.email}
        type="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message as string}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
    </motion.div>
  )

  const renderPasswordField = (name: string, label: string): JSX.Element => {
    const visible = !!showPassword[name]
    return (
      <motion.div
        layout
        key={`${name}-field`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.68 }}>
        <TextField
          label={label}
          type={visible ? 'text' : 'password'}
          {...register(name)}
          error={!!errors[name]}
          helperText={errors[name]?.message as string}
          fullWidth
          margin="normal"
          disabled={isLoading}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((prev) => ({ ...prev, [name]: !prev[name] }))}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    disabled={isLoading}>
                    {visible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </motion.div>
    )
  }

  const renderNameField = (): JSX.Element => (
    <motion.div
      layout
      key="name-field"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <TextField
        label={fields.name}
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message as string}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
    </motion.div>
  )

  const renderTermsCheckbox = (): JSX.Element => (
    <motion.div
      layout
      key="terms-checkbox"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <FormControlLabel
        control={<Checkbox {...register('acceptTerms')} disabled={isLoading} />}
        label={
          <Typography variant="body2">
            {acceptTermsPrefix}
            <Link href="/terms" target="_blank" rel="noopener noreferrer">
              {links.termsOfService}
            </Link>
            {betweenTermsAndPrivacy}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
              {links.privacyPolicy}
            </Link>
            {acceptTermsSuffix}
          </Typography>
        }
      />
    </motion.div>
  )

  return (
    <Box component="div">
      <LayoutGroup>
        <motion.div layout transition={{ layout: { duration: 0.25, ease: [0.2, 0, 0.2, 1] } }}>
          <AnimatePresence mode="wait" initial={false}>
            {operation !== AuthOperationsEnum.SET_PASSWORD && operation !== AuthOperationsEnum.UPDATE_PASSWORD && (
              <>
                {renderEmailField()}
                {operation !== AuthOperationsEnum.FORGOT_PASSWORD && (
                  <>
                    {renderPasswordField('password', fields.password)}

                    {operation === AuthOperationsEnum.SIGN_UP && (
                      <>
                        {renderPasswordField('confirmPassword', fields.confirmPassword)}
                        {renderNameField()}
                        {renderTermsCheckbox()}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {operation === AuthOperationsEnum.SET_PASSWORD && (
              <>
                {renderPasswordField('password', fields.newPassword)}
                {renderPasswordField('confirmPassword', fields.confirmNewPassword)}
              </>
            )}

            {operation === AuthOperationsEnum.UPDATE_PASSWORD && (
              <>
                {renderPasswordField('currentPassword', fields.currentPassword)}
                {renderPasswordField('newPassword', fields.newPassword)}
                {renderPasswordField('confirmPassword', fields.confirmNewPassword)}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </Box>
  )
}
