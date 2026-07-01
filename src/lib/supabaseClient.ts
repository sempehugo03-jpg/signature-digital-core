import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  readClientEnv('VITE_SUPABASE_URL') ??
  readClientEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey =
  readClientEnv('VITE_SUPABASE_ANON_KEY') ??
  readClientEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null

function readClientEnv(key: string) {
  const value = import.meta.env[key]

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
