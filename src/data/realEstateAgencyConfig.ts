import {
  fallbackPropertyImage,
  templateImmobilierAgencyId,
  templateImmobilierConfig,
  templateImmobilierSlug,
  type RealEstateAgencyConfig,
  type RealEstateAgent,
  type RealEstateDocument,
  type RealEstateOffer,
  type RealEstatePhoto,
  type RealEstateProperty,
  type RealEstateReport,
  type RealEstateRequest,
  type RealEstateSeller,
  type RealEstateVisit,
} from './realEstateTemplate'

export type RealEstateAgencyMode = 'demo' | 'live'

export type RealEstateAgencyStatus =
  | 'draft'
  | 'demo_ready'
  | 'sent'
  | 'validated'
  | 'active'
  | 'paused'
  | 'archived'

export type RealEstateEnabledModules = {
  estimation: boolean
  sellerSpace: boolean
  agentSpace: boolean
  ownerSpace: boolean
  publicProperties: boolean
  propertyDetail: boolean
  visits: boolean
  documents: boolean
  offers: boolean
  reports: boolean
  rentalPage: boolean
  soldProperties: boolean
  teamPage: boolean
  blog: boolean
  reviews: boolean
}

export type RealEstateModuleName = keyof RealEstateEnabledModules
export type RealEstateTemplateView = 'public' | 'estimation' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'invitation'

export type RealEstateAgencyModelConfig = {
  agencyId: string
  agencySlug: string
  agencyName: string
  city: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  email: string
  phone: string
  address: string
  websiteUrl: string
  painPoint: string
  objective: string
  visualStyle: string
  variant: string
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
  createdAt: string
  updatedAt: string
}

export type RealEstateAgencyThemeConfig = {
  agencyId: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
  }
  typography: {
    heading: string
    body: string
  }
  buttons: {
    radius: string
    primaryBackground: string
    primaryColor: string
  }
  cards: {
    radius: string
    background: string
    borderColor: string
  }
  hero: {
    imageUrl: string
    title: string
    subtitle: string
  }
  assets: {
    logoUrl: string
    heroImage: string
  }
}

export type RealEstateInvitationSeed = {
  id: string
  agencyId: string
  agencySlug: string
  email: string
  role: 'seller' | 'agent' | 'owner'
  propertyId?: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  createdAt: string
  expiresAt?: string
}

export type RealEstateAgencyDataConfig = {
  agencyId: string
  properties: RealEstateProperty[]
  agents: RealEstateAgent[]
  sellers: RealEstateSeller[]
  visits: RealEstateVisit[]
  reports: RealEstateReport[]
  documents: RealEstateDocument[]
  photos: RealEstatePhoto[]
  offers: RealEstateOffer[]
  requests: RealEstateRequest[]
  invitations: RealEstateInvitationSeed[]
}

export type RealEstateAgencyRuntime = {
  agencyConfig: RealEstateAgencyConfig
  modelConfig: RealEstateAgencyModelConfig
  themeConfig: RealEstateAgencyThemeConfig
  dataConfig: RealEstateAgencyDataConfig
  routes: {
    public: string
    estimation: string
    login: string
    seller: string
    agent: string
    owner: string
    invitation: string
    property: (propertyId: string) => string
  }
}

export type DuplicateRealEstateAgencyInput = {
  agencyName: string
  city: string
  agencySlug: string
  logoUrl?: string
  colors?: Partial<Pick<RealEstateAgencyModelConfig, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor'>>
  email: string
  phone: string
  address?: string
  websiteUrl?: string
  painPoint: string
  objective: string
  visualStyle?: string
  variant: string
  enabledModules?: Partial<RealEstateEnabledModules>
  status?: RealEstateAgencyStatus
  mode?: RealEstateAgencyMode
  propertyLimit?: number
  previousStatus?: RealEstateAgencyStatus
}

export type PersistedRealEstateAgencyInput = DuplicateRealEstateAgencyInput & {
  createdAt: string
  updatedAt: string
}

export const realEstateAgenciesStorageKey = 'signatureDigitalAgencies'

const defaultEnabledModules: RealEstateEnabledModules = {
  estimation: true,
  sellerSpace: true,
  agentSpace: true,
  ownerSpace: true,
  publicProperties: true,
  propertyDetail: true,
  visits: true,
  documents: true,
  offers: true,
  reports: true,
  rentalPage: false,
  soldProperties: false,
  teamPage: false,
  blog: false,
  reviews: false,
}

