import { api } from './client'

export interface LoginResponse {
  access_token: string
  token_type: string
  role: 'hr' | 'employee'
  employee_id: number | null
}

export interface MeResponse {
  id: number
  email: string
  role: 'hr' | 'employee'
  employee_id: number | null
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  me: () => api.get<MeResponse>('/auth/me'),
}
