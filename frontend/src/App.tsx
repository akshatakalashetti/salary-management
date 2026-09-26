import { CircularProgress, Box } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './context/AuthContext'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { EmployeeCreatePage } from './pages/EmployeeCreatePage'
import { EmployeeDetailPage } from './pages/EmployeeDetailPage'
import { EmployeeListPage } from './pages/EmployeeListPage'
import { EquityPage } from './pages/EquityPage'
import { LoginPage } from './pages/LoginPage'
import { PayrollPage } from './pages/PayrollPage'
import { MyProfilePage } from './pages/MyProfilePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireHR({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'hr') return <Navigate to="/my-profile" replace />
  return <>{children}</>
}

function DefaultRedirect() {
  const { user } = useAuth()
  if (user?.role === 'hr') return <Navigate to="/employees" replace />
  return <Navigate to="/my-profile" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/" element={<DefaultRedirect />} />
                <Route path="/my-profile" element={<MyProfilePage />} />
                <Route
                  path="/employees"
                  element={
                    <RequireHR>
                      <EmployeeListPage />
                    </RequireHR>
                  }
                />
                <Route
                  path="/employees/new"
                  element={
                    <RequireHR>
                      <EmployeeCreatePage />
                    </RequireHR>
                  }
                />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                <Route
                  path="/analytics"
                  element={
                    <RequireHR>
                      <AnalyticsPage />
                    </RequireHR>
                  }
                />
                <Route
                  path="/equity"
                  element={
                    <RequireHR>
                      <EquityPage />
                    </RequireHR>
                  }
                />
                <Route
                  path="/payroll"
                  element={
                    <RequireHR>
                      <PayrollPage />
                    </RequireHR>
                  }
                />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
