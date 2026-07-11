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
  const blueprint = input.agencyIdentity.visualBlueprint
  const composition = input.agencyIdentity.composition
  const layout = resolveLayout(blueprint?.hero.layout, composition.imageDominance)
  const surface = resolveSurface(blueprint?.hero.surface, blueprint?.hero.overlay, input.agencyIdentity.visualMood)
  const height = resolveHeight(blueprint?.hero.height, composition.imageDominance, composition.density)
  const alignment = resolveAlignment(blueprint?.hero.titleAlignment, layout)
  const headlineScale = resolveHeadlineScale(blueprint?.hero.headlineScale || blueprint?.hero.titleSize, composition.imageDominance, composition.density)
  const imageDominance = composition.imageDominance
  const overlay = resolveOverlay(blueprint?.hero.overlay, surface)
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

function resolveLayout(value: string | undefined, imageDominance: PublicHeroImageDominance): PublicHeroLayout {
  const normalized = toClassValue(value)
  if (normalized === 'full' || normalized === 'full-bleed' || normalized === 'fullscreen' || normalized === 'image-overlay') return 'full'
  if (normalized === 'split-left' || normalized === 'split') return 'split-left'
  if (normalized === 'split-right') return 'split-right'
  if (normalized === 'center' || normalized === 'centered' || normalized === 'centered-statement') return 'centered'
  if (normalized === 'minimal') return 'minimal'
  if (imageDominance === 'strong') return 'full'
  if (imageDominance === 'data') return 'split-right'
  return 'split-left'
}

function resolveSurface(value: string | undefined, overlay: string | undefined, mood: string): PublicHeroSurface {
  const normalized = toClassValue(value || overlay || mood)
  if (normalized === 'light' || normalized === 'dark' || normalized === 'transparent') return normalized
  if (/dark|navy|black|night|cinematic|luxury/.test(normalized)) return 'dark'
  if (/minimal|white|cream|warm|light/.test(normalized)) return 'light'
  return 'dark'
}

function resolveHeight(value: string | undefined, imageDominance: PublicHeroImageDominance, density: string): PublicHeroHeight {
  const normalized = toClassValue(value)
  if (normalized === 'compact' || normalized === 'standard' || normalized === 'large' || normalized === 'screen') return normalized
  if (normalized === 'full' || normalized === 'fullscreen' || normalized === 'full-bleed' || normalized === '100svh') return 'screen'
  if (density === 'high') return 'standard'
  if (imageDominance === 'strong') return 'screen'
  return 'large'
}

function resolveAlignment(value: string | undefined, layout: PublicHeroLayout): PublicHeroAlignment {
  const normalized = toClassValue(value)
  if (normalized === 'center' || normalized === 'centered') return 'center'
  if (layout === 'centered') return 'center'
  return 'left'
}

function resolveHeadlineScale(value: string | undefined, imageDominance: PublicHeroImageDominance, density: string): PublicHeroHeadlineScale {
  const normalized = toClassValue(value)
  if (normalized === 'display' || normalized === 'xl' || normalized === 'lg') return normalized
  if (density === 'high') return 'lg'
  if (imageDominance === 'strong') return 'display'
  return 'xl'
}

function resolveOverlay(value: string | undefined, surface: PublicHeroSurface) {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'light' || normalized === 'dark' || normalized === 'soft') return normalized
  if (surface === 'light') return 'light'
  if (surface === 'transparent') return 'soft'
  return 'dark'
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
