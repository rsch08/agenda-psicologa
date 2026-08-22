import { requireAdmin } from '../../lib/adminAuth.js'
import { getCalendarClient } from '../../lib/googleClient.js'

// GET /api/admin/calendar-events?from=ISO&to=ISO — eventos reales de TODOS
// los calendarios marcados como "a revisar" (busyCalendarIds — puede ser
// personal + trabajo), para pintarlos como "ocupado" en el widget donde la
// psicóloga elige a mano los horarios que le va a ofrecer a un paciente.
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'Faltan from/to' })

  try {
    const googleClient = await getCalendarClient()
    if (!googleClient) {
      return res.status(409).json({ error: 'Google Calendar no está conectado.' })
    }

    const timeMin = new Date(from).toISOString()
    const timeMax = new Date(to).toISOString()

    const results = await Promise.all(
      googleClient.busyCalendarIds.map(async (calendarId) => {
        try {
          const { data } = await googleClient.calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 250,
          })
          return data.items || []
        } catch (err) {
          console.error(`No se pudo leer el calendario ${calendarId}`, err)
          return []
        }
      }),
    )

    const events = results
      .flat()
      .filter((e) => e.start?.dateTime && e.end?.dateTime) // ignora eventos de "todo el día"
      .map((e) => ({
        start: e.start.dateTime,
        end: e.end.dateTime,
        summary: e.summary || '(sin título)',
      }))

    res.status(200).json({ events })
  } catch (err) {
    console.error('Error en /api/admin/calendar-events', err)
    res.status(500).json({ error: 'No se pudieron leer los eventos del calendario.' })
  }
}
