import { resolveRenderContract } from './renderContract'

export type CardImageFidelityProof = {
  label: string
  editorial: string | boolean
  commercial: string | boolean
  differs: boolean
}

const editorialBlueprint = `VisualBlueprint:
  version: v1
  layout:
    composition: editorial-immersive
  propertyCards:
    variant: editorial
    orientation: vertical
    imageRatio: portrait
    imageTreatment: editorial-crop
    density: minimal
    pricePosition: content
    badges: hidden
    radius: subtle
    border: none
    shadow: none
    spacing: minimal
    hover: subtle
    excerpt: visible
    informationStyle: premium
  hero:
    imagePosition: center top
  images:
    sectionImageStyle: cover`

const commercialBlueprint = `VisualBlueprint:
  version: v1
  layout:
    composition: commercial-direct
  propertyCards:
    variant: compact
    orientation: horizontal
    imageRatio: landscape
    imageTreatment: cover
    density: compact
    pricePosition: top
    badges: visible
    radius: rounded
    border: strong
    shadow: elevated
    spacing: compact
    hover: lift
    excerpt: hidden
    informationStyle: modern
  hero:
    imagePosition: center
  images:
    sectionImageStyle: cover`

export function resolveCardImageFidelityProofs(): CardImageFidelityProof[] {
  const editorial = resolveRenderContract({ visualBlueprint: editorialBlueprint })
  const commercial = resolveRenderContract({ visualBlueprint: commercialBlueprint })

  return [
    proof('variant', editorial.propertyCards.variant, commercial.propertyCards.variant),
    proof('orientation', editorial.propertyCards.orientation, commercial.propertyCards.orientation),
    proof('ratio image', editorial.propertyCards.imageRatio, commercial.propertyCards.imageRatio),
    proof('position prix', editorial.propertyCards.pricePosition, commercial.propertyCards.pricePosition),
    proof('badges', editorial.propertyCards.showBadges, commercial.propertyCards.showBadges),
    proof('bordure', editorial.propertyCards.border, commercial.propertyCards.border),
    proof('rayon', editorial.propertyCards.radius, commercial.propertyCards.radius),
    proof('ombre', editorial.propertyCards.shadow, commercial.propertyCards.shadow),
    proof('densite', editorial.propertyCards.density, commercial.propertyCards.density),
    proof('hover', editorial.propertyCards.hover, commercial.propertyCards.hover),
    proof('extrait', editorial.propertyCards.showExcerpt, commercial.propertyCards.showExcerpt),
    proof('cadrage image', editorial.propertyCards.imagePosition, commercial.propertyCards.imagePosition),
  ]
}

function proof(label: string, editorial: string | boolean, commercial: string | boolean): CardImageFidelityProof {
  return {
    label,
    editorial,
    commercial,
    differs: editorial !== commercial,
  }
}
