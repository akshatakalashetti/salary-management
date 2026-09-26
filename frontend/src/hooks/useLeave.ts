import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leaveApi } from '../api/leave'
import type { LeaveRequestCreate } from '../api/types'

export function useLeaveBalance() {
  return useQuery({ queryKey: ['leave', 'balance'], queryFn: () => leaveApi.getBalance() })
}

export function useLeaveRequests() {
  return useQuery({ queryKey: ['leave', 'requests'], queryFn: leaveApi.getRequests })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LeaveRequestCreate) => leaveApi.createRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => leaveApi.updateStatus(id, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] })
    },
  })
}
