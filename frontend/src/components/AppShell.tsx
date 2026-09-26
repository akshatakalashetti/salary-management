import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmployee } from '../hooks/useEmployees'

const HR_NAV = [
  { to: '/employees', label: 'Employees' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/equity', label: 'Pay Equity' },
  { to: '/payroll', label: 'Payroll' },
]

const EMPLOYEE_NAV = [{ to: '/my-profile', label: 'My Profile' }]

function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: employee } = useEmployee(user?.employee_id ?? undefined)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const initials = employee
    ? `${employee.first_name[0]}${employee.last_name[0]}`
    : user?.role === 'hr'
      ? 'HR'
      : '?'

  const displayName = employee
    ? `${employee.first_name} ${employee.last_name}`
    : 'HR Manager'

  const subline = employee
    ? `${employee.role_title} · ${employee.department.name}`
    : 'Human Resources'

  function handleLogout() {
    setAnchorEl(null)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <Tooltip title="My account">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              mt: 1.5,
              borderRadius: 3,
              boxShadow: '0 20px 40px -8px rgb(0 0 0 / 0.18)',
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Profile header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: '12px 12px 0 0',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                fontSize: '1rem',
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.4)',
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                {subline}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 1, fontSize: '0.7rem' }}>
            {user?.email}
          </Typography>
          {employee && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.7rem' }}>
              {employee.employee_code}
            </Typography>
          )}
        </Box>

        <Box sx={{ py: 0.5 }}>
          <MenuItem
            onClick={() => {
              setAnchorEl(null)
              navigate(user?.role === 'hr' ? '/employees' : '/my-profile')
            }}
            sx={{ mx: 1, borderRadius: 2, my: 0.25, color: 'text.primary' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>My Profile</Typography>
          </MenuItem>
        </Box>

        <Divider />

        <Box sx={{ py: 0.5 }}>
          <MenuItem
            onClick={handleLogout}
            sx={{ mx: 1, borderRadius: 2, my: 0.25, color: 'error.main' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Sign Out</Typography>
          </MenuItem>
        </Box>
      </Menu>
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navItems = user?.role === 'hr' ? HR_NAV : EMPLOYEE_NAV

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {/* Logo / brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
                color: 'white',
              }}
            >
              A
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em',
                fontSize: '1.05rem',
                whiteSpace: 'nowrap',
              }}
            >
              ACME HRM
            </Typography>
          </Box>

          {/* Nav links */}
          <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  px: 1.5,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  '&.active': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    fontWeight: 600,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <ProfileMenu />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}
