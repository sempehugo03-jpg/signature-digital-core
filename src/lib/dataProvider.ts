import {
  createAgency as createLocalAgency,
  deleteAgency as deleteLocalAgency,
  getAgency as getLocalAgency,
  listAgencies,
  updateAgency as updateLocalAgency,
} from './localStore'
import type { Agency, CreateAgencyInput } from './localStore'
import { dataModeLabel, isSupabaseConfigured, supabaseRequest } from './supabaseClient'

type AgencyRow = {
  id: string
  name: string
  sector: string | null
  city: string | null
  website_url: string | null
  status: string | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export function getDataModeLabel() {
  return dataModeLabel
}

function rowToAgency(row: AgencyRow): Agency {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector ?? 'Immobilier',
    city: row.city ?? '',
    currentSite: row.website_url ?? '',
    status: row.status ?? 'draft',
    colors: {
      primary: row.primary_color ?? 'bleu nuit',
      secondary: row.secondary_color ?? 'crème',
      accent: row.accent_color ?? 'doré doux',
    },
    appearance: {
      logoText: row.name,
      heroImageUrl: row.logo_url ?? '',
      visualStyle: 'premium',
      backgroundColor: 'crème',
      textColor: 'bleu nuit',
      buttonStyle: 'premium',
      fontStyle: 'moderne',
    },
    ownerName: '',
    ownerEmail: '',
    agentName: '',
    agentEmail: '',
    createdAt: row.created_at,
  }
}

function agencyToRow(data: Partial<CreateAgencyInput> | Partial<Agency>) {
  return {
    name: data.name,
    sector: data.sector,
    city: data.city,
    website_url: 'currentSite' in data ? data.currentSite : undefined,
    status: 'status' in data ? data.status : undefined,
    primary_color: data.colors?.primary,
    secondary_color: data.colors?.secondary,
    accent_color: data.colors?.accent,
    logo_url: data.appearance?.heroImageUrl,
  }
}

function withoutUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
}

export async function getAgencies() {
  if (!isSupabaseConfigured) return listAgencies()
  const rows = await supabaseRequest<AgencyRow[]>('agencies?select=*&order=created_at.desc')
  return rows.map(rowToAgency)
}

export async function getAgency(id: string) {
  if (!isSupabaseConfigured) return getLocalAgency(id)
  const rows = await supabaseRequest<AgencyRow[]>(`agencies?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)
  return rows[0] ? rowToAgency(rows[0]) : undefined
}

export async function createAgency(data: CreateAgencyInput) {
  if (!isSupabaseConfigured) return createLocalAgency(data)
  const [row] = await supabaseRequest<AgencyRow[]>('agencies', {
    method: 'POST',
    body: JSON.stringify(withoutUndefined({
      ...agencyToRow(data),
      status: 'draft',
    })),
  })
  return rowToAgency(row)
}

export async function updateAgency(id: string, data: Partial<Agency>) {
  if (!isSupabaseConfigured) return updateLocalAgency(id, data)
  const [row] = await supabaseRequest<AgencyRow[]>(`agencies?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(withoutUndefined({
      ...agencyToRow(data),
      updated_at: new Date().toISOString(),
    })),
  })
  return row ? rowToAgency(row) : undefined
}

export async function deleteAgency(id: string) {
  if (!isSupabaseConfigured) {
    deleteLocalAgency(id)
    return
  }
  await supabaseRequest<null>(`agencies?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
}

