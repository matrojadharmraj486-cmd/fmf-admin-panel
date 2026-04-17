import { useEffect, useState } from 'react'
import { getPaymentGatewaySettings, updatePaymentGatewaySettings } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function PaymentGatewaySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  const [gateway, setGateway] = useState('razorpay')
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
      setKeyId(res?.keyId || '')
      setSaltIdMasked(res?.saltIdMasked || '')
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
    if (!saltId.trim()) {
      const msg = 'Salt ID (Secret) is required'
      setError(msg)
      pushToast('error', msg)
      return
    }

    try {
      setSaving(true)
      await updatePaymentGatewaySettings({
        gateway: 'razorpay',
        keyId: keyId.trim(),
        saltId: saltId.trim(),
        isActive: !!isActive
      })
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
              <label className="text-sm text-gray-600 dark:text-gray-300">Key ID</label>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                placeholder="Key ID"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Salt ID (Secret)</label>
              {saltIdMasked ? (
                <div className="text-xs text-gray-500">Current Secret: {saltIdMasked}</div>
              ) : (
                <div className="text-xs text-gray-500">Current Secret: Not set</div>
              )}
              <input
                type="password"
                value={saltId}
                onChange={(e) => setSaltId(e.target.value)}
                className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                placeholder="Enter new secret"
                required
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

