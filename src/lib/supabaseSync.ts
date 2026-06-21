import type { Agency } from './localStore'

type RemoteRecord = Record<string, unknown>
export type SupabaseRequestFailure = Error & {
  code?: string
  details?: string
  status?: number
}
export type AgencyBrandingInput = {
  logoText: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  heroTitle: string
  heroSubtitle: string
}
export type AgencyPageInput = {
  title: string
  slug: string
  space: 'public' | 'patron' | 'agent' | 'client'
  content: string
  status: 'brouillon' | 'publié'
}
export type AgencyPageRecord = AgencyPageInput & {
  id: string
  agencyId: string
  createdAt: string
}
export type AgencyButtonInput = {
  label: string
  destination: string
  placement: string
  space: 'public' | 'patron' | 'agent' | 'client'
  status: 'actif' | 'inactif'
}
export type AgencyButtonRecord = AgencyButtonInput & {
  id: string
  agencyId: string
  createdAt: string
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

export async function getAgencyPagesFromSupabase(agencySlug: string): Promise<AgencyPageRecord[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.')
  }

  const remoteAgency = await findAgencyBySlug(agencySlug)
  if (!remoteAgency) return []

  const agencyId = readString(remoteAgency, 'id') ?? agencySlug
  const records = await request<RemoteRecord[]>(
    `agency_pages?agency_id=eq.${encodeURIComponent(agencyId)}&select=*`,
  )

  return records.map((record) => normalizeAgencyPage(record, agencyId))
}

export async function createAgencyPageInSupabase(
  agencySlug: string,
  page: AgencyPageInput,
): Promise<AgencyPageRecord> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.')
  }

  const remoteAgency = await findAgencyBySlug(agencySlug)
  if (!remoteAgency) {
    throw new Error('Supabase agency not found.')
  }

  const agencyId = readString(remoteAgency, 'id') ?? agencySlug
  const payload = {
    agency_id: agencyId,
    title: page.title,
    slug: page.slug,
    space: page.space,
    content: {
      body: page.content,
      type: 'simple',
    },
    is_published: page.status === 'publié',
  }
  const records = await request<RemoteRecord[]>('agency_pages?select=*', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeAgencyPage(records[0] ?? payload, agencyId)
}

export async function getAgencyButtonsFromSupabase(agencySlug: string): Promise<AgencyButtonRecord[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.')
  }

  const remoteAgency = await findAgencyBySlug(agencySlug)
  if (!remoteAgency) return []

  const agencyId = readString(remoteAgency, 'id') ?? agencySlug
  const records = await request<RemoteRecord[]>(
    `agency_buttons?agency_id=eq.${encodeURIComponent(agencyId)}&select=*`,
  )

  return records.map((record) => normalizeAgencyButton(record, agencyId))
}

export async function createAgencyButtonInSupabase(
  agencySlug: string,
  button: AgencyButtonInput,
): Promise<AgencyButtonRecord> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured.')
  }

  const remoteAgency = await findAgencyBySlug(agencySlug)
  if (!remoteAgency) {
    throw new Error('Supabase agency not found.')
  }

  const agencyId = readString(remoteAgency, 'id') ?? agencySlug
  const payload = {
    agency_id: agencyId,
    label: button.label,
    target_url: button.destination,
    placement: button.placement,
    space: button.space,
    is_active: button.status === 'actif',
  }
  const records = await request<RemoteRecord[]>('agency_buttons?select=*', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeAgencyButton(records[0] ?? payload, agencyId)
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
    const errorBody = await readErrorBody(response)
    const error = new Error(errorBody.message ?? `Supabase request failed: ${response.status}`) as SupabaseRequestFailure
    error.code = errorBody.code
    error.details = errorBody.details
    error.status = response.status

    throw error
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

async function readErrorBody(response: Response) {
  try {
    const body = await response.json() as RemoteRecord

    return {
      message: readString(body, 'message'),
      code: readString(body, 'code'),
      details: readString(body, 'details'),
    }
  } catch {
    return {
      message: undefined,
      code: undefined,
      details: undefined,
    }
  }
}

function normalizeAgencyPage(record: RemoteRecord, agencyId: string): AgencyPageRecord {
  const rawSpace = readString(record, 'space') ?? readString(record, 'placement') ?? 'public'
  const rawStatus = readString(record, 'status')
  const isPublished = readBoolean(record, 'is_published')
  const published = isPublished ?? rawStatus === 'publié'
  const slug = readString(record, 'slug') ?? 'page'

  return {
    id: readString(record, 'id') ?? slug,
    agencyId,
    title: readString(record, 'title') ?? 'Page personnalisée',
    slug,
    space: normalizePageSpace(rawSpace),
    content: readPageContent(record),
    status: published ? 'publié' : 'brouillon',
    createdAt: readString(record, 'created_at') ?? '',
  }
}

function readBoolean(record: RemoteRecord, key: string) {
  const value = record[key]

  return typeof value === 'boolean' ? value : undefined
}

function readPageContent(record: RemoteRecord) {
  const content = record.content

  if (typeof content === 'string') return content
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const body = (content as RemoteRecord).body

    return typeof body === 'string' ? body : ''
  }

  return ''
}

function normalizePageSpace(value: string): AgencyPageInput['space'] {
  if (value === 'patron' || value === 'agent' || value === 'client') return value
  if (value === 'vendeur') return 'client'

  return 'public'
}

function normalizeAgencyButton(record: RemoteRecord, agencyId: string): AgencyButtonRecord {
  const rawSpace = readString(record, 'space') ?? 'public'
  const rawStatus = readString(record, 'status')
  const isActive = readBoolean(record, 'is_active')
  const active = isActive ?? rawStatus !== 'inactif'
  const label = readString(record, 'label') ?? readString(record, 'text') ?? 'Bouton'

  return {
    id: readString(record, 'id') ?? label,
    agencyId,
    label,
    destination: readString(record, 'target_url') ?? readString(record, 'destination') ?? '#',
    placement: readString(record, 'placement') ?? 'hero',
    space: normalizeButtonSpace(rawSpace),
    status: active ? 'actif' : 'inactif',
    createdAt: readString(record, 'created_at') ?? '',
  }
}

function normalizeButtonSpace(value: string): AgencyButtonInput['space'] {
  if (value === 'patron' || value === 'agent' || value === 'client') return value
  if (value === 'vendeur') return 'client'

  return 'public'
}
