import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SalaryHistoryDialog } from '../components/SalaryHistoryDialog'
import { SalaryHistoryTable } from '../components/SalaryHistoryTable'
import { useDeleteEmployee, useEmployee, useUpdateEmployee } from '../hooks/useEmployees'
import { useCountries, useDepartments } from '../hooks/useReference'

function currentHistoryId(history: { id: number; effective_date: string }[]): number | null {
  const today = new Date().toISOString().slice(0, 10)
  const eligible = history.filter((h) => h.effective_date <= today)
  if (eligible.length === 0) return null
  return eligible.reduce((latest, h) => (h.effective_date > latest.effective_date ? h : latest)).id
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)
  const navigate = useNavigate()
  const { data: employee, isLoading, isError, error } = useEmployee(employeeId)
  const { data: departments } = useDepartments()
  const { data: countries } = useCountries()
  const updateMutation = useUpdateEmployee(employeeId)
  const deleteMutation = useDeleteEmployee()
  const [editing, setEditing] = useState(false)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [form, setForm] = useState<Record<string, string | number>>({})

  const currentId = useMemo(() => (employee ? currentHistoryId(employee.salary_history) : null), [employee])

  if (isLoading) return <CircularProgress />
  if (isError) return <Alert severity="error">{(error as Error).message}</Alert>
  if (!employee) return null

  function startEditing() {
    setForm({
      first_name: employee!.first_name,
      last_name: employee!.last_name,
      role_title: employee!.role_title,
      level: employee!.level,
      department_id: employee!.department.id,
      country_id: employee!.country.id,
    })
    setEditing(true)
  }

  function saveEdit() {
    updateMutation.mutate(form as never, { onSuccess: () => setEditing(false) })
  }

  function handleDelete() {
    if (!confirm(`Mark ${employee!.first_name} ${employee!.last_name} as terminated?`)) return
    deleteMutation.mutate(employeeId, { onSuccess: () => navigate('/employees') })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {employee.first_name} {employee.last_name}{' '}
          <Chip
            label={employee.status}
            size="small"
            color={employee.status === 'active' ? 'success' : 'default'}
          />
        </Typography>
        <Stack direction="row" spacing={1}>
          {!editing && <Button onClick={startEditing}>Edit</Button>}
          {employee.status === 'active' && (
            <Button color="error" onClick={handleDelete}>
              Mark Terminated
            </Button>
          )}
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        {editing ? (
          <Stack spacing={2} sx={{ maxWidth: 420 }}>
            <TextField
              label="First Name"
              value={form.first_name ?? ''}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
            <TextField
              label="Last Name"
              value={form.last_name ?? ''}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
            <TextField
              label="Role Title"
              value={form.role_title ?? ''}
              onChange={(e) => setForm({ ...form, role_title: e.target.value })}
            />
            <TextField
              label="Level"
              value={form.level ?? ''}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            />
            <TextField
              select
              label="Department"
              value={form.department_id ?? ''}
              onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })}
            >
              {departments?.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Country"
              value={form.country_id ?? ''}
              onChange={(e) => setForm({ ...form, country_id: Number(e.target.value) })}
            >
              {countries?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            {updateMutation.isError ? (
              <Alert severity="error">{(updateMutation.error as Error).message}</Alert>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={saveEdit} disabled={updateMutation.isPending}>
                Save
              </Button>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={0.5}>
            <Typography>
              <strong>Employee Code:</strong> {employee.employee_code}
            </Typography>
            <Typography>
              <strong>Email:</strong> {employee.email}
            </Typography>
            <Typography>
              <strong>Department:</strong> {employee.department.name}
            </Typography>
            <Typography>
              <strong>Country:</strong> {employee.country.name}
            </Typography>
            <Typography>
              <strong>Role:</strong> {employee.role_title} ({employee.level})
            </Typography>
            <Typography>
              <strong>Hire Date:</strong> {employee.hire_date}
            </Typography>
            <Typography>
              <strong>Current Salary:</strong>{' '}
              {employee.current_salary
                ? `${Number(employee.current_salary).toLocaleString()} ${employee.current_currency}`
                : '—'}
            </Typography>
          </Stack>
        )}
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Salary History</Typography>
        <Button variant="outlined" onClick={() => setSalaryDialogOpen(true)}>
          Add Salary Change
        </Button>
      </Box>
      <SalaryHistoryTable history={employee.salary_history} currentHistoryId={currentId} />

      <SalaryHistoryDialog
        employeeId={employeeId}
        currentCurrency={employee.current_currency ?? 'USD'}
        open={salaryDialogOpen}
        onClose={() => setSalaryDialogOpen(false)}
      />
    </Box>
  )
}
