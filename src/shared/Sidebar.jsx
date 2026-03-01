import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/structured-questions', label: 'Questions' },
  // { to: '/papers', label: 'Papers' },
  // { to: '/questions', label: 'Questions' },
  // { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/qotd', label: 'QOTD' },
  { to: '/banners', label: 'Banners' },
  { to: '/public-questions', label: 'Public' }
]

export function Sidebar({ open, onClose }) {
  return (
    <>
      <div className={`fixed inset-0 bg-black/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed lg:static top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-800 shadow lg:shadow-none transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 font-semibold text-lg border-b border-gray-100 dark:border-gray-700">FMF Admin</div>
        <nav className="p-2 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}`
              }
              onClick={onClose}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
