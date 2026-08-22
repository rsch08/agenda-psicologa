import { useEffect, useState } from 'react'

export default function SettingsForm({ initialSettings, onSave, saving, saveError }) {
  const [settings, setSettings] = useState(initialSettings)

  useEffect(() => setSettings(initialSettings), [initialSettings])

  function handleSubmit(e) {
    e.preventDefault()
    onSave(settings)
  }

  if (!settings) return null

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 grid sm:grid-cols-2 gap-4">
      <h2 className="text-sm font-semibold text-slate-700 sm:col-span-2">Ajustes</h2>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Nombre a mostrar</label>
        <input
          value={settings.psychologist_name || ''}
          onChange={(e) => setSettings({ ...settings, psychologist_name: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Zona horaria (IANA)</label>
        <input
          value={settings.timezone}
          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          placeholder="America/Bogota"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Duración de sesión (min)</label>
        <input
          type="number"
          min="5"
          value={settings.session_duration_minutes}
          onChange={(e) =>
            setSettings({ ...settings, session_duration_minutes: Number(e.target.value) })
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {saveError && <p className="text-sm text-red-600 sm:col-span-2">{saveError}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
