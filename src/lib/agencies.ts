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
