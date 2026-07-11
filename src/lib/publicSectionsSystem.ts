import type { AgencyIdentity } from './agencyIdentity'
import type { PublicRealEstateSectionKey } from './realEstateCompositionSystem'

export type PublicSectionSurface = 'default' | 'muted' | 'dark' | 'accent' | 'transparent'
export type PublicSectionWidth = 'wide' | 'standard' | 'narrow'
export type PublicSectionRhythm = 'quiet' | 'regular' | 'immersive' | 'compact'
export type PublicSectionAlignment = 'left' | 'center' | 'split'
export type PublicSectionDensity = 'airy' | 'balanced' | 'compact'
export type PublicSectionContrast = 'soft' | 'strong'

export type PublicSectionConfig = {
  key: PublicRealEstateSectionKey
  id?: string
  surface: PublicSectionSurface
  width: PublicSectionWidth
  rhythm: PublicSectionRhythm
  alignment: PublicSectionAlignment
  density: PublicSectionDensity
  contrast: PublicSectionContrast
  alternateMedia: boolean
  className: string
  innerClassName: string
}

export type PublicSectionsConfig = {
  order: PublicRealEstateSectionKey[]
  sections: Record<PublicRealEstateSectionKey, PublicSectionConfig>
}

export function resolvePublicSections(identity: AgencyIdentity): PublicSectionsConfig {
  const composition = identity.composition
  const blueprint = identity.visualBlueprint
  const defaultSurface = resolveDefaultSurface(blueprint?.sections.defaultBackground || blueprint?.sections.defaultMood)
  const density = resolveDensity(composition.density)
  const rhythm = resolveRhythm(composition.surfaceRhythm)
  const contrast = identity.visualMood === 'dark' || blueprint?.sections.defaultMood === 'dark' ? 'strong' : 'soft'
  const sectionConfigs: Record<PublicRealEstateSectionKey, PublicSectionConfig> = {
    properties: createSectionConfig({
      key: 'properties',
      id: 'biens',
      surface: surfaceFor('properties', defaultSurface, composition.ctaPriority),
      width: composition.imageDominance === 'strong' ? 'wide' : 'standard',
      rhythm,
      alignment: 'left',
      density,
      contrast,
      alternateMedia: composition.alternateMedia,
    }),
    method: createSectionConfig({
      key: 'method',
      id: 'methode',
      surface: surfaceFor('method', defaultSurface, composition.ctaPriority),
      width: composition.density === 'high' ? 'standard' : 'narrow',
      rhythm,
      alignment: composition.alternateMedia ? 'split' : 'left',
      density,
      contrast,
      alternateMedia: composition.alternateMedia,
    }),
    sellerSpace: createSectionConfig({
      key: 'sellerSpace',
      surface: surfaceFor('sellerSpace', defaultSurface, composition.ctaPriority),
      width: 'wide',
      rhythm,
      alignment: 'split',
      density,
      contrast,
      alternateMedia: composition.alternateMedia,
    }),
    reviews: createSectionConfig({
      key: 'reviews',
      surface: composition.proofPriority === 'high' ? 'dark' : surfaceFor('reviews', defaultSurface, composition.ctaPriority),
      width: 'narrow',
      rhythm: composition.proofPriority === 'high' ? 'regular' : rhythm,
      alignment: 'center',
      density,
      contrast: 'strong',
      alternateMedia: false,
    }),
    contact: createSectionConfig({
      key: 'contact',
      id: 'contact',
      surface: composition.ctaPriority === 'rare' ? 'transparent' : 'accent',
      width: 'narrow',
      rhythm: composition.ctaPriority === 'functional' ? 'compact' : 'regular',
      alignment: 'center',
      density,
      contrast: 'strong',
      alternateMedia: false,
    }),
  }

  return {
    order: composition.sectionOrder,
    sections: sectionConfigs,
  }
}

function createSectionConfig(input: Omit<PublicSectionConfig, 'className' | 'innerClassName'>): PublicSectionConfig {
  return {
    ...input,
    className: [
      'od-public-section',
      `od-public-section--${input.key}`,
      `od-section-surface-${input.surface}`,
      `od-section-width-${input.width}`,
      `od-section-rhythm-${input.rhythm}`,
      `od-section-align-${input.alignment}`,
      `od-section-density-${input.density}`,
      `od-section-contrast-${input.contrast}`,
      input.alternateMedia ? 'od-section-alternate-media' : '',
    ].filter(Boolean).join(' '),
    innerClassName: [
      'od-public-section__inner',
      `od-public-section__inner--${input.width}`,
    ].join(' '),
  }
}

function resolveDefaultSurface(value?: string): PublicSectionSurface {
  const normalized = toClassValue(value)
  if (/dark|navy|black|strong/.test(normalized)) return 'dark'
  if (/accent|gold|primary/.test(normalized)) return 'accent'
  if (/muted|cream|warm|soft|light/.test(normalized)) return 'muted'
  if (/transparent|none/.test(normalized)) return 'transparent'
  return 'default'
}

function resolveDensity(value: string): PublicSectionDensity {
  if (value === 'high') return 'compact'
  if (value === 'low') return 'airy'
  return 'balanced'
}

function resolveRhythm(value: string): PublicSectionRhythm {
  if (value === 'slow') return 'immersive'
  if (value === 'compact') return 'compact'
  if (value === 'warm') return 'quiet'
  return 'regular'
}

function surfaceFor(section: PublicRealEstateSectionKey, fallback: PublicSectionSurface, ctaPriority: string): PublicSectionSurface {
  if (section === 'properties') return fallback === 'default' ? 'muted' : fallback
  if (section === 'method') return fallback === 'dark' ? 'dark' : 'default'
  if (section === 'sellerSpace') return ctaPriority === 'soft' ? 'muted' : 'default'
  if (section === 'reviews') return fallback === 'default' ? 'transparent' : fallback
  return fallback
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
