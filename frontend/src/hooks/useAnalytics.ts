import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'

export function useAnalyticsSummary() {
  return useQuery({ queryKey: ['analytics', 'summary'], queryFn: analyticsApi.summary })
}

export function useByDepartment(countryId?: number) {
  return useQuery({
    queryKey: ['analytics', 'by-department', countryId],
    queryFn: () => analyticsApi.byDepartment(countryId),
  })
}

export function useByCountry(departmentId?: number) {
  return useQuery({
    queryKey: ['analytics', 'by-country', departmentId],
    queryFn: () => analyticsApi.byCountry(departmentId),
  })
}

export function useSalaryBands() {
  return useQuery({ queryKey: ['analytics', 'salary-bands'], queryFn: analyticsApi.salaryBands })
}

export function useOutliers(threshold: number) {
  return useQuery({
    queryKey: ['analytics', 'outliers', threshold],
    queryFn: () => analyticsApi.outliers(threshold),
  })
}

export function useGenderGap(threshold: number) {
  return useQuery({
    queryKey: ['analytics', 'gender-gap', threshold],
    queryFn: () => analyticsApi.genderGap(threshold),
  })
}
