export type PublicPageSectionType =
  | 'hero'
  | 'properties'
  | 'method'
  | 'sellerSpace'
  | 'reviews'
  | 'estimate'
  | 'contact'
  | 'agencyStory'

export type PublicPageImageRole =
  | 'hero'
  | 'agency'
  | 'method'
  | 'sellerSpace'
  | 'proof'
  | 'contact'
  | 'advisorPortrait'
  | 'localArea'

export type PublicPageCtaAction = 'estimate' | 'properties' | 'contact' | 'sellerSpace' | 'privateSpace' | 'none'
export type PublicPageSource = 'lovable' | 'legacy-fallback'
export type PublicPageSurface = 'default' | 'white' | 'ivory' | 'ink' | 'muted' | 'brand'

export type PublicPageCta = {
  label: string
  action: PublicPageCtaAction
}

export type PublicPageSectionConfig = {
  id: string
  type: PublicPageSectionType
  enabled: boolean
  variant?: string
  eyebrow?: string
  title?: string
  description?: string
  surface?: PublicPageSurface
  imageRole?: PublicPageImageRole
  primaryCta?: PublicPageCta
  secondaryCta?: PublicPageCta
  emphasis?: string
  desktopOrder?: number
  mobileOrder?: number
}

export type PublicPageConfig = {
  source: PublicPageSource
  sections: PublicPageSectionConfig[]
  imageRoles?: Partial<Record<PublicPageImageRole, string>>
}

export type LegacyPublicPageInput = {
  canShowProperties: boolean
  canShowSellerSpace: boolean
  canEstimate: boolean
  canShowReviews: boolean
}

const supportedSectionTypes: PublicPageSectionType[] = [
  'hero',
  'properties',
  'method',
  'sellerSpace',
  'reviews',
  'estimate',
  'contact',
  'agencyStory',
]

const supportedImageRoles: PublicPageImageRole[] = [
  'hero',
  'agency',
  'method',
  'sellerSpace',
  'proof',
  'contact',
  'advisorPortrait',
  'localArea',
]

const supportedCtaActions: PublicPageCtaAction[] = ['estimate', 'properties', 'contact', 'sellerSpace', 'privateSpace', 'none']
const supportedSurfaces: PublicPageSurface[] = ['default', 'white', 'ivory', 'ink', 'muted', 'brand']
const sectionVariantFallbacks: Record<PublicPageSectionType, string> = {
  hero: 'legacy',
  properties: 'legacy-grid',
  method: 'steps',
  sellerSpace: 'legacy-dashboard',
  reviews: 'legacy-proof',
  estimate: 'cta-estimate',
  contact: 'legacy-contact',
  agencyStory: 'image-text',
}
const sectionVariants: Record<PublicPageSectionType, string[]> = {
  hero: ['legacy', 'editorial-split', 'compact'],
  properties: ['legacy-grid', 'featured-first', 'dense-grid'],
  sellerSpace: ['legacy-dashboard', 'dashboard-proof', 'promise'],
  method: ['image-text', 'editorial', 'steps'],
  agencyStory: ['image-text', 'editorial', 'steps'],
  reviews: ['legacy-proof', 'stats', 'editorial'],
  contact: ['legacy-contact', 'portrait-form', 'compact'],
  estimate: ['quick-estimate', 'cta-estimate'],
}

