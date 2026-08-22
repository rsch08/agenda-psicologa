import { requireAdmin } from '../../lib/adminAuth.js'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

// GET /api/admin/appointments — próximas citas confirmadas (solo lectura).
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('status', 'confirmed')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(100)

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ appointments: data ?? [] })
}
