import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { getCalendarClient } from '../lib/googleClient.js'
import { computeAvailableSlots } from '../lib/slotEngine.js'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// POST /api/book { name, email, phone?, startISO } — pública.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { name, email, phone, startISO } = req.body ?? {}

  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Falta el nombre.' })
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Correo inválido.' })
  if (!startISO || Number.isNaN(new Date(startISO).getTime())) {
    return res.status(400).json({ error: 'Horario inválido.' })
  }

  try {
    const { data: settings, error: sErr } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
    if (sErr) throw sErr
    if (!settings) return res.status(500).json({ error: 'No hay configuración guardada todavía.' })

    const { data: rules, error: rErr } = await supabaseAdmin
      .from('availability_rules')
      .select('*')
      .eq('active', true)
    if (rErr) throw rErr

    const now = new Date()
    const rangeEnd = new Date(now.getTime() + settings.max_days_ahead * 24 * 60 * 60 * 1000)

    const { data: existingAppointments, error: aErr } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time')
      .eq('status', 'confirmed')
      .lte('start_time', rangeEnd.toISOString())
    if (aErr) throw aErr

    const googleClient = await getCalendarClient()
    let busyPeriods = []
    if (googleClient) {
      const { data: fb } = await googleClient.calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: rangeEnd.toISOString(),
          items: [{ id: googleClient.calendarId }],
        },
      })
      busyPeriods = (fb.calendars?.[googleClient.calendarId]?.busy ?? []).map((b) => ({
        start: b.start,
        end: b.end,
      }))
    }

    // Revalidar contra el estado actual antes de guardar — mitiga que dos
    // personas agenden el mismo horario casi al mismo tiempo.
    const days = computeAvailableSlots({
      rules: rules ?? [],
      settings,
      busyPeriods,
      appointments: existingAppointments ?? [],
      now,
    })
    const stillAvailable = days.some((d) => d.slots.some((s) => s.startISO === startISO))
    if (!stillAvailable) {
      return res.status(409).json({ error: 'Ese horario ya no está disponible. Elige otro.' })
    }

    const startTime = new Date(startISO)
    const endTime = new Date(startTime.getTime() + settings.session_duration_minutes * 60 * 1000)

    let googleEventId = null
    if (googleClient) {
      const { data: event } = await googleClient.calendar.events.insert({
        calendarId: googleClient.calendarId,
        sendUpdates: 'all',
        requestBody: {
          summary: `Sesión con ${name}`,
          description: phone ? `Teléfono: ${phone}` : undefined,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          attendees: [{ email }],
        },
      })
      googleEventId = event.id
    }

    const { data: appointment, error: insErr } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_name: name,
        patient_email: email,
        patient_phone: phone || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        google_event_id: googleEventId,
      })
      .select()
      .single()

    if (insErr) throw insErr

    res.status(200).json({ appointment })
  } catch (err) {
    console.error('Error en /api/book', err)
    res.status(500).json({ error: 'No se pudo agendar la cita.' })
  }
}