export function createLegacyPublicPageConfig(input: LegacyPublicPageInput): PublicPageConfig {
  return {
    source: 'legacy-fallback',
    sections: [
      {
        id: 'hero-main',
        type: 'hero',
        enabled: true,
        variant: 'legacy',
        imageRole: 'hero',
        desktopOrder: 0,
        mobileOrder: 0,
      },
      {
        id: 'properties-main',
        type: 'properties',
        enabled: input.canShowProperties,
        variant: 'legacy-grid',
        eyebrow: 'Collection',
        title: 'Nos exclusivites',
        imageRole: 'agency',
        primaryCta: { label: 'Tout voir', action: 'properties' },
        desktopOrder: 10,
        mobileOrder: 10,
      },
      {
        id: 'method-main',
        type: 'method',
        enabled: true,
        variant: 'legacy-steps',
        eyebrow: 'Methode',
        title: 'Une approche artisanale de la vente immobiliere.',
        imageRole: 'method',
        desktopOrder: 20,
        mobileOrder: 20,
      },
      {
        id: 'seller-space-main',
        type: 'sellerSpace',
        enabled: input.canShowSellerSpace,
        variant: 'legacy-dashboard',
        eyebrow: 'Espace vendeur',
        title: 'Vous savez tout, en temps reel.',
        description: 'Visites, retours, offres, documents : votre espace vendeur vous donne une vision claire de la vente.',
        imageRole: 'sellerSpace',
        primaryCta: { label: 'Voir une demonstration', action: 'sellerSpace' },
        desktopOrder: 30,
        mobileOrder: 30,
      },
      {
        id: 'proof-main',
        type: 'reviews',
        enabled: input.canShowReviews,
        variant: 'legacy-proof',
        imageRole: 'proof',
        desktopOrder: 40,
        mobileOrder: 40,
      },
      {
        id: 'contact-main',
        type: 'contact',
        enabled: true,
        variant: input.canEstimate ? 'legacy-estimate' : 'legacy-contact',
        title: 'Parlons de votre projet.',
        description: input.canEstimate ? 'Une estimation indicative en 3 minutes. Sans engagement.' : undefined,
        imageRole: 'contact',
        primaryCta: { label: input.canEstimate ? 'Estimer mon bien' : 'Contacter l agence', action: input.canEstimate ? 'estimate' : 'contact' },
        desktopOrder: 50,
        mobileOrder: 50,
      },
    ],
  }
}

export function normalizePublicPageConfig(value: unknown, source: PublicPageSource = 'lovable'): PublicPageConfig | null {
  if (!isRecord(value)) return null
  const rawSections = Array.isArray(value.sections) ? value.sections : []
  const sections = rawSections
    .map(normalizePublicPageSection)
    .filter((section): section is PublicPageSectionConfig => Boolean(section))

  if (!sections.length) return null

  return {
    source,
    sections,
    imageRoles: normalizeImageRoles(value.imageRoles),
  }
}

export function normalizePublicPageSection(value: unknown): PublicPageSectionConfig | null {
  if (!isRecord(value)) return null
  const type = normalizeEnum(value.type, supportedSectionTypes)
  if (!type) return null
  const id = cleanText(value.id) || `${type}-${cleanText(value.variant) || 'section'}`

  return {
    id,
    type,
    enabled: value.enabled === undefined ? true : value.enabled === true || String(value.enabled).toLowerCase() === 'true',
    variant: normalizeSectionVariant(type, value.variant),
    eyebrow: cleanText(value.eyebrow),
    title: cleanText(value.title),
    description: cleanText(value.description),
    surface: normalizeSurface(value.surface),
    imageRole: normalizeEnum(value.imageRole, supportedImageRoles),
    primaryCta: normalizeCta(value.primaryCta),
    secondaryCta: normalizeCta(value.secondaryCta),
    emphasis: cleanText(value.emphasis),
    desktopOrder: normalizeOrder(value.desktopOrder),
    mobileOrder: normalizeOrder(value.mobileOrder),
  }
}

export function sortPublicPageSections(config: PublicPageConfig, mode: 'desktop' | 'mobile' = 'desktop') {
  const key = mode === 'mobile' ? 'mobileOrder' : 'desktopOrder'
  return [...config.sections].sort((left, right) => {
    const leftOrder = left[key] ?? left.desktopOrder ?? 0
    const rightOrder = right[key] ?? right.desktopOrder ?? 0
    return leftOrder - rightOrder
  })
}

export function buildPublicPageImageRoles(input: {
  heroImage?: string
  sectionImages?: string[]
  configuredRoles?: Partial<Record<PublicPageImageRole, string>>
  source?: PublicPageSource
}) {
  const sectionImages = input.sectionImages ?? []
  const legacyRoles: Partial<Record<PublicPageImageRole, string>> = input.source === 'lovable' ? {
    hero: input.heroImage,
  } : {
    hero: input.heroImage,
    method: sectionImages[0],
    sellerSpace: sectionImages[1],
    agency: sectionImages[2] ?? sectionImages[0],
    proof: sectionImages[3] ?? sectionImages[1],
    contact: sectionImages[4] ?? sectionImages[0],
    advisorPortrait: sectionImages[4] ?? sectionImages[0],
    localArea: sectionImages[5] ?? sectionImages[1],
  }

  return { ...legacyRoles, ...input.configuredRoles }
}

