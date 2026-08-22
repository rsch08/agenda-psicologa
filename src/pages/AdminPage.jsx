import { useEffect, useState } from 'react'
import PasscodeGate from '../components/PasscodeGate.jsx'
import GoogleConnectCard from '../components/GoogleConnectCard.jsx'
import ScheduleForm from '../components/ScheduleForm.jsx'
import AppointmentsList from '../components/AppointmentsList.jsx'
import { adminFetch } from '../utils/adminApi.js'

const STORAGE_KEY = 'agenda_admin_passcode'

export default function AdminPage() {
  const [passcode, setPasscode] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [gateError, setGateError] = useState(null)

  const [settings, setSettings] = useState(null)
  const [rules, setRules] = useState([])
  const [googleStatus, setGoogleStatus] = useState(null)
  const [appointments, setAppointments] = useState([])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (passcode) tryPasscode(passcode)
    else setChecking(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const googleParam = new URLSearchParams(window.location.search).get('google')

  async function tryPasscode(code) {
    setChecking(true)
    setGateError(null)
    try {
      const [settingsData, statusData, appointmentsData] = await Promise.all([
        adminFetch('/api/admin/settings', code),
        adminFetch('/api/admin/google-status', code),
        adminFetch('/api/admin/appointments', code),
      ])
      setSettings(settingsData.settings)
      setRules(settingsData.rules)
      setGoogleStatus(statusData)
      setAppointments(appointmentsData.appointments)
      setPasscode(code)
      localStorage.setItem(STORAGE_KEY, code)
      setAuthorized(true)
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY)
      setAuthorized(false)
      setGateError(err.status === 401 ? 'Passcode incorrecto.' : err.message)
    } finally {
      setChecking(false)
    }
  }

  async function handleSave({ settings: newSettings, rules: newRules }) {
    setSaving(true)
    setSaveError(null)
    try {
      await adminFetch('/api/admin/settings', passcode, {
        method: 'POST',
        body: JSON.stringify({ settings: newSettings, rules: newRules }),
      })
      const data = await adminFetch('/api/admin/settings', passcode)
      setSettings(data.settings)
      setRules(data.rules)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await adminFetch('/api/admin/google-status', passcode, { method: 'DELETE' })
      setGoogleStatus({ connected: false })
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setDisconnecting(false)
    }
  }

  if (!authorized) {
    return <PasscodeGate onSubmit={tryPasscode} error={gateError} checking={checking} />
  }

  const bookingUrl = `${window.location.origin}/`

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-xl font-semibold">Configuración</h1>
          <p className="text-sm text-slate-500 mt-1">
            Link público para pacientes:{' '}
            <a href={bookingUrl} className="text-indigo-600 hover:underline">
              {bookingUrl}
            </a>
          </p>
          {googleParam === 'connected' && (
            <p className="text-sm text-emerald-700 mt-1">Google Calendar conectado correctamente.</p>
          )}
          {googleParam === 'error' && (
            <p className="text-sm text-red-600 mt-1">
              Hubo un problema conectando Google Calendar. Intenta de nuevo.
            </p>
          )}
        </header>

        <GoogleConnectCard
          status={googleStatus}
          passcode={passcode}
          onDisconnect={handleDisconnect}
          disconnecting={disconnecting}
        />

        <ScheduleForm
          initialSettings={settings}
          initialRules={rules}
          onSave={handleSave}
          saving={saving}
          saveError={saveError}
        />

        <AppointmentsList appointments={appointments} timezone={settings?.timezone} />
      </div>
    </div>
  )
}
