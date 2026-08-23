import { useEffect, useState } from 'react'
import { adminFetch } from '../utils/adminApi.js'

// Deja elegir qué calendarios de Google (personal, trabajo, etc.) se
// revisan para saber qué horas están ocupadas. Se queda en blanco si
// todavía no hay calendario conectado.
export default function CalendarSourcesCard() {
  const [calendars, setCalendars] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    setNotConnected(false)
    try {
      const data = await adminFetch('/api/admin/calendars')
      setCalendars(data.calendars || [])
      setSelected(data.selected || ['primary'])
    } catch (err) {
      if (err.status === 409) setNotConnected(true)
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggle(id) {
    setSaved(false)
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await adminFetch('/api/admin/calendars', {
        method: 'POST',
        body: JSON.stringify({ busy_calendar_ids: selected }),
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || notConnected) return null

  return (
    <div className="bg-paper-2 border border-line rounded-sm p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-1">
        Calendarios a revisar
      </h2>
      <p className="text-xs text-muted mb-3">
        Marca todos donde tengas compromisos (personal, trabajo…) — el widget los cruza todos
        para saber qué horas están libres de verdad.
      </p>

      {calendars.length === 0 ? (
        <p className="text-sm text-muted">No se encontraron calendarios.</p>
      ) : (
        <div className="space-y-1.5">
          {calendars.map((cal) => (
            <label key={cal.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={selected.includes(cal.id)}
                onChange={() => toggle(cal.id)}
              />
              {cal.summary}
              {cal.primary ? ' (principal)' : ''}
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || selected.length === 0}
        className="mt-3 rounded-sm bg-thread text-paper-2 font-mono text-sm tracking-wide px-3 py-1.5 hover:bg-ink disabled:opacity-60"
      >
        {saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar'}
      </button>
    </div>
  )
}
