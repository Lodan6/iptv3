import { createClient } from '@supabase/supabase-js'

// Cliente para uso no SERVIDOR (API routes) — usa service_role key (acesso total)
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Cliente para uso no FRONTEND — usa anon key (acesso apenas ao que RLS permite)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
