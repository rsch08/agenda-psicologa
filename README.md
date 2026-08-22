# Agenda para Psicóloga

Adaptación simplificada de Calendly, hecha a medida: la psicóloga configura
sus horarios disponibles una sola vez (conectando su Google Calendar de
verdad), y las pacientes ven todos los horarios libres **en una sola vista**
(como el embed de horarios que Calendly manda en los correos, sin tener que
navegar día por día) y agendan directo. Ver `SPEC.md` para el spec completo.

## Stack

- React + Vite + Tailwind + React Router
- Funciones serverless de Vercel (`/api`) para todo lo que necesita hablar
  con Google Calendar o con la service role key de Supabase
- Supabase (Postgres) como base de datos — el navegador **nunca** habla
  directo con Supabase en este proyecto (a diferencia de otros MVPs), todo
  pasa por `/api/*`
- Google Calendar API (OAuth2) para leer disponibilidad real y crear el
  evento cuando alguien agenda

## 1. Proyecto de Supabase

Ya está creado: proyecto `agenda-psicologa` (`https://mmqfsbtnejbbmcgmpvas.supabase.co`),
con `supabase/schema.sql` ya aplicado (tablas `settings`, `availability_rules`,
`google_tokens` y `appointments`, con RLS cerrado — solo la `service_role`
key puede leer/escribir, porque el navegador nunca las toca directamente).

Lo único que falta es que saques la `service_role` key tú mismo — por
seguridad no se puede obtener por API/MCP:

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto `agenda-psicologa`.
2. **Project Settings → API** → copia la key **`service_role`** (⚠️ no la `anon`/`publishable` — esta app no usa esa).
3. Guárdala para el paso 3 (variables de entorno).

## 2. Crear credenciales OAuth de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea un
   proyecto (o usa uno existente).
2. **APIs & Services → Library**: activa la **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**: configúrala en modo
   "External" (o "Internal" si usan Google Workspace), agrega el correo de
   la psicóloga como *test user* si la app queda en modo de prueba.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Tipo: **Web application**
   - **Authorized redirect URIs**: agrega
     `http://localhost:5173/api/google-callback` (para probar local) y
     `https://<tu-dominio-de-vercel>/api/google-callback` (para producción)
5. Copia el **Client ID** y el **Client Secret**.

## 3. Variables de entorno

```bash
cp .env.example .env
```

Completa `.env`:

| Variable | De dónde sale |
|---|---|
| `VITE_SUPABASE_URL` | ya viene prellenada en `.env.example` (no se usa hoy, pero se deja lista) |
| `SUPABASE_URL` | ya viene prellenada en `.env.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | la `service_role` key que sacaste en el paso 1 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | paso 2 |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5173/api/google-callback` en local |
| `APP_BASE_URL` | `http://localhost:5173` en local |
| `ADMIN_PASSCODE` | Inventa un passcode para entrar a `/admin` |

## 4. Correr en local

```bash
npm install
npm run dev
```

Las funciones de `/api` son serverless de Vercel — para probarlas en local
con el mismo comportamiento que en producción, usa la CLI de Vercel en vez
de solo `vite`:

```bash
npm install -g vercel   # una vez
vercel dev
```

## 5. Deploy en Vercel

1. Sube este repo a GitHub (ya lo está) y conéctalo en
   [vercel.com](https://vercel.com). Framework preset: **Vite**.
2. Agrega en **Settings → Environment Variables** las mismas variables del
   paso 3, pero con `GOOGLE_REDIRECT_URI` y `APP_BASE_URL` apuntando a tu
   dominio real de Vercel (ej. `https://agenda-psicologa.vercel.app`).
3. Vuelve a Google Cloud Console y agrega ese mismo dominio a los
   *Authorized redirect URIs* del paso 2 si no lo habías hecho.
4. Deploy.

## 6. Uso

1. Entra a `https://tu-dominio/admin`, ingresa el `ADMIN_PASSCODE`.
2. Clic en **Conectar con Google** y acepta los permisos — esto guarda un
   refresh token en Supabase para que la app pueda leer tu disponibilidad
   real y crear eventos en tu nombre.
3. Define qué días de la semana y en qué rango horario quieres ofrecer
   sesiones, y ajusta duración de sesión, buffer entre citas, zona horaria,
   aviso mínimo y cuántos días hacia adelante mostrar.
4. Comparte el link público (`https://tu-dominio/`) con tus pacientes.

En la página pública, la paciente ve todos los horarios disponibles de los
próximos días agrupados por fecha en una sola vista, con un botón para
**copiar esos horarios en formato de texto** (o mandarlos directo por
WhatsApp) y agendar con un formulario corto. Al confirmar, Google Calendar
le manda automáticamente una invitación por correo a la paciente
(`sendUpdates: all`) — no hace falta un servicio de correo aparte.

## Estructura

```
api/                          # funciones serverless (Vercel)
  google-auth.js               # inicia el flujo OAuth (protegido con passcode)
  google-callback.js           # Google redirige aquí, guarda el token
  availability.js               # público — calcula horarios libres
  book.js                       # público — agenda una cita
  admin/settings.js             # ajustes + horarios semanales (protegido)
  admin/google-status.js        # estado de conexión / desconectar (protegido)
  admin/appointments.js         # próximas citas (protegido)
lib/                           # código compartido del lado del servidor
  supabaseAdmin.js              # cliente con la service role key
  googleClient.js                # OAuth2 + cliente de Calendar
  slotEngine.js                  # calcula horarios libres cruzando reglas + Google + citas
  adminAuth.js                    # valida el passcode de /admin
src/
  pages/BookingPage.jsx         # página pública de agendado
  pages/AdminPage.jsx           # configuración (passcode-gated)
  components/                   # SlotPicker, BookingForm, ScheduleForm, etc.
  utils/                        # formateo de fechas y armado del texto de WhatsApp
supabase/schema.sql             # esquema + RLS
```

## Qué falta para producción real (fuera del MVP)

- Auth real por passcode compartido hoy — bien para una sola psicóloga con
  un link privado, pero endurecer si algún día hay más de una profesional.
- Solo un rango horario por día (no separa mañana/tarde). Ver `SPEC.md`
  fase 2.
- No hay cancelar/reagendar desde el lado de la paciente todavía.
- Los horarios se muestran en la zona horaria de la psicóloga, no en la del
  navegador de la paciente.
- Recordatorio automático 24h antes: no implementado (requiere un cron de
  Vercel + un servicio de correo/WhatsApp aparte).
