import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SalaryHistoryDialog } from '../components/SalaryHistoryDialog'
import { useDeleteEmployee, useEmployee, useUpdateEmployee } from '../hooks/useEmployees'
import { useCountries, useDepartments } from '../hooks/useReference'

function currentHistoryId(history: { id: number; effective_date: string }[]): number | null {
  const today = new Date().toISOString().slice(0, 10)
  const eligible = history.filter((h) => h.effective_date <= today)
  if (eligible.length === 0) return null
  return eligible.reduce((latest, h) => (h.effective_date > latest.effective_date ? h : latest)).id
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>{value ?? '—'}</Typography>
    </Box>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>{children}</Box>
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card variant="outlined" sx={{ mb: 0 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{title}</Typography>
          {action}
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        {children}
      </CardContent>
    </Card>
  )
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (isError) return <Alert severity="error">{(error as Error).message}</Alert>
  if (!employee) return null

  const sortedHistory = [...employee.salary_history].sort((a, b) =>
    a.effective_date < b.effective_date ? 1 : -1,
  )

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
      {/* Back button + header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/employees')}
          sx={{ color: 'text.secondary', fontWeight: 500, pl: 0.5, pr: 1.5 }}
        >
          Back
        </Button>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {employee.first_name} {employee.last_name}
            </Typography>
            <Chip
              label={employee.status}
              size="small"
              color={employee.status === 'active' ? 'success' : 'default'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {employee.role_title} · {employee.level} · {employee.department.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {employee.status === 'active' && (
            <Button color="error" size="small" variant="outlined" onClick={handleDelete}>
              Mark Terminated
            </Button>
          )}
          {!editing && (
            <Button variant="contained" size="small" onClick={startEditing}>
              Edit
            </Button>
          )}
        </Stack>
      </Box>

      {/* Edit form (inline, replaces card grid while editing) */}
      {editing && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Editing Work Information</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="First Name" size="small" value={form.first_name ?? ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <TextField label="Last Name" size="small" value={form.last_name ?? ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <TextField label="Role Title" size="small" value={form.role_title ?? ''} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
              <TextField label="Level" size="small" value={form.level ?? ''} onChange={(e) => setForm({ ...form, level: e.target.value })} />
              <TextField select label="Department" size="small" value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })}>
                {!departments ? <MenuItem value="">Loading…</MenuItem> : null}
                {departments?.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField select label="Country" size="small" value={form.country_id ?? ''} onChange={(e) => setForm({ ...form, country_id: Number(e.target.value) })}>
                {!countries ? <MenuItem value="">Loading…</MenuItem> : null}
                {countries?.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Box>
            {updateMutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{(updateMutation.error as Error).message}</Alert>}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" size="small" onClick={saveEdit} disabled={updateMutation.isPending}>Save Changes</Button>
              <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Profile sections — same layout as My Profile */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Left column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SectionCard title="Work Information">
            <InfoGrid>
              <InfoRow label="Employee Code" value={employee.employee_code} />
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Department" value={employee.department.name} />
              <InfoRow label="Country" value={employee.country.name} />
              <InfoRow label="Role" value={employee.role_title} />
              <InfoRow label="Level" value={employee.level} />
              <InfoRow label="Hire Date" value={employee.hire_date} />
              <InfoRow label="Gender" value={employee.gender} />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Personal Information">
            <InfoGrid>
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Date of Birth" value={employee.date_of_birth} />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Address">
            <InfoRow label="Street" value={employee.address_street} />
            <InfoGrid>
              <InfoRow label="City" value={employee.address_city} />
              <InfoRow label="State / Province" value={employee.address_state} />
              <InfoRow label="Postal Code" value={employee.address_postal_code} />
              <InfoRow label="Country" value={employee.country.name} />
            </InfoGrid>
          </SectionCard>
        </Box>

        {/* Right column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SectionCard title="Payroll & Compensation">
            <InfoGrid>
              <InfoRow
                label="Current Salary"
                value={employee.current_salary ? `${Number(employee.current_salary).toLocaleString()} ${employee.current_currency}` : null}
              />
              <InfoRow label="Pay Frequency" value={employee.pay_frequency} />
              <InfoRow label="Bank Account" value={employee.bank_last4 ? `•••• •••• •••• ${employee.bank_last4}` : null} />
              <InfoRow label="Tax ID" value={employee.tax_id} />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Emergency Contact">
            <InfoGrid>
              <InfoRow label="Name" value={employee.emergency_contact_name} />
              <InfoRow label="Phone" value={employee.emergency_contact_phone} />
            </InfoGrid>
          </SectionCard>

          <SectionCard
            title="Salary History"
            action={
              <Button variant="outlined" size="small" onClick={() => setSalaryDialogOpen(true)}>
                Add Change
              </Button>
            }
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Effective Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.effective_date}
                        {entry.id === currentId ? (
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
          </SectionCard>
        </Box>
      </Box>

      <SalaryHistoryDialog
        employeeId={employeeId}
        currentCurrency={employee.current_currency ?? 'USD'}
        open={salaryDialogOpen}
        onClose={() => setSalaryDialogOpen(false)}
      />
    </Box>
  )
}
