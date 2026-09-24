import { Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { GenderGapRow } from '../api/types'

export function GenderGapTable({ rows }: { rows: GenderGapRow[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Gender Pay Gap by Cohort ({rows.length})
      </Typography>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Cohort</TableCell>
              <TableCell>Higher Paid</TableCell>
              <TableCell>Lower Paid</TableCell>
              <TableCell align="right">Gap</TableCell>
              <TableCell>Headcount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.cohort_key}>
                <TableCell>{row.cohort_key}</TableCell>
                <TableCell>
                  {row.higher_gender} ({row.avg_by_gender[row.higher_gender]?.toLocaleString()})
                </TableCell>
                <TableCell>
                  {row.lower_gender} ({row.avg_by_gender[row.lower_gender]?.toLocaleString()})
                </TableCell>
                <TableCell align="right">
                  <Chip size="small" color="warning" label={`${(row.gap_pct * 100).toFixed(1)}%`} />
                </TableCell>
                <TableCell>
                  {Object.entries(row.count_by_gender)
                    .map(([g, n]) => `${g}: ${n}`)
                    .join(', ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
