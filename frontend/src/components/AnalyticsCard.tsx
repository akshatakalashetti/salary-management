import { Paper, Typography } from '@mui/material'

interface Props {
  label: string
  value: string
}

export function AnalyticsCard({ label, value }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, minWidth: 180 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={600}>
        {value}
      </Typography>
    </Paper>
  )
}
