'use client'

import { createTheme, responsiveFontSizes, type CSSObject } from '@mui/material/styles'

export const extrudedShadow: CSSObject = {
  boxShadow:
    'inset 1px 2px 4px color-mix(in srgb, oklch(0.9525 0.011 247.839) 75%, transparent), 1px 2px 4px 0 oklch(21% 0.034 264.665)',
}

export const carvedShadow: CSSObject = {
  boxShadow:
    'inset 0 2px 4px color-mix(in srgb, oklch(27.8% 0.033 256.848) 50%, transparent), 0 1px 3px 0 oklch(98.5% 0.002 247.839)',
}

export const concreteTheme = responsiveFontSizes(
  createTheme({
    modularCssLayers: '@layer theme, base, mui, components, utilities;',
    cssVariables: {
      colorSchemeSelector: 'class',
    },
    colorSchemes: {
      light: {
        palette: {
          mode: 'light',
          background: {
            default: '#f3f3f3ff',
            paper: '#ebe5e5ff',
          },
        },
      },
      dark: {
        palette: {
          mode: 'dark',
          background: {
            default: '#39393bff',
            paper: '#414040ff',
          },
        },
      },
    },
    typography: {
      fontFamily: 'var(--font-Inter)',
    },
    components: {
      MuiPaper: {
        defaultProps: {
          elevation: 1,
        },
        styleOverrides: {
          elevation1: extrudedShadow,
        },
      },
      MuiAppBar: {
        defaultProps: {
          color: 'default',
          enableColorOnDark: true,
        },
      },
    },
  })
)

// Export the theme for use in the app
export default concreteTheme
