import { google } from 'googleapis'
import { createOAuthClient, exchangeCodeForTokens } from '../lib/googleClient.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { isAuthorizedEmail } from '../lib/adminAuth.js'
import { createSessionCookie } from '../lib/session.js'

// GET /api/google-callback — Google redirige aquí después del consentimiento,
// tanto para el flujo de login como para el de conectar el calendario.
// `state` dice cuál de los dos fue.
export default async function handler(req, res) {
  const { code, error, state } = req.query
  const baseUrl = process.env.APP_BASE_URL || ''

  if (error || !code) {
    res.writeHead(302, { Location: `${baseUrl}/admin?error=google` })
    return res.end()
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const client = createOAuthClient()
    client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userinfo } = await oauth2.userinfo.get()
    const email = userinfo?.email

    if (state === 'login') {
      if (!isAuthorizedEmail(email)) {
        res.writeHead(302, { Location: `${baseUrl}/admin?error=unauthorized` })
        return res.end()
      }
      res.setHeader('Set-Cookie', createSessionCookie(email))
      res.writeHead(302, { Location: `${baseUrl}/admin` })
      return res.end()
    }

    // state === 'calendar': conectar/reconectar el calendario real.
    const { data: existing } = await supabaseAdmin
      .from('google_tokens')
      .select('refresh_token')
      .eq('id', true)
      .maybeSingle()

    const { error: upsertError } = await supabaseAdmin.from('google_tokens').upsert({
      id: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existing?.refresh_token || null,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      connected_email: email || null,
      calendar_id: 'primary',
      updated_at: new Date().toISOString(),
    })

    if (upsertError) throw upsertError

    res.writeHead(302, { Location: `${baseUrl}/admin?google=connected` })
    res.end()
  } catch (err) {
    console.error('Error en /api/google-callback', err)
    res.writeHead(302, { Location: `${baseUrl}/admin?error=google` })
    res.end()
  }
}
