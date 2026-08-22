import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { getCalendarClient } from '../lib/googleClient.js'
import { computeAvailableSlots } from '../lib/slotEngine.js'

// GET /api/availability — pública. Devuelve los horarios libres agrupados
// por día para los próximos `max_days_ahead` días.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  try {
    const [{ data: settings, error: sErr }, { data: rules, error: rErr }] = await Promise.all([
      supabaseAdmin.from('settings').select('*').eq('id', true).maybeSingle(),
      supabaseAdmin.from('availability_rules').select('*').eq('active', true),
    ])
    if (sErr) throw sErr
    if (rErr) throw rErr
    if (!settings) {
      return res.status(500).json({ error: 'No hay configuración guardada todavía.' })
    }

    const now = new Date()
    const rangeEnd = new Date(now.getTime() + settings.max_days_ahead * 24 * 60 * 60 * 1000)

    const { data: appointments, error: aErr } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time')
      .eq('status', 'confirmed')
      .lte('start_time', rangeEnd.toISOString())
    if (aErr) throw aErr

    let busyPeriods = []
    let googleConnected = false

    const googleClient = await getCalendarClient()
    if (googleClient) {
      googleConnected = true
      const { data: fb } = await googleClient.calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: rangeEnd.toISOString(),
          items: [{ id: googleClient.calendarId }],
        },
      })
      const calendarBusy = fb.calendars?.[googleClient.calendarId]?.busy ?? []
      busyPeriods = calendarBusy.map((b) => ({ start: b.start, end: b.end }))
    }

    const days = computeAvailableSlots({
      rules: rules ?? [],
      settings,
      busyPeriods,
      appointments: appointments ?? [],
      now,
    })

    res.status(200).json({
      days,
      googleConnected,
      settings: {
        session_duration_minutes: settings.session_duration_minutes,
        timezone: settings.timezone,
        psychologist_name: settings.psychologist_name,
      },
    })
  } catch (err) {
    console.error('Error en /api/availability', err)
    res.status(500).json({ error: 'No se pudo calcular la disponibilidad.' })
  }
}
