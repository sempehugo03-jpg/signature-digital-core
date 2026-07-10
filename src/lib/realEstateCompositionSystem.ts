import type { CSSProperties } from 'react'
import type { VisualBlueprintV1 } from './visualBlueprint'

export type PublicRealEstateSectionKey = 'properties' | 'method' | 'sellerSpace' | 'reviews' | 'contact'

export type RealEstateCompositionPreset =
  | 'editorial-immersive'
  | 'commercial-direct'
  | 'institutional-trust'
  | 'local-human'
  | 'data-investment'

export type RealEstateCompositionConfig = {
  id: RealEstateCompositionPreset
  label: string
  sectionOrder: PublicRealEstateSectionKey[]
  contentWidth: string
  narrowWidth: string
  density: 'low' | 'medium' | 'moderate' | 'high'
  sectionSpacing: string
  mobileSpacing: string
  imageDominance: 'strong' | 'medium' | 'balanced' | 'human' | 'data'
  surfaceRhythm: 'slow' | 'action' | 'regular' | 'warm' | 'compact'
  alternateMedia: boolean
  proofPriority: 'high' | 'medium' | 'standard'
  ctaPriority: 'rare' | 'high' | 'standard' | 'soft' | 'functional'
  className: string
  tokens: CSSProperties
}

export const fallbackRealEstateCompositionPreset: RealEstateCompositionPreset = 'commercial-direct'

const defaultPublicSectionOrder: PublicRealEstateSectionKey[] = ['properties', 'method', 'sellerSpace', 'reviews', 'contact']

const realEstateCompositionConfigs: { [preset in RealEstateCompositionPreset]: Omit<RealEstateCompositionConfig, 'className' | 'tokens'> } = {
  'editorial-immersive': {
    id: 'editorial-immersive',
    label: 'Editorial immersive',
    sectionOrder: ['properties', 'sellerSpace', 'method', 'reviews', 'contact'],
    contentWidth: '1240px',
    narrowWidth: '54rem',
    density: 'low',
    sectionSpacing: '9.5rem',
    mobileSpacing: '6.5rem',
    imageDominance: 'strong',
    surfaceRhythm: 'slow',
    alternateMedia: true,
    proofPriority: 'medium',
    ctaPriority: 'rare',
  },
  'commercial-direct': {
    id: 'commercial-direct',
    label: 'Commercial direct',
    sectionOrder: ['properties', 'reviews', 'contact', 'method', 'sellerSpace'],
    contentWidth: '1160px',
    narrowWidth: '48rem',
    density: 'medium',
    sectionSpacing: '6.5rem',
    mobileSpacing: '5rem',
    imageDominance: 'medium',
    surfaceRhythm: 'action',
    alternateMedia: false,
    proofPriority: 'high',
    ctaPriority: 'high',
  },
  'institutional-trust': {
    id: 'institutional-trust',
    label: 'Institutional trust',
    sectionOrder: ['reviews', 'method', 'properties', 'sellerSpace', 'contact'],
    contentWidth: '1120px',
    narrowWidth: '50rem',
    density: 'moderate',
    sectionSpacing: '7rem',
    mobileSpacing: '5.25rem',
    imageDominance: 'balanced',
    surfaceRhythm: 'regular',
    alternateMedia: false,
    proofPriority: 'high',
    ctaPriority: 'standard',
  },
  'local-human': {
    id: 'local-human',
    label: 'Local human',
    sectionOrder: ['sellerSpace', 'method', 'reviews', 'properties', 'contact'],
    contentWidth: '1120px',
    narrowWidth: '52rem',
    density: 'moderate',
    sectionSpacing: '7.75rem',
    mobileSpacing: '5.75rem',
    imageDominance: 'human',
    surfaceRhythm: 'warm',
    alternateMedia: true,
    proofPriority: 'standard',
    ctaPriority: 'soft',
  },
  'data-investment': {
    id: 'data-investment',
    label: 'Data investment',
    sectionOrder: ['properties', 'method', 'reviews', 'sellerSpace', 'contact'],
    contentWidth: '1080px',
    narrowWidth: '46rem',
    density: 'high',
    sectionSpacing: '5.5rem',
    mobileSpacing: '4.5rem',
    imageDominance: 'data',
    surfaceRhythm: 'compact',
    alternateMedia: false,
    proofPriority: 'high',
    ctaPriority: 'functional',
  },
}

