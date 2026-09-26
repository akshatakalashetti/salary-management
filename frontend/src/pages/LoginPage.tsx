import { Alert, Box, Button, CircularProgress, Divider, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4338CA 70%, #4F46E5 100%)',
      }}
    >
      {/* Left panel — branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          px: 8,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 900,
              color: 'white',
              boxShadow: '0 8px 20px rgba(245,158,11,0.4)',
            }}
          >
            A
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            ACME HRM
          </Typography>
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2, letterSpacing: '-0.03em' }}>
          Manage your<br />
          workforce with<br />
          <Box component="span" sx={{ color: '#FCD34D' }}>confidence.</Box>
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: 380 }}>
          Everything your HR team needs — employee records, payroll, analytics, and pay equity — in one place.
        </Typography>

        {/* Feature pills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4 }}>
          {['10,000+ employees', 'Pay analytics', 'Leave management', 'Pay equity'].map((f) => (
            <Box
              key={f}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.8rem',
                fontWeight: 500,
                backdropFilter: 'blur(4px)',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              ✓ {f}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel — login form */}
      <Box
        sx={{
          width: { xs: '100%', md: 460 },
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 5 },
          bgcolor: 'white',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.25)',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 380 }} component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#1E1B4B' }}>
            Welcome back 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to your account to continue
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email address"
              type="email"
              required
              autoFocus
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hr@acme-corp.example"
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || !email || !password}
              sx={{ py: 1.5, fontSize: '1rem', mt: 0.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">Demo credentials</Typography>
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              onClick={() => { setEmail('hr@acme-corp.example'); setPassword('hr-password') }}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.light',
                cursor: 'pointer',
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: '#EDE9FE' },
                transition: 'background 0.2s',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark', display: 'block' }}>HR Manager</Typography>
              <Typography variant="caption" color="text.secondary">hr@acme-corp.example · hr-password</Typography>
            </Box>
            <Box
              onClick={() => { setEmail('gabriella.abbott.1073@acme-corp.example'); setPassword('EMP-001073') }}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'grey.100' },
                transition: 'background 0.2s',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>Employee</Typography>
              <Typography variant="caption" color="text.secondary">gabriella.abbott.1073@acme-corp.example · EMP-001073</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
