import { requireAdmin } from '../../lib/adminAuth.js'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'
import { listAvailableCalendars } from '../../lib/googleClient.js'

// GET /api/admin/calendars — lista los calendarios de la cuenta conectada
// más cuáles están marcados para revisar como "ocupado".
// POST /api/admin/calendars { busy_calendar_ids: [...] } — guarda la selección.
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    try {
      const calendars = await listAvailableCalendars()
      if (!calendars) {
        return res.status(409).json({ error: 'Google Calendar no está conectado.' })
      }

      const { data: row, error } = await supabaseAdmin
        .from('google_tokens')
        .select('busy_calendar_ids')
        .eq('id', true)
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({
        calendars,
        selected: row?.busy_calendar_ids && row.busy_calendar_ids.length > 0 ? row.busy_calendar_ids : ['primary'],
      })
    } catch (err) {
      console.error('Error en /api/admin/calendars', err)
      return res.status(500).json({ error: 'No se pudieron leer los calendarios.' })
    }
  }

  if (req.method === 'POST') {
    const { busy_calendar_ids: busyCalendarIds } = req.body ?? {}
    if (!Array.isArray(busyCalendarIds) || busyCalendarIds.length === 0) {
      return res.status(400).json({ error: 'Selecciona al menos un calendario.' })
    }

    const { error } = await supabaseAdmin
      .from('google_tokens')
      .update({ busy_calendar_ids: busyCalendarIds, updated_at: new Date().toISOString() })
      .eq('id', true)
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
