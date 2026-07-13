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
import {
  createDefaultAgencyDomainConfig,
  resolveAgencyByHostname,
  type AgencyDomainConfig,
} from '../lib/agencyDomainSystem'
import {
  buildAgencyContactLegalIdentity,
  type AgencyContactAndLegalIdentity,
} from '../lib/agencyContactLegalIdentity'

export type RealEstateAgencyMode = 'demo' | 'live'
export type RealEstateAgencyKind = 'client' | 'pilot' | 'internal-test'

export type RealEstateAgencyStatus =
  | 'draft'
  | 'demo_ready'
  | 'sent'
  | 'validated'
  | 'active'
  | 'paused'
  | 'archived'

export type RealEstateAgencyAccessMode = 'demo' | 'active' | 'paused' | 'archived'

export type RealEstateAgencyAccess = {
  mode: RealEstateAgencyAccessMode
  canPreview: boolean
  canWrite: boolean
  showActivationCta: boolean
  activationHref: string
}

export type RealEstateThemePreset = 'luxury_dark' | 'premium_light' | 'local_trust' | 'modern_minimal'
export type RealEstateHeroVariant = 'premium' | 'trust' | 'estimation' | 'local'

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
  agencyKind: RealEstateAgencyKind
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
  contactLegalIdentity: AgencyContactAndLegalIdentity
  painPoint: string
  objective: string
  visualStyle: string
  variant: string
  themePreset: RealEstateThemePreset
  heroVariant: RealEstateHeroVariant
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel: string
  sectionOrder: string
  visualBlueprint?: string
  domainConfig?: AgencyDomainConfig
  importedProperties?: RealEstateProperty[]
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
  configVersion: number
  lastUpdatedBy: string
  updateHistory: RealEstateAgencyUpdateHistoryItem[]
  previousConfigSnapshot?: RealEstateAgencyConfigSnapshot
  createdAt: string
  updatedAt: string
}

export type RealEstateAgencyConfigSnapshot = {
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
  contactLegalIdentity?: AgencyContactAndLegalIdentity
  painPoint: string
  objective: string
  visualStyle: string
  variant: string
  themePreset: RealEstateThemePreset
  heroVariant: RealEstateHeroVariant
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel: string
  sectionOrder: string
  visualBlueprint?: string
  enabledModules: RealEstateEnabledModules
  configVersion: number
  capturedAt: string
}

