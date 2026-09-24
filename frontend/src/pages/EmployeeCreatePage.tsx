import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateEmployee } from '../hooks/useEmployees'
import { useCountries, useDepartments } from '../hooks/useReference'
import type { EmployeeCreateInput } from '../api/types'

const EMPTY_FORM: EmployeeCreateInput = {
  first_name: '',
  last_name: '',
  gender: 'female',
  email: '',
  department_id: 0,
  country_id: 0,
  role_title: '',
  level: 'L1',
  hire_date: new Date().toISOString().slice(0, 10),
  starting_salary: '',
  currency: '',
}

export function EmployeeCreatePage() {
  const navigate = useNavigate()
  const { data: departments } = useDepartments()
  const { data: countries } = useCountries()
  const mutation = useCreateEmployee()
  const [form, setForm] = useState<EmployeeCreateInput>(EMPTY_FORM)

  function set<K extends keyof EmployeeCreateInput>(key: K, value: EmployeeCreateInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCountryChange(countryId: number) {
    const country = countries?.find((c) => c.id === countryId)
    setForm((prev) => ({ ...prev, country_id: countryId, currency: country?.currency_code ?? prev.currency }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form, {
      onSuccess: (created) => navigate(`/employees/${created.id}`),
    })
  }

  const isValid =
    form.first_name && form.last_name && form.email && form.department_id && form.country_id &&
    form.role_title && form.level && form.hire_date && form.starting_salary && form.currency

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Add Employee
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }} component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {mutation.isError ? <Alert severity="error">{(mutation.error as Error).message}</Alert> : null}
          <TextField
            label="First Name"
            required
            value={form.first_name}
            onChange={(e) => set('first_name', e.target.value)}
          />
          <TextField
            label="Last Name"
            required
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <TextField select label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            select
            label="Department"
            required
            value={form.department_id || ''}
            onChange={(e) => set('department_id', Number(e.target.value))}
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
            required
            value={form.country_id || ''}
            onChange={(e) => handleCountryChange(Number(e.target.value))}
          >
            {countries?.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Role Title"
            required
            value={form.role_title}
            onChange={(e) => set('role_title', e.target.value)}
          />
          <TextField label="Level" required value={form.level} onChange={(e) => set('level', e.target.value)} />
          <TextField
            label="Hire Date"
            type="date"
            required
            value={form.hire_date}
            onChange={(e) => set('hire_date', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Starting Salary"
            type="number"
            required
            value={form.starting_salary}
            onChange={(e) => set('starting_salary', e.target.value)}
          />
          <TextField
            label="Currency"
            required
            value={form.currency}
            onChange={(e) => set('currency', e.target.value.toUpperCase())}
            slotProps={{ htmlInput: { maxLength: 3 } }}
          />
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" disabled={!isValid || mutation.isPending}>
              Create Employee
            </Button>
            <Button onClick={() => navigate('/employees')}>Cancel</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
