import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginAdmin } from '../services/api.js'
import {
  clearToken as clearStoredToken,
  getToken as getStoredToken,
  setToken as setStoredToken,
  getAccount as getStoredAccount,
  setAccount as setStoredAccount
} from '../services/authStorage.js'

const AuthContext = createContext(null)

function parseUser(token) {
  if (!token) return null
  try {
    const mid = token.split('.')[1] || ''
    const base64 = mid.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) || {}
    return { role: payload.role || 'admin', name: payload.name || 'Administrator', email: payload.email || '' }
  } catch {
    return { role: 'admin', name: 'Administrator', email: '' }
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  // The admin JWT carries only `userId`, so name/email come from the login
  // response and are kept here (and in storage) for display.
  const [account, setAccount] = useState(() => getStoredAccount())

  const user = useMemo(() => {
    const base = parseUser(token)
    if (!base) return null
    return {
      ...base,
      ...(account?.name ? { name: account.name } : {}),
      ...(account?.email ? { email: account.email } : {})
    }
  }, [token, account])

  useEffect(() => {
    if (token) setStoredToken(token)
    else clearStoredToken()
  }, [token])

  useEffect(() => {
    setStoredAccount(account)
  }, [account])

  const login = async (email, password) => {
    if (!email || !password) throw new Error('Missing credentials')
    // Call backend login
    const res = await loginAdmin(email, password)
    const allowed = import.meta.env.VITE_ADMIN_EMAIL
    if (allowed && res?.user?.email && res.user.email.toLowerCase() !== allowed.toLowerCase()) {
      throw new Error('Not authorized for admin panel')
    }
    const tk = res?.data?.token || res?.accessToken || res?.jwt || ''
    if (!tk) throw new Error('Server did not return a token')
    const loggedInUser = res?.data?.user || res?.user || null
    if (loggedInUser) {
      setAccount({ name: loggedInUser.name || '', email: loggedInUser.email || '' })
    }
    setToken(tk)
    return true
  }

  const logout = () => {
    setToken('')
    setAccount(null)
  }

  // Keeps the displayed email in sync after a self-service email change without
  // requiring a re-login (the token stays valid — it references the same userId).
  const updateAccountEmail = (email) => {
    setAccount((prev) => ({ ...(prev || {}), email: email || '' }))
  }

  const value = { token, user, isAuthenticated: !!token, login, logout, updateAccountEmail }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
