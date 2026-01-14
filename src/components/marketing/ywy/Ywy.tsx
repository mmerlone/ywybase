import { Paper, Typography, Container, Box, Grid } from '@mui/material'

export function Ywy(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={6} alignItems="center">
        <Grid size={{ xs: 12, md: 5 }}>
          <Box
            component="img"
            src="/araucaria.jpg"
            alt="Araucaria Tree at Sunset"
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              display: 'block',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 4,
              position: 'relative',
              '&:after': {
                content: '""',
                display: 'block',
                width: 80,
                height: 4,
                background: 'var(--gradient-primary)',
                margin: '1rem 0 0',
                borderRadius: 2,
              },
            }}>
            Ywy
          </Typography>
          <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7, mb: 3 }}>
              The name YwyBase is rooted in the ancestral heritage of Araucária, Paraná, a city built atop the
              historical site of the village of Tindiqüera. In the Tupi-Guarani language family, Ywy (or Yvy) translates
              literally to &quot;earth,&quot; &quot;soil,&quot; or &quot;land&quot;—the most fundamental substrate upon
              which all life and structures are established. By adopting this term, the project honors the regional
              identity of its birthplace while symbolizing the high-performance, resilient &quot;ground&quot; provided
              to developers as a starting point for their applications.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              Beyond its linguistic origin, the name reflects the geological stability of the Paraná Shield (Escudo
              Paranaense), the ancient crystalline basement that has sustained the region&apos;s landscape for billions
              of years. Just as the Guarani concept of Ywyrupa represents a continuous terrestrial platform where
              interconnected communities thrive together, YwyBase serves as a unified, &quot;solid ground&quot; designed
              to support the weight of complex software ecosystems. The combination of the indigenous root for earth
              with the technical term &quot;Base&quot; signals a project that is both deeply rooted in history and
              engineered for modern scalability.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
