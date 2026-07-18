import { parseLovableOutput } from './lovableOutput'

type PublicPageIngestionProof = {
  name: string
  raw: string
  expectedSectionIds: string[]
}

export const lovablePublicPageIngestionProofs: PublicPageIngestionProof[] = [
  {
    name: 'publicPage au niveau racine',
    expectedSectionIds: ['hero-main', 'contact-main'],
    raw: `version: v1
publicPage:
  sections:
    - id: hero-main
      type: hero
      enabled: true
      order: 0
      title: "Une agence locale"
      variant: editorial-split
      surface: ink
      imageRole: hero
      primaryCta:
        label: "Estimer mon bien"
        action: estimate
    - id: contact-main
      type: contact
      enabled: true
      order: 10
      title: "Parlons de votre projet"
      variant: portrait-form
      surface: ivory`,
  },
  {
    name: 'LovableOutput.publicPage enveloppe YAML',
    expectedSectionIds: ['hero-main', 'properties-main'],
    raw: `LovableOutput:
  version: v1
  publicPage:
    sections:
      - id: hero-main
        type: hero
        enabled: true
        desktopOrder: 0
        title: "L immobilier signe"
        variant: editorial-split
      - id: properties-main
        type: properties
        enabled: true
        desktopOrder: 20
        title: "Nos biens"
        variant: featured-first`,
  },
  {
    name: 'publicPage conserve avec Blueprint invalide',
    expectedSectionIds: ['story-main'],
    raw: `version: v1
visualBlueprint: |
  VisualBlueprint:
    version: invalid
publicPage:
  sections:
    - id: story-main
      type: agencyStory
      enabled: true
      order: 5
      title: "Une approche sur mesure"
      variant: image-text
      imageRole: agency`,
  },
  {
    name: 'sections inconnues ignorees sans perdre les valides',
    expectedSectionIds: ['hero-main', 'estimate-main'],
    raw: `version: v1
publicPage:
  sections:
    - id: hero-main
      type: hero
      enabled: true
      order: 0
      title: "Accueil"
    - id: unknown-main
      type: immersiveTimeline
      enabled: true
      order: 5
      title: "Bloc non supporte"
    - id: estimate-main
      type: estimate
      enabled: true
      order: 10
      title: "Estimez votre bien"
      variant: quick-estimate`,
  },
  {
    name: 'LovableOutput.publicPage enveloppe JSON',
    expectedSectionIds: ['hero-main', 'seller-main'],
    raw: JSON.stringify({
      LovableOutput: {
        version: 'v1',
        publicPage: {
          sections: [
            { id: 'hero-main', type: 'hero', enabled: true, order: 0, title: 'Demo commerciale', variant: 'compact' },
            { id: 'seller-main', type: 'sellerSpace', enabled: true, order: 30, title: 'Suivi vendeur', variant: 'promise' },
          ],
          imageRoles: {
            hero: 'https://example.com/hero.jpg',
          },
        },
      },
    }),
  },
]

export function resolveLovablePublicPageIngestionProofs() {
  return lovablePublicPageIngestionProofs.map((proof) => {
    const result = parseLovableOutput(proof.raw)
    const actualSectionIds = result.output.publicPage?.sections.map((section) => section.id) ?? []

    return {
      name: proof.name,
      expectedSectionIds: proof.expectedSectionIds,
      actualSectionIds,
      passed: proof.expectedSectionIds.every((id) => actualSectionIds.includes(id)),
      diagnostics: result.diagnostics.filter((diagnostic) => diagnostic.section === 'publicPage'),
    }
  })
}
