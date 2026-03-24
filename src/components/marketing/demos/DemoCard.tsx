import type { ReactElement } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardActions, Button, Typography } from '@mui/material'

export type Demo = {
  title: string
  description: string
  href: string
}

interface DemoCardProps {
  demo: Demo
}

export function DemoCard({ demo }: DemoCardProps): ReactElement {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {demo.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {demo.description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button component={Link} href={demo.href} variant="contained">
          Open Demo
        </Button>
      </CardActions>
    </Card>
  )
}
