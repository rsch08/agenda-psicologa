import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.')
}

// Cliente con la service role key: solo se usa del lado del servidor (en
// /api), nunca en el navegador. Ignora RLS a propósito.
export const supabaseAdmin = createClient(supabaseUrl ?? '', serviceRoleKey ?? '', {
  auth: { persistSession: false },
})
