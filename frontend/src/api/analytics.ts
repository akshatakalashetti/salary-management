import { api, buildQuery } from './client'
import type { AnalyticsSummary, CohortStats, GenderGapRow, OutlierRow } from './types'

export const analyticsApi = {
  summary: () => api.get<AnalyticsSummary>('/analytics/summary'),
  byDepartment: (countryId?: number) =>
    api.get<CohortStats[]>(`/analytics/by-department${buildQuery({ country_id: countryId })}`),
  byCountry: (departmentId?: number) =>
    api.get<CohortStats[]>(`/analytics/by-country${buildQuery({ department_id: departmentId })}`),
  salaryBands: () => api.get<CohortStats[]>('/analytics/salary-bands'),
  outliers: (threshold?: number) =>
    api.get<OutlierRow[]>(`/analytics/pay-equity/outliers${buildQuery({ threshold })}`),
  genderGap: (threshold?: number) =>
    api.get<GenderGapRow[]>(`/analytics/pay-equity/gender-gap${buildQuery({ threshold })}`),
}
