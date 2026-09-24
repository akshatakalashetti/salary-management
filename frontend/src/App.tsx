import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { EmployeeCreatePage } from './pages/EmployeeCreatePage'
import { EmployeeDetailPage } from './pages/EmployeeDetailPage'
import { EmployeeListPage } from './pages/EmployeeListPage'
import { EquityPage } from './pages/EquityPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/employees" replace />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<EmployeeCreatePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/equity" element={<EquityPage />} />
      </Routes>
    </AppShell>
  )
}
