const DAY_LABELS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTH_LABELS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

// dateKey viene como "yyyy-MM-dd" (fecha calendario, ya resuelta en la
// timezone de la psicóloga) — se parsea manual para no reintroducir
// ambigüedad de timezone al construir el Date.
export function formatDayLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAY_LABELS[date.getDay()]} ${d} de ${MONTH_LABELS[m - 1]}`
}

export function formatSlotTime(iso, timezone) {
  return new Intl.DateTimeFormat('es', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(new Date(iso))
}

export function formatSlotDateTime(iso, timezone) {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(new Date(iso))
}
