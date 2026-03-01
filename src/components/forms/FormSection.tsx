import { Box, type BoxProps, Typography, type SxProps, type Theme } from '@mui/material'
import { type ReactNode } from 'react'
import { mergeSx } from 'merge-sx'

interface FormSectionProps extends Omit<BoxProps, 'title' | 'sx'> {
  title: string
  children: ReactNode
  disabled?: boolean
  sx?: SxProps<Theme>
}

export function FormSection({
  title,
  children,
  disabled = false,
  id,
  sx = [],
  ...props
}: FormSectionProps): JSX.Element {
  return (
    <Box
      component="section"
      id={id}
      sx={mergeSx(
        {
          mb: 4,
          '&:last-child': { mb: 0 },
          ...(disabled && {
            opacity: 0.7,
            pointerEvents: 'none',
          }),
        },
        sx
      )}
      {...props}>
      <Typography
        component="h2"
        variant="h6"
        sx={{
          mb: 2.5,
          color: 'text.primary',
          fontWeight: 500,
          fontSize: '1.25rem',
          lineHeight: 1.4,
        }}>
        {title}
      </Typography>
      <Box
        sx={{
          '& > *:not(:last-child)': {
            mb: 3,
          },
        }}>
        {children}
      </Box>
    </Box>
  )
}

export default FormSection
