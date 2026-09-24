import { api, buildQuery } from './client'
import type {
  EmployeeCreateInput,
  EmployeeDetail,
  EmployeeListParams,
  EmployeeListResponse,
  SalaryHistoryCreateInput,
  SalaryHistoryEntry,
} from './types'

export const employeesApi = {
  list: (params: EmployeeListParams) =>
    api.get<EmployeeListResponse>(`/employees${buildQuery(params)}`),
  get: (id: number) => api.get<EmployeeDetail>(`/employees/${id}`),
  create: (input: EmployeeCreateInput) => api.post<EmployeeDetail>('/employees', input),
  update: (id: number, input: Partial<EmployeeCreateInput> & { status?: string }) =>
    api.put<EmployeeDetail>(`/employees/${id}`, input),
  remove: (id: number) => api.delete<EmployeeDetail>(`/employees/${id}`),
  addSalaryHistory: (id: number, input: SalaryHistoryCreateInput) =>
    api.post<SalaryHistoryEntry>(`/employees/${id}/salary-history`, input),
}