export const realEstateModuleUnavailableMessage = 'Ce module n’est pas activé pour cette agence.'

export function getDefaultRealEstateEnabledModules(): RealEstateEnabledModules {
  return { ...defaultEnabledModules }
}

export function isModuleEnabled(
  agencyConfig: Pick<RealEstateAgencyConfig, 'enabledModules'> | Pick<RealEstateAgencyModelConfig, 'enabledModules'> | null | undefined,
  moduleName: RealEstateModuleName,
) {
  return agencyConfig?.enabledModules?.[moduleName] ?? defaultEnabledModules[moduleName]
}

export function getRequiredModuleForRealEstateView(view: RealEstateTemplateView): RealEstateModuleName | null {
  const routeModules: Partial<Record<RealEstateTemplateView, RealEstateModuleName>> = {
    estimation: 'estimation',
    vendeur: 'sellerSpace',
    agent: 'agentSpace',
    patron: 'ownerSpace',
    biens: 'publicProperties',
    bien: 'propertyDetail',
  }

  return routeModules[view] ?? null
}

const defaultColors = {
  primaryColor: '#19191d',
  secondaryColor: '#f7f2ea',
  accentColor: '#b08d57',
  backgroundColor: '#fbfaf7',
}

export const templateRealEstateAgencyRuntime = buildAgencyRuntime({
  agencyConfig: templateImmobilierConfig,
  modelConfig: {
    agencyId: templateImmobilierAgencyId,
    agencySlug: templateImmobilierSlug,
    agencyName: templateImmobilierConfig.agencyName,
    city: templateImmobilierConfig.city,
    logoUrl: '',
    ...defaultColors,
    email: templateImmobilierConfig.email,
    phone: templateImmobilierConfig.phone,
    address: templateImmobilierConfig.address,
    websiteUrl: '',
    painPoint: 'Rendre le suivi vendeur clair et premium.',
    objective: templateImmobilierConfig.heroSubtitle,
    visualStyle: 'Opus Domus',
    variant: 'premium-editorial',
    mode: 'demo',
    status: 'demo_ready',
    enabledModules: defaultEnabledModules,
    createdAt: '2026-07-01',
    updatedAt: '2026-07-03',
  },
})

export const agenceTestRealEstateAgencyRuntime = duplicateRealEstateTemplateForAgency({
  agencyName: 'Agence Test',
  city: 'Tarbes',
  agencySlug: 'agence-test',
  email: 'contact@agence-test.fr',
  phone: '05 62 00 00 00',
  address: '1 place de Verdun, 65000 Tarbes',
  websiteUrl: 'https://agence-test.example',
  painPoint: 'Valider la duplication agence sans copier le moteur.',
  objective: 'Une agence de demonstration isolee pour tester les routes dynamiques.',
  variant: 'premium-editorial',
  status: 'demo_ready',
  mode: 'demo',
})

const realEstateAgencyRuntimes = [
  templateRealEstateAgencyRuntime,
  agenceTestRealEstateAgencyRuntime,
] as const

