import type { AgencyIdentity } from './agencyIdentity'

export type PublicPropertyCardVariant = 'visual' | 'editorial' | 'compact' | 'horizontal' | 'investment'
export type PublicPropertyCardOrientation = 'vertical' | 'horizontal'
export type PublicPropertyCardImageRatio = 'portrait' | 'landscape' | 'square' | 'cinematic'
export type PublicPropertyCardDensity = 'minimal' | 'standard' | 'compact'
export type PublicPropertyCardPricePosition = 'top' | 'content' | 'footer' | 'overlay'
export type PublicPropertyCardRadius = 'none' | 'subtle' | 'rounded'
export type PublicPropertyCardBorder = 'none' | 'subtle' | 'strong'
export type PublicPropertyCardShadow = 'none' | 'minimal' | 'elevated'
export type PublicPropertyCardHover = 'none' | 'subtle' | 'lift' | 'image-zoom'

export type PublicPropertyCardConfig = {
  variant: PublicPropertyCardVariant
  orientation: PublicPropertyCardOrientation
  imageRatio: PublicPropertyCardImageRatio
  informationDensity: PublicPropertyCardDensity
  pricePosition: PublicPropertyCardPricePosition
  showBadges: boolean
  radius: PublicPropertyCardRadius
  border: PublicPropertyCardBorder
  shadow: PublicPropertyCardShadow
  spacing: PublicPropertyCardDensity
  hover: PublicPropertyCardHover
  maxFeatures: number
  showExcerpt: boolean
  className: string
}

type PropertyCardDefaults = Omit<PublicPropertyCardConfig, 'className'>

const variantDefaults: Record<PublicPropertyCardVariant, PropertyCardDefaults> = {
  visual: {
    variant: 'visual',
    orientation: 'vertical',
    imageRatio: 'portrait',
    informationDensity: 'minimal',
    pricePosition: 'overlay',
    showBadges: false,
    radius: 'rounded',
    border: 'none',
    shadow: 'minimal',
    spacing: 'standard',
    hover: 'image-zoom',
    maxFeatures: 2,
    showExcerpt: false,
  },
  editorial: {
    variant: 'editorial',
    orientation: 'vertical',
    imageRatio: 'portrait',
    informationDensity: 'minimal',
    pricePosition: 'content',
    showBadges: false,
    radius: 'subtle',
    border: 'none',
    shadow: 'minimal',
    spacing: 'standard',
    hover: 'image-zoom',
    maxFeatures: 3,
    showExcerpt: true,
  },
  compact: {
    variant: 'compact',
    orientation: 'vertical',
    imageRatio: 'landscape',
    informationDensity: 'compact',
    pricePosition: 'top',
    showBadges: true,
    radius: 'rounded',
    border: 'subtle',
    shadow: 'minimal',
    spacing: 'compact',
    hover: 'subtle',
    maxFeatures: 4,
    showExcerpt: false,
  },
  horizontal: {
    variant: 'horizontal',
    orientation: 'horizontal',
    imageRatio: 'landscape',
    informationDensity: 'standard',
    pricePosition: 'content',
    showBadges: true,
    radius: 'subtle',
    border: 'subtle',
    shadow: 'minimal',
    spacing: 'standard',
    hover: 'lift',
    maxFeatures: 4,
    showExcerpt: true,
  },
  investment: {
    variant: 'investment',
    orientation: 'vertical',
    imageRatio: 'landscape',
    informationDensity: 'compact',
    pricePosition: 'top',
    showBadges: true,
    radius: 'none',
    border: 'strong',
    shadow: 'none',
    spacing: 'compact',
    hover: 'subtle',
    maxFeatures: 4,
    showExcerpt: false,
  },
}

export function resolvePublicPropertyCardConfig(identity: AgencyIdentity): PublicPropertyCardConfig {
  const blueprint = identity.visualBlueprint
  const propertyCards = blueprint?.propertyCards
  const variant = resolveVariant(propertyCards?.variant || propertyCards?.cardStyle, identity)
  const defaults = variantDefaults[variant]
  const orientation = resolveOrientation(propertyCards?.orientation, defaults.orientation, variant)
  const imageRatio = resolveImageRatio(propertyCards?.imageRatio, defaults.imageRatio)
  const informationDensity = resolveDensity(propertyCards?.density || propertyCards?.informationStyle, defaults.informationDensity)
  const pricePosition = resolvePricePosition(propertyCards?.pricePosition || propertyCards?.priceStyle, defaults.pricePosition)
  const showBadges = resolveVisibility(propertyCards?.badges || propertyCards?.badgeStyle, defaults.showBadges)
  const radius = resolveRadius(propertyCards?.radius || propertyCards?.cardRadius, defaults.radius)
  const border = resolveBorder(propertyCards?.border, defaults.border)
  const shadow = resolveShadow(propertyCards?.shadow || propertyCards?.shadowStyle, defaults.shadow)
  const spacing = resolveDensity(propertyCards?.spacing, defaults.spacing)
  const hover = resolveHover(propertyCards?.hover, defaults.hover)
  const showExcerpt = resolveVisibility(propertyCards?.excerpt, defaults.showExcerpt)
  const maxFeatures = resolveMaxFeatures(variant, informationDensity)

  return {
    variant,
    orientation,
    imageRatio,
    informationDensity,
    pricePosition,
    showBadges,
    radius,
    border,
    shadow,
    spacing,
    hover,
    maxFeatures,
    showExcerpt,
    className: [
      'od-property-card',
      'od-public-property-card',
      `od-property-card-variant-${variant}`,
      `od-property-card-orientation-${orientation}`,
      `od-property-card-ratio-${imageRatio}`,
      `od-property-card-density-${informationDensity}`,
      `od-property-card-price-${pricePosition}`,
      `od-property-card-badges-${showBadges ? 'visible' : 'hidden'}`,
      `od-property-card-radius-${radius}`,
      `od-property-card-border-${border}`,
      `od-property-card-shadow-${shadow}`,
      `od-property-card-spacing-${spacing}`,
      `od-property-card-hover-${hover}`,
      showExcerpt ? 'od-property-card-has-excerpt' : 'od-property-card-no-excerpt',
    ].join(' '),
  }
}

