import { useEffect, useState } from 'react'

const CALENDAR_COLORS = [
  { id: '1', label: 'Lavanda', hex: '#7986CB' },
  { id: '2', label: 'Salvia', hex: '#33B679' },
  { id: '3', label: 'Uva', hex: '#8E24AA' },
  { id: '4', label: 'Flamingo', hex: '#E67C73' },
  { id: '5', label: 'Plátano', hex: '#F6BF26' },
  { id: '6', label: 'Mandarina', hex: '#F4511E' },
  { id: '7', label: 'Pavo real', hex: '#039BE5' },
  { id: '8', label: 'Grafito', hex: '#616161' },
  { id: '9', label: 'Arándano', hex: '#3F51B5' },
  { id: '10', label: 'Albahaca', hex: '#0B8043' },
  { id: '11', label: 'Tomate', hex: '#D50000' },
]

const TIMEZONE_OPTIONS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Tijuana', label: 'Tijuana' },
  { value: 'America/Cancun', label: 'Cancún' },
  { value: 'America/Bogota', label: 'Bogotá' },
  { value: 'America/Lima', label: 'Lima' },
  { value: 'America/Santiago', label: 'Santiago' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/New_York', label: 'Nueva York' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles' },
  { value: 'Europe/Madrid', label: 'Madrid' },
]

function ColorSelect({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full border border-line shrink-0"
          style={{ backgroundColor: CALENDAR_COLORS.find((c) => c.id === value)?.hex }}
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-sm border border-line bg-paper-2 px-3 py-2 text-sm text-ink"
        >
          {CALENDAR_COLORS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function SettingsForm({ initialSettings, onSave, saving, saveError }) {
  const [settings, setSettings] = useState(initialSettings)

  useEffect(() => setSettings(initialSettings), [initialSettings])

  function handleSubmit(e) {
    e.preventDefault()
    onSave(settings)
  }

  if (!settings) return null

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-paper-2 border border-line rounded-sm p-5 grid sm:grid-cols-2 gap-4"
    >
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted sm:col-span-2">
        Ajustes
      </h2>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Nombre a mostrar</label>
        <input
          value={settings.psychologist_name || ''}
          onChange={(e) => setSettings({ ...settings, psychologist_name: e.target.value })}
          className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Zona horaria</label>
        <select
          value={settings.timezone}
          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink"
        >
          {!TIMEZONE_OPTIONS.some((tz) => tz.value === settings.timezone) && (
            <option value={settings.timezone}>{settings.timezone}</option>
          )}
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Duración de sesión (min)</label>
        <input
          type="number"
          min="5"
          value={settings.session_duration_minutes}
          onChange={(e) =>
            setSettings({ ...settings, session_duration_minutes: Number(e.target.value) })
          }
          className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-muted mb-1">
          Dirección del consultorio (para citas presenciales)
        </label>
        <input
          value={settings.office_address || ''}
          onChange={(e) => setSettings({ ...settings, office_address: e.target.value })}
          placeholder="Calle, colonia, ciudad"
          className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </div>

      <ColorSelect
        label="Color en Google Calendar — presencial"
        value={settings.in_person_color_id || '2'}
        onChange={(v) => setSettings({ ...settings, in_person_color_id: v })}
      />
      <ColorSelect
        label="Color en Google Calendar — virtual"
        value={settings.virtual_color_id || '7'}
        onChange={(v) => setSettings({ ...settings, virtual_color_id: v })}
      />

      {saveError && <p className="text-sm text-red-600 sm:col-span-2">{saveError}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-thread text-paper-2 font-mono text-sm tracking-wide px-4 py-2 hover:bg-ink disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
