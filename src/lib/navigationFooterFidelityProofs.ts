import { resolveRenderContract, type RenderContract } from './renderContract'

type NavigationFooterProof = {
  label: string
  navigation: RenderContract['navigation']
  footer: RenderContract['footer']
  tokens: {
    navHeight: string
    navGap: string
    navBackground: string
    footerBackground: string
    footerPaddingY: string
    footerColumns: string
  }
}

export function resolveNavigationFooterFidelityProofs(): NavigationFooterProof[] {
  return [
    createProof('Agence premium', `
version: v1
brand:
  name: "Agence premium"
  primaryColor: "#18120D"
  accentColor: "#B8945E"
  backgroundPalette: "ivory"
layout:
  composition: editorial-immersive
navigation:
  style: minimal
  surface: transparent
  density: standard
  behavior: static
  logoMode: light
  primaryCta: hidden
  privateAccess: visible
  height: 6.5rem
  spacing: 2.4rem
footer:
  style: editorial
  background: "#18120D"
  spacing: 5rem
`),
    createProof('Agence commerciale', `
version: v1
brand:
  name: "Agence commerciale"
  primaryColor: "#0F172A"
  accentColor: "#2563EB"
  backgroundPalette: "white"
layout:
  composition: commercial-direct
navigation:
  style: compact
  surface: light
  density: compact
  behavior: sticky
  logoMode: dark
  primaryCta: visible
  privateAccess: visible
  height: 4.2rem
  spacing: 0.85rem
footer:
  style: modern
  background: "#0F172A"
  spacing: 3rem
`),
  ]
}

function createProof(label: string, visualBlueprint: string): NavigationFooterProof {
  const contract = resolveRenderContract({ visualBlueprint })
  const tokens = contract.tokens as Record<string, string | number | undefined>
  return {
    label,
    navigation: contract.navigation,
    footer: contract.footer,
    tokens: {
      navHeight: String(tokens['--od-render-nav-height']),
      navGap: String(tokens['--od-render-nav-gap']),
      navBackground: String(tokens['--od-render-nav-background']),
      footerBackground: String(tokens['--od-render-footer-background']),
      footerPaddingY: String(tokens['--od-render-footer-padding-y']),
      footerColumns: String(tokens['--od-render-footer-columns']),
    },
  }
}
