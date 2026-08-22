import { useEffect, useState } from 'react'

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

function toRuleRows(rules) {
  const byWeekday = new Map(rules.map((r) => [r.weekday, r]))
  return WEEKDAYS.map(({ value }) => {
    const r = byWeekday.get(value)
    return {
      weekday: value,
      active: r ? r.active : false,
      start_time: r ? r.start_time.slice(0, 5) : '09:00',
      end_time: r ? r.end_time.slice(0, 5) : '17:00',
    }
  })
}

export default function ScheduleForm({ initialSettings, initialRules, onSave, saving, saveError }) {
  const [settings, setSettings] = useState(initialSettings)
  const [rules, setRules] = useState(() => toRuleRows(initialRules))

  useEffect(() => setSettings(initialSettings), [initialSettings])
  useEffect(() => setRules(toRuleRows(initialRules)), [initialRules])

  function updateRule(weekday, patch) {
    setRules((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      settings,
      rules: rules.map((r) => ({
        ...r,
        start_time: `${r.start_time}:00`,
        end_time: `${r.end_time}:00`,
      })),
    })
  }

  if (!settings) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Horarios semanales</h2>
        <div className="space-y-2">
          {rules.map((rule) => {
            const label = WEEKDAYS.find((w) => w.value === rule.weekday).label
            return (
              <div key={rule.weekday} className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 w-32">
                  <input
                    type="checkbox"
                    checked={rule.active}
                    onChange={(e) => updateRule(rule.weekday, { active: e.target.checked })}
                  />
                  <span className="text-sm">{label}</span>
                </label>
                <input
                  type="time"
                  value={rule.start_time}
                  disabled={!rule.active}
                  onChange={(e) => updateRule(rule.weekday, { start_time: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
                />
                <span className="text-sm text-slate-400">a</span>
                <input
                  type="time"
                  value={rule.end_time}
                  disabled={!rule.active}
                  onChange={(e) => updateRule(rule.weekday, { end_time: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100"
                />
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Un solo rango por día por ahora. Mañana y tarde separados queda para una fase 2.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-5 grid sm:grid-cols-2 gap-4">
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
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Duración de sesión (min)
          </label>
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

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Buffer entre citas (min)
          </label>
          <input
            type="number"
            min="0"
            value={settings.buffer_minutes}
            onChange={(e) => setSettings({ ...settings, buffer_minutes: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Aviso mínimo (horas)
          </label>
          <input
            type="number"
            min="0"
            value={settings.min_notice_hours}
            onChange={(e) => setSettings({ ...settings, min_notice_hours: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Días hacia adelante a mostrar
          </label>
          <input
            type="number"
            min="1"
            value={settings.max_days_ahead}
            onChange={(e) => setSettings({ ...settings, max_days_ahead: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
