import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material'
import type { SalaryHistoryEntry } from '../api/types'

interface Props {
  history: SalaryHistoryEntry[]
  currentHistoryId: number | null
}

export function SalaryHistoryTable({ history, currentHistoryId }: Props) {
  const sorted = [...history].sort((a, b) => (a.effective_date < b.effective_date ? 1 : -1))

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Effective Date</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {entry.effective_date}
                {entry.id === currentHistoryId ? (
                  <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} />
                ) : null}
              </TableCell>
              <TableCell>
                {Number(entry.amount).toLocaleString()} {entry.currency}
              </TableCell>
              <TableCell>{entry.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
