import { type ThemeOptions } from '@mui/material/styles'

/**
 * ywyGradients: ThemeOptions extension for global CSS variable gradients and text shadows.
 * To be merged into all themes via theme.tsx for consistent styleOverrides.
 */
export const ywyGradients: ThemeOptions = {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--gradient-primary': 'linear-gradient(90deg, #1976d2, #9c27b0)',
          '--gradient-primary-to-secondary':
            'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-secondary-main))',
          '--gradient-overlay-subtle': 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)',
          '--text-shadow-strong':
            '-1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 1px 1px 2px #000, 0 4px 8px rgba(0,0,0,0.9)',
          '--text-shadow-medium':
            '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.5)',
        },
      },
    },
  },
}
