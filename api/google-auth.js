import { getAuthUrl } from '../lib/googleClient.js'
import { requireAdmin } from '../lib/adminAuth.js'

// GET /api/google-auth?passcode=... — redirige a la pantalla de consentimiento de Google.
export default function handler(req, res) {
  if (!requireAdmin(req, res)) return

  const url = getAuthUrl('admin')
  res.writeHead(302, { Location: url })
  res.end()
}