export type RealEstateAgencyUpdateHistoryItem = {
  id: string
  source: string
  changedFields: string[]
  createdAt: string
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
  agencyKind?: RealEstateAgencyKind
  logoUrl?: string
  colors?: Partial<Pick<RealEstateAgencyModelConfig, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor'>>
  email: string
  phone: string
  address?: string
  websiteUrl?: string
  contactLegalIdentity?: Partial<AgencyContactAndLegalIdentity>
  painPoint: string
  objective: string
  visualStyle?: string
  variant: string
  themePreset?: RealEstateThemePreset
  heroVariant?: RealEstateHeroVariant
  heroTitle?: string
  heroSubtitle?: string
  primaryCtaLabel?: string
  sectionOrder?: string
  visualBlueprint?: string
  domainConfig?: AgencyDomainConfig
  importedProperties?: RealEstateProperty[]
  enabledModules?: Partial<RealEstateEnabledModules>
  status?: RealEstateAgencyStatus
  mode?: RealEstateAgencyMode
  propertyLimit?: number
  previousStatus?: RealEstateAgencyStatus
  configVersion?: number
  lastUpdatedBy?: string
  updateHistory?: RealEstateAgencyUpdateHistoryItem[]
  previousConfigSnapshot?: RealEstateAgencyConfigSnapshot
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

export function resolveAgencyAccessMode(
  agency: Pick<RealEstateAgencyModelConfig, 'agencySlug' | 'mode' | 'status'> | Pick<RealEstateAgencyConfig, 'agencySlug' | 'mode' | 'status'>,
  activationHref?: string,
): RealEstateAgencyAccess {
  const status = agency.status
  const mode = status === 'paused'
    ? 'paused'
    : status === 'archived'
      ? 'archived'
      : status === 'active' || agency.mode === 'live'
        ? 'active'
        : 'demo'

  return {
    mode,
    canPreview: mode === 'demo' || mode === 'active',
    canWrite: mode === 'active',
    showActivationCta: mode === 'demo',
    activationHref: activationHref || `/activation/${agency.agencySlug}`,
  }
}

const defaultColors = {
  primaryColor: '#19191d',
  secondaryColor: '#f7f2ea',
  accentColor: '#b08d57',
  backgroundColor: '#fbfaf7',
}

const defaultVisualDirection = {
  themePreset: 'premium_light' as RealEstateThemePreset,
  heroVariant: 'premium' as RealEstateHeroVariant,
  heroTitle: 'Votre bien merite une signature.',
  heroSubtitle: 'Une experience immobiliere claire, elegante et suivie a chaque etape.',
  primaryCtaLabel: 'Estimer mon bien',
  sectionOrder: 'hero, biens, methode, espace-vendeur, preuves, contact',
  visualBlueprint: '',
}

export const templateRealEstateAgencyRuntime = buildAgencyRuntime({
  agencyConfig: templateImmobilierConfig,
  modelConfig: {
    agencyId: templateImmobilierAgencyId,
    agencySlug: templateImmobilierSlug,
    agencyKind: 'internal-test',
    agencyName: templateImmobilierConfig.agencyName,
    city: templateImmobilierConfig.city,
    logoUrl: '',
    ...defaultColors,
    email: templateImmobilierConfig.email,
    phone: templateImmobilierConfig.phone,
    address: templateImmobilierConfig.address,
    websiteUrl: '',
    contactLegalIdentity: buildAgencyContactLegalIdentity(templateImmobilierConfig),
    painPoint: 'Rendre le suivi vendeur clair et premium.',
    objective: templateImmobilierConfig.heroSubtitle,
    visualStyle: 'Template immobilier',
    variant: 'premium-editorial',
    ...defaultVisualDirection,
    domainConfig: createDefaultAgencyDomainConfig(templateImmobilierAgencyId, templateImmobilierSlug),
    mode: 'demo',
    status: 'demo_ready',
    enabledModules: defaultEnabledModules,
    configVersion: 1,
    lastUpdatedBy: 'system',
    updateHistory: [],
    createdAt: '2026-07-01',
    updatedAt: '2026-07-03',
  },
})

export const agenceTestRealEstateAgencyRuntime = duplicateRealEstateTemplateForAgency({
  agencyName: 'Agence Test',
  city: 'Tarbes',
  agencySlug: 'agence-test',
  agencyKind: 'internal-test',
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
  const visualDirection = {
    ...defaultVisualDirection,
    themePreset: input.themePreset ?? defaultVisualDirection.themePreset,
    heroVariant: input.heroVariant ?? defaultVisualDirection.heroVariant,
    heroTitle: input.heroTitle ?? `${input.agencyName}, une experience immobiliere claire.`,
    heroSubtitle: input.heroSubtitle ?? input.objective,
    primaryCtaLabel: input.primaryCtaLabel ?? defaultVisualDirection.primaryCtaLabel,
    sectionOrder: input.sectionOrder ?? defaultVisualDirection.sectionOrder,
    visualBlueprint: input.visualBlueprint ?? defaultVisualDirection.visualBlueprint,
  }
  const modelConfig: RealEstateAgencyModelConfig = {
    agencyId,
    agencySlug: input.agencySlug,
    agencyKind: normalizeAgencyKind(input.agencyKind),
    agencyName: input.agencyName,
    city: input.city,
    logoUrl: input.logoUrl ?? '',
    ...colors,
    email: input.email,
    phone: input.phone,
    address: input.address ?? input.city,
    websiteUrl: input.websiteUrl ?? '',
    contactLegalIdentity: buildAgencyContactLegalIdentity({
      agencyName: input.agencyName,
      city: input.city,
      email: input.email,
      phone: input.phone,
      address: input.address ?? input.city,
      contactLegalIdentity: input.contactLegalIdentity,
    }),
    painPoint: input.painPoint,
    objective: input.objective,
    visualStyle: input.visualStyle ?? 'Template immobilier compatible',
    variant: input.variant,
    ...visualDirection,
    domainConfig: createDefaultAgencyDomainConfig(agencyId, input.agencySlug, input.domainConfig),
    importedProperties: input.importedProperties,
    mode: input.mode ?? 'demo',
    status: input.status ?? 'draft',
    enabledModules: { ...defaultEnabledModules, ...input.enabledModules },
    configVersion: input.configVersion ?? 1,
    lastUpdatedBy: input.lastUpdatedBy ?? 'system',
    updateHistory: input.updateHistory ?? [],
    previousConfigSnapshot: input.previousConfigSnapshot,
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

export function getRealEstateAgencyRuntimeByHostname(hostname: string) {
  const agency = resolveAgencyByHostname(hostname, listRealEstateAgencyRuntimes().map((runtime) => runtime.modelConfig))
  return agency ? getRealEstateAgencyRuntimeBySlug(agency.agencySlug) : undefined
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
  const importedProperties = input.importedProperties ?? existing?.importedProperties
  const changedFields = existing ? getChangedConfigFields(existing, input) : ['created']
  const configVersion = existing ? (existing.configVersion ?? 1) + (changedFields.length ? 1 : 0) : input.configVersion ?? 1
  const nextAgency: PersistedRealEstateAgencyInput = {
    ...input,
    agencySlug,
    agencyKind: normalizeAgencyKind(input.agencyKind ?? existing?.agencyKind),
    domainConfig: createDefaultAgencyDomainConfig(agencySlug, agencySlug, input.domainConfig ?? existing?.domainConfig),
    contactLegalIdentity: input.contactLegalIdentity ?? existing?.contactLegalIdentity,
    importedProperties,
    status: input.status ?? existing?.status ?? 'demo_ready',
    mode: input.mode ?? existing?.mode ?? 'demo',
    enabledModules: { ...defaultEnabledModules, ...existing?.enabledModules, ...input.enabledModules },
    propertyLimit: input.importedProperties
      ? input.propertyLimit ?? input.importedProperties.length
      : existing?.propertyLimit ?? input.propertyLimit ?? importedProperties?.length ?? 2,
    previousStatus: input.previousStatus ?? existing?.previousStatus,
    configVersion,
    lastUpdatedBy: input.lastUpdatedBy ?? 'admin',
    updateHistory: [
      ...(changedFields.length ? [{
        id: `agency-update-${Date.now()}`,
        source: input.lastUpdatedBy ?? 'admin',
        changedFields,
        createdAt: now,
      }] : []),
      ...(existing?.updateHistory ?? []),
    ].slice(0, 5),
    previousConfigSnapshot: existing ? createConfigSnapshot(existing, now) : input.previousConfigSnapshot,
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

export function restorePreviousRealEstateAgencyConfig(agencySlug: string): RealEstateAgencyRuntime | null {
  const current = readDuplicatedRealEstateAgencies()
  const agency = current.find((item) => item.agencySlug === agencySlug)
  const snapshot = agency?.previousConfigSnapshot
  if (!agency || !snapshot) return null
  const now = new Date().toISOString()
  const restored: PersistedRealEstateAgencyInput = {
    ...agency,
    agencyName: snapshot.agencyName,
    city: snapshot.city,
    logoUrl: snapshot.logoUrl,
    colors: {
      primaryColor: snapshot.primaryColor,
      secondaryColor: snapshot.secondaryColor,
      accentColor: snapshot.accentColor,
      backgroundColor: snapshot.backgroundColor,
    },
    email: snapshot.email,
    phone: snapshot.phone,
    address: snapshot.address,
    websiteUrl: snapshot.websiteUrl,
    contactLegalIdentity: snapshot.contactLegalIdentity,
    painPoint: snapshot.painPoint,
    objective: snapshot.objective,
    visualStyle: snapshot.visualStyle,
    variant: snapshot.variant,
    themePreset: snapshot.themePreset,
    heroVariant: snapshot.heroVariant,
    heroTitle: snapshot.heroTitle,
    heroSubtitle: snapshot.heroSubtitle,
    primaryCtaLabel: snapshot.primaryCtaLabel,
    sectionOrder: snapshot.sectionOrder,
    visualBlueprint: snapshot.visualBlueprint,
    enabledModules: snapshot.enabledModules,
    configVersion: (agency.configVersion ?? snapshot.configVersion ?? 1) + 1,
    lastUpdatedBy: 'restore',
    updateHistory: [{
      id: `agency-restore-${Date.now()}`,
      source: 'restore',
      changedFields: ['previousConfigSnapshot'],
      createdAt: now,
    }, ...(agency.updateHistory ?? [])].slice(0, 5),
    previousConfigSnapshot: undefined,
    updatedAt: now,
  }
  writeDuplicatedRealEstateAgencies([restored, ...current.filter((item) => item.agencySlug !== agencySlug)])
  return duplicateRealEstateTemplateForAgency(restored)
}

export function isDuplicatedRealEstateAgency(agencySlug: string) {
  return readDuplicatedRealEstateAgencies().some((agency) => agency.agencySlug === agencySlug)
}

export function canManageRealEstateAgency(agencySlug: string) {
  return agencySlug !== templateImmobilierSlug
}

export function normalizeAgencyKind(value: unknown): RealEstateAgencyKind {
  return value === 'pilot' || value === 'internal-test' ? value : 'client'
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
    agencyKind: runtime.modelConfig.agencyKind,
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
    contactLegalIdentity: runtime.modelConfig.contactLegalIdentity,
    painPoint: runtime.modelConfig.painPoint,
    objective: runtime.modelConfig.objective,
    visualStyle: runtime.modelConfig.visualStyle,
    variant: runtime.modelConfig.variant,
    themePreset: runtime.modelConfig.themePreset,
    heroVariant: runtime.modelConfig.heroVariant,
    heroTitle: runtime.modelConfig.heroTitle,
    heroSubtitle: runtime.modelConfig.heroSubtitle,
    primaryCtaLabel: runtime.modelConfig.primaryCtaLabel,
    sectionOrder: runtime.modelConfig.sectionOrder,
    visualBlueprint: runtime.modelConfig.visualBlueprint,
    domainConfig: runtime.modelConfig.domainConfig,
    importedProperties: runtime.modelConfig.importedProperties,
    enabledModules: runtime.modelConfig.enabledModules,
    configVersion: runtime.modelConfig.configVersion,
    lastUpdatedBy: runtime.modelConfig.lastUpdatedBy,
    updateHistory: runtime.modelConfig.updateHistory,
    previousConfigSnapshot: runtime.modelConfig.previousConfigSnapshot,
    status: runtime.modelConfig.status,
    mode: runtime.modelConfig.mode,
    propertyLimit: runtime.agencyConfig.properties.length,
    createdAt: runtime.modelConfig.createdAt || now,
    updatedAt: now,
  }
}

function createConfigSnapshot(agency: PersistedRealEstateAgencyInput, capturedAt: string): RealEstateAgencyConfigSnapshot {
  return {
    agencyName: agency.agencyName,
    city: agency.city,
    logoUrl: agency.logoUrl ?? '',
    primaryColor: agency.colors?.primaryColor ?? defaultColors.primaryColor,
    secondaryColor: agency.colors?.secondaryColor ?? defaultColors.secondaryColor,
    accentColor: agency.colors?.accentColor ?? defaultColors.accentColor,
    backgroundColor: agency.colors?.backgroundColor ?? defaultColors.backgroundColor,
    email: agency.email,
    phone: agency.phone,
    address: agency.address ?? agency.city,
    websiteUrl: agency.websiteUrl ?? '',
    contactLegalIdentity: buildAgencyContactLegalIdentity({
      agencyName: agency.agencyName,
      city: agency.city,
      email: agency.email,
      phone: agency.phone,
      address: agency.address ?? agency.city,
      contactLegalIdentity: agency.contactLegalIdentity,
    }),
    painPoint: agency.painPoint,
    objective: agency.objective,
    visualStyle: agency.visualStyle ?? 'Template immobilier compatible',
    variant: agency.variant,
    themePreset: agency.themePreset ?? defaultVisualDirection.themePreset,
    heroVariant: agency.heroVariant ?? defaultVisualDirection.heroVariant,
    heroTitle: agency.heroTitle ?? `${agency.agencyName}, une experience immobiliere claire.`,
    heroSubtitle: agency.heroSubtitle ?? agency.objective,
    primaryCtaLabel: agency.primaryCtaLabel ?? defaultVisualDirection.primaryCtaLabel,
    sectionOrder: agency.sectionOrder ?? defaultVisualDirection.sectionOrder,
    visualBlueprint: agency.visualBlueprint,
    enabledModules: { ...defaultEnabledModules, ...agency.enabledModules },
    configVersion: agency.configVersion ?? 1,
    capturedAt,
  }
}

function getChangedConfigFields(current: PersistedRealEstateAgencyInput, next: DuplicateRealEstateAgencyInput) {
  const fields: Array<keyof DuplicateRealEstateAgencyInput> = [
    'agencyName',
    'city',
    'logoUrl',
    'email',
    'phone',
    'address',
    'websiteUrl',
    'contactLegalIdentity',
    'painPoint',
    'objective',
    'visualStyle',
    'variant',
    'themePreset',
    'heroVariant',
    'heroTitle',
    'heroSubtitle',
    'primaryCtaLabel',
    'sectionOrder',
    'visualBlueprint',
    'mode',
    'status',
    'agencyKind',
  ]
  const changed = fields.filter((field) => JSON.stringify(current[field]) !== JSON.stringify(next[field]))
  if (JSON.stringify(current.colors) !== JSON.stringify(next.colors)) changed.push('colors')
  if (JSON.stringify(current.enabledModules) !== JSON.stringify(next.enabledModules)) changed.push('enabledModules')
  return changed.map(String)
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
    logoUrl: modelConfig.logoUrl,
    primaryColor: modelConfig.primaryColor,
    secondaryColor: modelConfig.secondaryColor,
    accentColor: modelConfig.accentColor,
    backgroundColor: modelConfig.backgroundColor,
    themePreset: modelConfig.themePreset,
    heroVariant: modelConfig.heroVariant,
    heroTitle: modelConfig.heroTitle,
    heroSubtitle: modelConfig.heroSubtitle,
    primaryCtaLabel: modelConfig.primaryCtaLabel,
    sectionOrder: modelConfig.sectionOrder,
    visualBlueprint: modelConfig.visualBlueprint,
    contactLegalIdentity: modelConfig.contactLegalIdentity,
    mode: modelConfig.mode,
    status: modelConfig.status,
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
  const selectedProperties = model.importedProperties?.length
    ? model.importedProperties
    : source.properties.slice(0, propertyLimit ?? source.properties.length)
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
    logoUrl: model.logoUrl,
    heroImage: source.heroImage || fallbackPropertyImage,
    heroTitle: model.heroTitle,
    heroSubtitle: model.heroSubtitle,
    primaryCtaLabel: model.primaryCtaLabel,
    themePreset: model.themePreset,
    heroVariant: model.heroVariant,
    sectionOrder: model.sectionOrder,
    visualBlueprint: model.visualBlueprint,
    primaryColor: model.primaryColor,
    secondaryColor: model.secondaryColor,
    accentColor: model.accentColor,
    backgroundColor: model.backgroundColor,
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
  const isImportedProperty = property.agencyId === model.agencyId

  return {
    ...property,
    agencyId: model.agencyId,
    address: isImportedProperty ? property.address : testAddresses[index] ?? property.address,
    city: isImportedProperty ? property.city : model.city,
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
