import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginAdmin } from '../services/api.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'fmf_admin_token'

function parseUser(token) {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || '')) || {}
    return { role: payload.role || 'admin', name: payload.name || 'Administrator', email: payload.email || '' }
  } catch {
    return { role: 'admin', name: 'Administrator', email: '' }
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const user = useMemo(() => parseUser(token), [token])

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }, [token])

  const login = async (email, password) => {
    if (!email || !password) throw new Error('Missing credentials')
    // Call backend login
    const res = await loginAdmin(email, password) // expects { token, user }
    const allowed = import.meta?.env?.VITE_ADMIN_EMAIL
    if (allowed && res?.user?.email && res.user.email.toLowerCase() !== allowed.toLowerCase()) {
      throw new Error('Not authorized for admin panel')
    }
    setToken(res?.token || '')
    return true
  }

  const logout = () => setToken('')

  const value = { token, user, isAuthenticated: !!token, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
