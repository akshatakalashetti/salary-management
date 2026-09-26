import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCreateLeaveRequest, useLeaveBalance, useLeaveRequests, useCancelLeaveRequest } from '../hooks/useLeave'
import { useEmployee, useUpdateEmployee } from '../hooks/useEmployees'

const LEAVE_TYPE_COLORS: Record<string, 'success' | 'primary' | 'warning' | 'info'> = {
  earned: 'success',
  flexi: 'primary',
  sick: 'warning',
  casual: 'info',
}

const LEAVE_STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>{children}</Box>
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {action}
        </Box>
        <Divider sx={{ mb: 1.5 }} />
        {children}
      </CardContent>
    </Card>
  )
}

export function MyProfilePage() {
  const { user } = useAuth()
  const employeeId = user?.employee_id ?? 0
  const { data: employee, isLoading, isError, error } = useEmployee(employeeId || undefined)
  const updateMutation = useUpdateEmployee(employeeId)

  const { data: leaveBalance } = useLeaveBalance()
  const { data: leaveRequests } = useLeaveRequests()
  const createLeaveMutation = useCreateLeaveRequest()
  const cancelLeaveMutation = useCancelLeaveRequest()

  const [editingAddress, setEditingAddress] = useState(false)
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingEmergency, setEditingEmergency] = useState(false)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'earned',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const [addressForm, setAddressForm] = useState({ address_street: '', address_city: '', address_state: '', address_postal_code: '' })
  const [personalForm, setPersonalForm] = useState({ phone: '', date_of_birth: '' })
  const [emergencyForm, setEmergencyForm] = useState({ emergency_contact_name: '', emergency_contact_phone: '' })

  function submitLeave() {
    createLeaveMutation.mutate(
      { leave_type: leaveForm.leave_type, start_date: leaveForm.start_date, end_date: leaveForm.end_date, reason: leaveForm.reason || undefined },
      { onSuccess: () => { setShowLeaveForm(false); setLeaveForm({ leave_type: 'earned', start_date: '', end_date: '', reason: '' }) } }
    )
  }

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

  function startEditing(section: 'address' | 'personal' | 'emergency') {
    if (section === 'address') {
      setAddressForm({
        address_street: employee!.address_street ?? '',
        address_city: employee!.address_city ?? '',
        address_state: employee!.address_state ?? '',
        address_postal_code: employee!.address_postal_code ?? '',
      })
      setEditingAddress(true)
    } else if (section === 'personal') {
      setPersonalForm({
        phone: employee!.phone ?? '',
        date_of_birth: employee!.date_of_birth ?? '',
      })
      setEditingPersonal(true)
    } else {
      setEmergencyForm({
        emergency_contact_name: employee!.emergency_contact_name ?? '',
        emergency_contact_phone: employee!.emergency_contact_phone ?? '',
      })
      setEditingEmergency(true)
    }
  }

  function saveSection(section: 'address' | 'personal' | 'emergency') {
    const payload = section === 'address' ? addressForm : section === 'personal' ? personalForm : emergencyForm
    updateMutation.mutate(payload as never, {
      onSuccess: () => {
        if (section === 'address') setEditingAddress(false)
        else if (section === 'personal') setEditingPersonal(false)
        else setEditingEmergency(false)
      },
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {employee.first_name} {employee.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {employee.role_title} · {employee.level} · {employee.department.name}
          </Typography>
        </Box>
        <Chip label={employee.status} color={employee.status === 'active' ? 'success' : 'default'} size="small" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Left column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Work info — read only */}
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

          {/* Personal info — editable */}
          <SectionCard
            title="Personal Information"
            action={
              !editingPersonal ? (
                <Button size="small" onClick={() => startEditing('personal')}>Edit</Button>
              ) : null
            }
          >
            {editingPersonal ? (
              <Stack spacing={1.5}>
                {updateMutation.isError ? <Alert severity="error">{(updateMutation.error as Error).message}</Alert> : null}
                <TextField label="Phone" size="small" value={personalForm.phone} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} />
                <TextField label="Date of Birth" type="date" size="small" value={personalForm.date_of_birth} onChange={(e) => setPersonalForm({ ...personalForm, date_of_birth: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" size="small" onClick={() => saveSection('personal')} disabled={updateMutation.isPending}>Save</Button>
                  <Button size="small" onClick={() => setEditingPersonal(false)}>Cancel</Button>
                </Stack>
              </Stack>
            ) : (
              <InfoGrid>
                <InfoRow label="Phone" value={employee.phone} />
                <InfoRow label="Date of Birth" value={employee.date_of_birth} />
              </InfoGrid>
            )}
          </SectionCard>

          {/* Address — editable */}
          <SectionCard
            title="Address"
            action={
              !editingAddress ? (
                <Button size="small" onClick={() => startEditing('address')}>Edit</Button>
              ) : null
            }
          >
            {editingAddress ? (
              <Stack spacing={1.5}>
                {updateMutation.isError ? <Alert severity="error">{(updateMutation.error as Error).message}</Alert> : null}
                <TextField label="Street" size="small" value={addressForm.address_street} onChange={(e) => setAddressForm({ ...addressForm, address_street: e.target.value })} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <TextField label="City" size="small" value={addressForm.address_city} onChange={(e) => setAddressForm({ ...addressForm, address_city: e.target.value })} />
                  <TextField label="State" size="small" value={addressForm.address_state} onChange={(e) => setAddressForm({ ...addressForm, address_state: e.target.value })} />
                  <TextField label="Postal Code" size="small" value={addressForm.address_postal_code} onChange={(e) => setAddressForm({ ...addressForm, address_postal_code: e.target.value })} />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" size="small" onClick={() => saveSection('address')} disabled={updateMutation.isPending}>Save</Button>
                  <Button size="small" onClick={() => setEditingAddress(false)}>Cancel</Button>
                </Stack>
              </Stack>
            ) : (
              <>
                <InfoRow label="Street" value={employee.address_street} />
                <InfoGrid>
                  <InfoRow label="City" value={employee.address_city} />
                  <InfoRow label="State / Province" value={employee.address_state} />
                  <InfoRow label="Postal Code" value={employee.address_postal_code} />
                  <InfoRow label="Country" value={employee.country.name} />
                </InfoGrid>
              </>
            )}
          </SectionCard>
        </Box>

        {/* Right column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Payroll — read only (sensitive; HR-managed) */}
          <SectionCard title="Payroll &amp; Compensation">
            <InfoGrid>
              <InfoRow
                label="Current Salary"
                value={employee.current_salary ? `${Number(employee.current_salary).toLocaleString()} ${employee.current_currency}` : null}
              />
              <InfoRow label="Pay Frequency" value={employee.pay_frequency} />
              <InfoRow label="Bank Account" value={employee.bank_last4 ? `•••• •••• •••• ${employee.bank_last4}` : null} />
              <InfoRow label="Tax ID" value={employee.tax_id ? '••••••••' : null} />
            </InfoGrid>
          </SectionCard>

          {/* Emergency contact — editable */}
          <SectionCard
            title="Emergency Contact"
            action={
              !editingEmergency ? (
                <Button size="small" onClick={() => startEditing('emergency')}>Edit</Button>
              ) : null
            }
          >
            {editingEmergency ? (
              <Stack spacing={1.5}>
                {updateMutation.isError ? <Alert severity="error">{(updateMutation.error as Error).message}</Alert> : null}
                <TextField label="Name" size="small" value={emergencyForm.emergency_contact_name} onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_name: e.target.value })} />
                <TextField label="Phone" size="small" value={emergencyForm.emergency_contact_phone} onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_phone: e.target.value })} />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" size="small" onClick={() => saveSection('emergency')} disabled={updateMutation.isPending}>Save</Button>
                  <Button size="small" onClick={() => setEditingEmergency(false)}>Cancel</Button>
                </Stack>
              </Stack>
            ) : (
              <InfoGrid>
                <InfoRow label="Name" value={employee.emergency_contact_name} />
                <InfoRow label="Phone" value={employee.emergency_contact_phone} />
              </InfoGrid>
            )}
          </SectionCard>

          {/* Leave section */}
          <SectionCard
            title="Leave"
            action={
              !showLeaveForm ? (
                <Button size="small" variant="contained" onClick={() => setShowLeaveForm(true)}>
                  Apply for Leave
                </Button>
              ) : null
            }
          >
            {/* Balance cards */}
            {leaveBalance && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                {leaveBalance.map((bal) => (
                  <Box key={bal.leave_type} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {bal.leave_type}
                      </Typography>
                      <Chip size="small" label={`${bal.available_days}/${bal.total_days}`} color={LEAVE_TYPE_COLORS[bal.leave_type] ?? 'default'} />
                    </Box>
                    <Tooltip title={`${bal.used_days} used · ${bal.pending_days} pending`}>
                      <LinearProgress
                        variant="determinate"
                        value={((bal.used_days + bal.pending_days) / bal.total_days) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                        color={LEAVE_TYPE_COLORS[bal.leave_type] ?? 'primary'}
                      />
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}

            {/* Apply form */}
            {showLeaveForm && (
              <Box sx={{ border: '1px solid', borderColor: 'primary.light', borderRadius: 1, p: 1.5, mb: 1.5, bgcolor: 'primary.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>New Leave Request</Typography>
                {createLeaveMutation.isError && <Alert severity="error" sx={{ mb: 1 }}>{(createLeaveMutation.error as Error).message}</Alert>}
                <Stack spacing={1}>
                  <TextField select size="small" label="Leave Type" value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                    {['earned', 'flexi', 'sick', 'casual'].map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
                  </TextField>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <TextField size="small" label="From" type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField size="small" label="To" type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                  </Box>
                  <TextField size="small" label="Reason (optional)" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" onClick={submitLeave} disabled={!leaveForm.start_date || !leaveForm.end_date || createLeaveMutation.isPending}>Submit</Button>
                    <Button size="small" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* Leave history */}
            {leaveRequests && leaveRequests.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{req.leave_type}</TableCell>
                        <TableCell>{req.start_date}</TableCell>
                        <TableCell>{req.end_date}</TableCell>
                        <TableCell>{req.days}</TableCell>
                        <TableCell>
                          <Chip size="small" label={req.status} color={LEAVE_STATUS_COLORS[req.status] ?? 'default'} />
                        </TableCell>
                        <TableCell>
                          {req.status === 'pending' && (
                            <Button size="small" color="error" onClick={() => cancelLeaveMutation.mutate(req.id)}>Cancel</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No leave requests yet.</Typography>
            )}
          </SectionCard>

          {/* Salary history — read only */}
          <SectionCard title="Salary History">
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
                  {sortedHistory.map((entry, idx) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.effective_date}
                        {idx === 0 ? <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} /> : null}
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
    </Box>
  )
}
