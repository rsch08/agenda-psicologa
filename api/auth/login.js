import { getAuthUrl } from '../../lib/googleClient.js'

// GET /api/auth/login — pública, inicia el flujo de "identidad" (sin acceso
// al calendario). El callback decide si el correo está autorizado.
export default function handler(req, res) {
  const url = getAuthUrl('login', 'login')
  res.writeHead(302, { Location: url })
  res.end()
}
