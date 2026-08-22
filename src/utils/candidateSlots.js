import { addDays, addMinutes } from 'date-fns'
import { fromZonedTime, format as formatTz } from 'date-fns-tz'

const DAY_START_HOUR = 7
const DAY_END_HOUR = 21

// Genera, por cada uno de los 7 días a partir de weekStart, las franjas
// candidatas de exactamente `durationMinutes` entre las DAY_START_HOUR y
// DAY_END_HOUR (hora de la psicóloga). Son solo candidatas — el widget las
// cruza con los eventos reales de Google para saber cuáles ya están
// ocupadas.
export function buildWeekDays(weekStart, timezone, durationMinutes) {
  const days = []

  for (let i = 0; i < 7; i++) {
    const instant = addDays(weekStart, i)
    const dateKey = formatTz(instant, 'yyyy-MM-dd', { timeZone: timezone })
    const dayStart = fromZonedTime(`${dateKey}T${pad(DAY_START_HOUR)}:00:00`, timezone)
    const dayEnd = fromZonedTime(`${dateKey}T${pad(DAY_END_HOUR)}:00:00`, timezone)

    const slots = []
    let cursor = dayStart
    while (addMinutes(cursor, durationMinutes) <= dayEnd) {
      slots.push({
        startISO: cursor.toISOString(),
        endISO: addMinutes(cursor, durationMinutes).toISOString(),
      })
      cursor = addMinutes(cursor, durationMinutes)
    }
    days.push({ date: dateKey, slots })
  }

  return days
}

function pad(n) {
  return String(n).padStart(2, '0')
}

// Agrupa una lista plana de horarios {startISO,endISO} por fecha calendario
// (en la timezone dada), ordenados.
export function groupSlotsByDay(slots, timezone) {
  const map = new Map()
  for (const slot of slots) {
    const dateKey = formatTz(new Date(slot.startISO), 'yyyy-MM-dd', { timeZone: timezone })
    if (!map.has(dateKey)) map.set(dateKey, [])
    map.get(dateKey).push(slot)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySlots]) => ({
      date,
      slots: daySlots.sort((a, b) => a.startISO.localeCompare(b.startISO)),
    }))
}
