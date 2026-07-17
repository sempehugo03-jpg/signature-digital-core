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
import {
  createDefaultAgencyComplianceConfig,
  type AgencyComplianceConfig,
} from '../lib/agencyCompliance'
import {
  createDefaultAgencyLifecycleState,
  appendAgencyLifecycleAudit,
  cancelAgencyDeletion,
  recordAgencyExport,
  requestAgencyDeletion,
  resolveAgencyDeletionPlan,
  sanitizeAccountForExport,
  type AgencyDeletionResourcePlan,
  type AgencyExportPayload,
  type AgencyLifecycleState,
} from '../lib/agencyLifecycle'
import { readProjects, writeProjects } from './projectStore'

export type RealEstateAgencyMode = 'demo' | 'live'
export type RealEstateAgencyKind = 'client' | 'pilot' | 'internal-test'
type LocalJsonRecord = Record<string, unknown>

export type RealEstateAgencyStatus =
  | 'draft'
  | 'demo_ready'
  | 'sent'
  | 'validated'
  | 'active'
  | 'paused'
  | 'archived'
  | 'deletion-requested'
  | 'deletion-scheduled'
  | 'deleted'

export type RealEstateAgencyAccessMode = 'demo' | 'active' | 'paused' | 'archived' | 'deleted'

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
export type RealEstateTemplateView = 'public' | 'estimation' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'invitation' | 'mentions-legales' | 'confidentialite' | 'cookies'

