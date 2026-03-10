'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { AppBar, Box, Button, Skeleton, Toolbar, Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { filterNavItemsByRole } from '@/config/routes'
import { normalizeUserRole } from '@/lib/utils/role-utils'

import { LogoIcon } from '../icons/logo'

import { SITE_CONFIG } from '@/config/site'

const ThemeToggle = dynamic(() => import('./ThemeToggle').then((m) => m.ThemeToggle), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" width={106} height={36} sx={{ borderRadius: 1 }} />,
})

const UserMenu = dynamic(() => import('../auth/UserMenu').then((m) => m.UserMenu), {
  ssr: false,
  loading: () => <Skeleton variant="circular" width={32} height={32} sx={{ ml: 2 }} />,
})

interface HeaderProps {
  supabaseEnabled?: boolean
}

export function Header({ supabaseEnabled = true }: HeaderProps): ReactElement {
  const siteName = SITE_CONFIG.name
  const isFixed = SITE_CONFIG.layout.fixedHeader
  const { authUser } = useAuthContext()
  const userRole = normalizeUserRole(authUser?.app_metadata?.role)
  const navigationItems = filterNavItemsByRole(SITE_CONFIG.navigation, userRole)

  return (
    <AppBar position={isFixed ? 'sticky' : 'static'} elevation={2}>
      <Toolbar>
        <LogoIcon />
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: '.1rem',
          }}>
          {siteName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navigationItems.map((navItem) => {
            return (
              <Button
                component={Link}
                href={navItem.link}
                target={navItem?.target}
                color="inherit"
                key={navItem.label}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}>
                {navItem.label}
              </Button>
            )
          })}
          <ThemeToggle />
          {supabaseEnabled && <UserMenu />}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
