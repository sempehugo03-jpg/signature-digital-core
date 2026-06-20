const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const dataModeLabel = isSupabaseConfigured ? 'Supabase connecté' : 'Mode local — Supabase non connecté'

export async function supabaseRequest<T>(path: string, options: RequestInit = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré')
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Erreur Supabase ${response.status}`)
  }

  if (response.status === 204) return null as T
  return response.json() as Promise<T>
}

