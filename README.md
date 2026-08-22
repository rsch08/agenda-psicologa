# Agenda para Psicóloga

Herramienta a la medida para armar y compartir horarios de sesión, uno por
uno, con cada paciente. Ver `SPEC.md` para el spec completo.

## Cómo funciona

1. La psicóloga entra a `/admin` (login con Google — solo correos
   autorizados en `ADMIN_EMAILS` pueden entrar) y conecta su Google Calendar
   real, una sola vez.
2. Le da clic a **"+ Nuevo horario"**, escribe el nombre del paciente, y ve
   un widget con su calendario real: los huecos ocupados salen tachados. Le
   da clic a mano a los 4-5 horarios que quiere ofrecerle.
3. Al crear el paquete, la app genera un **link único para ese paciente**
   (sin contraseña, con un código imposible de adivinar) y una pantalla
   lista para copiar/compartir por WhatsApp.
4. El paciente entra a su link y ve *solo* los horarios que le asignaron, en
   una sola vista. Escoge uno, llena nombre/correo/teléfono, y queda
   agendado — Google Calendar le manda la invitación por correo
   automáticamente. Si se arrepiente, puede volver a su link y elegir otro
   de los mismos horarios que le tocaron (se cancela el anterior y se crea
   el nuevo evento).

No hay un link público genérico — cada paciente recibe el suyo, con
exactamente los horarios que la psicóloga decidió a mano para esa persona.

## Stack

- React + Vite + Tailwind + React Router
- Funciones serverless de Vercel (`/api`) para todo lo que necesita hablar
  con Google Calendar o con la service role key de Supabase
- Supabase (Postgres) como base de datos — el navegador **nunca** habla
  directo con Supabase, todo pasa por `/api/*`
- Google Calendar API (OAuth2) — dos flujos separados: uno solo para
  identificar quién entra a `/admin` (sin acceso al calendario), y otro
  aparte para conectar el calendario real

## 1. Proyecto de Supabase

Ya está creado: proyecto `agenda-psicologa` (`https://mmqfsbtnejbbmcgmpvas.supabase.co`),
con `supabase/schema.sql` ya aplicado (tablas `settings`, `google_tokens`,
`patient_links`, `offered_slots` y `appointments`, con RLS cerrado — solo la
`service_role` key puede leer/escribir).

La `service_role` key hay que sacarla tú mismo — por seguridad no se puede
obtener por API/MCP: **Project Settings → API** en el dashboard de Supabase
→ copia la key **`service_role`**.

## 2. Credenciales OAuth de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea un
   proyecto (o usa uno existente).
2. **APIs & Services → Library**: activa la **Google Calendar API**.
3. **APIs & Services → OAuth consent screen / Google Auth Platform**: modo
   "External", agrega los correos autorizados (los mismos que vas a poner
   en `ADMIN_EMAILS`) como *test users*. Cuando quieras que la conexión no
   expire cada 7 días, pásala a **"In production"** desde ahí — no hace
   falta pasar por la revisión de Google para esto.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Tipo: **Web application**
   - **Authorized redirect URIs**: agrega
     `http://localhost:5173/api/google-callback` (local) y
     `https://<tu-dominio-de-vercel>/api/google-callback` (producción) —
     **un solo redirect URI sirve para los dos flujos** (login y conectar
     calendario), no hace falta registrar dos.
5. Copia el **Client ID** y el **Client Secret**.

## 3. Variables de entorno

```bash
cp .env.example .env
```

| Variable | De dónde sale |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | ya vienen prellenadas en `.env.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | paso 1 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | paso 2 |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5173/api/google-callback` en local |
| `APP_BASE_URL` | `http://localhost:5173` en local |
| `ADMIN_EMAILS` | correos de Google autorizados a entrar a `/admin`, separados por coma |
| `SESSION_SECRET` | una cadena larga y aleatoria (no importa el valor, solo que sea secreta) |

## 4. Correr en local

```bash
npm install
npm run dev
```

Las funciones de `/api` son serverless de Vercel — para probarlas en local
con el mismo comportamiento que en producción, usa la CLI de Vercel:

```bash
npm install -g vercel   # una vez
vercel dev
```

## 5. Deploy en Vercel

1. Conecta este repo en [vercel.com](https://vercel.com). Framework preset: **Vite**.
2. Agrega en **Settings → Environment Variables** las variables del paso 3,
   con `GOOGLE_REDIRECT_URI` y `APP_BASE_URL` apuntando a tu dominio real.
3. Agrega ese mismo dominio a los *Authorized redirect URIs* en Google
   Cloud Console si no lo habías hecho.
4. Deploy. Cada vez que cambies una variable de entorno, hay que darle
   **Redeploy** para que las funciones la recojan.

## 6. Uso

1. Entra a `https://tu-dominio/admin` → **Iniciar sesión con Google** (con
   un correo que esté en `ADMIN_EMAILS`).
2. **Conectar con Google** para que la app pueda leer tu calendario real y
   crear eventos — esto es independiente de con qué correo iniciaste sesión
   arriba, así que si varias personas entran a probar el panel, el
   calendario conectado no cambia solo porque alguien más se loguea.
3. **+ Nuevo horario** → nombre del paciente → elige sus horarios en el
   widget → Crear → comparte el link por WhatsApp.

## Estructura

```
api/
  auth/login.js                 # inicia el login (público, sin acceso a calendario)
  auth/logout.js                # borra la sesión
  google-auth.js                 # inicia el flujo de conectar el calendario (protegido)
  google-callback.js             # Google redirige aquí — decide login vs calendar según `state`
  admin/settings.js              # ajustes (duración de sesión, timezone, nombre)
  admin/google-status.js         # estado de conexión del calendario / desconectar
  admin/calendar-events.js       # eventos reales del calendario, para el widget
  admin/patient-links.js         # listar / crear paquetes de horarios por paciente
  patient/[token].js             # público — datos del paquete de un paciente
  patient/[token]/book.js        # público — agenda (o cambia) su horario
lib/
  supabaseAdmin.js               # cliente con la service role key
  googleClient.js                 # OAuth2 (login + calendar) + cliente de Calendar
  session.js                      # cookie de sesión firmada (HMAC)
  adminAuth.js                    # valida la sesión contra ADMIN_EMAILS
src/
  pages/AdminPage.jsx            # panel de la psicóloga
  pages/PatientBookingPage.jsx   # página del paciente (/p/:token)
  components/CalendarWidget.jsx  # calendario clickeable para armar un paquete
  components/NewPatientLinkFlow.jsx  # nombre → widget → compartir
  components/PatientLinksList.jsx    # log de a quién se le mandó qué
supabase/schema.sql              # esquema + RLS
```

## Qué falta para producción real (fuera del MVP)

- El widget de calendario muestra un rango fijo (7am–9pm) — no configurable
  todavía.
- No hay forma de cancelar un paquete ya creado desde el admin, solo crear
  nuevos.
- Los horarios se muestran en la zona horaria de la psicóloga, no en la del
  navegador de la paciente.
- Recordatorio automático 24h antes: no implementado.
- Multi-tenant (vender esto a otras psicólogas, cada una con su propio
  calendario) — anotado como visión a futuro en `SPEC.md`, no construido.
