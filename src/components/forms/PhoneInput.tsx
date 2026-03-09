'use client'

import { FormControl, FormHelperText, type SxProps, type Theme, useTheme } from '@mui/material'
import { styled } from '@mui/material/styles'
import { type Control, Controller, type FieldError } from 'react-hook-form'
import PhoneInput from 'react-phone-input-2'

interface PhoneInputProps {
  name: string
  control: Control<Record<string, unknown>>
  error?: FieldError | undefined
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  sx?: SxProps<Theme>
}

const StyledPhoneInput = styled(PhoneInput)(({ theme }) => ({
  '&.react-tel-input': {
    width: '100%',
    fontFamily: theme.typography.fontFamily,
    '& .form-control': {
      width: '100%',
      height: '56px',
      padding: '16.5px 14px 16.5px 58px',
      fontSize: theme.typography.body1.fontSize,
      fontFamily: 'inherit',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      '&:hover': {
        borderColor: theme.palette.text.primary,
      },
      '&:focus': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
        outline: 'none',
      },
      '&.error': {
        borderColor: theme.palette.error.main,
      },
    },
    '& .flag-dropdown': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
      '&.open': {
        backgroundColor: 'transparent',
        '& .selected-flag': {
          backgroundColor: theme.palette.action.hover,
        },
      },
    },
    '& .selected-flag': {
      padding: '0 8px 0 16px',
      borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:focus': {
        backgroundColor: theme.palette.action.selected,
      },
      '& .flag': {
        transform: 'scale(1.1)',
      },
      '& .arrow': {
        borderTopColor: theme.palette.text.secondary,
        marginLeft: '8px',
        '&.up': {
          borderBottomColor: theme.palette.text.secondary,
        },
      },
    },
    '& .country-list': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[4],
      margin: '4px 0 0',
      maxHeight: '300px',
      '& .divider': {
        borderBottom: `1px solid ${theme.palette.divider}`,
        margin: '4px 0',
      },
      '& .country': {
        padding: '8px 16px',
        '&:hover, &.highlight': {
          backgroundColor: theme.palette.action.hover,
        },
        '&.country:hover .country-name, &.highlight .country-name': {
          color: theme.palette.text.primary,
        },
        '&.preferred': {
          backgroundColor: theme.palette.action.selected,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      },
    },
    // Search container
    '& .search': {
      position: 'sticky',
      top: 0,
      backgroundColor: theme.palette.background.paper,
      padding: '8px 0 4px 0',
      zIndex: 1,
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&.search-box': {
        padding: '8px 16px',
        backgroundColor: theme.palette.background.paper,
      },
    },
    // Search input
    '& .search-box-box': {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: 'none',
      borderBottom: `1px solid ${theme.palette.divider}`,
      borderRadius: '0',
      padding: '12px 16px',
      margin: '0',
      width: '100%',
      fontSize: '0.9375rem',
      '&:focus': {
        borderBottomColor: theme.palette.primary.main,
        outline: 'none',
        boxShadow: `0 1px 0 0 ${theme.palette.primary.main}`,
      },
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
    '& .country-name, & .dial-code': {
      color: theme.palette.text.primary,
      fontSize: '0.9375rem',
    },
    '& .dial-code': {
      color: theme.palette.text.secondary,
      marginLeft: '4px',
    },
  },
}))

export function FormPhoneInput({
  name,
  control,
  error,
  helperText,
  required = false,
  fullWidth = true,
  sx = {},
}: PhoneInputProps): JSX.Element {
  const theme = useTheme()

  // CSS styling handled via styled components below

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <FormControl
          fullWidth={fullWidth}
          error={Boolean(error)}
          margin="normal"
          sx={{
            '& .react-tel-input': {
              fontFamily: theme.typography.fontFamily,
              '&.error': {
                '& .form-control': {
                  borderColor: theme.palette.error.main,
                  '&:focus': {
                    boxShadow: `0 0 0 1px ${theme.palette.error.main}`,
                  },
                },
              },
            },
            ...sx,
          }}>
          <StyledPhoneInput
            country="us"
            value={(value as string) ?? ''}
            onChange={onChange}
            inputProps={{
              name,
              required,
              style: { width: '100%' },
              id: `phone-input-${name}`,
              'aria-label': 'Phone number',
            }}
            containerClass={`react-tel-input ${error ? 'error' : ''}`}
            inputClass="form-control"
            buttonClass=""
            dropdownClass="country-list"
            searchClass="search-box"
            searchStyle={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: 'none',
              borderBottom: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
              padding: '12px 16px',
              margin: 0,
              width: '100%',
              fontSize: '0.9375rem',
            }}
            searchPlaceholder="Search..."
            searchNotFound="No results found"
            preferredCountries={['us', 'gb', 'ca', 'au']}
            enableAreaCodes
            enableSearch
            disableSearchIcon
          />
          {helperText && <FormHelperText sx={{ ml: 2, mt: 0.5 }}>{helperText}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
