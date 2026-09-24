import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { CohortStats } from '../api/types'

export function CohortStatsTable({ title, keyLabel, data }: { title: string; keyLabel: string; data: CohortStats[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{keyLabel}</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">Median</TableCell>
              <TableCell align="right">Avg</TableCell>
              <TableCell align="right">P25</TableCell>
              <TableCell align="right">P75</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Max</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.key}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
                <TableCell align="right">{row.median.toLocaleString()}</TableCell>
                <TableCell align="right">{row.avg.toLocaleString()}</TableCell>
                <TableCell align="right">{row.p25.toLocaleString()}</TableCell>
                <TableCell align="right">{row.p75.toLocaleString()}</TableCell>
                <TableCell align="right">{row.min.toLocaleString()}</TableCell>
                <TableCell align="right">{row.max.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
