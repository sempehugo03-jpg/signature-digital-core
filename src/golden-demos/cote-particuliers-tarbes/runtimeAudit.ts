import lovableOutputSource from './lovable-output.yaml?raw'
import { duplicateRealEstateTemplateForAgency, type RealEstateAgencyRuntime } from '../../data/realEstateAgencyConfig'
import { parseLovableOutput } from '../../lib/lovableOutput'
import { publicPageConfigProofFixtures, type PublicPageConfig, type PublicPageImageRole } from '../../lib/publicPageConfig'

export type CoteParticuliersAuditImageMode = 'source-originale' | 'images-locales-audit'
export type CoteParticuliersAuditProfile = 'cote-particuliers' | 'commercial-opposite'

export const coteParticuliersAuditSourceHash = '5dc016c192248161173ad2b545b2818a0c4cc6a6e3c8edd8f54d2f20dfc0930c'

export const coteParticuliersAuditLocalImageRoles: Record<PublicPageImageRole, string> = {
  hero: '/golden-audit/cote-particuliers/hero.svg',
  agency: '/golden-audit/cote-particuliers/agency.svg',
  method: '/golden-audit/cote-particuliers/method.svg',
  sellerSpace: '/golden-audit/cote-particuliers/seller-space.svg',
  proof: '/golden-audit/cote-particuliers/proof.svg',
  contact: '/golden-audit/cote-particuliers/contact.svg',
  advisorPortrait: '/golden-audit/cote-particuliers/contact.svg',
  localArea: '/golden-audit/cote-particuliers/local-area.svg',
}

export function createCoteParticuliersAuditRuntime(
  mode: CoteParticuliersAuditImageMode,
  profile: CoteParticuliersAuditProfile = 'cote-particuliers',
): RealEstateAgencyRuntime {
  const parsed = parseLovableOutput(lovableOutputSource).output
  const basePublicPageConfig = profile === 'commercial-opposite'
    ? createCommercialOppositePublicPageConfig()
    : parsed.publicPage
  const publicPageConfig = mode === 'images-locales-audit'
    ? withAuditImageRoles(basePublicPageConfig, coteParticuliersAuditLocalImageRoles)
    : basePublicPageConfig
  const imageRoles = publicPageConfig?.imageRoles ?? parsed.visualPack.imageRoles ?? {}
  const sectionImages = Object.values(imageRoles).filter(Boolean) as string[]
  const colors = parsed.visualPack.palette
  const heroSection = publicPageConfig?.sections.find((section) => section.enabled && section.type === 'hero')

  return duplicateRealEstateTemplateForAgency({
    agencyName: profile === 'commercial-opposite' ? 'Agence commerciale audit' : 'Cote Particuliers Tarbes',
    city: 'Tarbes',
    agencySlug: profile === 'commercial-opposite' ? 'golden-commercial-opposite-audit' : 'golden-cote-particuliers-tarbes',
    agencyKind: 'internal-test',
    logoUrl: mode === 'images-locales-audit' ? '/golden-audit/cote-particuliers/logo.svg' : parsed.visualPack.logo.url,
    heroImage: imageRoles.hero || parsed.visualPack.heroImageUrl,
    sectionImages,
    typographyHeading: parsed.visualPack.typography.heading,
    typographyBody: parsed.visualPack.typography.body,
    typographyStyle: {
      displayWeight: parsed.visualPack.typography.displayWeight,
      displayTracking: parsed.visualPack.typography.displayTracking,
      italicAccent: parsed.visualPack.typography.italicAccent,
      bodyWeight: parsed.visualPack.typography.bodyWeight,
      bodySize: parsed.visualPack.typography.bodySize,
      eyebrowCase: parsed.visualPack.typography.eyebrowCase,
      eyebrowTracking: parsed.visualPack.typography.eyebrowTracking,
      eyebrowSize: parsed.visualPack.typography.eyebrowSize,
      headlineScale: parsed.visualPack.typography.headlineScale,
      verticalRhythm: parsed.visualPack.typography.verticalRhythm,
    },
    colors: {
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
      backgroundColor: colors.background,
    },
    email: 'contact@coteparticuliers-tarbes.example',
    phone: '05 62 51 09 76',
    address: '12, place Marcadieu, 65000 Tarbes',
    websiteUrl: 'https://tarbes.coteparticuliers.com',
    painPoint: 'Golden demo runtime audit',
    objective: heroSection?.description ?? 'Audit runtime renderer de la golden demo.',
    visualStyle: 'Golden demo Cote Particuliers Tarbes',
    variant: profile === 'commercial-opposite' ? 'commercial-performance' : 'editorial-immersive',
    heroTitle: heroSection?.title,
    heroSubtitle: heroSection?.description,
    primaryCtaLabel: heroSection?.primaryCta?.label,
    sectionOrder: publicPageConfig?.sections.map((section) => section.type).join(','),
    visualBlueprint: parsed.visualBlueprint.raw,
    publicPageConfig,
    enabledModules: {
      estimation: true,
      sellerSpace: true,
      agentSpace: true,
      ownerSpace: true,
      publicProperties: true,
      propertyDetail: true,
      reviews: true,
    },
    status: 'demo_ready',
    mode: 'demo',
    propertyLimit: 3,
    lastUpdatedBy: `runtime-audit:${mode}:${profile}`,
  })
}

export function getCoteParticuliersAuditParseSummary() {
  const parsed = parseLovableOutput(lovableOutputSource)
  return {
    sourceHash: coteParticuliersAuditSourceHash,
    visualBlueprintRecognized: Boolean(parsed.output.visualBlueprint.normalized),
    visualPackRecognized: Boolean(parsed.output.visualPack),
    publicPageSections: parsed.output.publicPage?.sections.length ?? 0,
    visualPackImageRoles: Object.keys(parsed.output.visualPack.imageRoles ?? {}),
    publicPageImageRoles: Object.keys(parsed.output.publicPage?.imageRoles ?? {}),
    unsupportedCapabilities: parsed.output.unsupportedCapabilities.length,
    diagnostics: parsed.diagnostics,
  }
}

function withAuditImageRoles(
  publicPage: PublicPageConfig | undefined,
  imageRoles: Record<PublicPageImageRole, string>,
): PublicPageConfig | undefined {
  if (!publicPage) return undefined
  return {
    ...publicPage,
    imageRoles,
  }
}

function createCommercialOppositePublicPageConfig(): PublicPageConfig {
  return {
    ...publicPageConfigProofFixtures.commercial,
    sections: publicPageConfigProofFixtures.commercial.sections.map((section) => {
      if (section.type === 'hero') {
        return {
          ...section,
          surface: 'white',
          primaryCta: { label: 'Demander une estimation', action: 'estimate' },
          secondaryCta: { label: 'Voir les biens', action: 'properties' },
        } satisfies PublicPageConfig['sections'][number]
      }

      if (section.type === 'reviews') return { ...section, enabled: false }

      return section
    }),
  }
}
