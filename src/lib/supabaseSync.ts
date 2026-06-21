import type { Agency } from './localStore'

type RemoteRecord = Record<string, unknown>

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export async function syncLocalAgencyToSupabase(agency: Agency) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.')
  }

  const slug = agency.id
  const existingAgency = await findAgencyBySlug(slug)
  const remoteAgency = existingAgency ?? await createAgency(agency, slug)
  const agencyId = readString(remoteAgency, 'id') ?? slug

  await syncAgencyBranding(agency, agencyId)

  return remoteAgency
}

async function findAgencyBySlug(slug: string) {
  const records = await request<RemoteRecord[]>(`agencies?slug=eq.${encodeURIComponent(slug)}&select=*`)

  return records[0]
}

async function createAgency(agency: Agency, slug: string) {
  try {
    const records = await request<RemoteRecord[]>('agencies?select=*', {
      method: 'POST',
      body: JSON.stringify({
        name: agency.name,
        slug,
        sector: agency.sector,
        city: agency.city,
        website_url: agency.currentSite,
        status: 'demo_active',
      }),
    })

    return records[0] ?? { id: slug, slug }
  } catch (error) {
    const existingAgency = await findAgencyBySlug(slug)

    if (existingAgency) {
      return existingAgency
    }

    throw error
  }
}

async function syncAgencyBranding(agency: Agency, agencyId: string) {
  const payload = {
    agency_id: agencyId,
    logo_text: agency.appearance?.logoText ?? agency.name,
    primary_color: agency.colors.primary,
    secondary_color: agency.colors.secondary,
    accent_color: agency.colors.accent,
  }
  const existing = await request<RemoteRecord[]>(
    `agency_branding?agency_id=eq.${encodeURIComponent(agencyId)}&select=*`,
  )

  if (existing.length > 0) {
    await request(`agency_branding?agency_id=eq.${encodeURIComponent(agencyId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      prefer: 'return=minimal',
    })
    return
  }

  try {
    await request('agency_branding', {
      method: 'POST',
      body: JSON.stringify(payload),
      prefer: 'return=minimal',
    })
  } catch (error) {
    await request(`agency_branding?agency_id=eq.${encodeURIComponent(agencyId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      prefer: 'return=minimal',
    })
  }
}

async function request<T = unknown>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH'; body?: string; prefer?: string } = {},
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: supabaseAnonKey!,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer ?? 'return=representation',
    },
    body: options.body,
  })

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function readString(record: RemoteRecord, key: string) {
  const value = record[key]

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