export const realEstateCompositionPresets = Object.keys(realEstateCompositionConfigs) as RealEstateCompositionPreset[]

export function resolveRealEstateComposition(
  blueprint: VisualBlueprintV1 | null,
  fallbackSectionOrder?: string,
): RealEstateCompositionConfig {
  const explicitPreset = normalizeCompositionPreset(blueprint?.layout.composition)
  const base = realEstateCompositionConfigs[explicitPreset ?? fallbackRealEstateCompositionPreset]
  const sectionOrder = explicitPreset
    ? base.sectionOrder
    : resolveLegacySectionOrder(blueprint?.sections.sectionOrder || fallbackSectionOrder, base.sectionOrder)

  return {
    ...base,
    sectionOrder,
    className: [
      'od-composition-page',
      `od-composition-${base.id}`,
      `od-composition-density-${base.density}`,
      `od-composition-image-${base.imageDominance}`,
      `od-composition-rhythm-${base.surfaceRhythm}`,
      base.alternateMedia ? 'od-composition-alternate-media' : '',
      `od-composition-proof-${base.proofPriority}`,
      `od-composition-cta-${base.ctaPriority}`,
    ].filter(Boolean).join(' '),
    tokens: {
      '--od-composition-content-width': base.contentWidth,
      '--od-composition-narrow-width': base.narrowWidth,
      '--od-composition-section-spacing': base.sectionSpacing,
      '--od-composition-mobile-spacing': base.mobileSpacing,
    } as CSSProperties,
  }
}

function resolveLegacySectionOrder(value: string | undefined, fallbackOrder: PublicRealEstateSectionKey[]) {
  const ordered = parseSectionOrder(value)
  if (!ordered.length) return defaultPublicSectionOrder

  return [...ordered, ...fallbackOrder.filter((item) => !ordered.includes(item))]
}

function parseSectionOrder(value?: string) {
  if (!value) return []

  const aliases: { [key: string]: PublicRealEstateSectionKey } = {
    biens: 'properties',
    properties: 'properties',
    property: 'properties',
    annonces: 'properties',
    methode: 'method',
    method: 'method',
    trust: 'reviews',
    preuves: 'reviews',
    reviews: 'reviews',
    avis: 'reviews',
    sellerspace: 'sellerSpace',
    'seller-space': 'sellerSpace',
    'espace-vendeur': 'sellerSpace',
    estimation: 'contact',
    contact: 'contact',
    cta: 'contact',
  }

  return [
    ...new Set(
      value
        .split(',')
        .map((item) => aliases[toClassValue(item)])
        .filter((item): item is PublicRealEstateSectionKey => Boolean(item)),
    ),
  ]
}

function normalizeCompositionPreset(value?: string): RealEstateCompositionPreset | null {
  const normalized = toClassValue(value)
  const aliases: { [key: string]: RealEstateCompositionPreset } = {
    editorial: 'editorial-immersive',
    immersive: 'editorial-immersive',
    luxury: 'editorial-immersive',
    premium: 'editorial-immersive',
    direct: 'commercial-direct',
    conversion: 'commercial-direct',
    commercial: 'commercial-direct',
    trust: 'institutional-trust',
    institutional: 'institutional-trust',
    credible: 'institutional-trust',
    local: 'local-human',
    human: 'local-human',
    warm: 'local-human',
    data: 'data-investment',
    investment: 'data-investment',
    expert: 'data-investment',
  }

  if (realEstateCompositionPresets.includes(normalized as RealEstateCompositionPreset)) {
    return normalized as RealEstateCompositionPreset
  }

  return aliases[normalized] ?? null
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
