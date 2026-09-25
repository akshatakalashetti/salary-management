import { api, BASE_URL, buildQuery } from './client'
import type {
  EmployeeCreateInput,
  EmployeeDetail,
  EmployeeListParams,
  EmployeeListResponse,
  SalaryHistoryCreateInput,
  SalaryHistoryEntry,
} from './types'

export type EmployeeExportParams = Pick<
  EmployeeListParams,
  'search' | 'department_id' | 'country_id' | 'gender' | 'level' | 'status'
>

export const employeesApi = {
  list: (params: EmployeeListParams) =>
    api.get<EmployeeListResponse>(`/employees${buildQuery({ ...params })}`),
  // Not a fetch() call: exporting is a browser-native file download (the
  // server sends Content-Disposition: attachment), so callers just navigate
  // to this URL rather than parsing a JSON response.
  exportCsvUrl: (params: EmployeeExportParams) => `${BASE_URL}/employees/export${buildQuery({ ...params })}`,
  get: (id: number) => api.get<EmployeeDetail>(`/employees/${id}`),
  create: (input: EmployeeCreateInput) => api.post<EmployeeDetail>('/employees', input),
  update: (id: number, input: Partial<EmployeeCreateInput> & { status?: string }) =>
    api.put<EmployeeDetail>(`/employees/${id}`, input),
  remove: (id: number) => api.delete<EmployeeDetail>(`/employees/${id}`),
  addSalaryHistory: (id: number, input: SalaryHistoryCreateInput) =>
    api.post<SalaryHistoryEntry>(`/employees/${id}/salary-history`, input),
}
