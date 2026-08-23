import crypto from 'crypto'
import { requireAdmin } from '../../lib/adminAuth.js'
import { supabaseAdmin } from '../../lib/supabaseAdmin.js'

function generateToken() {
  return crypto.randomBytes(9).toString('base64url')
}

// GET /api/admin/patient-links — lista de paquetes armados, con sus
// horarios y la cita confirmada si ya agendó (esto es el "log" de a quién
// se le mandó qué).
// POST /api/admin/patient-links { patient_name, slots: [{start_time,end_time}] }
// — crea un paquete nuevo y devuelve el link para compartir.
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const { data: links, error } = await supabaseAdmin
      .from('patient_links')
      .select('*, offered_slots(*), appointments(*)')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ links: links ?? [] })
  }

  if (req.method === 'POST') {
    const { patient_name, slots, meeting_type: meetingType } = req.body ?? {}

    if (!patient_name || !String(patient_name).trim()) {
      return res.status(400).json({ error: 'Falta el nombre del paciente.' })
    }
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Selecciona al menos un horario.' })
    }
    if (!['presencial', 'virtual'].includes(meetingType)) {
      return res.status(400).json({ error: 'Falta indicar si la sesión es presencial o virtual.' })
    }

    const token = generateToken()

    const { data: link, error: linkErr } = await supabaseAdmin
      .from('patient_links')
      .insert({ patient_name: String(patient_name).trim(), token, meeting_type: meetingType })
      .select()
      .single()
    if (linkErr) return res.status(500).json({ error: linkErr.message })

    const rows = slots.map((s) => ({
      patient_link_id: link.id,
      start_time: s.start_time,
      end_time: s.end_time,
    }))
    const { error: slotsErr } = await supabaseAdmin.from('offered_slots').insert(rows)
    if (slotsErr) return res.status(500).json({ error: slotsErr.message })

    const baseUrl = process.env.APP_BASE_URL || ''
    return res.status(200).json({ link, url: `${baseUrl}/p/${token}` })
  }

  res.status(405).json({ error: 'Método no permitido' })
}