export function getPublicPageImage(
  section: PublicPageSectionConfig,
  imageRoles: Partial<Record<PublicPageImageRole, string>>,
) {
  return section.imageRole ? imageRoles[section.imageRole] : undefined
}

export const publicPageConfigProofFixtures = {
  editorial: {
    source: 'lovable',
    sections: [
      { id: 'hero-main', type: 'hero', enabled: true, variant: 'editorial-split', title: 'Une adresse locale, une exigence particuliere.', imageRole: 'hero', desktopOrder: 0, mobileOrder: 0 },
      { id: 'agency-story', type: 'agencyStory', enabled: true, variant: 'image-text', title: 'Une agence locale, une exigence particuliere.', imageRole: 'advisorPortrait', desktopOrder: 10, mobileOrder: 20 },
      { id: 'properties-main', type: 'properties', enabled: true, variant: 'featured-first', title: 'Nos biens', imageRole: 'agency', desktopOrder: 20, mobileOrder: 10 },
      { id: 'seller-promise', type: 'sellerSpace', enabled: false, variant: 'promise', desktopOrder: 30, mobileOrder: 30 },
      { id: 'contact-main', type: 'contact', enabled: true, variant: 'portrait-form', title: 'Parlons de votre projet', imageRole: 'advisorPortrait', desktopOrder: 40, mobileOrder: 40 },
    ],
  } satisfies PublicPageConfig,
  commercial: {
    source: 'lovable',
    sections: [
      { id: 'hero-main', type: 'hero', enabled: true, variant: 'compact', title: 'Vendre plus vite, avec une agence equipee.', imageRole: 'hero', desktopOrder: 0, mobileOrder: 0 },
      { id: 'estimate-main', type: 'estimate', enabled: true, variant: 'quick-estimate', title: 'Demandez une estimation', desktopOrder: 10, mobileOrder: 10 },
      { id: 'properties-main', type: 'properties', enabled: true, variant: 'dense-grid', title: 'Biens disponibles', desktopOrder: 20, mobileOrder: 20 },
      { id: 'seller-proof', type: 'sellerSpace', enabled: true, variant: 'dashboard-proof', title: 'Un suivi vendeur structure', imageRole: 'sellerSpace', desktopOrder: 30, mobileOrder: 30 },
      { id: 'reviews-main', type: 'reviews', enabled: true, variant: 'stats', desktopOrder: 40, mobileOrder: 40 },
      { id: 'contact-main', type: 'contact', enabled: true, variant: 'compact', title: 'Contactez l equipe', desktopOrder: 50, mobileOrder: 50 },
    ],
  } satisfies PublicPageConfig,
}

function normalizeCta(value: unknown): PublicPageCta | undefined {
  if (!isRecord(value)) return undefined
  const label = cleanText(value.label)
  const action = normalizeEnum(value.action, supportedCtaActions)
  if (!label || !action) return undefined
  return { label, action }
}

function normalizeSectionVariant(type: PublicPageSectionType, value: unknown) {
  const normalized = toClassValue(cleanText(value))
  return sectionVariants[type].includes(normalized) ? normalized : sectionVariantFallbacks[type]
}

function normalizeSurface(value: unknown) {
  const normalized = toClassValue(cleanText(value))
  if (normalized === 'cream' || normalized === 'bone') return 'ivory'
  if (normalized === 'dark' || normalized === 'black') return 'ink'
  if (normalized === 'accent' || normalized === 'primary') return 'brand'
  if (supportedSurfaces.includes(normalized as PublicPageSurface)) return normalized as PublicPageSurface
  return undefined
}

function normalizeImageRoles(value: unknown) {
  if (!isRecord(value)) return undefined
  const roles: Partial<Record<PublicPageImageRole, string>> = {}
  supportedImageRoles.forEach((role) => {
    const image = cleanText(value[role])
    if (image) roles[role] = image
  })
  return Object.keys(roles).length ? roles : undefined
}

function normalizeOrder(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]) {
  const text = cleanText(value)
  return allowed.find((item) => item === text)
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toClassValue(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
