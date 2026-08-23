import { formatDayLabel, formatSlotTime } from './format.js'

// Formato de WhatsApp: *texto* se ve en negritas. Cada día: la fecha en
// negritas en su propio renglón, y abajo sus horarios separados por coma.
export function buildPatientPackageWhatsAppText({ patientName, days, timezone, url }) {
  const lines = []
  lines.push(`Hola ${patientName}, estos son los horarios que tengo disponibles para tu sesión conmigo:`)
  lines.push('')

  for (const day of days) {
    const times = day.slots.map((s) => formatSlotTime(s.startISO, timezone)).join(', ')
    lines.push(`*${formatDayLabel(day.date)}*`)
    lines.push(times)
    lines.push('')
  }

  lines.push(`Agenda aquí: ${url}`)
  return lines.join('\n')
}

export function buildWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // sigue al fallback de abajo
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}
