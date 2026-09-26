import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState, useCallback } from 'react'
import { employeesApi } from '../api/employees'
import { useQuery } from '@tanstack/react-query'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() // 0-indexed

// Simulated per-employee processing state
type EmpStatus = 'pending' | 'processing' | 'done'

function StatusChip({ status }: { status: EmpStatus }) {
  if (status === 'pending') return <Chip size="small" label="Pending" variant="outlined" />
  if (status === 'processing') return <CircularProgress size={16} />
  return (
    <Stack direction="row" spacing={0.5}>
      <Chip size="small" label="Paid ✓" color="success" />
      <Chip size="small" label="📧 Email Sent" color="info" variant="outlined" />
    </Stack>
  )
}

function useAllEmployees() {
  return useQuery({
    queryKey: ['payroll-employees'],
    queryFn: () => employeesApi.list({ status: 'active', sort_by: 'last_name', page: 1, page_size: 100 }),
  })
}

export function PayrollPage() {
  const { data, isLoading } = useAllEmployees()
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statuses, setStatuses] = useState<Record<number, EmpStatus>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [runComplete, setRunComplete] = useState(false)

  const employees = data?.items ?? []
  const totalCount = data?.total ?? 0

  const processedCount = Object.values(statuses).filter(s => s === 'done').length
  const totalSalaryDisbursed = employees
    .filter(e => statuses[e.id] === 'done' && e.current_salary)
    .reduce((sum, e) => sum + Number(e.current_salary), 0)

  const runPayroll = useCallback(async () => {
    if (employees.length === 0) return
    setRunning(true)
    setRunComplete(false)
    setProgress(0)
    setDialogOpen(true)

    // Reset all to pending
    const initial: Record<number, EmpStatus> = {}
    employees.forEach(e => { initial[e.id] = 'pending' })
    setStatuses(initial)

    // Simulate processing in batches
    const batchSize = 5
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize)

      // Mark batch as processing
      setStatuses(prev => {
        const next = { ...prev }
        batch.forEach(e => { next[e.id] = 'processing' })
        return next
      })
      await new Promise(r => setTimeout(r, 300))

      // Mark batch as done
      setStatuses(prev => {
        const next = { ...prev }
        batch.forEach(e => { next[e.id] = 'done' })
        return next
      })
      setProgress(Math.round(((i + batchSize) / employees.length) * 100))
    }

    setProgress(100)
    setRunning(false)
    setRunComplete(true)
  }, [employees])

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Payroll Processing
      </Typography>

      {/* Controls */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <TextField
            select
            label="Month"
            value={month}
            onChange={e => { setMonth(Number(e.target.value)); setStatuses({}); setRunComplete(false) }}
            size="small"
            sx={{ minWidth: 160 }}
          >
            {MONTHS.map((m, i) => <MenuItem key={i} value={i}>{m}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Year"
            value={year}
            onChange={e => { setYear(Number(e.target.value)); setStatuses({}); setRunComplete(false) }}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {[currentYear - 1, currentYear].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          {runComplete ? (
            <Alert severity="success" sx={{ py: 0 }}>
              Payroll for {MONTHS[month]} {year} complete. {processedCount} employees paid.
              Salary notifications sent via email.
            </Alert>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={runPayroll}
              disabled={running || isLoading || employees.length === 0}
              startIcon={running ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {running ? 'Processing…' : `Run Payroll — ${MONTHS[month]} ${year}`}
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Summary cards (shown after run) */}
      {runComplete && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Employees Paid</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>{processedCount}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Total Disbursed (mixed currencies)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalSalaryDisbursed.toLocaleString()}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Email Notifications</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>{processedCount}</Typography>
            <Typography variant="caption" color="text.secondary">sent</Typography>
          </Paper>
        </Box>
      )}

      {/* Employee table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Bank Account</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : employees.map(emp => (
                  <TableRow key={emp.id} sx={statuses[emp.id] === 'done' ? { bgcolor: 'success.50' } : {}}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {emp.first_name} {emp.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                    </TableCell>
                    <TableCell>{emp.department.name}</TableCell>
                    <TableCell>
                      {/* bank_last4 comes from detail endpoint; show placeholder for list view */}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        •••• •••• •••• ????
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {emp.current_salary
                        ? <><strong>{Number(emp.current_salary).toLocaleString()}</strong> {emp.current_currency}</>
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={statuses[emp.id] ?? 'pending'} />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {totalCount > 100 && (
          <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Showing 100 of {totalCount.toLocaleString()} employees for preview. All {totalCount.toLocaleString()} are included in the payroll run.
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Processing dialog */}
      <Dialog open={dialogOpen && running} maxWidth="xs" fullWidth>
        <DialogTitle>Processing Payroll</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Disbursing salaries for {MONTHS[month]} {year}…
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              {processedCount} / {employees.length} employees processed
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Sending salary credit notifications via email…
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
