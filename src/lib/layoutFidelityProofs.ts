import { resolveRenderContract } from './renderContract'

export type LayoutFidelityProof = {
  label: string
  minimal: string
  dense: string
  differs: boolean
}

const minimalBlueprint = `VisualBlueprint:
  version: v1
  layout:
    composition: editorial-immersive
    density: airy
  container:
    maxWidth: 1280px
    padding: clamp(1.5rem, 5vw, 4rem)
  hero:
    layout: split-left
    height: screen
    contentWidth: 38rem
    contentBottom: clamp(5rem, 12vh, 9rem)
    copyGap: 1.7rem
    ctaMargin: 3.25rem
  sections:
    sectionSpacing: airy
    contentWidth: 58rem
  grid:
    gap: clamp(1.5rem, 3.5vw, 2.75rem)
  responsive:
    mobileSpacing: airy`

const denseBlueprint = `VisualBlueprint:
  version: v1
  layout:
    composition: commercial-direct
    density: dense
  container:
    maxWidth: 1080px
    padding: clamp(1rem, 3vw, 2rem)
  hero:
    layout: split-right
    height: compact
    contentWidth: 32rem
    contentBottom: clamp(2rem, 6vh, 3.5rem)
    copyGap: 0.8rem
    ctaMargin: 1.25rem
  sections:
    sectionSpacing: dense
    contentWidth: 46rem
  grid:
    gap: clamp(0.7rem, 1.6vw, 1rem)
  responsive:
    mobileSpacing: dense`

export function resolveLayoutFidelityProofs(): LayoutFidelityProof[] {
  const minimal = resolveRenderContract({ visualBlueprint: minimalBlueprint })
  const dense = resolveRenderContract({ visualBlueprint: denseBlueprint })

  return [
    proof('largeur contenu', minimal.layout.contentWidth, dense.layout.contentWidth),
    proof('padding horizontal', minimal.layout.sectionPaddingX, dense.layout.sectionPaddingX),
    proof('padding vertical sections', minimal.layout.sectionPaddingY, dense.layout.sectionPaddingY),
    proof('rythme mobile', minimal.layout.mobileSectionPaddingY, dense.layout.mobileSectionPaddingY),
    proof('gap grille', minimal.layout.gridGap, dense.layout.gridGap),
    proof('gap blocs', minimal.layout.blockGap, dense.layout.blockGap),
    proof('hauteur hero', minimal.layout.heroHeight, dense.layout.heroHeight),
    proof('position verticale hero', minimal.layout.heroContentBottom, dense.layout.heroContentBottom),
    proof('distance texte CTA', minimal.layout.heroCtaMargin, dense.layout.heroCtaMargin),
    proof('ratio texte image', minimal.layout.textImageColumns, dense.layout.textImageColumns),
  ]
}

function proof(label: string, minimal: string, dense: string): LayoutFidelityProof {
  return {
    label,
    minimal,
    dense,
    differs: minimal !== dense,
  }
}
