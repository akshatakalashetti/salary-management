import { Alert, Box, Card, CardContent, Chip, LinearProgress, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { AnalyticsBarChart } from '../components/AnalyticsBarChart'
import { AnalyticsCard } from '../components/AnalyticsCard'
import { CohortStatsTable } from '../components/CohortStatsTable'
import { useAnalyticsSummary, useByCountry, useByDepartment, useHeadcountByDepartment, useSalaryBands } from '../hooks/useAnalytics'
import { useCountries } from '../hooks/useReference'

export function AnalyticsPage() {
  const { data: countries } = useCountries()
  const [selectedCountryId, setSelectedCountryId] = useState<number | undefined>(undefined)
  // Default to the first country once the reference list loads, without a
  // setState-in-effect render cascade: derive it during render instead.
  const countryId = selectedCountryId ?? countries?.[0]?.id

  const { data: summary } = useAnalyticsSummary(countryId)
  const { data: byCountry } = useByCountry()
  const { data: byDepartment } = useByDepartment(countryId)
  const { data: salaryBands } = useSalaryBands(countryId)
  const { data: headcountByDept } = useHeadcountByDepartment()
  const selectedCountry = countries?.find((c) => c.id === countryId)
  const totalHeadcount = headcountByDept?.reduce((s, d) => s + d.count, 0) ?? 1

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Pay Analytics
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <AnalyticsCard label="Total Headcount" value={summary ? summary.headcount.toLocaleString() : '—'} icon="👥" accent="#4F46E5" />
        <AnalyticsCard
          label={`Median Salary${selectedCountry ? ` (${selectedCountry.currency_code})` : ' — select a country'}`}
          value={summary?.median_salary != null ? summary.median_salary.toLocaleString() : '—'}
          icon="📊"
          accent="#10B981"
        />
        <AnalyticsCard
          label={`Average Salary${selectedCountry ? ` (${selectedCountry.currency_code})` : ' — select a country'}`}
          value={summary?.avg_salary != null ? summary.avg_salary.toLocaleString() : '—'}
          icon="💰"
          accent="#F59E0B"
        />
      </Stack>

      {/* Headcount by department — currency-independent, always valid */}
      {headcountByDept && headcountByDept.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Headcount by Department ({totalHeadcount} active employees)
            </Typography>
            <Stack spacing={1}>
              {headcountByDept.map((dept) => {
                const pct = Math.round((dept.count / totalHeadcount) * 100)
                return (
                  <Box key={dept.department}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography variant="body2">{dept.department}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                        <Chip size="small" label={dept.count} variant="outlined" />
                      </Box>
                    </Box>
                    <Tooltip title={`${dept.count} employees (${pct}%)`}>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
                    </Tooltip>
                  </Box>
                )
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Salaries are stored in local currency and are not converted to a common currency, so
        department/level breakdowns are scoped to one country at a time to avoid blending
        incompatible currencies. Comparing pay across countries (below) is safe because each row is
        a single currency.
      </Alert>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Median &amp; Average Salary by Country
      </Typography>
      <Box sx={{ mb: 1 }}>
        <AnalyticsBarChart title="By Country" data={byCountry ?? []} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
        Each bar is in that country&apos;s own local currency (no FX conversion) -- bar heights are
        not directly comparable across countries; use this to see relative pay levels within a
        country, not to rank countries by pay.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Department &amp; Level Breakdown</Typography>
        {countries && countries.length > 0 ? (
          <TextField
            select
            label="Country"
            size="small"
            value={countryId ?? ''}
            onChange={(e) => setSelectedCountryId(Number(e.target.value))}
            sx={{ minWidth: 200 }}
          >
            {countries.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({c.currency_code})
              </MenuItem>
            ))}
          </TextField>
        ) : null}
      </Box>

      <Stack spacing={2}>
        <CohortStatsTable title="By Department" keyLabel="Department" data={byDepartment ?? []} />
        <CohortStatsTable title="Salary Bands By Level" keyLabel="Level" data={salaryBands ?? []} />
      </Stack>
    </Box>
  )
}
