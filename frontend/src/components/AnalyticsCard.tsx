import { Box, Paper, Typography } from '@mui/material'

interface Props {
  label: string
  value: string
  icon?: string
  accent?: string
}

export function AnalyticsCard({ label, value, icon = '📊', accent = '#4F46E5' }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        minWidth: 180,
        flex: 1,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${accent}08 0%, transparent 100%)`,
        borderColor: `${accent}30`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: '100%',
          backgroundColor: accent,
          borderRadius: '3px 0 0 3px',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ fontSize: '1.6rem', opacity: 0.8 }}>{icon}</Box>
      </Box>
    </Paper>
  )
}
