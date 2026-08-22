import { getAuthUrl } from '../lib/googleClient.js'
import { requireAdmin } from '../lib/adminAuth.js'

// GET /api/google-auth — protegida por sesión, inicia el flujo de conectar
// (o reconectar) el calendario real. Independiente de quién esté logueado.
export default function handler(req, res) {
  if (!requireAdmin(req, res)) return

  const url = getAuthUrl('calendar', 'calendar')
  res.writeHead(302, { Location: url })
  res.end()
}
