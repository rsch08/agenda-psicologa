import { useEffect, useState } from 'react'
import GoogleConnectCard from '../components/GoogleConnectCard.jsx'
import CalendarSourcesCard from '../components/CalendarSourcesCard.jsx'
import SettingsForm from '../components/SettingsForm.jsx'
import PatientLinksList from '../components/PatientLinksList.jsx'
import NewPatientLinkFlow from '../components/NewPatientLinkFlow.jsx'
import { adminFetch } from '../utils/adminApi.js'

export default function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const [settings, setSettings] = useState(null)
  const [googleStatus, setGoogleStatus] = useState(null)
  const [links, setLinks] = useState([])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showNewFlow, setShowNewFlow] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const errorParam = params.get('error')

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    setChecking(true)
    try {
      const [settingsData, statusData, linksData] = await Promise.all([
        adminFetch('/api/admin/settings'),
        adminFetch('/api/admin/google-status'),
        adminFetch('/api/admin/patient-links'),
      ])
      setSettings(settingsData.settings)
      setGoogleStatus(statusData)
      setLinks(linksData.links)
      setAuthorized(true)
    } catch (err) {
      setAuthorized(false)
      if (err.status !== 401) console.error(err)
    } finally {
      setChecking(false)
    }
  }

  async function handleSaveSettings(newSettings) {
    setSaving(true)
    setSaveError(null)
    try {
      await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
      })
      const data = await adminFetch('/api/admin/settings')
      setSettings(data.settings)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await adminFetch('/api/admin/google-status', { method: 'DELETE' })
      setGoogleStatus({ connected: false })
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setDisconnecting(false)
    }
  }

  async function refreshLinks() {
    const data = await adminFetch('/api/admin/patient-links')
    setLinks(data.links)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Cargando…</p>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl shadow p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold">Agenda Psicóloga</h1>
          <p className="text-sm text-slate-500">Panel de administración.</p>
          {errorParam === 'unauthorized' && (
            <p className="text-sm text-red-600">
              Esa cuenta de Google no tiene acceso a este panel.
            </p>
          )}
          {errorParam === 'google' && (
            <p className="text-sm text-red-600">Hubo un problema iniciando sesión. Intenta de nuevo.</p>
          )}
          <a
            href="/api/auth/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700"
          >
            Iniciar sesión con Google
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Agenda Psicóloga</h1>
            <p className="text-sm text-slate-500 mt-1">Panel de administración</p>
          </div>
          <a href="/api/auth/logout" className="text-sm text-slate-500 hover:underline">
            Cerrar sesión
          </a>
        </header>

        {errorParam === 'google' && (
          <p className="text-sm text-red-600">Hubo un problema con Google Calendar. Intenta de nuevo.</p>
        )}

        <button
          type="button"
          onClick={() => setShowNewFlow(true)}
          className="w-full rounded-xl bg-indigo-600 text-white py-4 text-base font-semibold hover:bg-indigo-700 shadow"
        >
          + Nuevo horario
        </button>

        <GoogleConnectCard
          status={googleStatus}
          onDisconnect={handleDisconnect}
          disconnecting={disconnecting}
        />

        <CalendarSourcesCard />

        <PatientLinksList links={links} timezone={settings?.timezone} />

        <SettingsForm
          initialSettings={settings}
          onSave={handleSaveSettings}
          saving={saving}
          saveError={saveError}
        />
      </div>

      {showNewFlow && (
        <NewPatientLinkFlow
          settings={settings}
          onCancel={() => setShowNewFlow(false)}
          onDone={() => {
            setShowNewFlow(false)
            refreshLinks()
          }}
        />
      )}
    </div>
  )
}
