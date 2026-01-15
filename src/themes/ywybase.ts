import { createTheme, responsiveFontSizes } from '@mui/material/styles'

const theme = responsiveFontSizes(
  createTheme({
    // MUI 7.3 enables CSS variables by default to prevent theme flickering
    cssVariables: {
      colorSchemeSelector: 'class',
    },
    // Components: (styleOverrides for gradients now merged globally in theme.tsx)
    components: {},
    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: '#5D4037', // Deep Terra Roxa
            light: '#8D6E63',
            dark: '#3E2723',
            contrastText: '#fff',
          },
          secondary: {
            main: '#2D4F1E', // Araucaria Pine Green
            light: '#567A46',
            dark: '#1A330F',
          },
          warning: {
            main: '#E64A19', // Pinhão Orange
          },
          background: {
            default: '#FDFBFA', // Warm "Mineral" white
            paper: '#FFFFFF',
          },
          text: {
            primary: '#1A1614', // Deep Obsidian
            secondary: '#5D4037',
          },
        },
      },
      dark: {
        palette: {
          primary: {
            main: '#A1887F', // Desaturated Earth for readability
            light: '#D7CCC8',
            dark: '#5D4037',
            contrastText: '#1A1614',
          },
          secondary: {
            main: '#81C784', // Brightened Forest Green
            light: '#A5D6A7',
            dark: '#2E7D32',
          },
          warning: {
            main: '#FF7043', // Vibrant Pinhão
          },
          background: {
            default: '#12100E', // Deep Basalt
            paper: '#1A1715', // Shield Granite
          },
          text: {
            primary: '#EEEBE9',
            secondary: '#BCAAA4',
          },
        },
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
    },
    shape: {
      borderRadius: 8, // Modern, slightly rounded "structural" feel
    },
    // Custom theme extensions for gradients and effects
    gradients: {
      primary: 'linear-gradient(90deg, #1976d2, #9c27b0)',
      primaryToSecondary: 'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-secondary-main))',
      fadeToBackground: 'linear-gradient(to bottom, transparent, var(--mui-palette-background-default))',
      overlaySubtle: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)',
    },
    effects: {
      textShadow: {
        strong: '-1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 1px 1px 2px #000, 0 4px 8px rgba(0,0,0,0.9)',
        medium: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.5)',
      },
    },
  })
)

export default theme
