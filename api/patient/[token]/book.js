import { supabaseAdmin } from '../../../lib/supabaseAdmin.js'
import { getCalendarClient } from '../../../lib/googleClient.js'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// POST /api/patient/:token/book { offered_slot_id, name, email, phone }
// — pública. Si el paciente ya tenía una cita confirmada de este mismo
// link, la cancela (borra el evento de Google) antes de crear la nueva —
// así puede cambiar de opinión entre los horarios que se le asignaron.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { token } = req.query
  const { offered_slot_id, name, email, phone } = req.body ?? {}

  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Falta el nombre.' })
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Correo inválido.' })
  if (!offered_slot_id) return res.status(400).json({ error: 'Falta el horario.' })

  try {
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('patient_links')
      .select('*, offered_slots(*), appointments(*)')
      .eq('token', token)
      .maybeSingle()
    if (linkErr) throw linkErr
    if (!link) return res.status(404).json({ error: 'Link no encontrado.' })

    const slot = (link.offered_slots || []).find((s) => s.id === offered_slot_id)
    if (!slot) return res.status(400).json({ error: 'Ese horario no pertenece a este link.' })

    const googleClient = await getCalendarClient()

    const existingAppointment = (link.appointments || []).find((a) => a.status === 'confirmed')
    if (existingAppointment) {
      if (googleClient && existingAppointment.google_event_id) {
        await googleClient.calendar.events
          .delete({ calendarId: googleClient.calendarId, eventId: existingAppointment.google_event_id })
          .catch(() => {}) // si ya no existe en Google, seguimos de todos modos
      }
      await supabaseAdmin.from('appointments').delete().eq('id', existingAppointment.id)
    }

    let googleEventId = null
    if (googleClient) {
      const { data: event } = await googleClient.calendar.events.insert({
        calendarId: googleClient.calendarId,
        sendUpdates: 'all',
        requestBody: {
          summary: `Sesión con ${name}`,
          description: phone ? `Teléfono: ${phone}` : undefined,
          start: { dateTime: slot.start_time },
          end: { dateTime: slot.end_time },
          attendees: [{ email }],
        },
      })
      googleEventId = event.id
    }

    const { data: appointment, error: insErr } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_link_id: link.id,
        offered_slot_id: slot.id,
        patient_name: name,
        patient_email: email,
        patient_phone: phone || null,
        start_time: slot.start_time,
        end_time: slot.end_time,
        google_event_id: googleEventId,
      })
      .select()
      .single()
    if (insErr) throw insErr

    res.status(200).json({ appointment })
  } catch (err) {
    console.error('Error en /api/patient/[token]/book', err)
    res.status(500).json({ error: 'No se pudo agendar la cita.' })
  }
}
