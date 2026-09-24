import { Box, MenuItem, TextField } from '@mui/material'
import { useDebouncedCallback } from 'use-debounce'
import { useCountries, useDepartments } from '../hooks/useReference'

export interface FilterState {
  search: string
  department_id: number | undefined
  country_id: number | undefined
  gender: string | undefined
  status: string
}

interface Props {
  filters: FilterState
  onChange: (next: FilterState) => void
}

export function EmployeeFilters({ filters, onChange }: Props) {
  const { data: departments } = useDepartments()
  const { data: countries } = useCountries()

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onChange({ ...filters, search: value })
  }, 300)

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      <TextField
        label="Search name, email, code"
        defaultValue={filters.search}
        onChange={(e) => debouncedSearch(e.target.value)}
        size="small"
        sx={{ minWidth: 260 }}
      />
      <TextField
        select
        label="Department"
        value={filters.department_id ?? ''}
        onChange={(e) =>
          onChange({ ...filters, department_id: e.target.value ? Number(e.target.value) : undefined })
        }
        size="small"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">All departments</MenuItem>
        {departments?.map((d) => (
          <MenuItem key={d.id} value={d.id}>
            {d.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Country"
        value={filters.country_id ?? ''}
        onChange={(e) =>
          onChange({ ...filters, country_id: e.target.value ? Number(e.target.value) : undefined })
        }
        size="small"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">All countries</MenuItem>
        {countries?.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Gender"
        value={filters.gender ?? ''}
        onChange={(e) => onChange({ ...filters, gender: e.target.value || undefined })}
        size="small"
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="female">Female</MenuItem>
        <MenuItem value="male">Male</MenuItem>
        <MenuItem value="other">Other</MenuItem>
      </TextField>
      <TextField
        select
        label="Status"
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        size="small"
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="terminated">Terminated</MenuItem>
      </TextField>
    </Box>
  )
}
