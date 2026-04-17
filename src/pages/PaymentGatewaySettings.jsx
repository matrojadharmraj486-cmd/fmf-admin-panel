import { useEffect, useState } from 'react'
import { getPaymentGatewaySettings, updatePaymentGatewaySettings } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function PaymentGatewaySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  const [gateway, setGateway] = useState('razorpay')
  const [mode, setMode] = useState('keyId') // backend field naming: keyId/saltId vs key/secret
  const [keyId, setKeyId] = useState('')
  const [saltId, setSaltId] = useState('')
  const [saltIdMasked, setSaltIdMasked] = useState('')
  const [isActive, setIsActive] = useState(false)

  const pushToast = (type, message) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await getPaymentGatewaySettings()
      setGateway(res?.gateway || 'razorpay')
      const resMode = res?.keyId != null || res?.saltIdMasked != null ? 'keyId' : (res?.key != null || res?.secretMasked != null ? 'key' : 'keyId')
      setMode(resMode)
      setKeyId(res?.keyId || res?.key || '')
      setSaltIdMasked(res?.saltIdMasked || res?.secretMasked || '')
      setIsActive(!!res?.isActive)
      setSaltId('')
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

  const onSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!keyId.trim()) {
      const msg = 'Key ID is required'
      setError(msg)
      pushToast('error', msg)
      return
    }
    if (!saltId.trim() && !saltIdMasked) {
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
              key: keyId.trim(),
              ...(saltId.trim() ? { secret: saltId.trim() } : {}),
              isActive: !!isActive
            }
          : {
              keyId: keyId.trim(),
              ...(saltId.trim() ? { saltId: saltId.trim() } : {}),
              isActive: !!isActive
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
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? (
        <Loader />
      ) : (
        <form onSubmit={onSave} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 max-w-3xl">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">Payment Gateway</label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
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
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                placeholder="Key"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Secret</label>
              <div className="text-xs text-gray-500">Secret is never shown. Paste a new secret only if you want to rotate it.</div>
              <input
                type="password"
                value={saltId}
                onChange={(e) => setSaltId(e.target.value)}
                className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                placeholder={saltIdMasked ? saltIdMasked : 'Enter secret'}
                autoComplete="new-password"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
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
