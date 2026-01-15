'use client'

import { themes } from '@/themes'
import { SITE_CONFIG } from '@/config/site'
import { extrudedShadow, carvedShadow } from '@/themes/concrete'
import { type Theme, createTheme, ThemeOptions } from '@mui/material/styles'
import { ywyGradients } from '@/themes/ywyGradients'

// re-export the shadows
export { extrudedShadow, carvedShadow }

// Merge ywyGradients into the selected theme using createTheme for extensibility
const baseTheme = (themes[SITE_CONFIG.theme] || themes['ywybase']) as Theme
const theme = createTheme(baseTheme as ThemeOptions, ywyGradients)

// Export the theme for use in the app
export default theme
