import { useEffect, useState } from 'react'
import { getPaymentGatewaySettings, updatePaymentGatewaySettings } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function PaymentGatewaySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  // Backend field naming: keyId/saltId vs key/secret (handle both for compatibility)
  const [mode, setMode] = useState('keyId')
  const [saved, setSaved] = useState({
    gateway: 'razorpay',
    key: '',
    secretMasked: '',
    description: '',
    isActive: false,
    updatedAt: ''
  })
  const [form, setForm] = useState({
    gateway: 'razorpay',
    key: '',
    secret: '',
    description: '',
    isActive: false
  })

  const pushToast = (type, message) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }

  const pickActive = (res) => {
    const val =
      res?.isActive ??
      res?.active ??
      res?.is_active ??
      res?.status ??
      res?.enabled ??
      false
    return !!val
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await getPaymentGatewaySettings()
      const gateway = res?.gateway || 'razorpay'
      const resMode = res?.keyId != null || res?.saltIdMasked != null ? 'keyId' : (res?.key != null || res?.secretMasked != null ? 'key' : 'keyId')
      setMode(resMode)
      const key = res?.keyId || res?.key || ''
      const secretMasked = res?.saltIdMasked || res?.secretMasked || ''
      const description = res?.description || ''
      const isActive = pickActive(res)
      const updatedAt = res?.updatedAt || res?.updated_at || res?.createdAt || res?.created_at || ''

      setSaved({ gateway, key, secretMasked, description, isActive, updatedAt })
      setForm({
        gateway,
        key,
        secret: '',
        description,
        isActive
      })
      setError('')
    } catch {
      const msg = 'Failed to load payment gateway settings'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const resetFormToSaved = () => {
    setForm((s) => ({
      ...s,
      gateway: saved.gateway || 'razorpay',
      key: saved.key || '',
      secret: '',
      description: saved.description || '',
      isActive: !!saved.isActive
    }))
  }

  const onSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.key.trim()) {
      const msg = 'Key ID is required'
      setError(msg)
      pushToast('error', msg)
      return
    }
    if (!form.secret.trim() && !saved.secretMasked) {
      const msg = 'Secret is required'
      setError(msg)
      pushToast('error', msg)
      return
    }

    try {
      setSaving(true)
      const payload =
        mode === 'key'
          ? {
              gateway: form.gateway,
              key: form.key.trim(),
              ...(form.secret.trim() ? { secret: form.secret.trim() } : {}),
              description: form.description.trim(),
              isActive: !!form.isActive
            }
          : {
              gateway: form.gateway,
              keyId: form.key.trim(),
              ...(form.secret.trim() ? { saltId: form.secret.trim() } : {}),
              description: form.description.trim(),
              isActive: !!form.isActive
            }

      await updatePaymentGatewaySettings(payload)
      pushToast('success', 'Payment gateway settings saved')
      await fetchSettings()
    } catch {
      const msg = 'Failed to save payment gateway settings'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Payment Gateway Settings</h2>
        <button
          type="button"
          onClick={fetchSettings}
          className="px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <form onSubmit={onSave} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Payment Gateway</label>
                <select
                  value={form.gateway}
                  onChange={(e) => setForm((s) => ({ ...s, gateway: e.target.value }))}
                  className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                  disabled
                >
                  <option value="razorpay">razorpay</option>
                </select>
                <div className="text-xs text-gray-500">Only Razorpay is supported for now.</div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">Key</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
                  className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                  placeholder="Key"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2 min-h-[90px]"
                  placeholder="e.g. Razorpay live keys for production"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Secret</label>
                <div className="text-xs text-gray-500">Secret is never shown. Paste a new secret only if you want to rotate it.</div>
                <input
                  type="password"
                  value={form.secret}
                  onChange={(e) => setForm((s) => ({ ...s, secret: e.target.value }))}
                  className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                  placeholder={saved.secretMasked ? saved.secretMasked : 'Enter secret'}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              Active
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={resetFormToSaved}
                className="px-4 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm disabled:opacity-60"
              >
                Revert
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">Saved Details</div>
              <div className="text-xs text-gray-500">
                {saved.updatedAt ? `Updated: ${String(saved.updatedAt)}` : ''}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="[&>tr>td]:py-2 [&>tr>td]:align-top">
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="text-gray-600 dark:text-gray-300 w-40">Gateway</td>
                    <td className="font-medium">{saved.gateway || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="text-gray-600 dark:text-gray-300">Key</td>
                    <td className="font-medium break-all">{saved.key || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="text-gray-600 dark:text-gray-300">Secret</td>
                    <td className="font-medium">{saved.secretMasked || '-'}</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="text-gray-600 dark:text-gray-300">Description</td>
                    <td className="font-medium whitespace-pre-wrap">{saved.description || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 dark:text-gray-300">Active</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${saved.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-200'}`}>
                        {saved.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow text-white ${t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
