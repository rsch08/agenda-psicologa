import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

// GET /api/patient/:token — pública. Devuelve el nombre del paciente, sus
// horarios asignados, y la cita confirmada (si ya agendó).
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  const { token } = req.query

  const { data: link, error } = await supabaseAdmin
    .from('patient_links')
    .select('*, offered_slots(*), appointments(*)')
    .eq('token', token)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!link) return res.status(404).json({ error: 'Link no encontrado.' })

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('timezone, psychologist_name')
    .eq('id', true)
    .maybeSingle()

  const appointment = (link.appointments || []).find((a) => a.status === 'confirmed') || null

  res.status(200).json({
    patient_name: link.patient_name,
    slots: (link.offered_slots || []).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    appointment,
    timezone: settings?.timezone,
    psychologist_name: settings?.psychologist_name,
  })
}
