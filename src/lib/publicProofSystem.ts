import type { AgencyIdentity } from './agencyIdentity'
import type { RealEstateAgent, RealEstateProperty } from '../data/realEstateTemplate'

export type PublicProofVariant = 'numbers' | 'testimonial' | 'institutional' | 'compact'
export type PublicProofDensity = 'compact' | 'standard' | 'airy'
export type PublicProofAlignment = 'left' | 'center'
export type PublicProofSurface = 'plain' | 'muted' | 'dark'

export type PublicProofItem = {
  value: string
  label: string
  context?: string
  source?: string
}

export type PublicProofConfig = {
  variant: PublicProofVariant
  density: PublicProofDensity
  alignment: PublicProofAlignment
  surface: PublicProofSurface
  items: PublicProofItem[]
  className: string
}

export type ResolvePublicProofInput = {
  agencyIdentity: AgencyIdentity
  properties: RealEstateProperty[]
  agents: RealEstateAgent[]
}

export function resolvePublicProof(input: ResolvePublicProofInput): PublicProofConfig | null {
  const variant = resolveProofVariant(input.agencyIdentity.visualBlueprint?.sections.proofVariant)
  const items = resolveProofItems(input, variant)
  if (!items.length) return null

  const density = resolveDensity(input.agencyIdentity.visualBlueprint?.forms.density)
  const alignment = input.agencyIdentity.composition.proofPriority === 'high' ? 'center' : 'left'
  const surface = input.agencyIdentity.composition.proofPriority === 'high' ? 'dark' : 'muted'

  return {
    variant,
    density,
    alignment,
    surface,
    items,
    className: [
      'od-public-proof',
      `od-public-proof-variant-${variant}`,
      `od-public-proof-density-${density}`,
      `od-public-proof-align-${alignment}`,
      `od-public-proof-surface-${surface}`,
    ].join(' '),
  }
}

function resolveProofItems(input: ResolvePublicProofInput, variant: PublicProofVariant): PublicProofItem[] {
  const publicProperties = input.properties.filter((property) => property.agencyId === input.agencyIdentity.agencyId)
  const activeAgents = input.agents.filter((agent) => agent.agencyId === input.agencyIdentity.agencyId && agent.active)

  if (variant === 'testimonial') {
    return []
  }

  const items: PublicProofItem[] = []

  if (publicProperties.length > 0) {
    items.push({
      value: String(publicProperties.length),
      label: publicProperties.length > 1 ? 'biens publics' : 'bien public',
      context: 'Collection actuellement disponible',
      source: 'Biens agence',
    })
  }

  if (activeAgents.length > 0) {
    items.push({
      value: String(activeAgents.length),
      label: activeAgents.length > 1 ? 'conseillers actifs' : 'conseiller actif',
      context: 'Equipe rattachee aux mandats',
      source: 'Equipe agence',
    })
  }

  if (input.agencyIdentity.brand.city) {
    items.push({
      value: input.agencyIdentity.brand.city,
      label: 'secteur accompagne',
      context: "Ancrage local de l'agence",
      source: 'Configuration agence',
    })
  }

  return variant === 'numbers' ? items.filter((item) => /^\d+$/.test(item.value)) : items
}

function resolveProofVariant(value?: string): PublicProofVariant {
  const normalized = toClassValue(value)
  if (normalized === 'numbers' || normalized === 'testimonial' || normalized === 'institutional' || normalized === 'compact') return normalized
  return 'compact'
}

function resolveDensity(value?: string): PublicProofDensity {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'airy') return normalized
  return 'standard'
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
