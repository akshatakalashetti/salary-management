import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../api/employees'
import type {
  EmployeeCreateInput,
  EmployeeListParams,
  SalaryHistoryCreateInput,
} from '../api/types'

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeesApi.list(params),
    placeholderData: (previous) => previous,
  })
}

export function useEmployee(id: number | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.get(id as number),
    enabled: id !== undefined,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EmployeeCreateInput) => employeesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<EmployeeCreateInput> & { status?: string }) =>
      employeesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
    },
  })
}

export function useAddSalaryHistory(employeeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SalaryHistoryCreateInput) =>
      employeesApi.addSalaryHistory(employeeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
    },
  })
}
