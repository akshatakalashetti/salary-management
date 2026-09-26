import { api } from './client'
import type { LeaveBalance, LeaveRequest, LeaveRequestCreate } from './types'

export const leaveApi = {
  getBalance: (year?: number) =>
    api.get<LeaveBalance[]>(`/leave/balance${year ? `?year=${year}` : ''}`),
  getRequests: () => api.get<LeaveRequest[]>('/leave/requests'),
  createRequest: (input: LeaveRequestCreate) =>
    api.post<LeaveRequest>('/leave/requests', input),
  updateStatus: (id: number, status: string) =>
    api.patch<LeaveRequest>(`/leave/requests/${id}/status`, { status }),
}
