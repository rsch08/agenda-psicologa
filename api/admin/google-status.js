import { requireAdmin } from '../../lib/adminAuth.js'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

// GET /api/admin/google-status — estado de la conexión con Google Calendar.
// DELETE /api/admin/google-status — desconecta (borra el token guardado).
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('google_tokens')
      .select('connected_email, calendar_id, updated_at')
      .eq('id', true)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ connected: Boolean(data?.connected_email), ...data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('google_tokens').delete().eq('id', true)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
