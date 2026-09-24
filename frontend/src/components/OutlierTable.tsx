import { Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { OutlierRow } from '../api/types'

export function OutlierTable({ rows }: { rows: OutlierRow[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Individual Outliers ({rows.length})
      </Typography>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Cohort</TableCell>
              <TableCell align="right">Salary</TableCell>
              <TableCell align="right">Cohort Median</TableCell>
              <TableCell align="right">Deviation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.employee_id}>
                <TableCell>{row.employee_name}</TableCell>
                <TableCell>{row.cohort_key}</TableCell>
                <TableCell align="right">{row.salary.toLocaleString()}</TableCell>
                <TableCell align="right">{row.cohort_median.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    label={`${(row.deviation_pct * 100).toFixed(1)}%`}
                    color={row.direction === 'over' ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
