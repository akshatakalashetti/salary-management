import { BarChart } from '@mui/x-charts/BarChart'
import { Paper, Typography } from '@mui/material'
import type { CohortStats } from '../api/types'

interface Props {
  title: string
  data: CohortStats[]
}

export function AnalyticsBarChart({ title, data }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 320 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <BarChart
        dataset={data as unknown as Record<string, unknown>[]}
        xAxis={[{ scaleType: 'band', dataKey: 'key' }]}
        series={[
          { dataKey: 'median', label: 'Median' },
          { dataKey: 'avg', label: 'Average' },
        ]}
        height={300}
      />
    </Paper>
  )
}
