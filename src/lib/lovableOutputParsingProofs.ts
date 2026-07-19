import { parseLovableOutput } from './lovableOutput'

type ProofResult = {
  name: string
  passed: boolean
  actual: string
  expected: string
}

const soraLovableOutputFixture = `LovableOutput:
  version: v1

  demo:
    url: "https://lovable.dev/projects/sora-reference"

  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Sora Immobilier"
      layout:
        composition: editorial-immersive
      navigation:
        surface: transparent
      hero:
        layout: split-left
      sections:
        sectionOrder: hero, agencyStory, properties, method, sellerSpace, reviews, contact
      propertyCards:
        variant: editorial
      typography:
        pairing: mixed-editorial

  VisualPack:
    logo:
      status: proposed
    palette:
      ink: "#111111"
      ivory: "#F7F2EA"
      sand: "#D8C6A3"
      brass: "#A77A3D"
    typography:
      display:
        family: "Instrument Serif"
        weight: "400"
      body:
        family: "Inter"
        weight: "400"
    imageRoles:
      hero: "https://images.example.com/sora/hero.jpg"
      agency: "https://images.example.com/sora/agency.jpg"
      method: "https://images.example.com/sora/method.jpg"
      proof: "https://images.example.com/sora/proof.jpg"
      contact: "https://images.example.com/sora/contact.jpg"
      advisorPortrait: "https://images.example.com/sora/advisor.jpg"
      localArea: "https://images.example.com/sora/local-area.jpg"
      sellerSpace: "https://images.example.com/sora/seller-space.jpg"

  publicPage:
    sections:
      - id: hero-main
        type: hero
        enabled: true
        variant: editorial-split
        surface: ink
        title: "Une signature immobiliere sensible."
        imageRole: hero
        primaryCta:
          label: "Estimer mon bien"
          action: estimate
        desktopOrder: 0
        mobileOrder: 0
      - id: agency-story
        type: agencyStory
        enabled: true
        variant: image-text
        surface: ivory
        title: "Une agence ancree dans son territoire."
        imageRole: agency
        desktopOrder: 10
        mobileOrder: 10
      - id: properties-main
        type: properties
        enabled: true
        variant: featured-first
        surface: white
        title: "Biens choisis"
        imageRole: agency
        desktopOrder: 20
        mobileOrder: 20
      - id: method-main
        type: method
        enabled: true
        variant: editorial
        surface: muted
        title: "Une methode lisible"
        imageRole: method
        desktopOrder: 30
        mobileOrder: 30
      - id: seller-space-main
        type: sellerSpace
        enabled: true
        variant: promise
        surface: brand
        title: "Un suivi clair"
        imageRole: sellerSpace
        desktopOrder: 40
        mobileOrder: 40
      - id: reviews-main
        type: reviews
        enabled: true
        variant: editorial
        surface: ivory
        title: "Des preuves simples"
        imageRole: proof
        desktopOrder: 50
        mobileOrder: 50
      - id: contact-main
        type: contact
        enabled: true
        variant: portrait-form
        surface: ink
        title: "Parlons de votre projet"
        imageRole: contact
        desktopOrder: 60
        mobileOrder: 60
    imageRoles:
      hero: "https://images.example.com/sora/hero.jpg"
      agency: "https://images.example.com/sora/agency.jpg"
      method: "https://images.example.com/sora/method.jpg"
      proof: "https://images.example.com/sora/proof.jpg"
      contact: "https://images.example.com/sora/contact.jpg"
      advisorPortrait: "https://images.example.com/sora/advisor.jpg"
      localArea: "https://images.example.com/sora/local-area.jpg"
      sellerSpace: "https://images.example.com/sora/seller-space.jpg"

  unsupportedCapabilities:
    - "Transition hero avec fondu de navigation au scroll"
    - "Micro animation de reveal typographique"
    - "Masque image diagonal dans la section agence"
    - "Footer editorial single-line anime"
    - "Parallax discret des images de preuve"
`

export function resolveLovableOutputParsingProofs(): ProofResult[] {
  const full = parseLovableOutput(soraLovableOutputFixture)
  const fullPack = full.output.visualPack
  const uniqueColors = new Set(Object.values(fullPack.colors).filter(Boolean))
  const activeSections = full.output.publicPage?.sections.filter((section) => section.enabled).length ?? 0
  const imageRoleCount = Object.values(fullPack.imageRoles ?? {}).filter(Boolean).length
  const errorCount = full.diagnostics.filter((diagnostic) => diagnostic.level === 'error').length

  const partialPalette = parseLovableOutput(`LovableOutput:
  version: v1
  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Palette"
      layout:
        composition: modular-premium
  VisualPack:
    palette:
      ink: "#111111"
      brass: "#A77A3D"
`)
  const validTypography = parseLovableOutput(`LovableOutput:
  version: v1
  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Typographie"
      layout:
        composition: modular-premium
  VisualPack:
    typography:
      display:
        family: "Instrument Serif"
      body:
        family: "Inter"
`)
  const validUrl = parseLovableOutput(`LovableOutput:
  version: v1
  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Image"
      layout:
        composition: modular-premium
  VisualPack:
    imageRoles:
      hero: "https://images.example.com/hero.jpg"
`)
  const invalidSrcAsset = parseLovableOutput(`LovableOutput:
  version: v1
  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Image"
      layout:
        composition: modular-premium
  VisualPack:
    imageRoles:
      hero: "src/assets/hero.jpg"
`)
  const mixedUrls = parseLovableOutput(`LovableOutput:
  version: v1
  VisualBlueprint: |
    VisualBlueprint:
      version: v1
      brand:
        name: "Images mixtes"
      layout:
        composition: modular-premium
  VisualPack:
    imageRoles:
      hero: "https://images.example.com/hero.jpg"
      agency: "/src/assets/agency.jpg"
      contact: "https://images.example.com/contact.jpg"
`)

  return [
    createProof('Bloc Sora sans erreur', errorCount, 0),
    createProof('Bloc Sora palette', uniqueColors.size, 4),
    createProof('Bloc Sora typography heading', fullPack.typography.heading, 'Instrument Serif'),
    createProof('Bloc Sora typography body', fullPack.typography.body, 'Inter'),
    createProof('Bloc Sora imageRoles', imageRoleCount, 8),
    createProof('Bloc Sora sections actives', activeSections, 7),
    createProof('Bloc Sora sans fallback legacy', full.output.publicPage?.source, 'lovable'),
    createProof('Bloc Sora unsupportedCapabilities', full.output.unsupportedCapabilities.length, 5),
    createProof('Palette partielle conservee', new Set(Object.values(partialPalette.output.visualPack.colors).filter(Boolean)).size, 2),
    createProof('Typographies imbriquees valides', `${validTypography.output.visualPack.typography.heading} + ${validTypography.output.visualPack.typography.body}`, 'Instrument Serif + Inter'),
    createProof('URL publique valide conservee', validUrl.output.visualPack.imageRoles?.hero, 'https://images.example.com/hero.jpg'),
    createProof('Chemin src/assets refuse', invalidSrcAsset.output.visualPack.imageRoles?.hero ?? '', ''),
    createProof('Melange URLs valides et invalides', Object.values(mixedUrls.output.visualPack.imageRoles ?? {}).filter(Boolean).length, 2),
  ]
}

function createProof(name: string, actual: string | number | undefined, expected: string | number): ProofResult {
  return {
    name,
    passed: actual === expected,
    actual: String(actual ?? ''),
    expected: String(expected),
  }
}
