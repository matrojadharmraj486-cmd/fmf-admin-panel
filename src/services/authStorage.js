const PRIMARY_KEY = 'fmf_admin_token'
const LEGACY_KEY = 'fm_admin_token'

export const getToken = () => localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY) || ''
export const setToken = (t) => {
  localStorage.setItem(PRIMARY_KEY, t)
  localStorage.setItem(LEGACY_KEY, t)
}
export const clearToken = () => {
  localStorage.removeItem(PRIMARY_KEY)
  localStorage.removeItem(LEGACY_KEY)
}
