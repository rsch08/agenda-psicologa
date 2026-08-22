import { addDays, addMinutes, isBefore } from 'date-fns'
import { fromZonedTime, format as formatTz } from 'date-fns-tz'

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

// Postgres regresa columnas `time` como "09:00:00" (a veces con
// microsegundos) — nos quedamos solo con HH:mm:ss.
function normalizeTime(value) {
  return String(value).slice(0, 8)
}

// isoDay: 1=lunes..7=domingo (token 'i' de date-fns) → weekday: 0=domingo..6=sábado
function isoDayToWeekday(isoDay) {
  return isoDay % 7
}

/**
 * Calcula los horarios disponibles agrupados por día.
 *
 * @param {object} params
 * @param {Array<{weekday:number,start_time:string,end_time:string,active:boolean}>} params.rules
 * @param {object} params.settings
 * @param {Array<{start:string,end:string}>} params.busyPeriods - ocupado según Google Calendar
 * @param {Array<{start_time:string,end_time:string}>} params.appointments - citas ya guardadas
 * @param {Date} [params.now]
 * @returns {Array<{date:string, slots:Array<{startISO:string,endISO:string}>}>}
 */
export function computeAvailableSlots({ rules, settings, busyPeriods, appointments, now = new Date() }) {
  const {
    session_duration_minutes: duration,
    buffer_minutes: buffer,
    timezone,
    min_notice_hours: minNoticeHours,
    max_days_ahead: maxDaysAhead,
  } = settings

  const earliestStart = addMinutes(now, minNoticeHours * 60)
  const step = duration + (buffer || 0)

  const busy = [
    ...busyPeriods.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
    ...appointments.map((a) => ({ start: new Date(a.start_time), end: new Date(a.end_time) })),
  ]

  const days = []

  for (let i = 0; i < maxDaysAhead; i++) {
    const instant = addDays(now, i)
    const dateKey = formatTz(instant, 'yyyy-MM-dd', { timeZone: timezone })
    const isoDay = Number(formatTz(instant, 'i', { timeZone: timezone }))
    const weekday = isoDayToWeekday(isoDay)

    const dayRules = rules.filter((r) => r.active && r.weekday === weekday)
    if (dayRules.length === 0) continue

    const slots = []

    for (const rule of dayRules) {
      const startTime = normalizeTime(rule.start_time)
      const endTime = normalizeTime(rule.end_time)

      let cursor = fromZonedTime(`${dateKey}T${startTime}`, timezone)
      const ruleEnd = fromZonedTime(`${dateKey}T${endTime}`, timezone)

      while (addMinutes(cursor, duration) <= ruleEnd) {
        const slotStart = cursor
        const slotEnd = addMinutes(cursor, duration)

        const tooSoon = isBefore(slotStart, earliestStart)
        const collides = busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))

        if (!tooSoon && !collides) {
          slots.push({ startISO: slotStart.toISOString(), endISO: slotEnd.toISOString() })
        }

        cursor = addMinutes(cursor, step)
      }
    }

    if (slots.length > 0) {
      slots.sort((a, b) => a.startISO.localeCompare(b.startISO))
      days.push({ date: dateKey, slots })
    }
  }

  return days
}
