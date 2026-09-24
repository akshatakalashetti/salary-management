import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { useAddSalaryHistory } from '../hooks/useEmployees'

const REASONS = ['raise', 'promotion', 'correction', 'adjustment']

interface Props {
  employeeId: number
  currentCurrency: string
  open: boolean
  onClose: () => void
}

export function SalaryHistoryDialog({ employeeId, currentCurrency, open, onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(currentCurrency)
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('raise')
  const mutation = useAddSalaryHistory(employeeId)

  function handleSubmit() {
    mutation.mutate(
      { amount, currency, effective_date: effectiveDate, reason },
      {
        onSuccess: () => {
          setAmount('')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Salary Change</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mutation.isError ? <Alert severity="error">{(mutation.error as Error).message}</Alert> : null}
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          <TextField
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            slotProps={{ htmlInput: { maxLength: 3 } }}
          />
          <TextField
            label="Effective Date"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!amount || !currency || mutation.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