export function duplicateRealEstateTemplateForAgency(input: DuplicateRealEstateAgencyInput): RealEstateAgencyRuntime {
  const agencyId = input.agencySlug
  const colors = { ...defaultColors, ...input.colors }
  const modelConfig: RealEstateAgencyModelConfig = {
    agencyId,
    agencySlug: input.agencySlug,
    agencyName: input.agencyName,
    city: input.city,
    logoUrl: input.logoUrl ?? '',
    ...colors,
    email: input.email,
    phone: input.phone,
    address: input.address ?? input.city,
    websiteUrl: input.websiteUrl ?? '',
    painPoint: input.painPoint,
    objective: input.objective,
    visualStyle: input.visualStyle ?? 'Opus Domus compatible',
    variant: input.variant,
    mode: input.mode ?? 'demo',
    status: input.status ?? 'draft',
    enabledModules: { ...defaultEnabledModules, ...input.enabledModules },
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  return buildAgencyRuntime({
    agencyConfig: createScopedAgencyConfig(templateImmobilierConfig, modelConfig, input.propertyLimit),
    modelConfig,
  })
}

export function createAgencyFromTemplate(input: DuplicateRealEstateAgencyInput) {
  return duplicateRealEstateTemplateForAgency(input)
}

export function getRealEstateAgencyRuntimeBySlug(agencySlug: string) {
  return listRealEstateAgencyRuntimes().find((runtime) => runtime.modelConfig.agencySlug === agencySlug)
}

export function getRealEstateAgencyRuntimeById(agencyId: string) {
  return listRealEstateAgencyRuntimes().find((runtime) => runtime.modelConfig.agencyId === agencyId)
}

export function listRealEstateAgencyRuntimes() {
  const persistedAgencies = readDuplicatedRealEstateAgencies()
  const persistedBySlug = new Map(persistedAgencies.map((agency) => [agency.agencySlug, agency]))
  const staticAgencyIds = new Set(realEstateAgencyRuntimes.map((runtime) => runtime.modelConfig.agencyId))
  const staticAgencies = realEstateAgencyRuntimes.map((runtime) => {
    const persisted = persistedBySlug.get(runtime.modelConfig.agencySlug)
    return persisted && runtime.modelConfig.agencySlug !== templateImmobilierSlug
      ? duplicateRealEstateTemplateForAgency(persisted)
      : runtime
  })
  const duplicatedAgencies = persistedAgencies
    .filter((agency) => !staticAgencyIds.has(agency.agencySlug))
    .map((agency) => duplicateRealEstateTemplateForAgency(agency))

  return [...staticAgencies, ...duplicatedAgencies]
}

export function getRealEstateDemoAgencies() {
  return listRealEstateAgencyRuntimes().filter((runtime) => runtime.modelConfig.mode === 'demo')
}

export function readDuplicatedRealEstateAgencies(): PersistedRealEstateAgencyInput[] {
  if (!canUseLocalStorage()) return []

  try {
    const raw = window.localStorage.getItem(realEstateAgenciesStorageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PersistedRealEstateAgencyInput[]
    return Array.isArray(parsed) ? parsed.filter((agency) => Boolean(agency.agencySlug)) : []
  } catch {
    return []
  }
}

export function saveDuplicatedRealEstateAgency(input: DuplicateRealEstateAgencyInput): RealEstateAgencyRuntime {
  const agencySlug = normalizeAgencySlug(input.agencySlug || input.agencyName)
  const now = new Date().toISOString()
  const current = readDuplicatedRealEstateAgencies()
  const existing = current.find((agency) => agency.agencySlug === agencySlug)
  const nextAgency: PersistedRealEstateAgencyInput = {
    ...input,
    agencySlug,
    status: input.status ?? existing?.status ?? 'demo_ready',
    mode: input.mode ?? existing?.mode ?? 'demo',
    enabledModules: { ...defaultEnabledModules, ...existing?.enabledModules, ...input.enabledModules },
    propertyLimit: input.propertyLimit ?? existing?.propertyLimit ?? 2,
    previousStatus: input.previousStatus ?? existing?.previousStatus,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  const next = [nextAgency, ...current.filter((agency) => agency.agencySlug !== agencySlug)]
  writeDuplicatedRealEstateAgencies(next)
  return duplicateRealEstateTemplateForAgency(nextAgency)
}

export function saveRealEstateAgencyConfig(input: DuplicateRealEstateAgencyInput): RealEstateAgencyRuntime {
  return saveDuplicatedRealEstateAgency(input)
}

export function updateRealEstateAgencyStatus(agencySlug: string, status: RealEstateAgencyStatus): RealEstateAgencyRuntime | null {
  const current = readDuplicatedRealEstateAgencies()
  const agency = current.find((item) => item.agencySlug === agencySlug) ?? createPersistedInputFromStaticRuntime(agencySlug)
  if (!agency) return null

  const updated: PersistedRealEstateAgencyInput = {
    ...agency,
    status,
    previousStatus: status === 'paused' || status === 'archived'
      ? agency.status
      : agency.previousStatus,
    updatedAt: new Date().toISOString(),
  }
  writeDuplicatedRealEstateAgencies([updated, ...current.filter((item) => item.agencySlug !== agencySlug)])
  return duplicateRealEstateTemplateForAgency(updated)
}

export function reactivateRealEstateAgency(agencySlug: string): RealEstateAgencyRuntime | null {
  const current = readDuplicatedRealEstateAgencies()
  const agency = current.find((item) => item.agencySlug === agencySlug) ?? createPersistedInputFromStaticRuntime(agencySlug)
  if (!agency) return null

  const nextStatus = agency.mode === 'live' ? 'active' : 'demo_ready'

  const updated: PersistedRealEstateAgencyInput = {
    ...agency,
    status: nextStatus,
    previousStatus: undefined,
    updatedAt: new Date().toISOString(),
  }
  writeDuplicatedRealEstateAgencies([updated, ...current.filter((item) => item.agencySlug !== agencySlug)])
  return duplicateRealEstateTemplateForAgency(updated)
}

export function isDuplicatedRealEstateAgency(agencySlug: string) {
  return readDuplicatedRealEstateAgencies().some((agency) => agency.agencySlug === agencySlug)
}

export function canManageRealEstateAgency(agencySlug: string) {
  return agencySlug !== templateImmobilierSlug
}

export function normalizeAgencySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function writeDuplicatedRealEstateAgencies(agencies: PersistedRealEstateAgencyInput[]) {
  if (!canUseLocalStorage()) return
  window.localStorage.setItem(realEstateAgenciesStorageKey, JSON.stringify(agencies))
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function createPersistedInputFromStaticRuntime(agencySlug: string): PersistedRealEstateAgencyInput | null {
  const runtime = realEstateAgencyRuntimes.find((item) => item.modelConfig.agencySlug === agencySlug)
  if (!runtime || runtime.modelConfig.agencySlug === templateImmobilierSlug) return null
  const now = new Date().toISOString()

  return {
    agencyName: runtime.modelConfig.agencyName,
    city: runtime.modelConfig.city,
    agencySlug: runtime.modelConfig.agencySlug,
    logoUrl: runtime.modelConfig.logoUrl,
    colors: {
      primaryColor: runtime.modelConfig.primaryColor,
      secondaryColor: runtime.modelConfig.secondaryColor,
      accentColor: runtime.modelConfig.accentColor,
      backgroundColor: runtime.modelConfig.backgroundColor,
    },
    email: runtime.modelConfig.email,
    phone: runtime.modelConfig.phone,
    address: runtime.modelConfig.address,
    websiteUrl: runtime.modelConfig.websiteUrl,
    painPoint: runtime.modelConfig.painPoint,
    objective: runtime.modelConfig.objective,
    visualStyle: runtime.modelConfig.visualStyle,
    variant: runtime.modelConfig.variant,
    enabledModules: runtime.modelConfig.enabledModules,
    status: runtime.modelConfig.status,
    mode: runtime.modelConfig.mode,
    propertyLimit: runtime.agencyConfig.properties.length,
    createdAt: runtime.modelConfig.createdAt || now,
    updatedAt: now,
  }
}

function buildAgencyRuntime({
  agencyConfig,
  modelConfig,
}: {
  agencyConfig: RealEstateAgencyConfig
  modelConfig: RealEstateAgencyModelConfig
}): RealEstateAgencyRuntime {
  const routeBase = `/demo/${modelConfig.agencySlug}`
  const configuredAgency: RealEstateAgencyConfig = {
    ...agencyConfig,
    enabledModules: modelConfig.enabledModules,
  }
  const dataConfig: RealEstateAgencyDataConfig = {
    agencyId: modelConfig.agencyId,
    properties: configuredAgency.properties,
    agents: configuredAgency.agents,
    sellers: configuredAgency.sellers,
    visits: configuredAgency.visits,
    reports: configuredAgency.reports,
    documents: configuredAgency.documents,
    photos: configuredAgency.photos,
    offers: configuredAgency.offers,
    requests: configuredAgency.requests,
    invitations: [],
  }

  return {
    agencyConfig: configuredAgency,
    modelConfig,
    themeConfig: {
      agencyId: modelConfig.agencyId,
      colors: {
        primary: modelConfig.primaryColor,
        secondary: modelConfig.secondaryColor,
        accent: modelConfig.accentColor,
        background: modelConfig.backgroundColor,
        foreground: '#19191d',
        muted: '#747179',
      },
      typography: {
        heading: 'Editorial serif',
        body: 'Inter, system-ui, sans-serif',
      },
      buttons: {
        radius: '999px',
        primaryBackground: modelConfig.primaryColor,
        primaryColor: '#ffffff',
      },
      cards: {
        radius: '24px',
        background: '#ffffff',
        borderColor: 'rgba(25, 25, 29, 0.08)',
      },
      hero: {
        imageUrl: configuredAgency.heroImage,
        title: configuredAgency.heroTitle,
        subtitle: configuredAgency.heroSubtitle,
      },
      assets: {
        logoUrl: modelConfig.logoUrl,
        heroImage: configuredAgency.heroImage,
      },
    },
    dataConfig,
    routes: {
      public: routeBase,
      estimation: `${routeBase}/estimation`,
      login: `${routeBase}/connexion`,
      seller: `${routeBase}/vendeur`,
      agent: `${routeBase}/agent`,
      owner: `${routeBase}/patron`,
      invitation: `${routeBase}/invitation`,
      property: (propertyId: string) => `${routeBase}/bien/${propertyId}`,
    },
  }
}

function createScopedAgencyConfig(source: RealEstateAgencyConfig, model: RealEstateAgencyModelConfig, propertyLimit?: number): RealEstateAgencyConfig {
  const selectedProperties = source.properties.slice(0, propertyLimit ?? source.properties.length)
  const propertyIds = new Set(selectedProperties.map((property) => property.id))
  const properties = selectedProperties.map((property, index) => scopeProperty(property, model, index))

  return {
    ...source,
    agencyId: model.agencyId,
    agencySlug: model.agencySlug,
    agencyName: model.agencyName,
    city: model.city,
    phone: model.phone,
    email: model.email,
    address: model.address,
    heroImage: source.heroImage || fallbackPropertyImage,
    heroTitle: `${model.agencyName}, une experience immobiliere claire.`,
    heroSubtitle: model.objective,
    properties,
    agents: source.agents.map((agent) => scopeAgent(agent, model.agencyId, propertyIds)),
    sellers: source.sellers.filter((seller) => propertyIds.has(seller.propertyId)).map((seller) => scopeSeller(seller, model.agencyId)),
    visits: source.visits.filter((visit) => propertyIds.has(visit.propertyId)).map((visit) => scopeVisit(visit, model.agencyId)),
    documents: source.documents.filter((document) => propertyIds.has(document.propertyId)).map((document) => scopeDocument(document, model.agencyId)),
    photos: source.photos.filter((photo) => propertyIds.has(photo.propertyId)).map((photo) => scopePhoto(photo, model.agencyId)),
    reports: source.reports.filter((report) => propertyIds.has(report.propertyId)).map((report) => scopeReport(report, model.agencyId)),
    offers: source.offers.filter((offer) => propertyIds.has(offer.propertyId)).map((offer) => scopeOffer(offer, model.agencyId)),
    requests: source.requests.filter((request) => propertyIds.has(request.propertyId)).map((request) => scopeRequest(request, model.agencyId)),
  }
}

function scopeProperty(property: RealEstateProperty, model: RealEstateAgencyModelConfig, index: number): RealEstateProperty {
  const testAddresses = ['Rue Brauhauban, 65000', 'Place Marcadieu, 65000', 'Quartier Arsenal, 65000']

  return {
    ...property,
    agencyId: model.agencyId,
    address: testAddresses[index] ?? property.address,
    city: model.city,
  }
}

function scopeAgent(agent: RealEstateAgent, agencyId: string, propertyIds: Set<string>): RealEstateAgent {
  const assignedPropertyIds = agent.assignedPropertyIds.filter((propertyId) => propertyIds.has(propertyId))
  return { ...agent, agencyId, activeListings: assignedPropertyIds.length, assignedPropertyIds }
}

function scopeSeller(seller: RealEstateSeller, agencyId: string): RealEstateSeller {
  return { ...seller, agencyId }
}

function scopeVisit(visit: RealEstateVisit, agencyId: string): RealEstateVisit {
  return { ...visit, agencyId }
}

function scopeDocument(document: RealEstateDocument, agencyId: string): RealEstateDocument {
  return { ...document, agencyId }
}

function scopePhoto(photo: RealEstatePhoto, agencyId: string): RealEstatePhoto {
  return { ...photo, agencyId }
}

function scopeReport(report: RealEstateReport, agencyId: string): RealEstateReport {
  return { ...report, agencyId }
}

function scopeOffer(offer: RealEstateOffer, agencyId: string): RealEstateOffer {
  return { ...offer, agencyId }
}

function scopeRequest(request: RealEstateRequest, agencyId: string): RealEstateRequest {
  return { ...request, agencyId }
}
