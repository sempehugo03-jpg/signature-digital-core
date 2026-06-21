import type { Agency } from './localStore'

type RemoteRecord = Record<string, unknown>
export type AgencyBrandingInput = {
  logoText: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  heroTitle: string
  heroSubtitle: string
}

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

  await upsertAgencyBranding(agencyId, {
    logoText: agency.appearance?.logoText ?? agency.name,
    primaryColor: agency.colors.primary,
    secondaryColor: agency.colors.secondary,
    accentColor: agency.colors.accent,
    heroTitle: agency.appearance?.heroTitle ?? agency.name,
    heroSubtitle: agency.appearance?.heroSubtitle ?? '',
  })

  return remoteAgency
}

export async function updateAgencyBrandingInSupabase(agencySlug: string, branding: AgencyBrandingInput) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.')
  }

  const remoteAgency = await findAgencyBySlug(agencySlug)
  const agencyId = remoteAgency ? readString(remoteAgency, 'id') ?? agencySlug : agencySlug

  await upsertAgencyBranding(agencyId, branding)
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

async function upsertAgencyBranding(agencyId: string, branding: AgencyBrandingInput) {
  const payload = {
    agency_id: agencyId,
    logo_text: branding.logoText,
    primary_color: branding.primaryColor,
    secondary_color: branding.secondaryColor,
    accent_color: branding.accentColor,
    hero_title: branding.heroTitle,
    hero_subtitle: branding.heroSubtitle,
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
