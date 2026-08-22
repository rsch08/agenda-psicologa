import { formatDayLabel, formatSlotTime, formatSlotDateTime } from './format.js'

export function buildAvailabilityWhatsAppText({ days, timezone, psychologistName, bookingUrl }) {
  const lines = []
  lines.push(
    psychologistName
      ? `Horarios disponibles con ${psychologistName}:`
      : 'Horarios disponibles para agendar:',
  )
  lines.push('')

  for (const day of days) {
    const times = day.slots.map((s) => formatSlotTime(s.startISO, timezone)).join(', ')
    lines.push(`${formatDayLabel(day.date)}: ${times}`)
  }

  lines.push('')
  lines.push(`Agenda aquí: ${bookingUrl}`)
  return lines.join('\n')
}

export function buildConfirmationWhatsAppText({ startISO, timezone, psychologistName, patientName }) {
  const when = formatSlotDateTime(startISO, timezone)
  const withWhom = psychologistName ? ` con ${psychologistName}` : ''
  return `Hola, soy ${patientName}. Confirmo mi sesión${withWhom} el ${when}.`
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