export type RealEstateAgencyModelConfig = {
  agencyId: string
  agencySlug: string
  agencyKind: RealEstateAgencyKind
  agencyName: string
  city: string
  logoUrl: string
  faviconUrl?: string
  heroImage: string
  sectionImages: string[]
  typographyHeading: string
  typographyBody: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  email: string
  phone: string
  address: string
  websiteUrl: string
  contactLegalIdentity: AgencyContactAndLegalIdentity
  complianceConfig: AgencyComplianceConfig
  lifecycleState: AgencyLifecycleState
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
  faviconUrl?: string
  heroImage?: string
  sectionImages?: string[]
  typographyHeading?: string
  typographyBody?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  email: string
  phone: string
  address: string
  websiteUrl: string
  contactLegalIdentity?: AgencyContactAndLegalIdentity
  complianceConfig?: AgencyComplianceConfig
  lifecycleState?: AgencyLifecycleState
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
    sectionImages: string[]
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
  faviconUrl?: string
  heroImage?: string
  sectionImages?: string[]
  typographyHeading?: string
  typographyBody?: string
  colors?: Partial<Pick<RealEstateAgencyModelConfig, 'primaryColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor'>>
  email: string
  phone: string
  address?: string
  websiteUrl?: string
  contactLegalIdentity?: Partial<AgencyContactAndLegalIdentity>
  complianceConfig?: Partial<AgencyComplianceConfig>
  lifecycleState?: Partial<AgencyLifecycleState>
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
    : status === 'archived' || status === 'deletion-requested' || status === 'deletion-scheduled'
      ? 'archived'
      : status === 'deleted'
        ? 'deleted'
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
    heroImage: templateImmobilierConfig.heroImage,
    sectionImages: templateImmobilierConfig.sectionImages ?? [],
    typographyHeading: templateImmobilierConfig.typographyHeading ?? '',
    typographyBody: templateImmobilierConfig.typographyBody ?? '',
    ...defaultColors,
    email: templateImmobilierConfig.email,
    phone: templateImmobilierConfig.phone,
    address: templateImmobilierConfig.address,
    websiteUrl: '',
    contactLegalIdentity: buildAgencyContactLegalIdentity(templateImmobilierConfig),
    complianceConfig: createDefaultAgencyComplianceConfig(buildAgencyContactLegalIdentity(templateImmobilierConfig)),
    lifecycleState: createDefaultAgencyLifecycleState('demo_ready'),
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
  const heroImage = normalizeOptionalUrl(input.heroImage)
  const sectionImages = normalizeStringArray(input.sectionImages).filter(isHttpUrl)
  const typographyHeading = normalizeOptionalText(input.typographyHeading)
  const typographyBody = normalizeOptionalText(input.typographyBody)
  const contactLegalIdentity = buildAgencyContactLegalIdentity({
    agencyName: input.agencyName,
    city: input.city,
    email: input.email,
    phone: input.phone,
    address: input.address ?? input.city,
    contactLegalIdentity: input.contactLegalIdentity,
  })
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
    faviconUrl: input.faviconUrl ?? input.logoUrl ?? '',
    heroImage,
    sectionImages,
    typographyHeading,
    typographyBody,
    ...colors,
    email: input.email,
    phone: input.phone,
    address: input.address ?? input.city,
    websiteUrl: input.websiteUrl ?? '',
    contactLegalIdentity,
    complianceConfig: createDefaultAgencyComplianceConfig(contactLegalIdentity, input.complianceConfig),
    lifecycleState: createDefaultAgencyLifecycleState(input.status ?? 'draft', input.lifecycleState),
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
    complianceConfig: input.complianceConfig ?? existing?.complianceConfig,
    lifecycleState: createDefaultAgencyLifecycleState(input.status ?? existing?.status ?? 'demo_ready', input.lifecycleState ?? existing?.lifecycleState),
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
    lifecycleState: appendAgencyLifecycleAudit(
      createDefaultAgencyLifecycleState(status, agency.lifecycleState),
      status === 'paused' ? 'pause' : status === 'archived' ? 'archive' : 'status-change',
      'admin',
      `Statut agence passe a ${status}.`,
    ),
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
    lifecycleState: appendAgencyLifecycleAudit(
      createDefaultAgencyLifecycleState(nextStatus, agency.lifecycleState),
      'reactivate',
      'admin',
      `Agence reactivee en statut ${nextStatus}.`,
    ),
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
    faviconUrl: snapshot.faviconUrl,
    heroImage: normalizeOptionalUrl(snapshot.heroImage),
    sectionImages: normalizeStringArray(snapshot.sectionImages).filter(isHttpUrl),
    typographyHeading: normalizeOptionalText(snapshot.typographyHeading),
    typographyBody: normalizeOptionalText(snapshot.typographyBody),
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
    complianceConfig: snapshot.complianceConfig,
    lifecycleState: agency.lifecycleState,
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

export function exportRealEstateAgencyData(agencySlug: string, actor = 'admin'): { payload: AgencyExportPayload; runtime: RealEstateAgencyRuntime } | null {
  const current = readDuplicatedRealEstateAgencies()
  const existing = current.find((item) => item.agencySlug === agencySlug)
  const runtime = getRealEstateAgencyRuntimeBySlug(agencySlug)
  if (!runtime) return null

  const lifecycleState = recordAgencyExport(runtime.modelConfig.lifecycleState, actor)
  if (existing) {
    writeDuplicatedRealEstateAgencies(current.map((agency) => (
      agency.agencySlug === agencySlug ? { ...agency, lifecycleState, updatedAt: new Date().toISOString() } : agency
    )))
  }

  const project = readProjects().find((item) => item.generatedAgencyId === agencySlug)
  const payload: AgencyExportPayload = {
    exportVersion: 'v1',
    exportedAt: new Date().toISOString(),
    scope: lifecycleState.exportHistory[0]?.scope ?? [],
    agency: sanitizeAgencyForExport(runtime.modelConfig),
    project: project ? sanitizeProjectForExport(project) : undefined,
    accounts: readLocalArray('signatureDigitalAccountProvisioning')
      .filter((account) => account.agencyId === runtime.modelConfig.agencyId || account.agencySlug === agencySlug)
      .map((account) => sanitizeAccountForExport(account)),
    invitations: readLocalArray('signatureDigitalTemplateInvitations')
      .filter((invitation) => invitation.agencyId === runtime.modelConfig.agencyId || invitation.agencySlug === agencySlug)
      .map(sanitizeInvitationForExport),
    properties: runtime.agencyConfig.properties,
    requests: runtime.agencyConfig.requests,
    documents: runtime.agencyConfig.documents.map((document) => ({
      id: document.id,
      agencyId: document.agencyId,
      propertyId: document.propertyId,
      name: document.name,
      type: document.type,
      url: document.url,
    })),
    domain: runtime.modelConfig.domainConfig,
    compliance: runtime.modelConfig.complianceConfig,
    updateHistory: runtime.modelConfig.updateHistory,
    lifecycle: lifecycleState,
  }

  return { payload, runtime: duplicateRealEstateTemplateForAgency({ ...createPersistedInputFromRuntime(runtime), lifecycleState }) }
}

export function requestRealEstateAgencyDeletion(input: {
  agencySlug: string
  confirmationValue: string
  actor?: string
  reason?: string
}): RealEstateAgencyRuntime | null {
  const current = readDuplicatedRealEstateAgencies()
  const agency = current.find((item) => item.agencySlug === input.agencySlug) ?? createPersistedInputFromStaticRuntime(input.agencySlug)
  if (!agency) return null
  const expected = agency.agencySlug || agency.agencyName
  if (input.confirmationValue !== expected) return null
  const now = new Date().toISOString()
  const lifecycleState = requestAgencyDeletion(
    createDefaultAgencyLifecycleState('deletion-scheduled', agency.lifecycleState),
    input.confirmationValue,
    input.actor ?? 'admin',
    input.reason,
  )
  const updated: PersistedRealEstateAgencyInput = {
    ...agency,
    status: 'deletion-scheduled',
    lifecycleState,
    previousStatus: agency.status,
    updatedAt: now,
  }
  writeDuplicatedRealEstateAgencies([updated, ...current.filter((item) => item.agencySlug !== input.agencySlug)])
  return duplicateRealEstateTemplateForAgency(updated)
}

export function cancelRealEstateAgencyDeletion(agencySlug: string, actor = 'admin'): RealEstateAgencyRuntime | null {
  const current = readDuplicatedRealEstateAgencies()
  const agency = current.find((item) => item.agencySlug === agencySlug)
  if (!agency) return null
  const nextStatus = agency.previousStatus && agency.previousStatus !== 'deletion-scheduled' ? agency.previousStatus : 'archived'
  const updated: PersistedRealEstateAgencyInput = {
    ...agency,
    status: nextStatus,
    lifecycleState: cancelAgencyDeletion(createDefaultAgencyLifecycleState(nextStatus, agency.lifecycleState), actor),
    previousStatus: undefined,
    updatedAt: new Date().toISOString(),
  }
  writeDuplicatedRealEstateAgencies([updated, ...current.filter((item) => item.agencySlug !== agencySlug)])
  return duplicateRealEstateTemplateForAgency(updated)
}

export function getRealEstateAgencyDeletionPlan(agencySlug: string): AgencyDeletionResourcePlan[] {
  const runtime = getRealEstateAgencyRuntimeBySlug(agencySlug)
  const project = readProjects().find((item) => item.generatedAgencyId === agencySlug)
  return resolveAgencyDeletionPlan({
    agencyExists: Boolean(runtime),
    projectExists: Boolean(project),
    hasCustomDomain: Boolean(runtime?.modelConfig.domainConfig?.customDomain),
    hasStripeSnapshot: Boolean(project?.commercialOfferSnapshot || project?.stripeCheckout?.sessionId),
    hasAccounts: readLocalArray('signatureDigitalAccountProvisioning').some((account) => account.agencySlug === agencySlug || account.agencyId === runtime?.modelConfig.agencyId),
    hasInvitations: readLocalArray('signatureDigitalTemplateInvitations').some((invitation) => invitation.agencySlug === agencySlug || invitation.agencyId === runtime?.modelConfig.agencyId),
    hasOutbox: readLocalArray('signatureDigitalEmailOutbox').some((email) => email.agencyId === agencySlug || email.agencyId === runtime?.modelConfig.agencyId),
    hasConsents: readLocalArray('signatureDigitalConsentRecords').some((consent) => consent.agencyId === agencySlug || consent.agencyId === runtime?.modelConfig.agencyId),
  })
}

export function executeRealEstateAgencyDeletion(agencySlug: string, confirmationValue: string, actor = 'admin') {
  const current = readDuplicatedRealEstateAgencies()
  const agency = current.find((item) => item.agencySlug === agencySlug)
  const runtime = getRealEstateAgencyRuntimeBySlug(agencySlug)
  if (!agency || !runtime || agency.status !== 'deletion-scheduled') {
    return { ok: false, plan: getRealEstateAgencyDeletionPlan(agencySlug), message: 'Suppression non planifiee ou agence absente.' }
  }
  if (confirmationValue !== agency.agencySlug) {
    return { ok: false, plan: getRealEstateAgencyDeletionPlan(agencySlug), message: 'Confirmation forte invalide.' }
  }
  const scheduledAt = agency.lifecycleState?.deletionRequest?.scheduledDeletionAt
  if (!scheduledAt || new Date(scheduledAt).getTime() > Date.now()) {
    return { ok: false, plan: getRealEstateAgencyDeletionPlan(agencySlug), message: 'Le delai de suppression n est pas encore atteint.' }
  }

  writeDuplicatedRealEstateAgencies(current.filter((item) => item.agencySlug !== agencySlug))
  cleanupLocalAgencyRecords(runtime.modelConfig.agencyId, agencySlug)
  writeProjects(readProjects().map((project) => (
    project.generatedAgencyId === agencySlug
      ? {
        ...project,
        generatedAgencyId: '',
        status: 'completed',
        technicalStatus: 'à préparer',
        lastClientAction: 'Agence supprimee definitivement par admin.',
        nextAction: 'Projet conserve pour audit commercial apres suppression agence.',
        privateNotes: [project.privateNotes, `Suppression agence executee par ${actor} le ${new Date().toISOString()}.`].filter(Boolean).join('\n'),
      }
      : project
  )))

  return { ok: true, plan: getRealEstateAgencyDeletionPlan(agencySlug), message: 'Suppression locale executee. Ressources externes a verifier manuellement.' }
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

  return createPersistedInputFromRuntime(runtime, now)
}

function createPersistedInputFromRuntime(runtime: RealEstateAgencyRuntime, updatedAt = new Date().toISOString()): PersistedRealEstateAgencyInput {
  return {
    agencyName: runtime.modelConfig.agencyName,
    agencyKind: runtime.modelConfig.agencyKind,
    city: runtime.modelConfig.city,
    agencySlug: runtime.modelConfig.agencySlug,
    logoUrl: runtime.modelConfig.logoUrl,
    faviconUrl: runtime.modelConfig.faviconUrl,
    heroImage: normalizeOptionalUrl(runtime.modelConfig.heroImage),
    sectionImages: normalizeStringArray(runtime.modelConfig.sectionImages).filter(isHttpUrl),
    typographyHeading: normalizeOptionalText(runtime.modelConfig.typographyHeading),
    typographyBody: normalizeOptionalText(runtime.modelConfig.typographyBody),
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
    complianceConfig: runtime.modelConfig.complianceConfig,
    lifecycleState: runtime.modelConfig.lifecycleState,
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
    createdAt: runtime.modelConfig.createdAt || updatedAt,
    updatedAt,
  }
}

function createConfigSnapshot(agency: PersistedRealEstateAgencyInput, capturedAt: string): RealEstateAgencyConfigSnapshot {
  const contactLegalIdentity = buildAgencyContactLegalIdentity({
    agencyName: agency.agencyName,
    city: agency.city,
    email: agency.email,
    phone: agency.phone,
    address: agency.address ?? agency.city,
    contactLegalIdentity: agency.contactLegalIdentity,
  })

  return {
    agencyName: agency.agencyName,
    city: agency.city,
    logoUrl: agency.logoUrl ?? '',
    faviconUrl: agency.faviconUrl ?? agency.logoUrl ?? '',
    heroImage: normalizeOptionalUrl(agency.heroImage),
    sectionImages: normalizeStringArray(agency.sectionImages).filter(isHttpUrl),
    typographyHeading: normalizeOptionalText(agency.typographyHeading),
    typographyBody: normalizeOptionalText(agency.typographyBody),
    primaryColor: agency.colors?.primaryColor ?? defaultColors.primaryColor,
    secondaryColor: agency.colors?.secondaryColor ?? defaultColors.secondaryColor,
    accentColor: agency.colors?.accentColor ?? defaultColors.accentColor,
    backgroundColor: agency.colors?.backgroundColor ?? defaultColors.backgroundColor,
    email: agency.email,
    phone: agency.phone,
    address: agency.address ?? agency.city,
    websiteUrl: agency.websiteUrl ?? '',
    contactLegalIdentity,
    complianceConfig: createDefaultAgencyComplianceConfig(contactLegalIdentity, agency.complianceConfig),
    lifecycleState: createDefaultAgencyLifecycleState(agency.status ?? 'demo_ready', agency.lifecycleState),
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
    'faviconUrl',
    'heroImage',
    'sectionImages',
    'typographyHeading',
    'typographyBody',
    'email',
    'phone',
    'address',
    'websiteUrl',
    'contactLegalIdentity',
    'complianceConfig',
    'lifecycleState',
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

function sanitizeAgencyForExport(modelConfig: RealEstateAgencyModelConfig) {
  return {
    ...modelConfig,
    previousConfigSnapshot: modelConfig.previousConfigSnapshot,
  }
}

function sanitizeProjectForExport(project: ReturnType<typeof readProjects>[number]) {
  return {
    ...project,
    stripeCheckout: {
      status: project.stripeCheckout.status,
      mode: project.stripeCheckout.mode,
      createdAt: project.stripeCheckout.createdAt,
    },
  }
}

function readLocalArray(key: string): LocalJsonRecord[] {
  if (!canUseLocalStorage()) return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]') as LocalJsonRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalArray(key: string, items: LocalJsonRecord[]) {
  if (!canUseLocalStorage()) return
  window.localStorage.setItem(key, JSON.stringify(items))
}

function cleanupLocalAgencyRecords(agencyId: string, agencySlug: string) {
  const belongsToAgency = (item: LocalJsonRecord) => item.agencyId === agencyId || item.agencyId === agencySlug || item.agencySlug === agencySlug
  writeLocalArray('signatureDigitalAccountProvisioning', readLocalArray('signatureDigitalAccountProvisioning').filter((item) => !belongsToAgency(item)))
  writeLocalArray('signatureDigitalTemplateInvitations', readLocalArray('signatureDigitalTemplateInvitations').filter((item) => !belongsToAgency(item)))
  writeLocalArray('signatureDigitalTemplateUsers', readLocalArray('signatureDigitalTemplateUsers').filter((item) => !belongsToAgency(item)))
  writeLocalArray('signatureDigitalEmailOutbox', readLocalArray('signatureDigitalEmailOutbox').filter((item) => !belongsToAgency(item)))
  writeLocalArray('signatureDigitalConsentRecords', readLocalArray('signatureDigitalConsentRecords').filter((item) => !belongsToAgency(item)))
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(`signatureDigitalTemplateData:${agencyId}`)
    window.localStorage.removeItem(`signatureDigitalTemplateData:${agencySlug}`)
    window.localStorage.removeItem(`signatureDigitalTemplateRequests:${agencyId}`)
    window.localStorage.removeItem(`signatureDigitalTemplateRequests:${agencySlug}`)
  }
}

function sanitizeInvitationForExport(invitation: LocalJsonRecord) {
  const safe = { ...invitation }
  delete safe.token
  return safe
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
    faviconUrl: modelConfig.faviconUrl,
    primaryColor: modelConfig.primaryColor,
    secondaryColor: modelConfig.secondaryColor,
    accentColor: modelConfig.accentColor,
    backgroundColor: modelConfig.backgroundColor,
    heroImage: modelConfig.heroImage || agencyConfig.heroImage,
    sectionImages: normalizeStringArray(modelConfig.sectionImages).filter(isHttpUrl),
    typographyHeading: normalizeOptionalText(modelConfig.typographyHeading),
    typographyBody: normalizeOptionalText(modelConfig.typographyBody),
    themePreset: modelConfig.themePreset,
    heroVariant: modelConfig.heroVariant,
    heroTitle: modelConfig.heroTitle,
    heroSubtitle: modelConfig.heroSubtitle,
    primaryCtaLabel: modelConfig.primaryCtaLabel,
    sectionOrder: modelConfig.sectionOrder,
    visualBlueprint: modelConfig.visualBlueprint,
    contactLegalIdentity: modelConfig.contactLegalIdentity,
    complianceConfig: modelConfig.complianceConfig,
    lifecycleState: modelConfig.lifecycleState,
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
        heading: normalizeOptionalText(modelConfig.typographyHeading) || 'Editorial serif',
        body: normalizeOptionalText(modelConfig.typographyBody) || 'Inter, system-ui, sans-serif',
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
        sectionImages: normalizeStringArray(configuredAgency.sectionImages).filter(isHttpUrl),
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
    faviconUrl: model.faviconUrl,
    heroImage: normalizeOptionalUrl(model.heroImage) || source.heroImage || fallbackPropertyImage,
    sectionImages: normalizeStringArray(model.sectionImages).filter(isHttpUrl),
    typographyHeading: normalizeOptionalText(model.typographyHeading),
    typographyBody: normalizeOptionalText(model.typographyBody),
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

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeOptionalText(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map((item) => normalizeOptionalText(item)).filter(Boolean)
  }

  return []
}

function normalizeOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalUrl(value: unknown): string {
  const url = normalizeOptionalText(value)
  return isHttpUrl(url) ? url : ''
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
