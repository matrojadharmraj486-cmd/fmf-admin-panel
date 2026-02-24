import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const redirectTo = '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-6 text-center">Admin Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className="w-full rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button disabled={loading} className="w-full rounded bg-gray-900 text-white py-2 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
