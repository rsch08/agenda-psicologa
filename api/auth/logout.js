import { clearSessionCookie } from '../../lib/session.js'

// GET /api/auth/logout — borra la cookie de sesión.
export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie())
  const baseUrl = process.env.APP_BASE_URL || ''
  res.writeHead(302, { Location: `${baseUrl}/admin` })
  res.end()
}
