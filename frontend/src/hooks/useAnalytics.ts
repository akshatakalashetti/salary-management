import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'

export function useAnalyticsSummary(countryId?: number) {
  return useQuery({
    queryKey: ['analytics', 'summary', countryId],
    queryFn: () => analyticsApi.summary(countryId),
  })
}

export function useByDepartment(countryId: number | undefined) {
  return useQuery({
    queryKey: ['analytics', 'by-department', countryId],
    queryFn: () => analyticsApi.byDepartment(countryId as number),
    enabled: countryId !== undefined,
  })
}

export function useByCountry(departmentId?: number) {
  return useQuery({
    queryKey: ['analytics', 'by-country', departmentId],
    queryFn: () => analyticsApi.byCountry(departmentId),
  })
}

export function useSalaryBands(countryId: number | undefined) {
  return useQuery({
    queryKey: ['analytics', 'salary-bands', countryId],
    queryFn: () => analyticsApi.salaryBands(countryId as number),
    enabled: countryId !== undefined,
  })
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
