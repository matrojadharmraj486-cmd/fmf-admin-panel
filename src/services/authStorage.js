const PRIMARY_KEY = 'fmf_admin_token'
const LEGACY_KEY = 'fm_admin_token'
const ACCOUNT_KEY = 'fmf_admin_account'

export const getToken = () => localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY) || ''
export const setToken = (t) => {
  localStorage.setItem(PRIMARY_KEY, t)
  localStorage.setItem(LEGACY_KEY, t)
}
export const clearToken = () => {
  localStorage.removeItem(PRIMARY_KEY)
  localStorage.removeItem(LEGACY_KEY)
}

// The admin JWT only carries `userId`, so name/email are persisted separately from
// the login response to keep them available for display across reloads.
export const getAccount = () => {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export const setAccount = (account) => {
  try {
    if (account) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
    else localStorage.removeItem(ACCOUNT_KEY)
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}
export const clearAccount = () => localStorage.removeItem(ACCOUNT_KEY)
