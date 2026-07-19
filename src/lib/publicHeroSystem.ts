import type { AgencyIdentity } from './agencyIdentity'
import type { PublicNavigationTarget } from './publicNavigationSystem'

export type PublicHeroLayout = 'full' | 'split-left' | 'split-right' | 'centered' | 'minimal'
export type PublicHeroSurface = 'light' | 'dark' | 'transparent'
export type PublicHeroHeight = 'compact' | 'standard' | 'large' | 'screen'
export type PublicHeroAlignment = 'left' | 'center'
export type PublicHeroHeadlineScale = 'display' | 'xl' | 'lg'
export type PublicHeroVisibility = 'visible' | 'hidden'
export type PublicHeroImageDominance = 'strong' | 'medium' | 'balanced' | 'human' | 'data'

export type PublicHeroAction = {
  label: string
  target: PublicNavigationTarget
  visible: boolean
}

export type PublicHeroConfig = {
  layout: PublicHeroLayout
  surface: PublicHeroSurface
  height: PublicHeroHeight
  alignment: PublicHeroAlignment
  headlineScale: PublicHeroHeadlineScale
  imageDominance: PublicHeroImageDominance
  overlay: 'soft' | 'dark' | 'light' | 'none'
  search: PublicHeroVisibility
  secondaryCta: PublicHeroVisibility
  eyebrow: string
  title: string
  titleLines: string[]
  italicAccent: boolean
  subtitle: string
  image: {
    src: string
    alt: string
  }
  primaryCta: PublicHeroAction
  secondaryAction: PublicHeroAction
  searchAction: PublicHeroAction
  className: string
}

export type ResolvePublicHeroInput = {
  agencyIdentity: AgencyIdentity
  baseRoute: string
  canEstimate: boolean
  canShowProperties: boolean
}

export function resolvePublicHero(input: ResolvePublicHeroInput): PublicHeroConfig {
  const renderHero = input.agencyIdentity.renderContract.hero
  const composition = input.agencyIdentity.composition
  const layout = renderHero.layout
  const surface = renderHero.surface
  const height = renderHero.height
  const alignment = renderHero.alignment
  const headlineScale = renderHero.headlineScale
  const imageDominance = composition.imageDominance
  const overlay = renderHero.overlay
  const blueprint = input.agencyIdentity.visualBlueprint
  const search = resolveVisibility(blueprint?.hero.search)
  const secondaryCta = resolveVisibility(blueprint?.hero.secondaryCta)
  const primaryTarget = input.canEstimate
    ? { route: `${input.baseRoute}/estimation` }
    : input.canShowProperties
      ? { route: input.baseRoute, anchor: 'biens' }
      : { route: input.baseRoute, anchor: 'contact' }
  const secondaryTarget = input.canShowProperties
    ? { route: input.baseRoute, anchor: 'biens' }
    : { route: input.baseRoute, anchor: 'contact' }
  const title = input.agencyIdentity.content.heroTitle
  const hasExplicitTitleBreak = /\r?\n/.test(title)

  return {
    layout,
    surface,
    height,
    alignment,
    headlineScale,
    imageDominance,
    overlay,
    search,
    secondaryCta,
    eyebrow: `${heroVariantLabel(input.agencyIdentity.content.heroVariant)} - ${input.agencyIdentity.brand.city}`,
    title,
    titleLines: createTitleLines(title),
    italicAccent: input.agencyIdentity.renderContract.typography.italicAccent && hasExplicitTitleBreak,
    subtitle: input.agencyIdentity.content.heroSubtitle,
    image: {
      src: input.agencyIdentity.assets.heroImage,
      alt: `${input.agencyIdentity.brand.name} - ${input.agencyIdentity.brand.city}`,
    },
    primaryCta: {
      label: input.canEstimate ? input.agencyIdentity.content.primaryCtaLabel : input.canShowProperties ? 'Voir les biens' : 'Nous contacter',
      target: primaryTarget,
      visible: true,
    },
    secondaryAction: {
      label: input.canShowProperties ? 'Voir les biens' : 'Nous contacter',
      target: secondaryTarget,
      visible: secondaryCta === 'visible' && (input.canShowProperties || !input.canEstimate),
    },
    searchAction: {
      label: input.canShowProperties ? 'Explorer les biens' : 'Nous contacter',
      target: secondaryTarget,
      visible: search === 'visible',
    },
    className: [
      'od-hero',
      'od-public-hero',
      `od-hero-layout-${layout}`,
      `od-hero-surface-${surface}`,
      `od-hero-height-${height}`,
      `od-hero-align-${alignment}`,
      `od-hero-headline-${headlineScale}`,
      `od-hero-image-dominance-${imageDominance}`,
      `od-hero-overlay-${overlay}`,
      search === 'visible' ? 'od-hero-has-search' : '',
      secondaryCta === 'visible' ? 'od-hero-has-secondary' : '',
    ].filter(Boolean).join(' '),
  }
}

function resolveVisibility(value?: string): PublicHeroVisibility {
  return toClassValue(value) === 'visible' ? 'visible' : 'hidden'
}

function heroVariantLabel(value?: string) {
  const labels: Record<string, string> = {
    premium: 'Agence premium',
    trust: 'Agence de confiance',
    estimation: 'Estimation',
    local: 'Agence locale',
  }

  return labels[value || ''] ?? 'Agence'
}

function createTitleLines(title: string) {
  if (title === 'Votre bien merite une signature.') return ['Votre bien merite', 'une signature.']

  const lines = title
    .split(/\n|\. /)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.length ? lines : [title]
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
