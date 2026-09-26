import { api, buildQuery } from './client'
import type { AnalyticsSummary, CohortStats, GenderGapRow, OutlierRow } from './types'

export interface DeptHeadcount {
  department: string
  count: number
}

export const analyticsApi = {
  summary: (countryId?: number) =>
    api.get<AnalyticsSummary>(`/analytics/summary${buildQuery({ country_id: countryId })}`),
  headcountByDepartment: () => api.get<DeptHeadcount[]>('/analytics/headcount-by-department'),
  // country_id is required by the backend for these two: avg/median would
  // otherwise blend incompatible currencies across countries.
  byDepartment: (countryId: number) =>
    api.get<CohortStats[]>(`/analytics/by-department${buildQuery({ country_id: countryId })}`),
  byCountry: (departmentId?: number) =>
    api.get<CohortStats[]>(`/analytics/by-country${buildQuery({ department_id: departmentId })}`),
  salaryBands: (countryId: number) =>
    api.get<CohortStats[]>(`/analytics/salary-bands${buildQuery({ country_id: countryId })}`),
  outliers: (threshold?: number) =>
    api.get<OutlierRow[]>(`/analytics/pay-equity/outliers${buildQuery({ threshold })}`),
  genderGap: (threshold?: number) =>
    api.get<GenderGapRow[]>(`/analytics/pay-equity/gender-gap${buildQuery({ threshold })}`),
}
