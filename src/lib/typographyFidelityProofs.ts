import { resolveRenderContract } from './renderContract'

type TypographyProof = {
  name: string
  passed: boolean
  editorial: string
  commercial: string
}

const baseBlueprint = `VisualBlueprint:
  version: v1
  brand:
    name: "Agence"
  layout:
    composition: editorial-immersive
  hero:
    layout: split-left
`

export function resolveTypographyFidelityProofs(): TypographyProof[] {
  const editorial = resolveRenderContract({
    visualBlueprint: `${baseBlueprint}
  typography:
    display:
      family: "Instrument Serif"
      weight: 300
      tracking: "-0.03em"
      italicAccent: true
    body:
      family: "Inter"
      weight: 400
      size: "1rem"
    eyebrow:
      case: uppercase
      tracking: "0.18em"
      size: "0.72rem"
    headlineScale: display
    verticalRhythm: "1.55rem"
`,
    typographyHeading: 'Instrument Serif',
    typographyBody: 'Inter',
  })
  const commercial = resolveRenderContract({
    visualBlueprint: `${baseBlueprint}
  typography:
    display:
      family: "Manrope"
      weight: 700
      tracking: "0"
      italicAccent: false
    body:
      family: "Arial"
      weight: 500
      size: "0.95rem"
    eyebrow:
      case: none
      tracking: "0.04em"
      size: "0.78rem"
    headlineScale: lg
    verticalRhythm: "0.95rem"
`,
    typographyHeading: 'Manrope',
    typographyBody: 'Arial',
  })

  return [
    proof('Famille display differente', editorial.typography.headingFontFamily, commercial.typography.headingFontFamily),
    proof('Poids display different', editorial.typography.displayWeight, commercial.typography.displayWeight),
    proof('Tracking display different', editorial.typography.displayTracking, commercial.typography.displayTracking),
    proof('Body size different', editorial.typography.bodySize, commercial.typography.bodySize),
    proof('Eyebrow tracking different', editorial.typography.eyebrowTracking, commercial.typography.eyebrowTracking),
    proof('Rythme vertical different', editorial.typography.verticalRhythm, commercial.typography.verticalRhythm),
    proof('Hero scale different', editorial.hero.headlineScale, commercial.hero.headlineScale),
  ]
}

function proof(name: string, editorial: string, commercial: string): TypographyProof {
  return {
    name,
    passed: editorial !== commercial,
    editorial,
    commercial,
  }
}
