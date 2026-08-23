import { requireAdmin } from '../../lib/adminAuth.js'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

// GET /api/admin/settings — ajustes actuales.
// POST /api/admin/settings { session_duration_minutes, timezone, psychologist_name,
//   office_address, in_person_color_id, virtual_color_id }
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { data: settings, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ settings })
  }

  if (req.method === 'POST') {
    const {
      session_duration_minutes,
      timezone,
      psychologist_name,
      office_address,
      in_person_color_id,
      virtual_color_id,
    } = req.body ?? {}

    const { error } = await supabaseAdmin
      .from('settings')
      .update({
        session_duration_minutes,
        timezone,
        psychologist_name,
        office_address,
        in_person_color_id,
        virtual_color_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
