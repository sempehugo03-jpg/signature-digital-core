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

export function resolvePublicPropertyCardConfig(identity: AgencyIdentity): PublicPropertyCardConfig {
  const cards = identity.renderContract.propertyCards
  const variant = cards.variant
  const orientation = cards.orientation
  const imageRatio = cards.imageRatio
  const informationDensity = cards.density
  const pricePosition = cards.pricePosition
  const showBadges = cards.showBadges
  const radius = cards.radius
  const border = cards.border
  const shadow = cards.shadow
  const spacing = cards.spacing
  const hover = cards.hover
  const showExcerpt = cards.showExcerpt
  const maxFeatures = cards.maxFeatures

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
