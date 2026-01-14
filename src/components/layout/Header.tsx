import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import Link from 'next/link'

import { UserMenu } from '../auth/UserMenu'
import { LogoIcon } from '../icons/logo'

import { ThemeToggle } from './ThemeToggle'

import { SITE_CONFIG } from '@/config/site'

export function Header(): JSX.Element {
  return (
    <AppBar position={SITE_CONFIG.layout.fixedHeader ? 'sticky' : 'static'} elevation={2}>
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
          {SITE_CONFIG.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {SITE_CONFIG.navigation.map((navItem) => {
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
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
