import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, alpha, useTheme
} from '@mui/material'
import { Icon } from '@iconify/react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
        background: (t) => t.palette.mode === 'dark'
          ? `linear-gradient(135deg, #28243D 0%, #312D4B 100%)`
          : `linear-gradient(135deg, #F4F5FA 0%, #EDE7FF 100%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              mb: 2,
              boxShadow: `0 4px 18px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <Icon icon="mdi:shield-crown-outline" color="#fff" fontSize={28} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
            Welcome to FMF Admin
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        {/* Card */}
        <Card
          sx={{
            boxShadow: (t) => t.palette.mode === 'dark'
              ? '0 4px 24px 0 rgba(0,0,0,0.4)'
              : '0 4px 24px 0 rgba(47,51,73,0.1)',
          }}
        >
          <CardContent sx={{ p: '2rem !important' }}>
            <Typography variant="h6" fontWeight={600} mb={0.5}>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter your credentials below
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} noValidate>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:email-outline" fontSize={20} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:lock-outline" fontSize={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        <Icon icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} fontSize={20} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 4 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: `0 4px 18px 0 ${alpha(theme.palette.primary.main, 0.35)}`,
                  '&:hover': {
                    boxShadow: `0 6px 22px 0 ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
