'use client'

import { themes } from '@/themes'
import { SITE_CONFIG } from '@/config/site'
import { extrudedShadow, carvedShadow } from '@/themes/concrete'
import { type Theme } from '@mui/material/styles'

// re-export the shadows
export { extrudedShadow, carvedShadow }

const theme = (themes[SITE_CONFIG.theme] || themes['ywybase']) as Theme

// Export the theme for use in the app
export default theme
