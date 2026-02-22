import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'

export function Topbar({ onMenu }) {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [dark])
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onMenu} aria-label="Toggle Menu">
            ☰
          </button>
          <div className="font-semibold">FMF Admin</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setDark((v) => !v)}>
            {dark ? 'Light' : 'Dark'}
          </button>
          <div className="text-sm">{user?.name}</div>
          <button className="px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-gray-700" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  )
}
