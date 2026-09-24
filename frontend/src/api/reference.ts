import { api } from './client'
import type { Country, Department } from './types'

export const referenceApi = {
  departments: () => api.get<Department[]>('/departments'),
  countries: () => api.get<Country[]>('/countries'),
}
