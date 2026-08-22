import crypto from 'crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 días

function sign(value) {
  const secret = process.env.SESSION_SECRET || ''
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

// El correo va codificado en base64url dentro de la cookie: un correo real
// como "novia@gmail.com" ya trae un punto en el dominio, y si no se
// codificara chocaría con el separador "." usado más abajo entre los tres
// campos (se rompía silenciosamente el parseo y la sesión nunca "prendía").
function encodeEmail(email) {
  return Buffer.from(email, 'utf8').toString('base64url')
}

function decodeEmail(encoded) {
  return Buffer.from(encoded, 'base64url').toString('utf8')
}

export function createSessionCookie(email) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = `${encodeEmail(email)}.${expires}`
  const value = `${payload}.${sign(payload)}`
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}

// Devuelve el correo de la sesión si la cookie es válida y no expiró, o null.
export function getSessionEmail(req) {
  const raw = parseCookies(req.headers.cookie)[COOKIE_NAME]
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [encodedEmail, expiresStr, signature] = parts

  if (sign(`${encodedEmail}.${expiresStr}`) !== signature) return null

  const expires = Number(expiresStr)
  if (!expires || Date.now() > expires) return null

  return decodeEmail(encodedEmail)
}
