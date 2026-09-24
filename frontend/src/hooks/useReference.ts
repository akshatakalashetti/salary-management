import { useQuery } from '@tanstack/react-query'
import { referenceApi } from '../api/reference'

export function useDepartments() {
  return useQuery({ queryKey: ['departments'], queryFn: referenceApi.departments, staleTime: Infinity })
}

export function useCountries() {
  return useQuery({ queryKey: ['countries'], queryFn: referenceApi.countries, staleTime: Infinity })
}
