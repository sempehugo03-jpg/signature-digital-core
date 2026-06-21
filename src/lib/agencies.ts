import { localAgencies, type AdminAgency, type AgencyColors } from './local-agencies'
import { isSupabaseConfigured, supabase } from './supabase'

export type { AdminAgency }

type UnknownRecord = Record<string, unknown>
type AgenciesSource = 'supabase' | 'local'

export type AgenciesReadResult = {
  agencies: AdminAgency[]
  source: AgenciesSource
  supabaseConfigured: boolean
}

export type CreateAgencyDemoInput = {
  name: string
  sector: string
  city: string
  currentSite: string
  colors: AgencyColors
  logoText: string
}

const fallbackColors = localAgencies[0].colors

export async function getAgencies(): Promise<AgenciesReadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return localFallback()
  }

  try {
    const { data, error } = await supabase.from('agencies').select('*').order('name', { ascending: true })

    if (error) {
      throw error
    }

    const rows = Array.isArray(data) ? data.filter(isRecord) : []
    const brandingByAgency = await readAgencyBranding()

    return {
      agencies: rows.map((agency) => mapAgency(agency, brandingByAgency)),
      source: 'supabase',
      supabaseConfigured: true,
    }
  } catch (error) {
    console.warn('Supabase agencies read failed; using local fallback.', error)
    return localFallback()
  }
}

export async function createAgencyDemo(input: CreateAgencyDemoInput) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Impossible de synchroniser avec Supabase pour le moment.')
  }

  const slug = createSlug(input.name)
  const agency = await insertAgency({
    name: input.name.trim(),
    slug,
    sector: input.sector.trim(),
    city: input.city.trim(),
    currentSite: input.currentSite.trim(),
  })

  const agencyId = readString(agency, 'id') ?? slug
  const agencySlug = readString(agency, 'slug') ?? slug

  await insertAgencyBranding({
    agencyId,
    agencySlug,
    colors: input.colors,
    logoText: input.logoText.trim(),
  })

  return {
    id: agencySlug,
    name: input.name.trim(),
    sector: input.sector.trim(),
    city: input.city.trim(),
    status: 'Démo active',
    colors: input.colors,
  } satisfies AdminAgency
}

async function readAgencyBranding() {
  if (!supabase) {
    return new Map<string, UnknownRecord>()
  }

  try {
    const { data, error } = await supabase.from('agency_branding').select('*')

    if (error) {
      return new Map<string, UnknownRecord>()
    }

    const rows = Array.isArray(data) ? data.filter(isRecord) : []

    return rows.reduce((brandingMap, branding) => {
      for (const key of ['agency_id', 'agencyId', 'agency_slug', 'agencySlug', 'slug', 'id']) {
        const value = readString(branding, key)

        if (value) {
          brandingMap.set(value, branding)
        }
      }

      return brandingMap
    }, new Map<string, UnknownRecord>())
  } catch {
    return new Map<string, UnknownRecord>()
  }
}

async function insertAgency(input: {
  name: string
  slug: string
  sector: string
  city: string
  currentSite: string
}) {
  const payloads = [
    {
      name: input.name,
      slug: input.slug,
      sector: input.sector,
      city: input.city,
      current_site: input.currentSite,
      status: 'demo_active',
    },
    {
      name: input.name,
      slug: input.slug,
      secteur: input.sector,
      ville: input.city,
      site_actuel: input.currentSite,
      statut: 'demo_active',
    },
  ]

  return insertFirst('agencies', payloads)
}

async function insertAgencyBranding(input: {
  agencyId: string
  agencySlug: string
  colors: AgencyColors
  logoText: string
}) {
  const payloads = [
    {
      agency_id: input.agencyId,
      primary_color: input.colors.primary,
      secondary_color: input.colors.secondary,
      accent_color: input.colors.accent,
      logo_text: input.logoText,
    },
    {
      agency_id: input.agencyId,
      primary: input.colors.primary,
      secondary: input.colors.secondary,
      accent: input.colors.accent,
      logo_text: input.logoText,
    },
    {
      agency_slug: input.agencySlug,
      primary_color: input.colors.primary,
      secondary_color: input.colors.secondary,
      accent_color: input.colors.accent,
      logo_text: input.logoText,
    },
  ]

  return insertFirst('agency_branding', payloads)
}

async function insertFirst(table: 'agencies' | 'agency_branding', payloads: UnknownRecord[]) {
  let lastError: unknown

  for (const payload of payloads) {
    const { data, error } = await supabase!.from(table).insert(payload).select('*').single()

    if (!error && isRecord(data)) {
      return data
    }

    lastError = error
  }

  throw lastError
}

function mapAgency(agency: UnknownRecord, brandingByAgency: Map<string, UnknownRecord>): AdminAgency {
  const databaseId = readString(agency, 'id')
  const slug = readString(agency, 'slug')
  const id = slug ?? databaseId ?? 'agency'
  const branding = findBranding(agency, brandingByAgency)

  return {
    id,
    name: readString(agency, 'name') ?? readString(agency, 'agency_name') ?? 'Agence sans nom',
    sector: readString(agency, 'sector') ?? readString(agency, 'secteur') ?? 'Secteur non renseigné',
    city: readString(agency, 'city') ?? readString(agency, 'ville') ?? 'Ville non renseignée',
    status: formatStatus(readString(agency, 'status') ?? readString(agency, 'statut') ?? 'active'),
    colors: readColors(branding),
  }
}

function findBranding(agency: UnknownRecord, brandingByAgency: Map<string, UnknownRecord>) {
  const candidates = [
    readString(agency, 'id'),
    readString(agency, 'slug'),
    readString(agency, 'agency_id'),
    readString(agency, 'agencyId'),
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidates) {
    const branding = brandingByAgency.get(candidate)

    if (branding) {
      return branding
    }
  }

  return undefined
}

function readColors(branding?: UnknownRecord): AgencyColors {
  if (!branding) {
    return fallbackColors
  }

  const nestedColors = readRecord(branding, 'colors')

  return {
    primary:
      readString(branding, 'primary') ??
      readString(branding, 'primary_color') ??
      readString(branding, 'primaryColor') ??
      readString(nestedColors, 'primary') ??
      fallbackColors.primary,
    secondary:
      readString(branding, 'secondary') ??
      readString(branding, 'secondary_color') ??
      readString(branding, 'secondaryColor') ??
      readString(branding, 'background') ??
      readString(nestedColors, 'secondary') ??
      readString(nestedColors, 'background') ??
      fallbackColors.secondary,
    accent:
      readString(branding, 'accent') ??
      readString(branding, 'accent_color') ??
      readString(branding, 'accentColor') ??
      readString(nestedColors, 'accent') ??
      fallbackColors.accent,
  }
}

function formatStatus(value: string) {
  const readable = value.trim().replace(/[_-]+/g, ' ')

  if (readable.toLowerCase() === 'demo active') {
    return 'Démo active'
  }

  return readable.charAt(0).toUpperCase() + readable.slice(1)
}

function localFallback(): AgenciesReadResult {
  return {
    agencies: localAgencies,
    source: 'local',
    supabaseConfigured: isSupabaseConfigured,
  }
}

function readString(record: UnknownRecord | undefined, key: string) {
  const value = record?.[key]

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readRecord(record: UnknownRecord, key: string) {
  const value = record[key]

  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `agence-${Date.now()}`
}
