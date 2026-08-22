import { getSessionEmail } from './session.js'

function getAllowedEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAuthorizedEmail(email) {
  if (!email) return false
  return getAllowedEmails().includes(email.toLowerCase())
}

// Devuelve el correo de la sesión si está autorizada, o null (y responde 401).
export function requireAdmin(req, res) {
  const email = getSessionEmail(req)
  if (!isAuthorizedEmail(email)) {
    res.status(401).json({ error: 'No autorizado' })
    return null
  }
  return email
}
