# Agenda para Psicóloga — Spec v1

## Problema que resuelve
La psicóloga (novia de Casta) agenda sus sesiones a mano por WhatsApp: cada
paciente pregunta disponibilidad, ella revisa su Google Calendar, contesta,
y a veces hay choques o idas y vueltas. Se necesita una versión simplificada
de Calendly, hecha a medida:

1. Ella configura **una sola vez** qué horarios de la semana quiere ofrecer.
2. El sistema cruza esos horarios con su Google Calendar real (para no
   ofrecer horas que ya están ocupadas).
3. El paciente entra a un link público, ve **todos los horarios disponibles
   de una sola vista** (no día por día, como si estuvieran "embebidos" en un
   correo) y agenda directo.
4. El paciente puede copiar esos horarios en un formato listo para pegar en
   WhatsApp.

## Stack
- **Frontend**: React + Vite + Tailwind, con React Router (página pública de
  agendado + página de configuración)
- **Backend**: funciones serverless de Vercel (`/api/*`) — necesarias porque
  hablar con la API de Google Calendar requiere manejar `client_secret` y
  refresh tokens, que nunca deben llegar al navegador
- **DB**: Supabase (Postgres) — pero a diferencia del proyecto anterior, el
  navegador **nunca** habla directo con Supabase. Todo pasa por `/api/*`
  usando la service role key del lado del servidor. Esto evita exponer
  tokens de Google o el passcode de admin.
- **Calendario**: Google Calendar API (OAuth2 + `freebusy.query` +
  `events.insert`)
- **Deploy**: Vercel (funciones serverless + frontend estático)

## Modelo de datos (MVP)
```
settings (fila única)
 - session_duration_minutes, buffer_minutes, timezone
 - min_notice_hours, max_days_ahead
 - psychologist_name

availability_rules (reglas semanales recurrentes)
 - id, weekday (0=domingo..6=sábado), start_time, end_time, active

google_tokens (fila única — credenciales OAuth de la psicóloga)
 - access_token, refresh_token, expiry_date, connected_email, calendar_id

appointments (citas agendadas)
 - id, patient_name, patient_email, patient_phone
 - start_time, end_time, google_event_id, status, notes, created_at
```

## Cómo se calcula la disponibilidad
1. Tomar `availability_rules` activas → generar franjas candidatas por día,
   según `session_duration_minutes` + `buffer_minutes`, en la `timezone`
   configurada.
2. Descartar franjas que empiecen antes de `ahora + min_notice_hours`.
3. Descartar franjas que choquen con eventos ocupados de Google Calendar
   (`freebusy.query`) o con citas ya guardadas en `appointments`.
4. Devolver el resultado agrupado por día, para los próximos
   `max_days_ahead` días — esta es la lista que ve el paciente en una sola
   vista, sin tener que hacer clic día por día.

## Features — MVP (fase 1)
1. **Config (`/admin`)**, protegida con passcode simple (`ADMIN_PASSCODE`):
   - Conectar/desconectar Google Calendar (OAuth2)
   - Editor de horarios semanales (un rango por día activo)
   - Ajustes: duración de sesión, buffer entre citas, timezone, aviso mínimo
     en horas, cuántos días hacia adelante mostrar
   - Lista de próximas citas agendadas (solo lectura)
2. **Página pública de agendado (`/`)**:
   - Todos los horarios disponibles de los próximos N días, agrupados por
     día, visibles de una sola vez (sin navegar día por día)
   - Botón "Copiar para WhatsApp" que arma un texto con los horarios +
     el link de la página, listo para pegar en un chat
   - Al escoger un horario: formulario corto (nombre, correo, teléfono
     opcional) → confirmación
   - Al confirmar, Google Calendar le manda automáticamente una invitación
     por correo al paciente (usando `sendUpdates: all` en el evento) — no
     hace falta un servicio de correo aparte para el MVP
3. **Prevención de choques**: antes de guardar la cita se revalida contra
   Google Calendar + citas ya guardadas (mitiga condiciones de carrera si
   dos personas agendan casi al mismo tiempo).

## Features — Fase 2 (después del MVP)
- Más de un rango horario por día (ej. mañana y tarde separados)
- Cancelar/reagendar cita desde un link que le llega al paciente
- Recordatorio automático 24h antes (cron de Vercel + correo/WhatsApp)
- Autenticación real de la psicóloga (hoy es un passcode único en vez de
  login), pensado para si algún día hay más de una profesional usando el
  sistema
- Bloqueo manual de fechas puntuales (vacaciones, día festivo) sin tener
  que tocar Google Calendar
- Botón "Compartir por WhatsApp" que abre directo `wa.me` con el texto
  precargado, además de copiar al portapapeles

## Riesgo #1 identificado
Que la conexión con Google Calendar se desconfigure (token expirado o
revocado) y la página siga mostrando horarios "disponibles" que en
realidad ya están ocupados. Mitigación: si `google_tokens` no tiene una
conexión válida, la página de admin lo muestra en rojo de forma visible, y
`/api/availability` intenta refrescar el token en cada consulta.

## Siguiente paso práctico
1. Crear proyecto en Supabase y correr `supabase/schema.sql`
2. Crear credenciales OAuth de Google Cloud Console (ver README)
3. Configurar variables de entorno (Supabase + Google + `ADMIN_PASSCODE`)
4. `npm install` → `npm run dev` para probar local
5. Deploy en Vercel, agregar las mismas variables de entorno ahí
6. Entrar a `/admin`, conectar Google Calendar, definir horarios
7. Compartir el link público (`/`) con las pacientes
