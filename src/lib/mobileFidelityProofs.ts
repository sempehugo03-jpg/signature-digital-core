import {
  publicPageConfigProofFixtures,
  sortPublicPageSections,
  type PublicPageConfig,
} from './publicPageConfig'
import { resolveRenderContract, type RenderContract } from './renderContract'

export type MobileFidelityProof = {
  label: string
  widths: number[]
  desktopOrder: string[]
  mobileOrder: string[]
  hero: RenderContract['hero']
  layout: RenderContract['layout']
  navigation: RenderContract['navigation']
  footer: RenderContract['footer']
  publicSectionCount: number
}

export function resolveMobileFidelityProofs(): MobileFidelityProof[] {
  return [
    createProof('Agence premium aeree', publicPageConfigProofFixtures.editorial, `
version: v1
brand:
  name: "Agence premium"
  primaryColor: "#18120D"
  accentColor: "#B8945E"
layout:
  composition: editorial-immersive
  density: airy
hero:
  layout: split-left
  height: screen
  headlineScale: display
navigation:
  style: minimal
  surface: transparent
  density: standard
footer:
  style: editorial
  background: "#18120D"
responsive:
  mobileSpacing: airy
  mobileTypographyScale: 0.94
`),
    createProof('Agence commerciale dense', publicPageConfigProofFixtures.commercial, `
version: v1
brand:
  name: "Agence commerciale"
  primaryColor: "#0F172A"
  accentColor: "#2563EB"
layout:
  composition: commercial-direct
  density: dense
hero:
  layout: centered
  height: compact
  headlineScale: lg
navigation:
  style: compact
  surface: light
  density: compact
  behavior: sticky
footer:
  style: modern
  background: "#0F172A"
responsive:
  mobileSpacing: dense
  mobileTypographyScale: 0.88
`),
  ]
}

function createProof(label: string, publicPageConfig: PublicPageConfig, visualBlueprint: string): MobileFidelityProof {
  const contract = resolveRenderContract({ visualBlueprint })

  return {
    label,
    widths: [320, 375, 390, 430, 768],
    desktopOrder: sortPublicPageSections(publicPageConfig, 'desktop').map((section) => `${section.desktopOrder ?? 'auto'}:${section.id}`),
    mobileOrder: sortPublicPageSections(publicPageConfig, 'mobile').map((section) => `${section.mobileOrder ?? section.desktopOrder ?? 'auto'}:${section.id}`),
    hero: contract.hero,
    layout: contract.layout,
    navigation: contract.navigation,
    footer: contract.footer,
    publicSectionCount: publicPageConfig.sections.filter((section) => section.enabled).length,
  }
}
