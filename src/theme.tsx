'use client'

import { themes } from '@/themes'
import { extrudedShadow, carvedShadow } from '@/themes/concrete'
import { createTheme } from '@mui/material/styles'
import { ywyGradients } from '@/themes/ywyGradients'

// re-export the shadows
export { extrudedShadow, carvedShadow }

const THEME_NAME = 'concrete'
const baseTheme = themes[THEME_NAME] ?? themes['ywybase']
const theme = createTheme(baseTheme, ywyGradients)

// Export the theme for use in the app
export default theme
