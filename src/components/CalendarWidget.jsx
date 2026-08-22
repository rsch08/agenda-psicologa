import { useEffect, useMemo, useState } from 'react'
import { addDays, startOfWeek } from 'date-fns'
import { adminFetch } from '../utils/adminApi.js'
import { buildWeekDays } from '../utils/candidateSlots.js'
import { formatDayLabel, formatSlotTime } from '../utils/format.js'

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

export default function CalendarWidget({ timezone, durationMinutes, selected, onToggle }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const thisWeekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const canGoBack = weekStart > thisWeekStart

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const from = weekStart.toISOString()
        const to = addDays(weekStart, 7).toISOString()
        const data = await adminFetch(
          `/api/admin/calendar-events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        )
        if (!cancelled) setEvents(data.events || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [weekStart])

  const { days, buildError } = useMemo(() => {
    try {
      return { days: buildWeekDays(weekStart, timezone || 'America/Mexico_City', durationMinutes || 50), buildError: null }
    } catch (err) {
      return { days: [], buildError: err.message }
    }
  }, [weekStart, timezone, durationMinutes])

  const selectedKeys = useMemo(() => new Set(selected.map((s) => s.start_time)), [selected])
  const now = useMemo(() => new Date(), [])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm disabled:opacity-40"
        >
          ← Semana anterior
        </button>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
        >
          Semana siguiente →
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando tu calendario…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {buildError && (
        <p className="text-sm text-red-600">
          {buildError} — revisa la zona horaria en Ajustes.
        </p>
      )}

      {!loading && !error && !buildError && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {days.map((day) => (
            <div key={day.date}>
              <h4 className="text-xs font-semibold text-slate-500 capitalize mb-1.5">
                {formatDayLabel(day.date)}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {day.slots.map((slot) => {
                  const start = new Date(slot.startISO)
                  const end = new Date(slot.endISO)
                  const isPast = start < now
                  const busyEvent = events.find((e) =>
                    overlaps(start, end, new Date(e.start), new Date(e.end)),
                  )
                  const isSelected = selectedKeys.has(slot.startISO)

                  if (isPast || busyEvent) {
                    return (
                      <span
                        key={slot.startISO}
                        title={busyEvent ? busyEvent.summary : 'Ya pasó'}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-400 bg-slate-50 line-through"
                      >
                        {formatSlotTime(slot.startISO, timezone)}
                      </span>
                    )
                  }

                  return (
                    <button
                      key={slot.startISO}
                      type="button"
                      onClick={() =>
                        onToggle({ start_time: slot.startISO, end_time: slot.endISO })
                      }
                      className={`px-2.5 py-1.5 rounded-lg border text-xs transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                      }`}
                    >
                      {formatSlotTime(slot.startISO, timezone)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
