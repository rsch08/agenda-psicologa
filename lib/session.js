import crypto from 'crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 días

function sign(value) {
  const secret = process.env.SESSION_SECRET || ''
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

export function createSessionCookie(email) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = `${email}.${expires}`
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
  const [email, expiresStr, signature] = parts

  if (sign(`${email}.${expiresStr}`) !== signature) return null

  const expires = Number(expiresStr)
  if (!expires || Date.now() > expires) return null

  return email
}
