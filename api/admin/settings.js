import { requireAdmin } from '../../lib/adminAuth.js'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

// GET /api/admin/settings — ajustes + reglas de disponibilidad actuales.
// POST /api/admin/settings { settings?, rules? } — guarda ambos (reemplaza las reglas).
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const [{ data: settings, error: sErr }, { data: rules, error: rErr }] = await Promise.all([
      supabaseAdmin.from('settings').select('*').eq('id', true).maybeSingle(),
      supabaseAdmin.from('availability_rules').select('*').order('weekday'),
    ])
    if (sErr) return res.status(500).json({ error: sErr.message })
    if (rErr) return res.status(500).json({ error: rErr.message })
    return res.status(200).json({ settings, rules: rules ?? [] })
  }

  if (req.method === 'POST') {
    const { settings, rules } = req.body ?? {}

    if (settings) {
      const {
        session_duration_minutes,
        buffer_minutes,
        timezone,
        min_notice_hours,
        max_days_ahead,
        psychologist_name,
      } = settings

      const { error } = await supabaseAdmin
        .from('settings')
        .update({
          session_duration_minutes,
          buffer_minutes,
          timezone,
          min_notice_hours,
          max_days_ahead,
          psychologist_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', true)
      if (error) return res.status(500).json({ error: error.message })
    }

    if (Array.isArray(rules)) {
      const { error: delErr } = await supabaseAdmin.from('availability_rules').delete().gte('weekday', 0)
      if (delErr) return res.status(500).json({ error: delErr.message })

      const validRules = rules
        .filter((r) => r.active && r.start_time && r.end_time && r.start_time < r.end_time)
        .map((r) => ({
          weekday: r.weekday,
          start_time: r.start_time,
          end_time: r.end_time,
          active: true,
        }))

      if (validRules.length > 0) {
        const { error: insErr } = await supabaseAdmin.from('availability_rules').insert(validRules)
        if (insErr) return res.status(500).json({ error: insErr.message })
      }
    }

    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
