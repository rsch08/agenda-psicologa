// Auth simple de un solo passcode compartido — suficiente para una sola
// psicóloga con un link privado, no es un sistema de auth robusto.
export function isAuthorized(req) {
  const passcode = process.env.ADMIN_PASSCODE
  if (!passcode) return false

  const header = req.headers['x-admin-passcode']
  const fromQuery = req.query?.passcode
  const provided = header || fromQuery

  return typeof provided === 'string' && provided === passcode
}

export function requireAdmin(req, res) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'No autorizado' })
    return false
  }
  return true
}
