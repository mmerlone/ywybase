'use client'

import { useState, type ReactElement } from 'react'
import MuiPhoneNumber, { type CountryData, type PhoneNumberProps } from '@mmerlone/mui7-phone-number'
import { Alert, Box, Card, CardContent, Chip, Container, Link as MuiLink, Stack, Typography } from '@mui/material'

interface StoryDefinition {
  id: string
  title: string
  description: string
  props: PhoneNumberProps
}

interface StoryCardProps {
  story: StoryDefinition
}

const STORIES: readonly StoryDefinition[] = [
  {
    id: 'basic',
    title: 'Basic',
    description: 'Minimal setup with automatic formatting and the full country selector.',
    props: {
      label: 'Phone number',
      fullWidth: true,
      disableAreaCodes: true,
      variant: 'outlined',
    },
  },
  {
    id: 'preferred',
    title: 'Preferred Countries',
    description: 'Pins Brazil, Italy, Sweden, Germany, and France to the top of the dropdown.',
    props: {
      label: 'Preferred countries',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'br',
      preferredCountries: ['br', 'it', 'se', 'de', 'fr'],
    },
  },
  {
    id: 'only',
    title: 'Only Countries',
    description: 'Restricts the selector to Great Britain, Spain, France, Germany, and Italy.',
    props: {
      label: 'European selection',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'gb',
      onlyCountries: ['gb', 'es', 'fr', 'de', 'it'],
    },
  },
  {
    id: 'exclude',
    title: 'Exclude Countries',
    description: 'Hides specific countries from the picker while keeping the rest available.',
    props: {
      label: 'Exclude US and Canada',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'no',
      excludeCountries: ['us', 'ca'],
    },
  },
  {
    id: 'regions',
    title: 'Region Filtering',
    description: 'Filters the list down to Europe-focused options.',
    props: {
      label: 'European region only',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'it',
      regions: 'europe',
    },
  },
  {
    id: 'validation',
    title: 'Custom Validation',
    description: 'Uses the raw digit callback to validate numbers between 10 and 15 digits.',
    props: {
      label: 'Validated phone',
      fullWidth: true,
      helperText: 'Enter between 10 and 15 digits.',
      variant: 'outlined',
      defaultCountry: 'us',
      isValid: (inputNumber: string): boolean =>
        inputNumber.length === 0 || (inputNumber.length >= 10 && inputNumber.length <= 15),
    },
  },
  {
    id: 'localization',
    title: 'Localization',
    description: 'Overrides country names in the dropdown using the package localization map.',
    props: {
      label: 'Localized countries',
      fullWidth: true,
      variant: 'outlined',
      onlyCountries: ['de', 'es', 'fr'],
      localization: {
        Germany: 'Deutschland',
        Spain: 'España',
        France: 'France',
      },
    },
  },
  {
    id: 'native',
    title: 'Native Select',
    description: 'Switches the country selector to a native select element.',
    props: {
      label: 'Native country selector',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'us',
      native: true,
      onlyCountries: ['us', 'ca', 'mx'],
    },
  },
  {
    id: 'disable-dropdown',
    title: 'Disable Dropdown',
    description: 'Keeps a fixed country while leaving the phone input editable.',
    props: {
      label: 'Dropdown disabled',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'us',
      disableDropdown: true,
      onlyCountries: ['us'],
    },
  },
  {
    id: 'disable-country-code',
    title: 'Hide Country Code',
    description: 'Leaves the selected country active while hiding the dial code in the input.',
    props: {
      label: 'Country code hidden',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'us',
      disableCountryCode: true,
    },
  },
  {
    id: 'disabled',
    title: 'Disabled State',
    description: 'Shows the component as a read-only field with an initial value.',
    props: {
      label: 'Disabled input',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'us',
      disabled: true,
      value: '+1 555 123 4567',
    },
  },
  {
    id: 'error',
    title: 'Forced Error',
    description: 'Applies the standard MUI error state for form-level validation feedback.',
    props: {
      label: 'Error state',
      fullWidth: true,
      variant: 'outlined',
      defaultCountry: 'us',
      error: true,
      helperText: 'Example server-side or form-level error state.',
      value: 'invalid',
    },
  },
]

const formatCountry = (country: CountryData | null): string => {
  if (!country) {
    return 'No country selected yet'
  }

  return `${country.name} (+${country.dialCode})`
}

function StoryCard({ story }: StoryCardProps): ReactElement {
  const [value, setValue] = useState<string>(story.props.value ?? '')
  const [country, setCountry] = useState<CountryData | null>(null)

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {story.title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {story.description}
            </Typography>
          </Box>

          <MuiPhoneNumber
            {...story.props}
            value={value}
            onChange={(nextValue: string, nextCountry: CountryData): void => {
              setValue(nextValue)
              setCountry(nextCountry)
            }}
          />

          <Alert severity="info" variant="outlined">
            <Stack spacing={0.5}>
              <Typography variant="body2">Value: {value || '(empty)'}</Typography>
              <Typography variant="body2">Country: {formatCountry(country)}</Typography>
            </Stack>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function Mui7PhoneInputDemo(): ReactElement {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h3">
            mui7-phone-input Demo
          </Typography>

          <Typography color="text.secondary" sx={{ maxWidth: 900 }} variant="body1">
            <MuiLink href="https://www.npmj" rel="noreferrer" target="_blank">
              @mmerlone/mui7-phone-number
            </MuiLink>{' '}
            is a phone number input component for MUI v7+ with auto-formatting, country selection, and full TypeScript
            support.
          </Typography>

          <Typography color="text.secondary" sx={{ maxWidth: 900 }} variant="body1">
            It is built on top of MUI&apos;s <code>TextField</code> and renders a country flag selector as a start
            adornment alongside a formatted international phone input.
          </Typography>

          <Typography color="text.secondary" sx={{ maxWidth: 900 }} variant="body1">
            This package is a fork of{' '}
            <MuiLink href="https://www.npmjs.com/package/mui-phone-number" rel="noreferrer" target="_blank">
              mui-phone-number
            </MuiLink>
            , updated to support the latest React 19 and MUI 7 versions.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Chip label="React 19+" size="small" />
            <Chip label="MUI 7" size="small" />
            <Chip label="Auto-formatting" size="small" />
            <Chip label="Country selector" size="small" />
            <Chip label="TypeScript support" size="small" />
            <Chip label="Localization" size="small" />
            <Chip label="Validation hooks" size="small" />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
            },
          }}>
          {STORIES.map(
            (story: StoryDefinition): ReactElement => (
              <StoryCard key={story.id} story={story} />
            )
          )}
        </Box>
      </Stack>
    </Container>
  )
}
