# Agenda para Psicóloga — Spec v2

## Problema que resuelve
La psicóloga agenda sus sesiones a mano por WhatsApp. Quiere automatizar
*compartir* horarios y *agendar*, pero sin perder el control fino de a
quién le ofrece qué — su Google Calendar no refleja el 100% de sus
compromisos reales (otras pacientes, pendientes personales), así que
calcular disponibilidad de forma automática no es confiable. Ella prefiere
elegir a mano, por paciente, exactamente qué horarios ofrecer.

## Cómo funciona (v2)
1. La psicóloga entra a `/admin`, se loguea con su cuenta de Google (solo
   correos autorizados) y conecta su calendario real una sola vez.
2. Por cada paciente nuevo: clic en "Nuevo horario" → escribe el nombre →
   elige si la sesión es presencial o virtual → ve un widget con su
   calendario real (los huecos ocupados salen tachados) → hace clic a mano
   en los horarios que quiere ofrecer.
3. Se genera un link único para ese paciente (sin contraseña, token
   imposible de adivinar) con una pantalla lista para compartir por
   WhatsApp.
4. El paciente entra a su link, ve solo esos horarios, agenda uno — Google
   Calendar le manda la invitación automática. Puede volver y cambiar de
   horario entre los que le tocaron (se cancela el evento anterior).
5. Al agendar, si la cita es virtual se crea un link único de Google Meet
   (uno nuevo por cita, vía la API de Meet — no `conferenceData` de
   Calendar, para que el paciente siempre tenga que "tocar la puerta" y la
   psicóloga lo admita a mano); si es presencial se usa la dirección del
   consultorio configurada en Ajustes. El evento sale con el color que la
   psicóloga configuró para ese tipo de cita, y ella misma queda como
   invitada del evento para enterarse por correo de Google Calendar cuando
   alguien agenda.

No existe un link público genérico: cada paciente tiene el suyo, curado a
mano.

## Stack
- **Frontend**: React + Vite + Tailwind, React Router
- **Backend**: funciones serverless de Vercel (`/api/*`)
- **DB**: Supabase (Postgres) — solo accesible server-side con la service
  role key, RLS cerrado
- **Calendario**: Google Calendar API — dos flujos OAuth separados (login
  de identidad vs. conexión del calendario), para que loguearse a probar el
  panel no reemplace accidentalmente el calendario conectado
- **Videollamada**: Google Meet API (`meet.googleapis.com`, espacio nuevo
  por cita) — separada de `conferenceData` de Calendar a propósito, ver
  sección de Google Meet más abajo
- **Auth del admin**: cookie de sesión firmada (HMAC), emitida tras un
  login con Google cuyo correo esté en `ADMIN_EMAILS`
- **Deploy**: Vercel

## Modelo de datos
```
settings (fila única)
 - session_duration_minutes, timezone, psychologist_name
 - office_address (para citas presenciales)
 - in_person_color_id, virtual_color_id (colores de Google Calendar)

google_tokens (fila única — el calendario conectado)
 - access_token, refresh_token, expiry_date, connected_email
 - calendar_id (dónde se crean los eventos)
 - busy_calendar_ids (qué calendarios se revisan para saber qué está ocupado)

patient_links (un paquete de horarios armado a mano para un paciente)
 - id, patient_name, token (único, va en la URL)
 - meeting_type ('presencial' | 'virtual')
 - created_at

offered_slots (los horarios exactos elegidos para ese paciente)
 - id, patient_link_id, start_time, end_time

appointments (la cita agendada, si el paciente ya escogió)
 - id, patient_link_id, offered_slot_id, patient_name, patient_email,
   patient_phone (sin uso hoy, se deja la columna), start_time, end_time,
   google_event_id, meeting_link (URL de Meet, solo si es virtual), status
```

## Google Meet: por qué un espacio nuevo por cita

La psicóloga necesita aprobar ella misma a cada paciente antes de dejarlo
entrar a la videollamada. El tipo de acceso "Restringido" de Meet (el
anfitrión aprueba a cada quien) es exclusivo de cuentas Google Workspace,
no existe en Gmail normal. La forma de lograr el mismo efecto en una cuenta
personal es no usar la integración oficial de Calendar
(`conferenceData`), porque esa es la que le da a los invitados del evento
el privilegio de entrar sin tocar la puerta. En cambio: se crea el espacio
de Meet aparte con la API de Meet (`meet.spaces.create`), se pega la URL
como texto plano en `location` del evento, y el paciente se sigue
agregando como `attendee` normal (para que le llegue la invitación por
correo). Resultado: el paciente siempre tiene que pedir unirse y la
psicóloga lo admite a mano — y como el espacio es nuevo por cada cita, dos
pacientes distintos nunca comparten la misma sala de espera.

## Features — MVP (v2, construido)
1. Login de admin con Google, restringido por lista de correos
2. Conexión del calendario real, independiente de quién esté logueado
3. Widget de calendario clickeable (semana navegable, eventos reales
   tachados) para armar el paquete de un paciente
4. Link único por paciente, sin contraseña
5. Compartir por WhatsApp (copiar texto o abrir wa.me con el mensaje
   armado)
6. Página del paciente: ve sus horarios asignados, agenda, puede cambiar de
   opinión entre los mismos horarios
7. Invitación automática de Google Calendar al paciente al agendar (sin
   `conferenceData` — el link de Meet, cuando aplica, se maneja aparte, ver
   sección de Google Meet)
8. Log en el admin de a qué paciente se le mandó qué y si ya agendó
9. Presencial vs. virtual por paquete de paciente: presencial pone la
   dirección del consultorio en el evento, virtual crea un link único de
   Google Meet por cita
10. Colores de evento en Google Calendar configurables por tipo de cita
    (presencial / virtual)
11. La psicóloga se agrega como invitada de cada evento, para que le
    llegue la notificación de Google Calendar cuando un paciente agenda
12. Mensaje de bienvenida configurable arriba del selector de horarios de
    la página del paciente
13. Widget de calendario del admin anclado a "hoy", nunca muestra días ya
    pasados
14. Mensaje de WhatsApp con formato nativo (negritas en fechas, bullets) y
    en primera persona ("mi sesión contigo")
15. Rebranding visual (paleta, tipografía) alineado al sitio real de la
    psicóloga

## Features — Fase 2 (después del MVP)
- Rango horario del widget configurable (hoy fijo 7am–9pm)
- Cancelar un paquete ya creado desde el admin
- Horarios mostrados en la zona horaria del navegador del paciente, no solo
  la de la psicóloga
- Recordatorio automático 24h antes (cron de Vercel)
- Notificación por WhatsApp automática al agendar (requiere WhatsApp
  Business Platform de pago — hoy la notificación a la psicóloga depende
  del correo que manda Google Calendar por ser invitada al evento)
- **Multi-tenant**: cada psicóloga con su propia cuenta y su propio
  calendario conectado, para poder vender esto a otras profesionales. Hoy
  el modelo asume una sola psicóloga (filas únicas de `settings` y
  `google_tokens`) — para generalizar hace falta agregar un "dueño" a cada
  tabla y aislar los datos por cuenta.

## Siguiente paso práctico
1. `service_role` key de Supabase → variables de entorno
2. Credenciales OAuth de Google (un solo redirect URI para los dos flujos)
3. `ADMIN_EMAILS` + `SESSION_SECRET` en las variables de entorno
4. Deploy en Vercel, login, conectar calendario, primer "Nuevo horario"
