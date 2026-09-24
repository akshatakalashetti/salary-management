import { Alert, Box, Button, Chip, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmployeeFilters, type FilterState } from '../components/EmployeeFilters'
import { useEmployees } from '../hooks/useEmployees'
import type { EmployeeListItem } from '../api/types'

const DEFAULT_FILTERS: FilterState = {
  search: '',
  department_id: undefined,
  country_id: undefined,
  gender: undefined,
  status: 'active',
}

// Only columns backed by a backend-supported sort_by value are sortable --
// the rest visually would show a sort arrow that silently does nothing.
const columns: GridColDef<EmployeeListItem>[] = [
  { field: 'employee_code', headerName: 'Code', width: 110, sortable: false },
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => `${row.first_name} ${row.last_name}`,
  },
  {
    field: 'department',
    headerName: 'Department',
    width: 150,
    sortable: false,
    valueGetter: (_v, row) => row.department.name,
  },
  {
    field: 'country',
    headerName: 'Country',
    width: 140,
    sortable: false,
    valueGetter: (_v, row) => row.country.name,
  },
  { field: 'role_title', headerName: 'Role', width: 180, sortable: false },
  { field: 'level', headerName: 'Level', width: 90, sortable: false },
  {
    field: 'current_salary',
    headerName: 'Current Salary',
    width: 160,
    valueGetter: (_v, row) =>
      row.current_salary ? `${Number(row.current_salary).toLocaleString()} ${row.current_currency}` : '—',
  },
  { field: 'status', headerName: 'Status', width: 110, sortable: false },
]

export function EmployeeListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0) // MUI DataGrid pages are 0-indexed
  const [pageSize, setPageSize] = useState(25)
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }])

  const sortBy = sortModel[0]?.field === 'name' ? 'last_name' : (sortModel[0]?.field ?? 'last_name')
  const sortDir = sortModel[0]?.sort ?? 'asc'

  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      department_id: filters.department_id,
      country_id: filters.country_id,
      gender: filters.gender,
      status: filters.status,
      sort_by: sortBy,
      sort_dir: sortDir as 'asc' | 'desc',
      page: page + 1,
      page_size: pageSize,
    }),
    [filters, sortBy, sortDir, page, pageSize],
  )

  const { data, isLoading, isError, error } = useEmployees(queryParams)

  function handleFiltersChange(next: FilterState) {
    setFilters(next)
    setPage(0)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Employees
          {data ? (
            <Chip label={`${data.total.toLocaleString()} total`} size="small" sx={{ ml: 1.5 }} />
          ) : null}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/employees/new')}>
          Add Employee
        </Button>
      </Box>

      <EmployeeFilters filters={filters} onChange={handleFiltersChange} />

      {isError ? <Alert severity="error">{(error as Error).message}</Alert> : null}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        <DataGrid
          autoHeight
          rows={data?.items ?? []}
          rowCount={data?.total ?? 0}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          sortingMode="server"
          filterMode="server"
          disableColumnFilter
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          pageSizeOptions={[25, 50, 100]}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          onRowClick={(params) => navigate(`/employees/${params.id}`)}
          sx={{ cursor: 'pointer' }}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  )
}
