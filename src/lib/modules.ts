import type { AgencyModule, ModuleKey, SectorKey, SignatureModule } from '../types/signature-digital'

const moduleStorageKey = 'signature-digital-agency-modules'
const moduleCreatedAt = '2026-06-28T00:00:00.000Z'

const defaultModules: SignatureModule[] = [
  createModule('lead_form', 'Formulaire de contact', 'Collecte une demande entrante simple et qualifie le prospect.', 'conversion', true, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('callback_request', 'Demande de rappel', 'Permet au visiteur de demander un rappel avec un moment prefere.', 'conversion', true, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('appointment', 'Prise de rendez-vous', 'Permet aux visiteurs de demander ou reserver un rendez-vous.', 'conversion', false, ['avocat', 'notaire', 'immobilier', 'clinique', 'architecte', 'automobile', 'patrimoine']),
  createModule('client_space', 'Espace client', 'Donne au client un espace prive pour suivre ses prochaines etapes.', 'client_experience', false, ['avocat', 'notaire', 'architecte', 'clinique', 'constructeur', 'patrimoine', 'autre']),
  createModule('professional_space', 'Espace professionnel', 'Prepare un espace dedie aux equipes ou partenaires.', 'client_experience', false, ['immobilier', 'notaire', 'architecte', 'constructeur', 'patrimoine']),
  createModule('documents', 'Documents', 'Affiche des documents utiles au dossier ou a la demo.', 'operations', false, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'constructeur', 'patrimoine']),
  createModule('document_upload', 'Depot de documents', 'Permet au client de deposer des documents dans son espace.', 'operations', false, ['avocat', 'notaire', 'architecte', 'clinique', 'constructeur', 'patrimoine']),
  createModule('estimation', 'Estimation', 'Propose un parcours d estimation ou de qualification chiffre.', 'conversion', false, ['immobilier', 'constructeur', 'automobile', 'patrimoine']),
  createModule('payment', 'Paiement', 'Prepare un parcours de paiement ou d activation.', 'commercial', false, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('services_pages', 'Pages services', 'Structure les offres et services pour rendre la valeur claire.', 'content', false, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('premium_presentation', 'Presentation premium', 'Renforce la perception haut de gamme et la reassurance.', 'content', true, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('notifications', 'Notifications', 'Prepare les messages importants pour clients et equipe.', 'communication', false, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'constructeur', 'patrimoine']),
  createModule('reports', 'Comptes rendus', 'Affiche des comptes rendus ou bilans de suivi.', 'operations', false, ['immobilier', 'architecte', 'constructeur', 'patrimoine']),
  createModule('analytics', 'Analytics', 'Suit les evenements importants du parcours.', 'analytics', false, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('project_tracking', 'Suivi de projet', 'Affiche les etapes d un dossier, chantier ou accompagnement.', 'client_experience', false, ['architecte', 'constructeur', 'avocat', 'notaire', 'patrimoine']),
  createModule('visit_request', 'Demande de visite', 'Permet de demander une visite ou un essai.', 'conversion', false, ['immobilier', 'automobile']),
  createModule('seller_space', 'Espace vendeur', 'Suit un bien, des visites, documents et retours vendeur.', 'client_experience', false, ['immobilier']),
  createModule('buyer_space', 'Espace acheteur', 'Prepare un espace de suivi pour acheteurs ou candidats.', 'client_experience', false, ['immobilier', 'automobile']),
  createModule('qualification_form', 'Formulaire de qualification', 'Filtre les demandes pour mieux comprendre le besoin avant contact.', 'conversion', false, ['avocat', 'notaire', 'clinique', 'patrimoine', 'constructeur']),
  createModule('quote_request', 'Demande de devis', 'Structure une demande de devis ou proposition commerciale.', 'conversion', false, ['architecte', 'constructeur', 'automobile', 'clinique', 'autre']),
  createModule('demo_preview', 'Preview de demo', 'Affiche une demo personnalisee avant activation.', 'commercial', true, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
  createModule('email_notifications', 'Emails automatiques', 'Prepare les emails client et notifications internes.', 'communication', true, ['immobilier', 'avocat', 'notaire', 'architecte', 'clinique', 'automobile', 'constructeur', 'patrimoine', 'autre']),
]

const sectorAliases: Record<string, SectorKey> = {
  immobilier: 'immobilier',
  immobiliers: 'immobilier',
  agence: 'immobilier',
  avocats: 'avocat',
  avocat: 'avocat',
  notaires: 'notaire',
  notaire: 'notaire',
  architectes: 'architecte',
  architecte: 'architecte',
  clinique: 'clinique',
  cliniques: 'clinique',
  automobile: 'automobile',
  garage: 'automobile',
  garages: 'automobile',
  constructeur: 'constructeur',
  constructeurs: 'constructeur',
  patrimoine: 'patrimoine',
}

function createModule(
  key: ModuleKey,
  name: string,
  description: string,
  category: SignatureModule['category'],
  defaultEnabled: boolean,
  availableForSectors: SectorKey[],
): SignatureModule {
  return {
    id: `module_${key}`,
    key,
    name,
    description,
    category,
    defaultEnabled,
    availableForSectors,
    createdAt: moduleCreatedAt,
  }
}

export function getDefaultModules() {
  return defaultModules.map((module) => ({ ...module, availableForSectors: [...module.availableForSectors] }))
}

export function normalizeSector(sector: string): SectorKey {
  const normalized = sector.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const direct = sectorAliases[normalized]
  if (direct) return direct

  const foundKey = Object.keys(sectorAliases).find((alias) => normalized.includes(alias))
  return foundKey ? sectorAliases[foundKey] : 'autre'
}

export function getModulesForSector(sector: string) {
  const sectorKey = normalizeSector(sector)
  return getDefaultModules().filter((module) => module.availableForSectors.includes(sectorKey))
}

export function getAgencyModules(agencyId: string) {
  return readAgencyModules().filter((module) => module.agencyId === agencyId)
}

export function isModuleEnabled(agencyId: string, moduleKey: ModuleKey) {
  const configured = getAgencyModules(agencyId).find((module) => module.moduleKey === moduleKey)
  if (configured) return configured.enabled

  return defaultModules.find((module) => module.key === moduleKey)?.defaultEnabled ?? false
}

export function enableModule(agencyId: string, moduleKey: ModuleKey, config: AgencyModule['config'] = {}) {
  return upsertAgencyModule(agencyId, moduleKey, true, config)
}

export function disableModule(agencyId: string, moduleKey: ModuleKey) {
  return upsertAgencyModule(agencyId, moduleKey, false)
}

export function applyModuleConfiguration(
  agencyId: string,
  modulesConfig: Partial<Record<ModuleKey, boolean | { enabled: boolean; config?: AgencyModule['config'] }>>,
) {
  const now = new Date().toISOString()
  const existingModules = readAgencyModules().filter((module) => module.agencyId !== agencyId)
  const nextModules = defaultModules.map((module) => {
    const config = modulesConfig[module.key]
    const enabled = typeof config === 'object' ? config.enabled : config ?? module.defaultEnabled
    const moduleConfig = typeof config === 'object' ? config.config : {}

    return {
      id: `${agencyId}_${module.key}`,
      agencyId,
      moduleKey: module.key,
      enabled,
      config: moduleConfig,
      createdAt: now,
      updatedAt: now,
    }
  })

  writeAgencyModules([...existingModules, ...nextModules])
  return nextModules
}

function upsertAgencyModule(agencyId: string, moduleKey: ModuleKey, enabled: boolean, config: AgencyModule['config'] = {}) {
  const now = new Date().toISOString()
  const modules = readAgencyModules()
  const current = modules.find((module) => module.agencyId === agencyId && module.moduleKey === moduleKey)
  const nextModule: AgencyModule = {
    id: current?.id ?? `${agencyId}_${moduleKey}`,
    agencyId,
    moduleKey,
    enabled,
    config: { ...(current?.config ?? {}), ...config },
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  }

  writeAgencyModules([
    ...modules.filter((module) => !(module.agencyId === agencyId && module.moduleKey === moduleKey)),
    nextModule,
  ])

  return nextModule
}

function readAgencyModules(): AgencyModule[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(moduleStorageKey)
    return raw ? JSON.parse(raw) as AgencyModule[] : []
  } catch {
    return []
  }
}

function writeAgencyModules(modules: AgencyModule[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(moduleStorageKey, JSON.stringify(modules))
}
