import { Star } from '@mui/icons-material'
import { Box, Card, CardContent, Typography } from '@mui/material'

export type Feature = {
  icon: React.ReactNode
  title: string
  description: string
  span?: 1 | 2 | 3
  isHighlighted?: boolean
}

export function FeatureCard({ feature }: { feature: Feature }): JSX.Element {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...(feature.isHighlighted === true && {
          border: '1px solid color-mix(in srgb, var(--mui-palette-primary-main) 20%, transparent)',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'var(--gradient-primary-to-secondary)',
          },
        }),
      }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'row', gap: 2 }}>
        <Box
          sx={{
            display: 'inline-flex',
            flex: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            mb: 3,
            '& svg': {
              width: 28,
              height: 28,
            },
          }}>
          {feature.icon}
        </Box>
        <div>
          <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 1 }}>
            {feature.title}
            {feature.isHighlighted === true && (
              <Star color="primary" sx={{ ml: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {feature.description}
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}
