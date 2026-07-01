import {
  fallbackPropertyImage,
  realEstateTemplateKey,
  type RealEstateAgencyConfig,
  type RealEstateDocument,
  type RealEstateOffer,
  type RealEstatePhoto,
  type RealEstateReport,
  type RealEstateRequest,
  type RealEstateVisit,
} from '../data/realEstateTemplate'

export type RealEstateAgencyVariant = 'premium-editorial' | 'local-trust' | 'conversion-focused'

export type RealEstateAgencyColors = {
  background: string
  foreground: string
  muted: string
  accent: string
}

export type DuplicateRealEstateTemplateInput = {
  agencyName: string
  agencySlug: string
  city: string
  logoUrl?: string
  colors: RealEstateAgencyColors
  phone: string
  email: string
  painPoint: string
  objective: string
  variant: RealEstateAgencyVariant
}

export type RealEstateThemeConfig = {
  agencyId: string
  agencySlug: string
  logoUrl?: string
  colors: RealEstateAgencyColors
  variant: RealEstateAgencyVariant
}

export type RealEstateContentConfig = {
  agencyId: string
  agencySlug: string
  heroTitle: string
  heroSubtitle: string
  painPoint: string
  objective: string
  sectionOrder: string[]
}

export type RealEstateDataConfig = Pick<
  RealEstateAgencyConfig,
  'agencyId' | 'agencySlug' | 'properties' | 'agents' | 'sellers' | 'visits' | 'documents' | 'photos' | 'reports' | 'offers' | 'requests'
>

export type DuplicateRealEstateTemplateOutput = {
  agencyConfig: RealEstateAgencyConfig
  themeConfig: RealEstateThemeConfig
  contentConfig: RealEstateContentConfig
  dataConfig: RealEstateDataConfig
  routes: {
    public: string
    estimation: string
    login: string
    seller: string
    agent: string
    owner: string
  }
}

export const realEstateEngineRules = [
  'Le moteur immobilier commun ne se duplique pas.',
  'Une agence est une instance configuree du moteur.',
  'Les skins Lovable sont des habillages compatibles, pas des applications paralleles.',
  'Les donnees agence sont isolees par agencyId.',
  'Les variations passent par themeConfig, contentConfig, sectionOrder, feature flags ou variant.',
] as const

export const nextRealEstateEngineStep = {
  branch: 'codex/add-agent-patron-content-actions-v1',
  objective:
    'Agent ajoute photo/document/visite/compte rendu, patron ajoute/desactive agent, vendeur voit les mises a jour.',
} as const

export function duplicateRealEstateTemplateForAgency(
  input: DuplicateRealEstateTemplateInput,
): DuplicateRealEstateTemplateOutput {
  const agencyId = input.agencySlug
  const routeBase = `/demo/${input.agencySlug}`

  const agencyConfig: RealEstateAgencyConfig = {
    template: realEstateTemplateKey,
    agencyId,
    agencySlug: input.agencySlug,
    agencyName: input.agencyName,
    baseVisual: `Real estate engine skin:${input.variant}`,
    city: input.city,
    phone: input.phone,
    email: input.email,
    address: input.city,
    heroImage: input.logoUrl || fallbackPropertyImage,
    heroTitle: `${input.agencyName}, une experience immobiliere claire.`,
    heroSubtitle: input.objective,
    properties: [],
    agents: [],
    sellers: [],
    visits: [],
    documents: [],
    photos: [],
    reports: [],
    offers: [],
    requests: [],
  }

  const themeConfig: RealEstateThemeConfig = {
    agencyId,
    agencySlug: input.agencySlug,
    logoUrl: input.logoUrl,
    colors: input.colors,
    variant: input.variant,
  }

  const contentConfig: RealEstateContentConfig = {
    agencyId,
    agencySlug: input.agencySlug,
    heroTitle: agencyConfig.heroTitle,
    heroSubtitle: agencyConfig.heroSubtitle,
    painPoint: input.painPoint,
    objective: input.objective,
    sectionOrder: ['hero', 'properties', 'method', 'seller-space', 'final-cta'],
  }

  return {
    agencyConfig,
    themeConfig,
    contentConfig,
    dataConfig: {
      agencyId,
      agencySlug: input.agencySlug,
      properties: [],
      agents: [],
      sellers: [],
      visits: [],
      documents: [],
      photos: [],
      reports: [],
      offers: [],
      requests: [],
    },
    routes: {
      public: routeBase,
      estimation: `${routeBase}/estimation`,
      login: `${routeBase}/connexion`,
      seller: `${routeBase}/vendeur`,
      agent: `${routeBase}/agent`,
      owner: `${routeBase}/patron`,
    },
  }
}

export function isAgencyScopedEntity(entity: { agencyId: string }, agencyId: string) {
  return entity.agencyId === agencyId
}

export function assertAgencyScopedCollection<T extends { agencyId: string }>(items: T[], agencyId: string) {
  return items.every((item) => isAgencyScopedEntity(item, agencyId))
}

export function assertAgencyDataIsolation(config: RealEstateAgencyConfig) {
  const collections: Array<Array<{ agencyId: string }>> = [
    config.properties,
    config.agents,
    config.sellers,
    config.visits as RealEstateVisit[],
    config.documents as RealEstateDocument[],
    config.photos as RealEstatePhoto[],
    config.reports as RealEstateReport[],
    config.offers as RealEstateOffer[],
    config.requests as RealEstateRequest[],
  ]

  return collections.every((items) => assertAgencyScopedCollection(items, config.agencyId))
}

export * from './data/realEstateRepository'