function resolveVariant(value: string | undefined, identity: AgencyIdentity): PublicPropertyCardVariant {
  const normalized = toClassValue(value)
  if (normalized === 'visual' || normalized === 'editorial' || normalized === 'compact' || normalized === 'horizontal' || normalized === 'investment') return normalized
  if (normalized === 'magazine' || normalized === 'editorial-grid' || normalized === 'luxury-shadow') return 'editorial'
  if (normalized === 'minimal') return 'visual'
  if (normalized === 'structured') return 'compact'
  if (identity.composition.imageDominance === 'strong') return 'visual'
  if (identity.composition.imageDominance === 'data') return 'investment'
  if (identity.composition.density === 'high') return 'compact'
  return 'editorial'
}

function resolveOrientation(value: string | undefined, fallback: PublicPropertyCardOrientation, variant: PublicPropertyCardVariant) {
  const normalized = toClassValue(value)
  if (normalized === 'horizontal') return 'horizontal'
  if (normalized === 'vertical') return 'vertical'
  return variant === 'horizontal' ? 'horizontal' : fallback
}

function resolveImageRatio(value: string | undefined, fallback: PublicPropertyCardImageRatio): PublicPropertyCardImageRatio {
  const normalized = toClassValue(value)
  const compact = value?.replace(/\s+/g, '') ?? ''
  if (normalized === 'portrait' || compact === '4/5') return 'portrait'
  if (normalized === 'landscape' || compact === '16/10' || compact === '3/2') return 'landscape'
  if (normalized === 'square' || compact === '1/1') return 'square'
  if (normalized === 'cinematic' || compact === '16/9') return 'cinematic'
  return fallback
}

function resolveDensity(value: string | undefined, fallback: PublicPropertyCardDensity): PublicPropertyCardDensity {
  const normalized = toClassValue(value)
  if (normalized === 'minimal' || normalized === 'standard' || normalized === 'compact') return normalized
  return fallback
}

function resolvePricePosition(value: string | undefined, fallback: PublicPropertyCardPricePosition): PublicPropertyCardPricePosition {
  const normalized = toClassValue(value)
  if (normalized === 'top' || normalized === 'content' || normalized === 'footer' || normalized === 'overlay') return normalized
  return fallback
}

function resolveVisibility(value: string | undefined, fallback: boolean) {
  const normalized = toClassValue(value)
  if (normalized === 'visible') return true
  if (normalized === 'hidden') return false
  return fallback
}

function resolveRadius(value: string | undefined, fallback: PublicPropertyCardRadius): PublicPropertyCardRadius {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === '0' || normalized === '0px') return 'none'
  if (normalized === 'subtle') return 'subtle'
  if (normalized === 'rounded') return 'rounded'
  return fallback
}

function resolveBorder(value: string | undefined, fallback: PublicPropertyCardBorder): PublicPropertyCardBorder {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'subtle' || normalized === 'strong') return normalized
  return fallback
}

function resolveShadow(value: string | undefined, fallback: PublicPropertyCardShadow): PublicPropertyCardShadow {
  const normalized = toClassValue(value)
  if (normalized === 'none') return 'none'
  if (normalized === 'minimal' || normalized === 'soft') return 'minimal'
  if (normalized === 'elevated' || normalized === 'medium' || normalized === 'deep' || normalized === 'luxury') return 'elevated'
  return fallback
}

function resolveHover(value: string | undefined, fallback: PublicPropertyCardHover): PublicPropertyCardHover {
  const normalized = toClassValue(value)
  if (normalized === 'none' || normalized === 'subtle' || normalized === 'lift' || normalized === 'image-zoom') return normalized
  return fallback
}

function resolveMaxFeatures(variant: PublicPropertyCardVariant, density: PublicPropertyCardDensity) {
  if (variant === 'visual') return 2
  if (variant === 'investment' || density === 'compact') return 4
  return 3
}

function toClassValue(value?: string) {
  return value ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''
}
