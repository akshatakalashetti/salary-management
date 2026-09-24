import { Alert, Box, Slider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { GenderGapTable } from '../components/GenderGapTable'
import { OutlierTable } from '../components/OutlierTable'
import { useGenderGap, useOutliers } from '../hooks/useAnalytics'

export function EquityPage() {
  const [outlierThreshold, setOutlierThreshold] = useState(0.2)
  const [gapThreshold, setGapThreshold] = useState(0.1)

  const { data: outliers, isLoading: outliersLoading } = useOutliers(outlierThreshold)
  const { data: genderGaps, isLoading: gapsLoading } = useGenderGap(gapThreshold)

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        Pay Equity
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Flags are relative to each employee&apos;s own cohort (department + level + country, so
        currencies are never mixed) -- an employee is flagged if their salary deviates from their
        cohort&apos;s median by more than the threshold below. Cohorts smaller than 3 people are
        skipped to avoid noisy results from tiny samples.
      </Alert>

      <Stack direction="row" spacing={6} sx={{ mb: 3, maxWidth: 700 }}>
        <Box sx={{ flex: 1 }}>
          <Typography gutterBottom>Outlier threshold: {(outlierThreshold * 100).toFixed(0)}%</Typography>
          <Slider
            value={outlierThreshold}
            onChange={(_e, v) => setOutlierThreshold(v as number)}
            min={0.05}
            max={0.6}
            step={0.05}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography gutterBottom>Gender gap threshold: {(gapThreshold * 100).toFixed(0)}%</Typography>
          <Slider
            value={gapThreshold}
            onChange={(_e, v) => setGapThreshold(v as number)}
            min={0.05}
            max={0.5}
            step={0.05}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
          />
        </Box>
      </Stack>

      <Stack spacing={3}>
        {!outliersLoading && <OutlierTable rows={outliers ?? []} />}
        {!gapsLoading && <GenderGapTable rows={genderGaps ?? []} />}
      </Stack>
    </Box>
  )
}
