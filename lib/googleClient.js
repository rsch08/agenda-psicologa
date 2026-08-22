import { google } from 'googleapis'
import { supabaseAdmin } from './supabaseAdmin.js'

const LOGIN_SCOPES = ['openid', 'email', 'profile']
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

// type: 'login' (identidad, sin acceso al calendario) o 'calendar' (conectar
// el calendario real). Ambos comparten el mismo redirect URI — el callback
// decide qué hacer según `state`.
export function getAuthUrl(type, state) {
  const client = createOAuthClient()
  const isLogin = type === 'login'
  return client.generateAuthUrl({
    access_type: isLogin ? 'online' : 'offline',
    prompt: 'consent', // fuerza a que Google reemita refresh_token cada vez (calendar)
    scope: isLogin ? LOGIN_SCOPES : CALENDAR_SCOPES,
    state,
  })
}

export async function exchangeCodeForTokens(code) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

// Arma un OAuth2Client autenticado con el token guardado en Supabase, o
// null si todavía no se conectó el calendario. Si Google refresca el
// access_token en el camino, lo persiste de vuelta en Supabase.
async function getAuthenticatedClient() {
  const { data: row, error } = await supabaseAdmin
    .from('google_tokens')
    .select('*')
    .eq('id', true)
    .maybeSingle()

  if (error) throw error
  if (!row || !row.refresh_token) return null

  const client = createOAuthClient()
  client.setCredentials({
    access_token: row.access_token ?? undefined,
    refresh_token: row.refresh_token,
    scope: row.scope ?? undefined,
    token_type: row.token_type ?? undefined,
    expiry_date: row.expiry_date ?? undefined,
  })

  client.on('tokens', (tokens) => {
    const update = { updated_at: new Date().toISOString() }
    if (tokens.access_token) update.access_token = tokens.access_token
    if (tokens.refresh_token) update.refresh_token = tokens.refresh_token
    if (tokens.expiry_date) update.expiry_date = tokens.expiry_date
    supabaseAdmin
      .from('google_tokens')
      .update(update)
      .eq('id', true)
      .then(({ error: updateError }) => {
        if (updateError) console.error('No se pudo guardar el token refrescado', updateError)
      })
  })

  return { client, row }
}

// Cliente de Calendar listo para usar, más a qué calendario se crean los
// eventos (calendarId) y cuáles se revisan para "ocupado" (busyCalendarIds
// — puede ser más de uno, ej. personal + trabajo).
export async function getCalendarClient() {
  const auth = await getAuthenticatedClient()
  if (!auth) return null
  const { client, row } = auth

  return {
    calendar: google.calendar({ version: 'v3', auth: client }),
    calendarId: row.calendar_id || 'primary',
    busyCalendarIds:
      Array.isArray(row.busy_calendar_ids) && row.busy_calendar_ids.length > 0
        ? row.busy_calendar_ids
        : ['primary'],
    connectedEmail: row.connected_email,
  }
}

// Lista todos los calendarios de la cuenta conectada (para que la
// psicóloga elija cuáles quiere que se revisen como "ocupado").
export async function listAvailableCalendars() {
  const auth = await getAuthenticatedClient()
  if (!auth) return null

  const calendar = google.calendar({ version: 'v3', auth: auth.client })
  const { data } = await calendar.calendarList.list()

  return (data.items || []).map((c) => ({
    id: c.id,
    summary: c.summary,
    primary: Boolean(c.primary),
  }))
}
