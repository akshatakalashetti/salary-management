export interface Department {
  id: number
  name: string
  code: string
}

export interface Country {
  id: number
  name: string
  iso_code: string
  currency_code: string
}

export interface SalaryHistoryEntry {
  id: number
  amount: string
  currency: string
  effective_date: string
  reason: string
  created_at: string
}

export interface EmployeeListItem {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  gender: string
  email: string
  department: Department
  country: Country
  role_title: string
  level: string
  hire_date: string
  status: string
  current_salary: string | null
  current_currency: string | null
}

export interface EmployeeDetail extends EmployeeListItem {
  salary_history: SalaryHistoryEntry[]
  // Personal
  phone: string | null
  date_of_birth: string | null
  // Address
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_postal_code: string | null
  // Payroll
  pay_frequency: string | null
  bank_last4: string | null
  tax_id: string | null
  // Emergency contact
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

export interface EmployeeListResponse {
  items: EmployeeListItem[]
  total: number
  page: number
  page_size: number
}

export interface EmployeeCreateInput {
  first_name: string
  last_name: string
  gender: string
  email: string
  department_id: number
  country_id: number
  role_title: string
  level: string
  hire_date: string
  starting_salary: string
  currency: string
}

export interface SalaryHistoryCreateInput {
  amount: string
  currency: string
  effective_date: string
  reason: string
}

export interface CohortStats {
  key: string
  count: number
  avg: number
  median: number
  min: number
  max: number
  p25: number
  p75: number
}

export interface AnalyticsSummary {
  headcount: number
  // null when no country filter is applied -- salaries aren't currency-
  // converted, so a blended org-wide figure would be meaningless.
  avg_salary: number | null
  median_salary: number | null
}

export interface OutlierRow {
  employee_id: number
  employee_name: string
  cohort_key: string
  salary: number
  cohort_median: number
  deviation_pct: number
  direction: 'over' | 'under'
}

export interface GenderGapRow {
  cohort_key: string
  gap_pct: number
  higher_gender: string
  lower_gender: string
  avg_by_gender: Record<string, number>
  count_by_gender: Record<string, number>
}

export interface EmployeeListParams {
  search?: string
  department_id?: number
  country_id?: number
  gender?: string
  level?: string
  status?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface LeaveBalance {
  leave_type: string
  total_days: number
  used_days: number
  pending_days: number
  available_days: number
}

export interface LeaveRequest {
  id: number
  employee_id: number
  leave_type: string
  start_date: string
  end_date: string
  days: number
  reason: string | null
  status: string
  created_at: string
}

export interface LeaveRequestCreate {
  leave_type: string
  start_date: string
  end_date: string
  reason?: string
}
