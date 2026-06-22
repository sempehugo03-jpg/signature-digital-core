import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import './App.css'
import {
  createCustomButton,
  createCustomPage,
  createGlobalButton,
  createGlobalPage,
  createProperty,
  addTeamMember,
  createAccessToken,
  deleteButton,
  deleteAgency,
  deletePage,
  deleteProperty,
  generateInvitation,
  getAgencyButtons,
  getAgencyButtonsByPlacement,
  getAgencyAccessTokens,
  getAgencyActivity,
  getAgencyInvitations,
  getAgencyPageBySlug,
  getAgencyPages,
  getAgencyPaymentLink,
  getAgencyProperties,
  getAgencySimulatedEmails,
  getAgencyTeamMembers,
  getAgencyUsers,
  getAdminLayout,
  getAccessByToken,
  getBranchableStatuses,
  getGlobalAppearance,
  getGlobalButtons,
  getGlobalButtonsByPlacement,
  getGlobalModules,
  getGlobalPageBySlug,
  getGlobalPages,
  getLocalState,
  getProperty,
  getPublicSiteConfig,
  resetDemoData,
  resetAgencyDemo,
  removeTeamMember,
  updateAgency,
  updateAgencyMood,
  updateAccessToken,
  updateAdminLayout,
  updateGlobalAppearance,
  updateGlobalModules,
  updateInvitationStatus,
  updatePublicSiteConfig,
  updateProperty,
  updateSimulatedEmailStatus,
  upsertPaymentLink,
} from './lib/localStore'
import type {
  AdminCardConfig,
  Agency,
  AgencyAnalysis,
  AgencyMood,
  CustomButton,
  CreatePropertyInput,
  GlobalButton,
  GlobalModule,
  GlobalPage,
  InvitationRole,
  Property,
  PropertyDocument,
  PropertyVisit,
  PublicSiteConfig,
  TeamMember,
} from './lib/localStore'
import {
  createAgencyButtonInSupabase,
  createAgencyPageInSupabase,
  getAgencyButtonsFromSupabase,
  getAgencyModulesFromSupabase,
  getAgencyPagesFromSupabase,
  syncLocalAgencyToSupabase,
  upsertAgencyModuleInSupabase,
  updateAgencyBrandingInSupabase,
  updateAgencyStatusInSupabase,
} from './lib/supabaseSync'
import type { AgencyBrandingInput, AgencyButtonInput, AgencyModuleInput, AgencyPageInput, SupabaseRequestFailure } from './lib/supabaseSync'
import {
  demoProperty,
  immobilierAgency,
  immobilierSector,
  sellerTracking,
} from './sectors/immobilier/data'

type AssistantPrefillState = {
  prompt: string
  message: string
}
type AppNavigationState = {
  assistantPrefill?: AssistantPrefillState
}
type Navigate = (route: string, state?: AppNavigationState) => void
type FlashSetter = (message: string) => void
type LocalCreatedAgency = Agency & {
  syncedAt?: string
}
type ListedAgency = LocalCreatedAgency & {
  syncBadge: 'Supabase connecté' | 'Local non synchronisé'
}
type AgencyFormState = {
  name: string
  sector: string
  city: string
  currentSite: string
  primary: string
  secondary: string
  accent: string
  logoText: string
}
type AgencyAppearanceFormState = {
  logoText: string
  primary: string
  secondary: string
  accent: string
  heroTitle: string
  heroSubtitle: string
}
type AgencyPageFormState = AgencyPageInput
type AgencyPageListing = AgencyPageInput & {
  id: string
  agencyId: string
  source: 'Supabase' | 'Local'
  createdAt: string
}
type AgencyButtonFormState = AgencyButtonInput
type AgencyButtonListing = AgencyButtonInput & {
  id: string
  agencyId: string
  source: 'Supabase' | 'Local'
  createdAt: string
}
type AgencyModuleListing = AgencyModuleInput & {
  id: string
  agencyId: string
  name: string
  source: 'Supabase' | 'Local'
  createdAt: string
}
type AgencyAssistantProposal = {
  heroTitle: string
  heroSubtitle: string
  pages: string[]
  buttons: string[]
  modules: string[]
}
type AgencyAssistantApplication = {
  page: AgencyPageInput
  button: AgencyButtonInput
  module: AgencyModuleInput & { name: string }
}
type ChatGptImportDraft = {
  clientPain: string
  weaknesses: string
  salesAngle: string
  pageTitle: string
  buttonLabel: string
  moduleKey: string
  heroTitle: string
  heroSubtitle: string
  salesPitch: string
}
type AgencyActivationChecklistItem = {
  label: string
  status: 'prêt' | 'à vérifier' | 'manquant'
}
type AgencyWebsiteAnalysisResult = {
  detectedName: string
  detectedSector: string
  detectedCity: string
  detectedColors: string[]
  proposedTone: string[]
  weaknesses: string[]
  recommendedPages: string[]
  recommendedButtons: string[]
  recommendedModules: string[]
}
type DynamicAgencySpace = AgencyPageInput['space']
type DynamicAgencySpaceConfig = {
  slug: DynamicAgencySpace
  title: string
  description: string
  emptyMessage: string
}
type AgencySpaceDesign = {
  visualStyle: string
  cardStyle: string
  buttonStyle: string
  density: string
  spaces: Record<DynamicAgencySpace, {
    title: string
    subtitle: string
  }>
}
type AgencySpaceDesignListing = {
  agencyId: string
  design: AgencySpaceDesign
  updatedAt: string
}
type AgencyAppearanceUpdate = {
  colors: Agency['colors']
  appearance: NonNullable<Agency['appearance']>
}

const hubLinks = [
  { label: 'Site public', route: '/demo/immobilier/public' },
  { label: 'Espace patron', route: '/demo/immobilier/patron' },
  { label: 'Espace agent', route: '/demo/immobilier/agent' },
  { label: 'Espace vendeur', route: '/demo/immobilier/vendeur' },
  { label: 'Gérer le bien', route: '/demo/immobilier/bien' },
]

const saleSteps = ['Mandat', 'Annonce', 'Visites', 'Offre', 'Compromis', 'Vente']
const branchableBadge = 'Fonction prête à connecter'
const localCreatedAgenciesKey = 'signature-digital-core-local-created-agencies'
const localAgencyPagesKey = 'signature-digital-core-agency-pages'
const localAgencyButtonsKey = 'signature-digital-core-agency-buttons'
const localAgencyModulesKey = 'signature-digital-core-agency-modules'
const localAgencySpaceDesignKey = 'signature-digital-core-agency-space-design'
const spaceDesignModuleKey = 'space_design'
const visualStyleOptions = ['Premium sobre', 'Luxe sombre', 'Clair minimal', 'Chaleureux local']
const cardStyleOptions = ['doux', 'net', 'premium']
const buttonStyleOptions = ['arrondi', 'sobre', 'plein']
const densityOptions = ['compacte', 'confortable']
const agencyModuleDefinitions = [
  ['espace_client', 'Espace client / vendeur'],
  ['documents', 'Documents'],
  ['rendez_vous', 'Rendez-vous'],
  ['comptes_rendus', 'Comptes rendus'],
  ['estimation', 'Estimation'],
  ['formulaire_rappel', 'Formulaire rappel'],
  ['page_biens', 'Page biens'],
] as const
const dynamicAgencySpaces: DynamicAgencySpaceConfig[] = [
  {
    slug: 'public',
    title: 'Expérience publique',
    description: 'Présentation publique, promesse et contact agence.',
    emptyMessage: 'Aucun contenu public personnalisé pour le moment.',
  },
  {
    slug: 'patron',
    title: 'Pilotage de l’agence',
    description: 'Vue dirigeant avec suivi global et décisions.',
    emptyMessage: 'Aucun contenu patron personnalisé pour le moment.',
  },
  {
    slug: 'agent',
    title: 'Espace terrain',
    description: 'Actions terrain, vendeur et avancement.',
    emptyMessage: 'Aucun contenu agent personnalisé pour le moment.',
  },
  {
    slug: 'client',
    title: 'Espace client / vendeur',
    description: 'Parcours client clair, premium et rassurant.',
    emptyMessage: 'Aucun contenu client personnalisé pour le moment.',
  },
]
const defaultAgencySpaceDesign: AgencySpaceDesign = {
  visualStyle: 'Premium sobre',
  cardStyle: 'doux',
  buttonStyle: 'arrondi',
  density: 'confortable',
  spaces: {
    public: {
      title: 'Expérience publique',
      subtitle: 'Une vitrine claire pour découvrir l’agence et ses services.',
    },
    patron: {
      title: 'Pilotage de l’agence',
      subtitle: 'Un espace de synthèse pour suivre les priorités et décisions.',
    },
    agent: {
      title: 'Espace terrain',
      subtitle: 'Un environnement simple pour les actions commerciales du quotidien.',
    },
    client: {
      title: 'Espace client / vendeur',
      subtitle: 'Un parcours rassurant pour suivre les étapes et les échanges.',
    },
  },
}

function getRoute() {
  return window.location.pathname
}

function getAssistantPrefillState(): AssistantPrefillState | null {
  const navigationState = window.history.state as AppNavigationState | null
  const prefill = navigationState?.assistantPrefill

  if (!prefill?.prompt?.trim()) return null

  return {
    prompt: prefill.prompt,
    message: prefill.message || 'Analyse importée dans l’Assistant IA.',
  }
}

function copyLocalText(value: string, setFlash: FlashSetter, message = 'Copié localement') {
  navigator.clipboard?.writeText(value).catch(() => undefined)
  setFlash(message)
}

function createSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `agence-${Date.now()}`
}

function getAgencyRouteSlug(agency: Agency) {
  return createSlug(agency.name)
}

function findListedAgencyBySlug(agencies: ListedAgency[], slug: string) {
  return agencies.find((agency) => agency.id === slug || getAgencyRouteSlug(agency) === slug)
}

function getAgencyHeroTitle(agency: Agency) {
  return agency.appearance?.heroTitle?.trim() || agency.name
}

function getAgencyHeroSubtitle(agency: Agency) {
  return agency.appearance?.heroSubtitle?.trim() || 'Une démo personnalisée et premium'
}

function getAgencyModuleLabel(key: string) {
  return agencyModuleDefinitions.find(([moduleKey]) => moduleKey === key)?.[1] ?? key
}

function getDynamicAgencySpaceConfig(space: string): DynamicAgencySpaceConfig {
  return dynamicAgencySpaces.find((item) => item.slug === space) ?? dynamicAgencySpaces[0]
}

function getDefaultAgencySpaceDesign(): AgencySpaceDesign {
  return JSON.parse(JSON.stringify(defaultAgencySpaceDesign)) as AgencySpaceDesign
}

function normalizeAgencySpaceDesign(value: unknown): AgencySpaceDesign {
  const fallback = getDefaultAgencySpaceDesign()

  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback

  const record = value as Record<string, unknown>
  const spacesRecord = record.spaces && typeof record.spaces === 'object' && !Array.isArray(record.spaces)
    ? record.spaces as Record<string, unknown>
    : {}

  return {
    visualStyle: typeof record.visualStyle === 'string' && visualStyleOptions.includes(record.visualStyle)
      ? record.visualStyle
      : fallback.visualStyle,
    cardStyle: typeof record.cardStyle === 'string' && cardStyleOptions.includes(record.cardStyle)
      ? record.cardStyle
      : fallback.cardStyle,
    buttonStyle: typeof record.buttonStyle === 'string' && buttonStyleOptions.includes(record.buttonStyle)
      ? record.buttonStyle
      : fallback.buttonStyle,
    density: typeof record.density === 'string' && densityOptions.includes(record.density)
      ? record.density
      : fallback.density,
    spaces: dynamicAgencySpaces.reduce((nextSpaces, spaceConfig) => {
      const spaceValue = spacesRecord[spaceConfig.slug]
      const spaceRecord = spaceValue && typeof spaceValue === 'object' && !Array.isArray(spaceValue)
        ? spaceValue as Record<string, unknown>
        : {}

      nextSpaces[spaceConfig.slug] = {
        title: typeof spaceRecord.title === 'string' && spaceRecord.title.trim()
          ? spaceRecord.title.trim()
          : fallback.spaces[spaceConfig.slug].title,
        subtitle: typeof spaceRecord.subtitle === 'string' && spaceRecord.subtitle.trim()
          ? spaceRecord.subtitle.trim()
          : fallback.spaces[spaceConfig.slug].subtitle,
      }

      return nextSpaces
    }, {} as AgencySpaceDesign['spaces']),
  }
}

function getAgencySpaceCopy(design: AgencySpaceDesign, space: DynamicAgencySpace) {
  return design.spaces[space] ?? defaultAgencySpaceDesign.spaces[space]
}

function getSpaceVisualTokens(agency: Agency, design: AgencySpaceDesign) {
  if (design.visualStyle === 'Luxe sombre') {
    return {
      heroBackground: agency.colors.primary,
      heroText: agency.colors.secondary,
      accent: agency.colors.accent,
      panelBackground: '#fbf7ef',
      panelText: agency.colors.primary,
    }
  }
  if (design.visualStyle === 'Clair minimal') {
    return {
      heroBackground: '#fffaf3',
      heroText: agency.colors.primary,
      accent: agency.colors.accent,
      panelBackground: '#ffffff',
      panelText: agency.colors.primary,
    }
  }
  if (design.visualStyle === 'Chaleureux local') {
    return {
      heroBackground: '#efe2cf',
      heroText: '#322116',
      accent: '#b98242',
      panelBackground: '#fff8ee',
      panelText: '#322116',
    }
  }

  return {
    heroBackground: agency.colors.secondary,
    heroText: agency.colors.primary,
    accent: agency.colors.accent,
    panelBackground: '#fffaf3',
    panelText: agency.colors.primary,
  }
}

function getSpacePanelStyle(design: AgencySpaceDesign, agency: Agency): CSSProperties {
  const tokens = getSpaceVisualTokens(agency, design)

  return {
    backgroundColor: tokens.panelBackground,
    color: tokens.panelText,
    borderRadius: design.cardStyle === 'net' ? 8 : design.cardStyle === 'premium' ? 18 : 14,
    padding: design.density === 'compacte' ? '1rem' : undefined,
    borderColor: design.cardStyle === 'premium' ? tokens.accent : undefined,
  }
}

function getSpaceButtonStyle(design: AgencySpaceDesign, agency: Agency): CSSProperties {
  const tokens = getSpaceVisualTokens(agency, design)

  return {
    borderRadius: design.buttonStyle === 'sobre' ? 8 : design.buttonStyle === 'plein' ? 12 : 999,
    backgroundColor: design.buttonStyle === 'plein' ? tokens.heroText : undefined,
    color: design.buttonStyle === 'plein' ? tokens.heroBackground : undefined,
  }
}

function getContentExcerpt(content: string) {
  const cleanContent = content.trim()

  if (cleanContent.length <= 140) return cleanContent

  return `${cleanContent.slice(0, 137).trim()}...`
}

function createAssistantDraft(prompt: string, agency: Agency): AgencyAssistantProposal {
  const normalizedPrompt = prompt.toLowerCase()
  const wantsPremiumTone = normalizedPrompt.includes('premium') || normalizedPrompt.includes('rassurant')

  if (wantsPremiumTone) {
    return {
      heroTitle: 'Une expérience digitale claire, premium et rassurante.',
      heroSubtitle: 'Présentez votre agence avec une image plus forte et un parcours client plus fluide.',
      pages: ['Estimation offerte'],
      buttons: ['Demander une estimation'],
      modules: ['Formulaire rappel'],
    }
  }

  return {
    heroTitle: `Une démo plus claire pour ${agency.name}.`,
    heroSubtitle: 'Structurez le parcours client avec des contenus simples, visibles et faciles à activer.',
    pages: ['Présentation agence'],
    buttons: ['Contacter l’agence'],
    modules: ['Espace client / vendeur'],
  }
}

function getModuleKeyFromLabel(label: string) {
  return agencyModuleDefinitions.find(([, moduleLabel]) => moduleLabel === label)?.[0] ?? createSlug(label)
}

function getModuleKeyFromImportedValue(value: string) {
  const cleanValue = value.trim().replace(/[.;,]+$/, '')
  const normalizedValue = cleanValue.toLowerCase()
  const matchingModule = agencyModuleDefinitions.find(([moduleKey, moduleLabel]) => (
    moduleKey === normalizedValue || moduleLabel.toLowerCase() === normalizedValue
  ))

  return matchingModule?.[0] ?? getModuleKeyFromLabel(cleanValue)
}

function createAssistantApplication(proposal: AgencyAssistantProposal): AgencyAssistantApplication {
  const pageTitle = proposal.pages[0] ?? 'Présentation agence'
  const pageSlug = createSlug(pageTitle)
  const buttonLabel = proposal.buttons[0] ?? 'Contacter l’agence'
  const moduleName = proposal.modules[0] ?? 'Espace client / vendeur'
  const moduleKey = getModuleKeyFromLabel(moduleName)

  return {
    page: {
      title: pageTitle,
      slug: pageSlug,
      space: 'public',
      content: `Suggestion assistant : ${proposal.heroTitle} ${proposal.heroSubtitle}`,
      contentType: 'assistant_suggestion',
      status: 'brouillon',
    },
    button: {
      label: buttonLabel,
      destination: `/${pageSlug}`,
      placement: 'hero',
      space: 'public',
      status: 'actif',
    },
    module: {
      key: moduleKey,
      name: getAgencyModuleLabel(moduleKey),
      enabled: true,
    },
  }
}

function extractImportedSection(text: string, labels: string[]) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const normalizedLabels = labels.map((label) => label.toLowerCase())

  for (const line of lines) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) continue

    const label = line.slice(0, separatorIndex).trim().toLowerCase()
    const value = line.slice(separatorIndex + 1).trim()

    if (value && normalizedLabels.includes(label)) return value
  }

  return ''
}

function createChatGptImportDraft(text: string): ChatGptImportDraft {
  const pageTitle = extractImportedSection(text, ['page à créer', 'page recommandée', 'page'])
    || 'Estimation offerte'
  const buttonLabel = extractImportedSection(text, ['bouton à créer', 'bouton recommandé', 'bouton'])
    || 'Demander une estimation'
  const moduleValue = extractImportedSection(text, ['module à activer', 'module recommandé', 'module'])
    || 'formulaire_rappel'

  return {
    clientPain: extractImportedSection(text, ['douleur client', 'douleur client détectée', 'douleur'])
      || 'Les clients ne comprennent pas encore clairement pourquoi choisir cette agence.',
    weaknesses: extractImportedSection(text, ['failles', 'failles détectées', 'failles du site actuel'])
      || 'Le message manque de clarté, de différenciation et de parcours guidé.',
    salesAngle: extractImportedSection(text, ['angle de vente', 'angle'])
      || 'Vendre une expérience plus claire, premium et rassurante.',
    pageTitle,
    buttonLabel,
    moduleKey: getModuleKeyFromImportedValue(moduleValue),
    heroTitle: extractImportedSection(text, ['titre proposé', 'titre principal proposé', 'titre'])
      || 'Une expérience plus claire, premium et rassurante.',
    heroSubtitle: extractImportedSection(text, ['sous-titre proposé', 'sous-titre', 'subtitle'])
      || 'Transformez votre présence digitale en parcours client plus fluide.',
    salesPitch: extractImportedSection(text, ['pitch commercial', 'pitch'])
      || 'Le Studio peut transformer cette proposition en parcours clair avant application.',
  }
}

function createChatGptImportApplication(draft: ChatGptImportDraft): AgencyAssistantApplication {
  const pageSlug = createSlug(draft.pageTitle)

  return {
    page: {
      title: draft.pageTitle,
      slug: pageSlug,
      space: 'public',
      content: `${draft.salesPitch}\n\nDouleur client : ${draft.clientPain}\nAngle : ${draft.salesAngle}`,
      contentType: 'chatgpt_import',
      status: 'brouillon',
    },
    button: {
      label: draft.buttonLabel,
      destination: `/${pageSlug}`,
      placement: 'hero',
      space: 'public',
      status: 'actif',
    },
    module: {
      key: draft.moduleKey,
      name: getAgencyModuleLabel(draft.moduleKey),
      enabled: true,
    },
  }
}

async function applyAgencyGeneratedElements(selectedAgency: ListedAgency, application: AgencyAssistantApplication) {
  const nextAppliedItems: string[] = []

  if (selectedAgency.syncBadge === 'Supabase connecté') {
    const agencyRouteSlug = getAgencyRouteSlug(selectedAgency)
    const [existingPages, existingButtons] = await Promise.all([
      getAgencyPagesFromSupabase(agencyRouteSlug),
      getAgencyButtonsFromSupabase(agencyRouteSlug),
    ])
    const pageExists = existingPages.some((page) => (
      page.slug === application.page.slug && page.space === application.page.space
    ))
    const buttonExists = existingButtons.some((button) => (
      button.label === application.button.label &&
      button.destination === application.button.destination &&
      button.space === application.button.space
    ))

    if (pageExists) {
      nextAppliedItems.push(`Page déjà existante, conservée : ${application.page.title}`)
    } else {
      await createAgencyPageInSupabase(agencyRouteSlug, application.page)
      nextAppliedItems.push(`Page créée : ${application.page.title} (brouillon)`)
    }

    if (buttonExists) {
      nextAppliedItems.push(`Bouton déjà existant, conservé : ${application.button.label}`)
    } else {
      await createAgencyButtonInSupabase(agencyRouteSlug, application.button)
      nextAppliedItems.push(`Bouton créé : ${application.button.label}`)
    }

    await upsertAgencyModuleInSupabase(agencyRouteSlug, application.module)
    nextAppliedItems.push(`Module activé : ${application.module.name}`)

    return nextAppliedItems
  }

  const pageExists = readStoredPagesForAgency(selectedAgency).some((page) => (
    page.slug === application.page.slug && page.space === application.page.space
  ))
  const buttonExists = readStoredButtonsForAgency(selectedAgency).some((button) => (
    button.label === application.button.label &&
    button.destination === application.button.destination &&
    button.space === application.button.space
  ))

  if (pageExists) {
    nextAppliedItems.push(`Page déjà existante, conservée : ${application.page.title}`)
  } else {
    saveLocalAgencyPage(selectedAgency, application.page)
    nextAppliedItems.push(`Page créée : ${application.page.title} (brouillon)`)
  }

  if (buttonExists) {
    nextAppliedItems.push(`Bouton déjà existant, conservé : ${application.button.label}`)
  } else {
    saveLocalAgencyButton(selectedAgency, application.button)
    nextAppliedItems.push(`Bouton créé : ${application.button.label}`)
  }

  saveLocalAgencyModule(selectedAgency, application.module)
  nextAppliedItems.push(`Module activé : ${application.module.name}`)

  return nextAppliedItems
}

function createWebsiteAnalysis(agency: Agency): AgencyWebsiteAnalysisResult {
  return {
    detectedName: agency.name,
    detectedSector: agency.sector,
    detectedCity: agency.city,
    detectedColors: ['bleu nuit', 'crème', 'doré doux'],
    proposedTone: ['premium', 'rassurant', 'clair'],
    weaknesses: [
      'message commercial peu différenciant',
      'parcours client peu guidé',
      'manque d’espace client visible',
    ],
    recommendedPages: ['Estimation offerte', 'Suivi client', 'Présentation agence'],
    recommendedButtons: ['Demander une estimation', 'Être rappelé', 'Voir la démo'],
    recommendedModules: ['formulaire_rappel', 'espace_client', 'documents'],
  }
}

function createAssistantPromptFromWebsiteAnalysis(analysis: AgencyWebsiteAnalysisResult) {
  const tone = analysis.proposedTone.join(', ')
  const pages = analysis.recommendedPages.join(', ')
  const modules = analysis.recommendedModules.map(getAgencyModuleLabel).join(', ')

  return `À partir de l’analyse du site actuel, rends cette agence plus ${tone}. Mets en avant ${pages}, ${modules}.`
}

function readLocalCreatedAgencies(): LocalCreatedAgency[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(localCreatedAgenciesKey)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalCreatedAgencies(agencies: LocalCreatedAgency[]) {
  window.localStorage.setItem(localCreatedAgenciesKey, JSON.stringify(agencies))
}

function createLocalAgency(form: AgencyFormState): LocalCreatedAgency {
  const id = createSlug(form.name)
  const now = new Date().toISOString()

  return {
    id,
    name: form.name.trim(),
    sector: form.sector.trim(),
    city: form.city.trim(),
    currentSite: form.currentSite.trim(),
    status: 'Démo locale',
    colors: {
      primary: form.primary.trim(),
      secondary: form.secondary.trim(),
      accent: form.accent.trim(),
    },
    appearance: {
      logoText: form.logoText.trim(),
      heroTitle: form.name.trim(),
      heroSubtitle: 'Une démo personnalisée et premium',
      heroImageUrl: '',
      visualStyle: 'premium',
      backgroundColor: form.secondary.trim(),
      textColor: form.primary.trim(),
      buttonStyle: 'premium',
      fontStyle: 'moderne',
    },
    ownerName: 'Patron démo',
    ownerEmail: 'patron@demo.local',
    agentName: 'Agent démo',
    agentEmail: 'agent@demo.local',
    createdAt: now,
  }
}

function createAppearanceUpdates(agency: Agency, form: AgencyAppearanceFormState): AgencyAppearanceUpdate {
  const primary = form.primary.trim()
  const secondary = form.secondary.trim()
  const accent = form.accent.trim()

  return {
    colors: {
      primary,
      secondary,
      accent,
    },
    appearance: {
      logoText: form.logoText.trim() || agency.name,
      heroTitle: form.heroTitle.trim() || agency.name,
      heroSubtitle: form.heroSubtitle.trim() || 'Une démo personnalisée et premium',
      heroImageUrl: agency.appearance?.heroImageUrl ?? '',
      visualStyle: agency.appearance?.visualStyle ?? 'premium',
      backgroundColor: secondary,
      textColor: primary,
      buttonStyle: agency.appearance?.buttonStyle ?? 'premium',
      fontStyle: agency.appearance?.fontStyle ?? 'moderne',
    },
  }
}

function createBrandingInput(agency: Agency, form: AgencyAppearanceFormState): AgencyBrandingInput {
  const updates = createAppearanceUpdates(agency, form)

  return {
    logoText: updates.appearance.logoText,
    primaryColor: updates.colors.primary,
    secondaryColor: updates.colors.secondary,
    accentColor: updates.colors.accent,
    heroTitle: updates.appearance.heroTitle ?? agency.name,
    heroSubtitle: updates.appearance.heroSubtitle ?? 'Une démo personnalisée et premium',
  }
}

function updateAgencyAppearanceLocally(agency: Agency, form: AgencyAppearanceFormState) {
  const updates = createAppearanceUpdates(agency, form)
  const localAgencies = readLocalCreatedAgencies()
  const localMatch = localAgencies.some((item) => item.id === agency.id)

  if (localMatch) {
    writeLocalCreatedAgencies(localAgencies.map((item) => (
      item.id === agency.id ? { ...item, ...updates } : item
    )))
    return
  }

  updateAgency(agency.id, updates)
}

function updateAgencyStatusLocally(agency: Agency, status: string) {
  const localAgencies = readLocalCreatedAgencies()
  const localMatch = localAgencies.some((item) => item.id === agency.id)

  if (localMatch) {
    writeLocalCreatedAgencies(localAgencies.map((item) => (
      item.id === agency.id ? { ...item, status } : item
    )))
    return
  }

  updateAgency(agency.id, { status })
}

function getActivationStatus(isReady: boolean, isOptional = false): AgencyActivationChecklistItem['status'] {
  if (isReady) return 'prêt'

  return isOptional ? 'à vérifier' : 'manquant'
}

function readLocalAgencyPages(): AgencyPageListing[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(localAgencyPagesKey)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalAgencyPages(pages: AgencyPageListing[]) {
  window.localStorage.setItem(localAgencyPagesKey, JSON.stringify(pages))
}

function readStoredPagesForAgency(agency: Agency): AgencyPageListing[] {
  const localPages = readLocalAgencyPages().filter((page) => page.agencyId === agency.id)
  const legacyPages = getAgencyPages(agency.id).map((page) => ({
    id: page.id,
    agencyId: page.agencyId,
    title: page.title,
    slug: page.slug,
    space: page.placement === 'vendeur' ? 'client' as const : page.placement as AgencyPageInput['space'],
    content: page.content,
    status: page.status ?? 'brouillon',
    source: 'Local' as const,
    createdAt: page.createdAt,
  }))

  return [...legacyPages, ...localPages]
}

function saveLocalAgencyPage(agency: Agency, form: AgencyPageFormState) {
  const slug = createSlug(form.slug || form.title)
  const page: AgencyPageListing = {
    id: `${agency.id}-${slug}`,
    agencyId: agency.id,
    title: form.title.trim(),
    slug,
    space: form.space,
    content: form.content.trim(),
    status: form.status,
    source: 'Local',
    createdAt: new Date().toISOString(),
  }
  const nextPages = [
    ...readLocalAgencyPages().filter((item) => !(item.agencyId === agency.id && item.slug === page.slug)),
    page,
  ]

  writeLocalAgencyPages(nextPages)

  return page
}

function readLocalAgencyButtons(): AgencyButtonListing[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(localAgencyButtonsKey)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalAgencyButtons(buttons: AgencyButtonListing[]) {
  window.localStorage.setItem(localAgencyButtonsKey, JSON.stringify(buttons))
}

function normalizeButtonSpace(value: string): AgencyButtonInput['space'] {
  if (value === 'patron' || value === 'agent' || value === 'client') return value
  if (value === 'vendeur') return 'client'

  return 'public'
}

function readStoredButtonsForAgency(agency: Agency): AgencyButtonListing[] {
  const localButtons = readLocalAgencyButtons().filter((button) => button.agencyId === agency.id)
  const legacyButtons = getAgencyButtons(agency.id).map((button) => ({
    id: button.id,
    agencyId: button.agencyId,
    label: button.label,
    destination: button.destination,
    placement: 'hero',
    space: normalizeButtonSpace(button.placement),
    status: button.status ?? 'actif',
    source: 'Local' as const,
    createdAt: button.createdAt,
  }))

  return [...legacyButtons, ...localButtons]
}

function saveLocalAgencyButton(agency: Agency, form: AgencyButtonFormState) {
  const id = `${agency.id}-${createSlug(form.label)}-${Date.now()}`
  const button: AgencyButtonListing = {
    id,
    agencyId: agency.id,
    label: form.label.trim(),
    destination: form.destination.trim(),
    placement: form.placement.trim(),
    space: form.space,
    status: form.status,
    source: 'Local',
    createdAt: new Date().toISOString(),
  }
  const nextButtons = [...readLocalAgencyButtons(), button]

  writeLocalAgencyButtons(nextButtons)

  return button
}

function readLocalAgencyModules(): AgencyModuleListing[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(localAgencyModulesKey)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalAgencyModules(modules: AgencyModuleListing[]) {
  window.localStorage.setItem(localAgencyModulesKey, JSON.stringify(modules))
}

function createDefaultModuleListings(agency: Agency): AgencyModuleListing[] {
  return agencyModuleDefinitions.map(([key]) => ({
    id: `${agency.id}-${key}`,
    agencyId: agency.id,
    key,
    name: getAgencyModuleLabel(key),
    enabled: Boolean(agency.modules?.[key]),
    source: 'Local',
    createdAt: '',
  }))
}

function readStoredModulesForAgency(agency: Agency): AgencyModuleListing[] {
  const storedModules = readLocalAgencyModules().filter((module) => module.agencyId === agency.id)
  const moduleMap = new Map<string, AgencyModuleListing>()

  createDefaultModuleListings(agency).forEach((module) => moduleMap.set(module.key, module))
  storedModules.forEach((module) => moduleMap.set(module.key, module))

  return agencyModuleDefinitions.map(([key]) => moduleMap.get(key) ?? {
    id: `${agency.id}-${key}`,
    agencyId: agency.id,
    key,
    name: getAgencyModuleLabel(key),
    enabled: false,
    source: 'Local',
    createdAt: '',
  })
}

function saveLocalAgencyModule(agency: Agency, module: AgencyModuleInput) {
  const nextModule: AgencyModuleListing = {
    id: `${agency.id}-${module.key}`,
    agencyId: agency.id,
    key: module.key,
    name: getAgencyModuleLabel(module.key),
    enabled: module.enabled,
    source: 'Local',
    createdAt: new Date().toISOString(),
  }
  const nextModules = [
    ...readLocalAgencyModules().filter((item) => !(item.agencyId === agency.id && item.key === module.key)),
    nextModule,
  ]

  writeLocalAgencyModules(nextModules)

  return nextModule
}

function readLocalAgencySpaceDesigns(): AgencySpaceDesignListing[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(localAgencySpaceDesignKey)
    const parsed = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalAgencySpaceDesigns(designs: AgencySpaceDesignListing[]) {
  window.localStorage.setItem(localAgencySpaceDesignKey, JSON.stringify(designs))
}

function readStoredSpaceDesignForAgency(agency: Agency): AgencySpaceDesign {
  const localDesign = readLocalAgencySpaceDesigns().find((item) => item.agencyId === agency.id)?.design

  return normalizeAgencySpaceDesign(localDesign)
}

function saveLocalAgencySpaceDesign(agency: Agency, design: AgencySpaceDesign) {
  const listing: AgencySpaceDesignListing = {
    agencyId: agency.id,
    design: normalizeAgencySpaceDesign(design),
    updatedAt: new Date().toISOString(),
  }
  const nextDesigns = [
    ...readLocalAgencySpaceDesigns().filter((item) => item.agencyId !== agency.id),
    listing,
  ]

  writeLocalAgencySpaceDesigns(nextDesigns)

  return listing.design
}

async function getAgencySpaceDesignFromSupabase(agencySlug: string) {
  const modules = await getAgencyModulesFromSupabase(agencySlug)
  const designModule = modules.find((module) => module.key === spaceDesignModuleKey)

  return designModule?.settings ? normalizeAgencySpaceDesign(designModule.settings) : getDefaultAgencySpaceDesign()
}

async function saveAgencySpaceDesignInSupabase(agencySlug: string, design: AgencySpaceDesign) {
  await upsertAgencyModuleInSupabase(agencySlug, {
    key: spaceDesignModuleKey,
    name: 'Design des espaces',
    enabled: false,
    settings: normalizeAgencySpaceDesign(design),
  })
}

function useAgencyCustomElements(agency: ListedAgency | undefined, agencySlug: string) {
  const [pages, setPages] = useState<AgencyPageListing[]>(() => agency ? readStoredPagesForAgency(agency) : [])
  const [buttons, setButtons] = useState<AgencyButtonListing[]>(() => agency ? readStoredButtonsForAgency(agency) : [])
  const [modules, setModules] = useState<AgencyModuleListing[]>(() => agency ? readStoredModulesForAgency(agency) : [])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!agency) return

    let cancelled = false
    const localPages = readStoredPagesForAgency(agency)
    const localButtons = readStoredButtonsForAgency(agency)
    const localModules = readStoredModulesForAgency(agency)

    setPages(localPages)
    setButtons(localButtons)
    setModules(localModules)
    setMessage('')

    if (agency.syncBadge !== 'Supabase connecté') return

    Promise.allSettled([
      getAgencyPagesFromSupabase(getAgencyRouteSlug(agency)),
      getAgencyButtonsFromSupabase(getAgencyRouteSlug(agency)),
      getAgencyModulesFromSupabase(getAgencyRouteSlug(agency)),
    ]).then(([pagesResult, buttonsResult, modulesResult]) => {
      if (cancelled) return

      if (pagesResult.status === 'fulfilled') {
        setPages(pagesResult.value.map((page) => ({ ...page, source: 'Supabase' as const })))
      }
      if (buttonsResult.status === 'fulfilled') {
        setButtons(buttonsResult.value.map((button) => ({ ...button, source: 'Supabase' as const })))
      }
      if (modulesResult.status === 'fulfilled') {
        setModules(modulesResult.value.map((module) => ({ ...module, source: 'Supabase' as const })))
      }
      if (
        pagesResult.status === 'rejected' ||
        buttonsResult.status === 'rejected' ||
        modulesResult.status === 'rejected'
      ) {
        setMessage('Lecture Supabase partielle. Affichage du fallback local disponible.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [agency, agencySlug])

  return { pages, buttons, modules, message }
}

function useAgencySpaceDesign(agency: ListedAgency | undefined, agencySlug: string) {
  const [design, setDesign] = useState<AgencySpaceDesign>(() => agency ? readStoredSpaceDesignForAgency(agency) : getDefaultAgencySpaceDesign())
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!agency) return

    let cancelled = false

    setDesign(readStoredSpaceDesignForAgency(agency))
    setMessage('')

    if (agency.syncBadge !== 'Supabase connecté') return

    getAgencySpaceDesignFromSupabase(getAgencyRouteSlug(agency))
      .then((remoteDesign) => {
        if (!cancelled) setDesign(remoteDesign)
      })
      .catch(() => {
        if (!cancelled) setMessage('Design Supabase indisponible. Affichage du design local.')
      })

    return () => {
      cancelled = true
    }
  }, [agency, agencySlug])

  return { design, setDesign, message }
}

async function saveAgencySpaceDesign(agency: ListedAgency, design: AgencySpaceDesign) {
  const normalizedDesign = normalizeAgencySpaceDesign(design)

  saveLocalAgencySpaceDesign(agency, normalizedDesign)

  if (agency.syncBadge === 'Supabase connecté') {
    await saveAgencySpaceDesignInSupabase(getAgencyRouteSlug(agency), normalizedDesign)
  }

  return normalizedDesign
}

function formatSupabaseError(error: unknown) {
  const supabaseError = error as SupabaseRequestFailure
  const parts = [
    supabaseError.message,
    supabaseError.code ? `code ${supabaseError.code}` : '',
    supabaseError.details ? `details ${supabaseError.details}` : '',
  ].filter(Boolean)

  return `Erreur Supabase : ${parts.join(' · ') || 'erreur inconnue'}`
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [storeVersion, setStoreVersion] = useState(0)
  const [flash, setFlash] = useState('')
  const state = useMemo(() => getLocalState(), [storeVersion])
  const localCreatedAgencies = useMemo(() => readLocalCreatedAgencies(), [storeVersion])
  const adminAgencies = useMemo<ListedAgency[]>(
    () => [
      ...state.agencies.map((agency) => ({ ...agency, syncBadge: 'Supabase connecté' as const })),
      ...localCreatedAgencies.map((agency) => ({
        ...agency,
        syncBadge: agency.syncedAt ? 'Supabase connecté' as const : 'Local non synchronisé' as const,
      })),
    ],
    [localCreatedAgencies, state.agencies],
  )

  const currentLabel = useMemo(() => {
    if (route.startsWith('/admin/agences') || route.startsWith('/admin/agencies')) return 'Agences'
    if (route === '/admin') return 'Studio'
    if (route.startsWith('/demo/immobilier')) return immobilierSector.sectorName
    if (route === '/demo') return 'Démo'
    if (route.startsWith('/demo/')) return 'Démo agence'
    return 'Accueil'
  }, [route])

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function refreshStore() {
    setStoreVersion((version) => version + 1)
  }

  function navigate(nextRoute: string, state?: AppNavigationState) {
    window.history.pushState(state ?? {}, '', nextRoute)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function flashAndRefresh(message: string) {
    setFlash(message)
    refreshStore()
  }

  const adminAgencyNew = route === '/admin/agences/new' || route === '/admin/agencies/new'
  const adminSite = route === '/admin/site'
  const adminGlobalAppearance = route === '/admin/apparence'
  const adminGlobalPages = route === '/admin/pages'
  const adminGlobalButtons = route === '/admin/buttons'
  const adminGlobalModules = route === '/admin/modules'
  const adminTemplates = route === '/admin/templates'
  const adminLayout = route === '/admin/layout'
  const adminAssistant = route === '/admin/assistant'
  const adminPreview = route === '/admin/preview'
  const adminSystem = route === '/admin/system'
  const globalPage = route.match(/^\/page\/([^/]+)$/)
  const adminAgencyDetail = adminAgencyNew ? null : route.match(/^\/admin\/agences\/([^/]+)$/)
  const adminAgencyProfileAppearance = route.match(/^\/admin\/agencies\/([^/]+)\/appearance$/)
  const adminAgencyProfilePages = route.match(/^\/admin\/agencies\/([^/]+)\/pages$/)
  const adminAgencyProfileButtons = route.match(/^\/admin\/agencies\/([^/]+)\/buttons$/)
  const adminAgencyProfileModules = route.match(/^\/admin\/agencies\/([^/]+)\/modules$/)
  const adminAgencyProfileAssistant = route.match(/^\/admin\/agencies\/([^/]+)\/assistant$/)
  const adminAgencyProfileWebsiteAnalysis = route.match(/^\/admin\/agencies\/([^/]+)\/website-analysis$/)
  const adminAgencyProfileDesign = route.match(/^\/admin\/agencies\/([^/]+)\/design$/)
  const adminAgencyProfileChatGptImport = route.match(/^\/admin\/agencies\/([^/]+)\/chatgpt-import$/)
  const adminAgencyProfileActivation = route.match(/^\/admin\/agencies\/([^/]+)\/activation$/)
  const adminAgencyProfile = adminAgencyNew ? null : route.match(/^\/admin\/agencies\/([^/]+)$/)
  const adminAnalysis = route.match(/^\/admin\/agences\/([^/]+)\/analyse$/)
  const adminAppearance = route.match(/^\/admin\/agences\/([^/]+)\/apparence$/)
  const adminMood = route.match(/^\/admin\/agences\/([^/]+)\/ambiance$/)
  const adminAccess = route.match(/^\/admin\/agences\/([^/]+)\/acces$/)
  const adminInvitations = route.match(/^\/admin\/agences\/([^/]+)\/invitations$/)
  const adminEmails = route.match(/^\/admin\/agences\/([^/]+)\/emails$/)
  const adminPayment = route.match(/^\/admin\/agences\/([^/]+)\/paiement$/)
  const adminTeam = route.match(/^\/admin\/agences\/([^/]+)\/equipe$/)
  const adminTracking = route.match(/^\/admin\/agences\/([^/]+)\/suivi$/)
  const adminDanger = route.match(/^\/admin\/agences\/([^/]+)\/danger$/)
  const adminProperties = route.match(/^\/admin\/agences\/([^/]+)\/annonces$/)
  const adminPropertyNew = route.match(/^\/admin\/agences\/([^/]+)\/annonces\/new$/)
  const adminPropertyEdit = adminPropertyNew ? null : route.match(/^\/admin\/agences\/([^/]+)\/annonces\/([^/]+)$/)
  const adminPages = route.match(/^\/admin\/agences\/([^/]+)\/pages$/)
  const adminButtons = route.match(/^\/admin\/agences\/([^/]+)\/buttons$/)
  const adminModules = route.match(/^\/admin\/agences\/([^/]+)\/modules$/)
  const adminAgencyDemo = route.match(/^\/admin\/agences\/([^/]+)\/demo$/)
  const adminExport = route.match(/^\/admin\/agences\/([^/]+)\/export$/)
  const dynamicAgencySpace = route.match(/^\/demo\/([^/]+)\/(public|patron|agent|client)$/)
  const dynamicAgencyDemo = route === '/demo/immobilier' ? null : route.match(/^\/demo\/([^/]+)$/)
  const generatedPublic = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/public$/)
  const generatedPublicProperty = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/public\/([^/]+)$/)
  const generatedPatron = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/patron$/)
  const generatedAgent = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/agent$/)
  const generatedSeller = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/vendeur\/([^/]+)$/)
  const generatedProperty = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/bien\/([^/]+)$/)
  const generatedPage = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/page\/([^/]+)$/)
  const generatedPreparation = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/preparation$/)
  const accessRoute = route.match(/^\/(?:access|acces|invitation)\/([^/]+)$/)
  const paymentRoute = route.match(/^\/payment\/([^/]+)$/)
  const paymentSuccess = route.match(/^\/payment\/([^/]+)\/success$/)
  const paymentCancel = route.match(/^\/payment\/([^/]+)\/cancel$/)

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Navigation principale">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          SDC
        </button>
        <div className="nav-links">
          <button className={route === '/' ? 'active' : ''} type="button" onClick={() => navigate('/')}>
            Accueil
          </button>
          <button className={route.startsWith('/admin') ? 'active' : ''} type="button" onClick={() => navigate('/admin')}>
            Admin
          </button>
          <button className={route.startsWith('/demo') ? 'active' : ''} type="button" onClick={() => navigate('/demo')}>
            Démo
          </button>
        </div>
      </nav>

      <p className="route-pill">{currentLabel}</p>
      {flash && <p className="flash-message">{flash}</p>}

      {route === '/' && <HomeView onNavigate={navigate} />}
      {route === '/admin' && <AdminView onNavigate={navigate} />}
      {adminSite && <GlobalSiteView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalAppearance && <GlobalAppearanceView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalPages && <GlobalPagesView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalButtons && <GlobalButtonsView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalModules && <GlobalModulesView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminTemplates && <GlobalTemplatesView onNavigate={navigate} />}
      {adminLayout && <AdminLayoutView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminAssistant && <AdminAssistantView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminPreview && <AdminPreviewView onNavigate={navigate} />}
      {adminSystem && <AdminSystemView onNavigate={navigate} />}
      {globalPage && <GlobalPageView slug={globalPage[1]} onNavigate={navigate} />}
      {(route === '/admin/agences' || route === '/admin/agencies') && (
        <AgenciesView agencies={adminAgencies} onNavigate={navigate} onReset={flashAndRefresh} />
      )}
      {adminAgencyNew && <NewAgencyView onNavigate={navigate} onCreated={flashAndRefresh} />}
      {adminAgencyProfileAppearance && (
        <AgencyProfileAppearanceView
          key={adminAgencyProfileAppearance[1]}
          agencySlug={adminAgencyProfileAppearance[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
          onSaved={flashAndRefresh}
        />
      )}
      {adminAgencyProfilePages && (
        <AgencyProfilePagesView
          key={adminAgencyProfilePages[1]}
          agencySlug={adminAgencyProfilePages[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
          onSaved={flashAndRefresh}
        />
      )}
      {adminAgencyProfileButtons && (
        <AgencyProfileButtonsView
          key={adminAgencyProfileButtons[1]}
          agencySlug={adminAgencyProfileButtons[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
          onSaved={flashAndRefresh}
        />
      )}
      {adminAgencyProfileModules && (
        <AgencyProfileModulesView
          key={adminAgencyProfileModules[1]}
          agencySlug={adminAgencyProfileModules[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
          onSaved={flashAndRefresh}
        />
      )}
      {adminAgencyProfileAssistant && (
        <AgencyProfileAssistantView
          key={adminAgencyProfileAssistant[1]}
          agencySlug={adminAgencyProfileAssistant[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
        />
      )}
      {adminAgencyProfileWebsiteAnalysis && (
        <AgencyProfileWebsiteAnalysisView
          key={adminAgencyProfileWebsiteAnalysis[1]}
          agencySlug={adminAgencyProfileWebsiteAnalysis[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
        />
      )}
      {adminAgencyProfileDesign && (
        <AgencyProfileDesignView
          key={adminAgencyProfileDesign[1]}
          agencySlug={adminAgencyProfileDesign[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
        />
      )}
      {adminAgencyProfileChatGptImport && (
        <AgencyProfileChatGptImportView
          key={adminAgencyProfileChatGptImport[1]}
          agencySlug={adminAgencyProfileChatGptImport[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
        />
      )}
      {adminAgencyProfileActivation && (
        <AgencyProfileActivationView
          key={adminAgencyProfileActivation[1]}
          agencySlug={adminAgencyProfileActivation[1]}
          agencies={adminAgencies}
          onNavigate={navigate}
          onActivated={flashAndRefresh}
        />
      )}
      {adminAgencyProfile && (
        <AgencyProfileView agencySlug={adminAgencyProfile[1]} agencies={adminAgencies} onNavigate={navigate} />
      )}
      {adminAgencyDetail && (
        <AgencyDetailView agencyId={adminAgencyDetail[1]} onNavigate={navigate} setFlash={setFlash} />
      )}
      {adminAnalysis && (
        <AgencyAnalysisView agencyId={adminAnalysis[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminAppearance && (
        <AgencyAppearanceView agencyId={adminAppearance[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminMood && (
        <AgencyMoodView agencyId={adminMood[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminAccess && (
        <AgencyAccessView agencyId={adminAccess[1]} onNavigate={navigate} setFlash={setFlash} />
      )}
      {adminInvitations && (
        <AgencyInvitationsView agencyId={adminInvitations[1]} onNavigate={navigate} onSaved={flashAndRefresh} setFlash={setFlash} />
      )}
      {adminEmails && (
        <AgencyEmailsView agencyId={adminEmails[1]} onNavigate={navigate} onSaved={flashAndRefresh} setFlash={setFlash} />
      )}
      {adminPayment && (
        <AgencyPaymentView agencyId={adminPayment[1]} onNavigate={navigate} onSaved={flashAndRefresh} setFlash={setFlash} />
      )}
      {adminTeam && (
        <AgencyTeamView agencyId={adminTeam[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminTracking && (
        <AgencyTrackingView agencyId={adminTracking[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminDanger && (
        <AgencyDangerView agencyId={adminDanger[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminProperties && (
        <AgencyPropertiesView agencyId={adminProperties[1]} onNavigate={navigate} />
      )}
      {adminPropertyNew && (
        <NewPropertyView agencyId={adminPropertyNew[1]} onNavigate={navigate} onCreated={flashAndRefresh} />
      )}
      {adminPages && (
        <AgencyPagesView agencyId={adminPages[1]} onNavigate={navigate} onCreated={flashAndRefresh} />
      )}
      {adminButtons && (
        <AgencyButtonsView agencyId={adminButtons[1]} onNavigate={navigate} onCreated={flashAndRefresh} />
      )}
      {adminModules && (
        <AgencyModulesView agencyId={adminModules[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminAgencyDemo && (
        <AgencyDemoView agencyId={adminAgencyDemo[1]} onNavigate={navigate} />
      )}
      {adminExport && (
        <AgencyExportView agencyId={adminExport[1]} onNavigate={navigate} setFlash={setFlash} />
      )}
      {adminPropertyEdit && (
        <EditPropertyView
          agencyId={adminPropertyEdit[1]}
          propertyId={adminPropertyEdit[2]}
          onNavigate={navigate}
          onSaved={flashAndRefresh}
        />
      )}
      {route === '/demo' && <DemoIndexView onNavigate={navigate} />}
      {route === '/demo/immobilier' && <ImmobilierHubView agencies={state.agencies} onNavigate={navigate} />}
      {route === '/demo/immobilier/public' && <ImmobilierPublicView onNavigate={navigate} />}
      {route === '/demo/immobilier/patron' && <ImmobilierPatronView onNavigate={navigate} />}
      {route === '/demo/immobilier/agent' && <ImmobilierAgentView onNavigate={navigate} />}
      {route === '/demo/immobilier/vendeur' && <ImmobilierVendeurView onNavigate={navigate} />}
      {route === '/demo/immobilier/bien' && <ImmobilierBienView onNavigate={navigate} />}
      {dynamicAgencySpace && (
        <DynamicAgencySpaceView
          agencySlug={dynamicAgencySpace[1]}
          space={dynamicAgencySpace[2] as DynamicAgencySpace}
          agencies={adminAgencies}
          onNavigate={navigate}
        />
      )}
      {dynamicAgencyDemo && (
        <DynamicAgencyDemoView agencySlug={dynamicAgencyDemo[1]} agencies={adminAgencies} onNavigate={navigate} />
      )}
      {generatedPublic && <GeneratedPublicView agencyId={generatedPublic[1]} onNavigate={navigate} />}
      {generatedPublicProperty && (
        <GeneratedPublicView
          agencyId={generatedPublicProperty[1]}
          propertyId={generatedPublicProperty[2]}
          onNavigate={navigate}
        />
      )}
      {generatedPatron && <GeneratedPatronView agencyId={generatedPatron[1]} onNavigate={navigate} />}
      {generatedAgent && <GeneratedAgentView agencyId={generatedAgent[1]} onNavigate={navigate} />}
      {generatedSeller && (
        <GeneratedSellerView agencyId={generatedSeller[1]} propertyId={generatedSeller[2]} onNavigate={navigate} />
      )}
      {generatedProperty && (
        <GeneratedPropertyView agencyId={generatedProperty[1]} propertyId={generatedProperty[2]} onNavigate={navigate} />
      )}
      {generatedPage && (
        <GeneratedCustomPageView agencyId={generatedPage[1]} slug={generatedPage[2]} onNavigate={navigate} />
      )}
      {generatedPreparation && (
        <PreparationView agencyId={generatedPreparation[1]} onNavigate={navigate} />
      )}
      {accessRoute && <AccessTokenView token={accessRoute[1]} onNavigate={navigate} />}
      {paymentRoute && <PaymentSimulationView agencyId={paymentRoute[1]} onNavigate={navigate} />}
      {paymentSuccess && <PaymentResultView agencyId={paymentSuccess[1]} status="success" onNavigate={navigate} />}
      {paymentCancel && <PaymentResultView agencyId={paymentCancel[1]} status="cancel" onNavigate={navigate} />}
      {!isKnownRoute(route) &&
        !adminAgencyNew &&
        !adminSite &&
        !adminGlobalAppearance &&
        !adminGlobalPages &&
        !adminGlobalButtons &&
        !adminGlobalModules &&
        !adminTemplates &&
        !adminLayout &&
        !adminAssistant &&
        !adminPreview &&
        !adminSystem &&
        !globalPage &&
        !adminAgencyProfileAppearance &&
        !adminAgencyProfilePages &&
        !adminAgencyProfileButtons &&
        !adminAgencyProfileModules &&
        !adminAgencyProfileAssistant &&
        !adminAgencyProfileWebsiteAnalysis &&
        !adminAgencyProfileDesign &&
        !adminAgencyProfileChatGptImport &&
        !adminAgencyProfileActivation &&
        !adminAgencyProfile &&
        !adminAgencyDetail &&
        !adminAnalysis &&
        !adminAppearance &&
        !adminMood &&
        !adminAccess &&
        !adminInvitations &&
        !adminEmails &&
        !adminPayment &&
        !adminTeam &&
        !adminTracking &&
        !adminDanger &&
        !adminProperties &&
        !adminPropertyNew &&
        !adminPropertyEdit &&
        !adminPages &&
        !adminButtons &&
        !adminModules &&
        !adminAgencyDemo &&
        !adminExport &&
        !dynamicAgencySpace &&
        !dynamicAgencyDemo &&
        !generatedPublic &&
        !generatedPublicProperty &&
        !generatedPatron &&
        !generatedAgent &&
        !generatedSeller &&
        !generatedProperty &&
        !generatedPage &&
        !generatedPreparation &&
        !accessRoute &&
        !paymentRoute &&
        !paymentSuccess &&
        !paymentCancel && <NotFoundView onNavigate={navigate} />}
    </main>
  )
}

function isKnownRoute(route: string) {
  return [
    '/',
    '/admin',
    '/admin/system',
    '/admin/site',
    '/admin/apparence',
    '/admin/pages',
    '/admin/buttons',
    '/admin/modules',
    '/admin/templates',
    '/admin/layout',
    '/admin/assistant',
    '/admin/preview',
    '/admin/agences',
    '/admin/agencies',
    '/admin/agencies/new',
    '/demo',
    '/demo/immobilier',
    '/demo/immobilier/public',
    '/demo/immobilier/patron',
    '/demo/immobilier/agent',
    '/demo/immobilier/vendeur',
    '/demo/immobilier/bien',
  ].includes(route)
}

function HomeView({ onNavigate }: { onNavigate: Navigate }) {
  const config = getPublicSiteConfig()
  const homeButtons = getGlobalButtonsByPlacement('accueil')
  return (
    <section className="hero-view">
      <div className="hero-content">
        <h1>{config.title}</h1>
        <p className="subtitle">{config.subtitle}</p>
        <p className="intro">{config.promise}</p>
        <div className="actions">
          <button className="primary-button" type="button" onClick={() => onNavigate(config.primaryButtonDestination)}>
            {config.primaryButtonText}
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate(config.secondaryButtonDestination)}>
            {config.secondaryButtonText}
          </button>
          {homeButtons.map((button) => (
            <button className="secondary-button" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
              {button.label}
            </button>
          ))}
        </div>
      </div>
      <AgencyPreview />
    </section>
  )
}

function AdminView({ onNavigate }: { onNavigate: Navigate }) {
  const layout = getAdminLayout()
  const cards = [...layout.cards].filter((card) => card.visible).sort((a, b) => a.order - b.order)
  const sections: AdminCardConfig['section'][] = ['Production', 'Personnalisation globale', 'Système']
  const adminButtons = getGlobalButtonsByPlacement('admin')
  const state = getLocalState()
  const latestAgency = [...state.agencies].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const shortcutCards = [
    {
      title: 'Mes agences',
      text: `${state.agencies.length} espace${state.agencies.length > 1 ? 's' : ''} en préparation.`,
      route: '/admin/agencies',
      label: 'Ouvrir',
    },
    {
      title: 'Signature Immobilier',
      text: 'Ouvrir la démo de référence.',
      route: '/demo/immobilier',
      label: 'Voir',
    },
    {
      title: 'Site Signature Digital',
      text: 'Ajuster la page d’accueil.',
      route: '/admin/site',
      label: 'Modifier',
    },
  ]
  const advancedCards = cards.filter((card) => !['agencies', 'create-agency', 'preview'].includes(card.id))

  return (
    <section className="page-view admin-cockpit">
      <div className="calm-heading">
        <p className="eyebrow">Studio Admin</p>
        <h1>Bonjour Hugo</h1>
        <p className="subtitle">Que veux-tu faire aujourd’hui ?</p>
        <p className="microcopy">Commence par une action. Tu pourras tout modifier plus tard.</p>
      </div>

      <div className="hero-action">
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies/new')}>
          Créer une démo agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Voir les agences
        </button>
      </div>

      <article className="guided-card">
        <div>
          <p className="eyebrow">Reprendre</p>
          {latestAgency ? (
            <>
              <h2>{latestAgency.name}</h2>
              <p>{latestAgency.city} · {latestAgency.status}</p>
            </>
          ) : (
            <>
              <h2>Aucune agence locale</h2>
              <p>Crée une première démo pour préparer les espaces public, patron, agent et client.</p>
            </>
          )}
        </div>
        <div className="inline-actions">
          <button
            className="primary-button compact"
            type="button"
            onClick={() => onNavigate(latestAgency ? `/admin/agencies/${getAgencyRouteSlug(latestAgency)}` : '/admin/agencies/new')}
          >
            {latestAgency ? 'Continuer' : 'Créer'}
          </button>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() => onNavigate(latestAgency ? `/demo/${getAgencyRouteSlug(latestAgency)}` : '/demo/immobilier')}
          >
            Voir la démo
          </button>
        </div>
      </article>

      <section className="calm-section">
        <div>
          <p className="eyebrow">Raccourcis</p>
          <h2>Les essentiels</h2>
        </div>
        <div className="shortcut-grid">
          {shortcutCards.map((card) => (
            <article className="quiet-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(card.route)}>
                {card.label}
              </button>
            </article>
          ))}
        </div>
      </section>

      <details className="advanced-box">
        <summary>Réglages avancés</summary>
        <div className="shortcut-grid">
          {advancedCards.map((card) => (
            <article className="quiet-card" key={card.id}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(card.route)}>
                {card.buttonLabel}
              </button>
            </article>
          ))}
          {adminButtons.map((button) => (
            <article className="quiet-card" key={button.id}>
              <h2>{button.label}</h2>
              <p>Bouton global admin.</p>
              <button className="secondary-button compact" type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
                Tester
              </button>
            </article>
          ))}
          <div className="advanced-links">
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/pages')}>Pages</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/buttons')}>Boutons</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/modules')}>Modules</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/templates')}>Templates</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/layout')}>Personnaliser admin</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/assistant')}>Assistant IA</button>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => {
                resetDemoData()
                window.location.assign('/admin')
              }}
            >
              Réinitialiser les données locales
            </button>
          </div>
        </div>
      </details>

      <div className="page-heading">
        <h1>{layout.title}</h1>
        <p className="subtitle">{layout.subtitle}</p>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agences/new')}>
          Créer une agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/preview')}>
          Prévisualiser le système
        </button>
      </div>

      {sections.map((section) => (
        <section className="page-view" key={section}>
          <p className="eyebrow">{section}</p>
          <div className="card-grid">
            {cards
              .filter((card) => card.section === section)
              .map((card) => (
                <article className="info-card" key={card.id}>
                  <h2>{card.title}</h2>
                  <p>{card.text}</p>
                  <div className="inline-actions">
                    <button className="secondary-button compact" type="button" onClick={() => onNavigate(card.route)}>
                      {card.buttonLabel}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}

      {adminButtons.length > 0 && (
        <article className="demo-panel">
          <p className="eyebrow">Boutons globaux admin</p>
          <div className="inline-actions">
            {adminButtons.map((button) => (
              <button className="secondary-button compact" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
                {button.label}
              </button>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

function GlobalSiteView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [config, setConfig] = useState<PublicSiteConfig>(getPublicSiteConfig)
  const sectionNames = ['Hero', 'Signature Immobilier', 'Secteurs', 'Méthode', 'Contact']

  function updateField(field: keyof PublicSiteConfig, value: string) {
    setConfig((current) => ({ ...current, [field]: value }))
  }

  function toggleSection(section: string) {
    setConfig((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: !current.sections[section],
      },
    }))
  }

  function save() {
    updatePublicSiteConfig(config)
    onSaved('Accueil enregistré localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Site Signature Digital</h1>
        <p className="subtitle">Modifiez l’accueil, les textes et les CTA.</p>
      </div>
      <article className="edit-panel form-grid">
        <TextField label="Titre principal" value={config.title} onChange={(value) => updateField('title', value)} />
        <TextField label="Sous-titre" value={config.subtitle} onChange={(value) => updateField('subtitle', value)} />
        <TextAreaField label="Promesse" value={config.promise} onChange={(value) => updateField('promise', value)} />
        <TextField label="Texte bouton principal" value={config.primaryButtonText} onChange={(value) => updateField('primaryButtonText', value)} />
        <TextField label="Destination bouton principal" value={config.primaryButtonDestination} onChange={(value) => updateField('primaryButtonDestination', value)} />
        <TextField label="Texte bouton secondaire" value={config.secondaryButtonText} onChange={(value) => updateField('secondaryButtonText', value)} />
        <TextField label="Destination bouton secondaire" value={config.secondaryButtonDestination} onChange={(value) => updateField('secondaryButtonDestination', value)} />
      </article>
      <article className="demo-panel">
        <p className="eyebrow">Sections visibles</p>
        <div className="inline-actions">
          {sectionNames.map((section) => (
            <button className="secondary-button compact" key={section} type="button" onClick={() => toggleSection(section)}>
              {config.sections[section] ? 'ON' : 'OFF'} · {section}
            </button>
          ))}
        </div>
      </article>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/')}>
          Prévisualiser l’accueil
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function GlobalAppearanceView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [appearance, setAppearance] = useState(getGlobalAppearance)

  function updateField(field: keyof typeof appearance, value: string) {
    setAppearance((current) => ({ ...current, [field]: value }))
  }

  function save() {
    updateGlobalAppearance(appearance)
    onSaved('Apparence globale enregistrée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Apparence globale</h1>
        <p className="subtitle">Couleurs, ambiance et densité du système.</p>
      </div>
      <article className="edit-panel form-grid">
        <TextField label="Couleur principale" value={appearance.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={appearance.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={appearance.accent} onChange={(value) => updateField('accent', value)} />
        <TextField label="Fond" value={appearance.background} onChange={(value) => updateField('background', value)} />
        <SelectField label="Style" value={appearance.style} options={['premium sobre', 'luxe discret', 'moderne', 'minimal']} onChange={(value) => updateField('style', value)} />
        <SelectField label="Arrondis" value={appearance.radius} options={['doux', 'très arrondis', 'sobres']} onChange={(value) => updateField('radius', value)} />
        <SelectField label="Densité" value={appearance.density} options={['compacte', 'confortable']} onChange={(value) => updateField('density', value)} />
      </article>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function GlobalPagesView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const pages = getGlobalPages()
  const [form, setForm] = useState({
    title: 'Page contact',
    slug: 'contact',
    placement: 'site public',
    content: 'Une page globale créée depuis le Studio Signature.',
    status: 'publié',
    ctaLabel: 'Retour accueil',
    ctaDestination: '/',
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const page = createGlobalPage({
      title: form.title,
      slug: form.slug,
      placement: form.placement as GlobalPage['placement'],
      content: form.content,
      status: form.status as GlobalPage['status'],
      ctaLabel: form.ctaLabel,
      ctaDestination: form.ctaDestination,
    })
    onSaved('Page globale créée localement')
    onNavigate(`/page/${page.slug}`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Pages globales</h1>
        <p className="subtitle">Ajoutez des pages au site, à l’admin, à l’aide ou aux secteurs.</p>
      </div>
      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Titre" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <TextField label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} />
        <SelectField label="Emplacement" value={form.placement} options={['site public', 'admin', 'aide', 'secteur']} onChange={(value) => setForm((current) => ({ ...current, placement: value }))} />
        <SelectField label="Statut" value={form.status} options={['brouillon', 'publié']} onChange={(value) => setForm((current) => ({ ...current, status: value }))} />
        <TextAreaField label="Contenu" value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} />
        <TextField label="CTA texte" value={form.ctaLabel} onChange={(value) => setForm((current) => ({ ...current, ctaLabel: value }))} />
        <TextField label="CTA destination" value={form.ctaDestination} onChange={(value) => setForm((current) => ({ ...current, ctaDestination: value }))} />
        <button className="primary-button" type="submit">
          Créer page
        </button>
      </form>
      <div className="list-grid">
        {pages.map((page) => (
          <article className="list-card" key={page.id}>
            <div>
              <p className="eyebrow">{page.placement} · {page.status}</p>
              <h2>{page.title}</h2>
              <p>/page/{page.slug}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/page/${page.slug}`)}>
              Voir
            </button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function GlobalButtonsView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const buttons = getGlobalButtons()
  const [form, setForm] = useState({
    label: 'Ouvrir Signature Immobilier',
    placement: 'accueil',
    destination: '/demo/immobilier',
    style: 'secondaire',
    status: 'actif',
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    createGlobalButton({
      label: form.label,
      placement: form.placement as GlobalButton['placement'],
      destination: form.destination,
      style: form.style as GlobalButton['style'],
      status: form.status as GlobalButton['status'],
    })
    onSaved('Bouton global créé localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Boutons globaux</h1>
        <p className="subtitle">Ajoutez des boutons dans l’accueil, l’admin ou les pages globales.</p>
      </div>
      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Texte" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} />
        <SelectField label="Emplacement" value={form.placement} options={['accueil', 'admin', 'démo immobilier', 'page globale']} onChange={(value) => setForm((current) => ({ ...current, placement: value }))} />
        <TextField label="Destination" value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} />
        <SelectField label="Style" value={form.style} options={['principal', 'secondaire', 'discret']} onChange={(value) => setForm((current) => ({ ...current, style: value }))} />
        <SelectField label="Statut" value={form.status} options={['actif', 'inactif']} onChange={(value) => setForm((current) => ({ ...current, status: value }))} />
        <button className="primary-button" type="submit">
          Créer bouton
        </button>
      </form>
      <div className="list-grid">
        {buttons.map((button) => (
          <article className="list-card" key={button.id}>
            <div>
              <p className="eyebrow">{button.placement} · {button.status}</p>
              <h2>{button.label}</h2>
              <p>{button.destination}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
              Tester
            </button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function GlobalModulesView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [modules, setModules] = useState<GlobalModule[]>(getGlobalModules)

  function toggle(id: string) {
    setModules((current) =>
      current.map((module) =>
        module.id === id ? { ...module, active: !module.active } : module,
      ),
    )
    onSaved('Module modifié localement')
  }

  function save() {
    updateGlobalModules(modules)
    onSaved('Modules globaux enregistrés localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Modules globaux</h1>
        <p className="subtitle">Activez ou désactivez les fonctionnalités du cockpit.</p>
      </div>
      <div className="list-grid">
        {modules.map((module) => (
          <article className="list-card" key={module.id}>
            <div>
              <p className="eyebrow">{module.active ? 'actif' : 'inactif'} · {module.state}</p>
              <h2>{module.name}</h2>
              <p>{module.description}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => toggle(module.id)}>
              {module.active ? 'Désactiver' : 'Activer'}
            </button>
          </article>
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function GlobalTemplatesView({ onNavigate }: { onNavigate: Navigate }) {
  const templates = [
    { name: 'Immobilier', status: 'actif', spaces: 'public / pro / client', modules: 'annonces, vendeur, documents' },
    { name: 'Constructeur', status: 'bientôt', spaces: 'public / pro / client', modules: 'projets, devis, suivi' },
    { name: 'Avocat', status: 'bientôt', spaces: 'public / pro / client', modules: 'dossiers, rendez-vous' },
    { name: 'Architecte', status: 'bientôt', spaces: 'public / pro / client', modules: 'portfolio, projets' },
    { name: 'Notaire', status: 'bientôt', spaces: 'public / pro / client', modules: 'dossiers, actes' },
    { name: 'Clinique', status: 'bientôt', spaces: 'public / pro / client', modules: 'patients, rendez-vous' },
    { name: 'Courtier', status: 'bientôt', spaces: 'public / pro / client', modules: 'leads, dossiers' },
  ]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Templates secteurs</h1>
        <p className="subtitle">Préparez les prochains modules métier depuis le cockpit.</p>
      </div>
      <div className="list-grid">
        {templates.map((template) => (
          <article className="list-card" key={template.name}>
            <div>
              <p className="eyebrow">{template.status}</p>
              <h2>{template.name}</h2>
              <p>{template.spaces} · {template.modules}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => template.name === 'Immobilier' ? onNavigate('/demo/immobilier') : onNavigate('/admin/preview')}>
                Voir
              </button>
              <button className="secondary-button compact" type="button" onClick={() => template.name === 'Immobilier' ? onNavigate('/admin/agences') : onNavigate('/admin/preview')}>
                Modifier
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function AdminLayoutView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [layout, setLayout] = useState(getAdminLayout)

  function updateCard(id: string, updates: Partial<AdminCardConfig>) {
    setLayout((current) => ({
      ...current,
      cards: current.cards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
    }))
  }

  function moveCard(id: string, direction: -1 | 1) {
    setLayout((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === id ? { ...card, order: card.order + direction } : card,
      ),
    }))
  }

  function save() {
    updateAdminLayout(layout)
    onSaved('Cockpit admin enregistré localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Personnaliser l’admin</h1>
        <p className="subtitle">Cartes, raccourcis et textes du cockpit.</p>
      </div>
      <article className="edit-panel form-grid">
        <TextField label="Titre du cockpit" value={layout.title} onChange={(value) => setLayout((current) => ({ ...current, title: value }))} />
        <TextField label="Sous-titre" value={layout.subtitle} onChange={(value) => setLayout((current) => ({ ...current, subtitle: value }))} />
        <SelectField label="Style" value={layout.style} options={['compact', 'confortable', 'premium']} onChange={(value) => setLayout((current) => ({ ...current, style: value as typeof layout.style }))} />
      </article>
      <div className="list-grid">
        {[...layout.cards].sort((a, b) => a.order - b.order).map((card) => (
          <article className="list-card" key={card.id}>
            <div>
              <p className="eyebrow">{card.visible ? 'visible' : 'masquée'} · {card.section}</p>
              <TextField label="Titre" value={card.title} onChange={(value) => updateCard(card.id, { title: value })} />
              <TextField label="Texte" value={card.text} onChange={(value) => updateCard(card.id, { text: value })} />
              <TextField label="Destination" value={card.route} onChange={(value) => updateCard(card.id, { route: value })} />
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => updateCard(card.id, { visible: !card.visible })}>
                {card.visible ? 'Désactiver' : 'Activer'}
              </button>
              <button className="secondary-button compact" type="button" onClick={() => moveCard(card.id, -1)}>
                Monter
              </button>
              <button className="secondary-button compact" type="button" onClick={() => moveCard(card.id, 1)}>
                Descendre
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function AdminAssistantView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [prompt, setPrompt] = useState('Ajoute une carte Pages dans mon admin')
  const [proposal, setProposal] = useState('')

  function simulate() {
    setProposal(`Action proposée : ${prompt}. Cette modification sera appliquée localement sans API externe.`)
  }

  function apply() {
    if (prompt.toLowerCase().includes('page')) {
      createGlobalPage({
        title: 'Page créée par assistant',
        slug: 'page-assistant',
        placement: 'admin',
        content: 'Page simulée depuis l’assistant IA local.',
        status: 'publié',
        ctaLabel: 'Retour admin',
        ctaDestination: '/admin',
      })
      onSaved('Page créée localement par l’assistant')
      return
    }
    if (prompt.toLowerCase().includes('bouton')) {
      createGlobalButton({
        label: 'Signature Immobilier',
        placement: 'admin',
        destination: '/demo/immobilier',
        style: 'secondaire',
        status: 'actif',
      })
      onSaved('Bouton ajouté localement par l’assistant')
      return
    }
    onSaved('Modification simulée appliquée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Assistant IA</h1>
        <p className="subtitle">Décrivez une modification. Le système simule une action locale.</p>
      </div>
      <article className="edit-panel">
        <TextAreaField label="Décris ce que tu veux modifier" value={prompt} onChange={setPrompt} />
        <button className="primary-button compact" type="button" onClick={simulate}>
          Simuler
        </button>
        {proposal && <p className="save-message">{proposal}</p>}
      </article>
      <div className="actions">
        <button className="primary-button" type="button" onClick={apply}>
          Appliquer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function AdminPreviewView({ onNavigate }: { onNavigate: Navigate }) {
  const items = ['accueil configurable', 'admin configurable', 'agences', 'Signature Immobilier', 'pages globales', 'boutons globaux', 'modules', 'templates secteurs']
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Prévisualisation globale</h1>
        <p className="subtitle">Checklist du cockpit local.</p>
      </div>
      <div className="card-grid">
        {items.map((item) => <InfoBlock key={item} title={item} text="Prêt à tester localement." />)}
      </div>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate('/')}>Accueil</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>Admin</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>Signature Immobilier</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>Agences</button>
      </div>
    </section>
  )
}

function AdminSystemView({ onNavigate }: { onNavigate: Navigate }) {
  const statuses = getBranchableStatuses()
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Réglages intégrés</h1>
        <p className="subtitle">Ces réglages sont maintenant directement intégrés dans l’admin principal.</p>
      </div>
      <div className="list-grid">
        {statuses.map(([id, label, status]) => (
          <InfoBlock key={id} title={label} text={status} />
        ))}
      </div>
      <button className="primary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function AgenciesView({
  agencies,
  onNavigate,
  onReset,
}: {
  agencies: ListedAgency[]
  onNavigate: Navigate
  onReset: FlashSetter
}) {
  const [syncingAgencyId, setSyncingAgencyId] = useState('')
  const [syncMessage, setSyncMessage] = useState('')

  function resetData() {
    resetDemoData()
    try {
      window.localStorage.removeItem(localCreatedAgenciesKey)
    } catch {
      undefined
    }
    onReset('Données locales réinitialisées.')
  }

  async function synchronizeAgency(agency: ListedAgency) {
    setSyncingAgencyId(agency.id)
    setSyncMessage('')

    try {
      await syncLocalAgencyToSupabase(agency)
      const nextAgencies = readLocalCreatedAgencies().map((item) => (
        item.id === agency.id ? { ...item, status: 'Démo active', syncedAt: new Date().toISOString() } : item
      ))

      writeLocalCreatedAgencies(nextAgencies)
      onReset('Agence synchronisée avec Supabase.')
    } catch (error) {
      console.warn('Supabase agency sync failed.', error)
      setSyncMessage('Synchronisation impossible pour le moment.')
    } finally {
      setSyncingAgencyId('')
    }
  }

  return (
    <section className="page-view agencies-premium-view">
      <div className="page-heading">
        <p className="eyebrow">Studio</p>
        <h1>Agences</h1>
        <p className="subtitle">Préparez chaque expérience client, puis ouvrez la démo en un geste.</p>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies/new')}>
          Créer une agence
        </button>
        <button className="secondary-button" type="button" onClick={resetData}>
          Réinitialiser les données démo
        </button>
      </div>

      {syncMessage && <p className="save-message">{syncMessage}</p>}

      <div className="list-grid">
        {agencies.length === 0 && (
          <article className="info-card">
            <h2>Aucune agence créée</h2>
            <p>Créez une première agence pour préparer sa démo et ses espaces.</p>
          </article>
        )}

        {agencies.map((agency) => (
          <article className="list-card" key={agency.id}>
            <div>
              <p className="eyebrow">{agency.sector}</p>
              <h2>{agency.name}</h2>
              <p>{agency.city} · {agency.status}</p>
              {agency.syncBadge === 'Local non synchronisé' && <span className="sync-badge local">À synchroniser</span>}
            </div>
            <div className="inline-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(agency)}`)}>
                Ouvrir
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}`)}
              >
                Ouvrir démo
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/public`)}
              >
                Site public
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/patron`)}
              >
                Patron
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/agent`)}
              >
                Agent
              </button>
              {agency.syncBadge === 'Local non synchronisé' && (
                <button
                  className="secondary-button compact"
                  type="button"
                  onClick={() => synchronizeAgency(agency)}
                  disabled={syncingAgencyId === agency.id}
                >
                  {syncingAgencyId === agency.id ? 'Synchronisation...' : 'Synchroniser'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AgencyProfileView({
  agencySlug,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const {
    pages: agencyPages,
    buttons: agencyButtons,
    modules: agencyModules,
  } = useAgencyCustomElements(agency, agencySlug)

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Fiche agence</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }

  const logoText = agency.appearance?.logoText?.trim() || agency.name
  const websiteLabel = agency.currentSite?.trim() || 'Non renseigné'
  const routeSlug = getAgencyRouteSlug(agency)
  const activeModules = agencyModules.filter((module) => module.enabled && module.key !== spaceDesignModuleKey)
  const demoIndicators = [
    {
      label: 'Identité prête',
      value: agency.appearance?.heroTitle || agency.appearance?.logoText ? 'Prêt' : 'À vérifier',
      ready: Boolean(agency.appearance?.heroTitle || agency.appearance?.logoText),
    },
    {
      label: 'Pages',
      value: String(agencyPages.length),
      ready: agencyPages.length > 0,
    },
    {
      label: 'Actions',
      value: String(agencyButtons.length),
      ready: agencyButtons.length > 0,
    },
    {
      label: 'Modules activés',
      value: String(activeModules.length),
      ready: activeModules.length > 0,
    },
    {
      label: 'Espaces prêts',
      value: '4',
      ready: true,
    },
  ]
  const quickActions = [
    ['Modifier l’apparence', `/admin/agencies/${routeSlug}/appearance`],
    ['Pages de la démo', `/admin/agencies/${routeSlug}/pages`],
    ['Boutons et actions', `/admin/agencies/${routeSlug}/buttons`],
    ['Fonctionnalités', `/admin/agencies/${routeSlug}/modules`],
    ['Design des espaces', `/admin/agencies/${routeSlug}/design`],
    ['Analyser le site', `/admin/agencies/${routeSlug}/website-analysis`],
    ['Coller une proposition ChatGPT', `/admin/agencies/${routeSlug}/chatgpt-import`],
  ] as const
  const demoSpaces = [
    ['Site public', `/demo/${routeSlug}/public`],
    ['Patron', `/demo/${routeSlug}/patron`],
    ['Agent', `/demo/${routeSlug}/agent`],
    ['Client / vendeur', `/demo/${routeSlug}/client`],
  ] as const

  return (
    <section className="page-view agency-profile-view">
      <article className="agency-cockpit-hero">
        <div className="agency-cockpit-identity">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/agencies')}>
            Retour aux agences
          </button>
          <p className="eyebrow">Cockpit agence</p>
          <h1>{agency.name}</h1>
          <p className="subtitle">{agency.sector} · {agency.city}</p>
          <div className="agency-cockpit-meta">
            <span>Statut : {agency.status}</span>
            <span>Site actuel : {websiteLabel}</span>
            <span>Logo : {logoText}</span>
          </div>
        </div>

        <div className="agency-cockpit-status">
          {agency.syncBadge === 'Local non synchronisé' && <span className="sync-badge local">Non synchronisée</span>}
          <div className="agency-cockpit-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate(`/demo/${routeSlug}`)}>
              Ouvrir la démo
            </button>
            <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agencies/${routeSlug}/assistant`)}>
              Modifier avec l’Assistant
            </button>
            <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agencies/${routeSlug}/activation`)}>
              Activer l’agence
            </button>
          </div>
        </div>
      </article>

      <article className="agency-assistant-card">
        <div>
          <p className="eyebrow">Assistant Signature</p>
          <h2>Le chemin le plus simple</h2>
          <p>Décris ce que tu veux obtenir. L’assistant prépare une proposition claire avant toute application.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agencies/${routeSlug}/assistant`)}>
          Ouvrir l’Assistant Signature
        </button>
      </article>

      <section className="cockpit-section">
        <div>
          <p className="eyebrow">État de la démo</p>
          <h2>Vue d’ensemble</h2>
        </div>
        <div className="cockpit-status-grid">
          {demoIndicators.map((indicator) => (
            <article className={indicator.ready ? 'cockpit-status-card ready' : 'cockpit-status-card'} key={indicator.label}>
              <span>{indicator.ready ? 'Prêt' : 'À faire'}</span>
              <strong>{indicator.value}</strong>
              <p>{indicator.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cockpit-section">
        <div>
          <p className="eyebrow">Actions rapides</p>
          <h2>Améliorer l’expérience</h2>
        </div>
        <div className="cockpit-action-grid">
          {quickActions.map(([label, destination]) => (
            <button className="secondary-button" type="button" key={label} onClick={() => onNavigate(destination)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="cockpit-section">
        <div>
          <p className="eyebrow">Espaces de démo</p>
          <h2>Ouvrir un espace</h2>
        </div>
        <div className="cockpit-space-grid">
          {demoSpaces.map(([label, destination]) => (
            <button className="secondary-button" type="button" key={label} onClick={() => onNavigate(destination)}>
              {label}
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}

function AgencyProfileAppearanceView({
  agencySlug,
  agencies,
  onNavigate,
  onSaved,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const [form, setForm] = useState<AgencyAppearanceFormState>(() => ({
    logoText: agency?.appearance?.logoText ?? agency?.name ?? '',
    primary: agency?.colors.primary ?? '#071b33',
    secondary: agency?.colors.secondary ?? '#f7f1e7',
    accent: agency?.colors.accent ?? '#d7b46a',
    heroTitle: agency ? getAgencyHeroTitle(agency) : '',
    heroSubtitle: agency ? getAgencyHeroSubtitle(agency) : '',
  }))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Apparence</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function updateField(field: keyof AgencyAppearanceFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveAppearance(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (selectedAgency.syncBadge === 'Supabase connecté') {
        await updateAgencyBrandingInSupabase(
          getAgencyRouteSlug(selectedAgency),
          createBrandingInput(selectedAgency, form),
        )
      }

      updateAgencyAppearanceLocally(selectedAgency, form)
      onSaved('Apparence enregistrée.')
      setMessage('Apparence enregistrée.')
    } catch (error) {
      console.warn('Agency appearance sync failed.', error)
      setMessage('Synchronisation Supabase impossible pour le moment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">Apparence</p>
        <h1>Modifier apparence</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <form className="edit-panel form-grid creation-form" onSubmit={saveAppearance}>
        <div className="form-section-title">
          <p className="eyebrow">{selectedAgency.syncBadge}</p>
          <h2>Branding agence</h2>
          <p>Les champs restent modifiables même si Supabase est temporairement indisponible.</p>
        </div>

        <TextField label="Logo texte" value={form.logoText} onChange={(value) => updateField('logoText', value)} />
        <TextField label="Couleur principale" value={form.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={form.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={form.accent} onChange={(value) => updateField('accent', value)} />
        <TextField label="Titre principal" value={form.heroTitle} onChange={(value) => updateField('heroTitle', value)} />
        <TextField label="Sous-titre" value={form.heroSubtitle} onChange={(value) => updateField('heroSubtitle', value)} />

        <div className="actions form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer l’apparence'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}`)}
          >
            Retour à la fiche agence
          </button>
          {message && <p className="save-message">{message}</p>}
        </div>
      </form>
    </section>
  )
}

function AgencyProfileDesignView({
  agencySlug,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const {
    design,
    setDesign,
    message: loadMessage,
  } = useAgencySpaceDesign(agency, agencySlug)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Design des espaces</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function updateDesign(field: keyof Pick<AgencySpaceDesign, 'visualStyle' | 'cardStyle' | 'buttonStyle' | 'density'>, value: string) {
    setDesign((current) => normalizeAgencySpaceDesign({ ...current, [field]: value }))
  }

  function updateSpaceCopy(space: DynamicAgencySpace, field: 'title' | 'subtitle', value: string) {
    setDesign((current) => normalizeAgencySpaceDesign({
      ...current,
      spaces: {
        ...current.spaces,
        [space]: {
          ...current.spaces[space],
          [field]: value,
        },
      },
    }))
  }

  async function saveDesign(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const savedDesign = await saveAgencySpaceDesign(selectedAgency, design)
      setDesign(savedDesign)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? 'Design des espaces enregistré dans Supabase.'
          : 'Design des espaces enregistré localement.',
      )
    } catch (error) {
      console.warn('Agency space design save failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? `Design enregistré localement. ${formatSupabaseError(error)}`
          : 'Impossible d’enregistrer le design pour le moment.',
      )
    } finally {
      setSaving(false)
    }
  }

  const routeSlug = getAgencyRouteSlug(selectedAgency)
  const tokens = getSpaceVisualTokens(selectedAgency, design)

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Design des espaces</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <form className="edit-panel form-grid" onSubmit={saveDesign}>
        <div className="form-section-title">
          <p className="eyebrow">Style global</p>
          <h2>Personnalisation visuelle</h2>
          <p>Ces réglages s’appliquent à la démo agence et aux espaces public, patron, agent et client.</p>
        </div>

        <SelectField label="Style visuel global" value={design.visualStyle} options={visualStyleOptions} onChange={(value) => updateDesign('visualStyle', value)} />
        <SelectField label="Style des cartes" value={design.cardStyle} options={cardStyleOptions} onChange={(value) => updateDesign('cardStyle', value)} />
        <SelectField label="Style des boutons" value={design.buttonStyle} options={buttonStyleOptions} onChange={(value) => updateDesign('buttonStyle', value)} />
        <SelectField label="Densité visuelle" value={design.density} options={densityOptions} onChange={(value) => updateDesign('density', value)} />

        <div className="form-section-title">
          <p className="eyebrow">Espaces</p>
          <h2>Titres et sous-titres</h2>
        </div>

        {dynamicAgencySpaces.map((spaceConfig) => {
          const spaceCopy = getAgencySpaceCopy(design, spaceConfig.slug)

          return (
            <article className="info-card" key={spaceConfig.slug}>
              <p className="eyebrow">{spaceConfig.slug}</p>
              <TextField
                label={`Titre ${spaceConfig.title.toLowerCase()}`}
                value={spaceCopy.title}
                onChange={(value) => updateSpaceCopy(spaceConfig.slug, 'title', value)}
              />
              <TextAreaField
                label={`Sous-titre ${spaceConfig.title.toLowerCase()}`}
                value={spaceCopy.subtitle}
                onChange={(value) => updateSpaceCopy(spaceConfig.slug, 'subtitle', value)}
              />
            </article>
          )
        })}

        <article className="info-card" style={getSpacePanelStyle(design, selectedAgency)}>
          <p className="eyebrow">Aperçu local</p>
          <h2 style={{ color: tokens.panelText }}>{getAgencySpaceCopy(design, 'public').title}</h2>
          <p>{getAgencySpaceCopy(design, 'public').subtitle}</p>
          <button className="secondary-button compact" type="button" style={getSpaceButtonStyle(design, selectedAgency)}>
            Exemple de bouton
          </button>
        </article>

        <div className="actions form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer le design'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate(`/admin/agencies/${routeSlug}`)}
          >
            Retour à la fiche agence
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate(`/demo/${routeSlug}`)}
          >
            Ouvrir la démo
          </button>
          {(loadMessage || message) && <p className="save-message">{message || loadMessage}</p>}
        </div>
      </form>
    </section>
  )
}

function AgencyProfilePagesView({
  agencySlug,
  agencies,
  onNavigate,
  onSaved,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const [pages, setPages] = useState<AgencyPageListing[]>(() => agency ? readStoredPagesForAgency(agency) : [])
  const [form, setForm] = useState<AgencyPageFormState>({
    title: 'Estimation offerte',
    slug: 'estimation-offerte',
    space: 'public',
    content: 'Une page pour présenter l’estimation offerte.',
    status: 'publié',
  })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!agency) return

    let cancelled = false
    setPages(readStoredPagesForAgency(agency))

    if (agency.syncBadge !== 'Supabase connecté') return

    getAgencyPagesFromSupabase(getAgencyRouteSlug(agency))
      .then((remotePages) => {
        if (cancelled) return
        setPages(remotePages.map((page) => ({ ...page, source: 'Supabase' as const })))
      })
      .catch((error) => {
        console.warn('Supabase agency pages read failed.', error)
        if (!cancelled) setMessage('Lecture Supabase impossible pour le moment.')
      })

    return () => {
      cancelled = true
    }
  }, [agency, agencySlug])

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Pages personnalisées</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function updateField(field: keyof AgencyPageFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    if (!form.title.trim() || !form.slug.trim()) {
      setSaving(false)
      setMessage('Le titre et le slug sont obligatoires.')
      return
    }

    const pageInput: AgencyPageInput = {
      title: form.title.trim(),
      slug: createSlug(form.slug),
      space: form.space,
      content: form.content.trim(),
      status: form.status,
    }

    try {
      if (selectedAgency.syncBadge === 'Supabase connecté') {
        const page = await createAgencyPageInSupabase(getAgencyRouteSlug(selectedAgency), pageInput)
        setPages((current) => [
          ...current.filter((item) => item.slug !== page.slug),
          { ...page, source: 'Supabase' as const },
        ])
      } else {
        const page = saveLocalAgencyPage(selectedAgency, pageInput)
        setPages(readStoredPagesForAgency(selectedAgency).filter((item) => item.slug !== page.slug).concat(page))
      }

      setShowForm(false)
      setMessage('Page personnalisée enregistrée.')
      onSaved('Page personnalisée enregistrée.')
    } catch (error) {
      console.warn('Agency page save failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? formatSupabaseError(error)
          : 'Impossible d’enregistrer la page pour le moment.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Pages personnalisées</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => setShowForm((current) => !current)}>
          Créer une page
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}`)}
        >
          Retour à la fiche agence
        </button>
      </div>

      {message && <p className="save-message">{message}</p>}

      {showForm && (
        <form className="edit-panel form-grid" onSubmit={submit}>
          <TextField label="Titre" value={form.title} onChange={(value) => updateField('title', value)} />
          <TextField label="Slug" value={form.slug} onChange={(value) => updateField('slug', value)} />
          <SelectField
            label="Espace"
            value={form.space}
            options={['public', 'patron', 'agent', 'client']}
            onChange={(value) => updateField('space', value as AgencyPageFormState['space'])}
          />
          <TextAreaField label="Contenu simple" value={form.content} onChange={(value) => updateField('content', value)} />
          <SelectField
            label="Statut"
            value={form.status}
            options={['brouillon', 'publié']}
            onChange={(value) => updateField('status', value as AgencyPageFormState['status'])}
          />
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer la page'}
          </button>
        </form>
      )}

      <div className="list-grid">
        {pages.length === 0 && (
          <article className="info-card">
            <h2>Aucune page personnalisée</h2>
            <p>Créez une première page pour préparer le contenu de cette agence.</p>
          </article>
        )}

        {pages.map((page) => (
          <article className="list-card" key={`${page.source}-${page.id}-${page.slug}`}>
            <div>
              <p className="eyebrow">{page.space} · {page.status} · {page.source}</p>
              <h2>{page.title}</h2>
              <p>/{page.slug}</p>
              <p>{page.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AgencyProfileButtonsView({
  agencySlug,
  agencies,
  onNavigate,
  onSaved,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const [buttons, setButtons] = useState<AgencyButtonListing[]>(() => agency ? readStoredButtonsForAgency(agency) : [])
  const [form, setForm] = useState<AgencyButtonFormState>({
    label: 'Demander une estimation',
    destination: '/offre-estimation',
    placement: 'hero',
    space: 'public',
    status: 'actif',
  })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!agency) return

    let cancelled = false
    setButtons(readStoredButtonsForAgency(agency))

    if (agency.syncBadge !== 'Supabase connecté') return

    getAgencyButtonsFromSupabase(getAgencyRouteSlug(agency))
      .then((remoteButtons) => {
        if (cancelled) return
        setButtons(remoteButtons.map((button) => ({ ...button, source: 'Supabase' as const })))
      })
      .catch((error) => {
        console.warn('Supabase agency buttons read failed.', error)
        if (!cancelled) setMessage(formatSupabaseError(error))
      })

    return () => {
      cancelled = true
    }
  }, [agency, agencySlug])

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Boutons personnalisés</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function updateField(field: keyof AgencyButtonFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    if (!form.label.trim() || !form.destination.trim() || !form.placement.trim()) {
      setSaving(false)
      setMessage('Le texte, la destination et l’emplacement sont obligatoires.')
      return
    }

    const buttonInput: AgencyButtonInput = {
      label: form.label.trim(),
      destination: form.destination.trim(),
      placement: form.placement.trim(),
      space: form.space,
      status: form.status,
    }

    try {
      if (selectedAgency.syncBadge === 'Supabase connecté') {
        const button = await createAgencyButtonInSupabase(getAgencyRouteSlug(selectedAgency), buttonInput)
        setButtons((current) => [...current, { ...button, source: 'Supabase' as const }])
      } else {
        const button = saveLocalAgencyButton(selectedAgency, buttonInput)
        setButtons(readStoredButtonsForAgency(selectedAgency).filter((item) => item.id !== button.id).concat(button))
      }

      setShowForm(false)
      setMessage('Bouton personnalisé enregistré.')
      onSaved('Bouton personnalisé enregistré.')
    } catch (error) {
      console.warn('Agency button save failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? formatSupabaseError(error)
          : 'Impossible d’enregistrer le bouton pour le moment.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Boutons personnalisés</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => setShowForm((current) => !current)}>
          Créer un bouton
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}`)}
        >
          Retour à la fiche agence
        </button>
      </div>

      {message && <p className="save-message">{message}</p>}

      {showForm && (
        <form className="edit-panel form-grid" onSubmit={submit}>
          <TextField label="Texte du bouton" value={form.label} onChange={(value) => updateField('label', value)} />
          <TextField label="Destination / URL cible" value={form.destination} onChange={(value) => updateField('destination', value)} />
          <TextField label="Emplacement" value={form.placement} onChange={(value) => updateField('placement', value)} />
          <SelectField
            label="Espace"
            value={form.space}
            options={['public', 'patron', 'agent', 'client']}
            onChange={(value) => updateField('space', value as AgencyButtonFormState['space'])}
          />
          <SelectField
            label="Statut"
            value={form.status}
            options={['actif', 'inactif']}
            onChange={(value) => updateField('status', value as AgencyButtonFormState['status'])}
          />
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer le bouton'}
          </button>
        </form>
      )}

      <div className="list-grid">
        {buttons.length === 0 && (
          <article className="info-card">
            <h2>Aucun bouton personnalisé</h2>
            <p>Créez un premier bouton pour préparer les appels à l’action de cette agence.</p>
          </article>
        )}

        {buttons.map((button) => (
          <article className="list-card" key={`${button.source}-${button.id}-${button.label}`}>
            <div>
              <p className="eyebrow">{button.space} · {button.placement} · {button.status} · {button.source}</p>
              <h2>{button.label}</h2>
              <p>{button.destination}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AgencyProfileModulesView({
  agencySlug,
  agencies,
  onNavigate,
  onSaved,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const [modules, setModules] = useState<AgencyModuleListing[]>(() => agency ? readStoredModulesForAgency(agency) : [])
  const [savingKey, setSavingKey] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!agency) return

    let cancelled = false
    setModules(readStoredModulesForAgency(agency))

    if (agency.syncBadge !== 'Supabase connecté') return

    getAgencyModulesFromSupabase(getAgencyRouteSlug(agency))
      .then((remoteModules) => {
        if (cancelled) return

        const moduleMap = new Map<string, AgencyModuleListing>()
        readStoredModulesForAgency(agency).forEach((module) => moduleMap.set(module.key, module))
        remoteModules.forEach((module) => moduleMap.set(module.key, { ...module, source: 'Supabase' as const }))
        setModules(agencyModuleDefinitions.map(([key]) => moduleMap.get(key) ?? {
          id: `${agency.id}-${key}`,
          agencyId: agency.id,
          key,
          name: getAgencyModuleLabel(key),
          enabled: false,
          source: 'Supabase' as const,
          createdAt: '',
        }))
      })
      .catch((error) => {
        console.warn('Supabase agency modules read failed.', error)
        if (!cancelled) setMessage(formatSupabaseError(error))
      })

    return () => {
      cancelled = true
    }
  }, [agency, agencySlug])

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Modules activables</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function getModuleState(key: string) {
    return modules.find((module) => module.key === key)?.enabled ?? false
  }

  function getModuleSource(key: string) {
    return modules.find((module) => module.key === key)?.source ?? (
      selectedAgency.syncBadge === 'Supabase connecté' ? 'Supabase' : 'Local'
    )
  }

  async function toggleModule(key: string) {
    const nextEnabled = !getModuleState(key)
    const moduleInput: AgencyModuleInput = { key, enabled: nextEnabled }

    setSavingKey(key)
    setMessage('')

    try {
      if (selectedAgency.syncBadge === 'Supabase connecté') {
        const module = await upsertAgencyModuleInSupabase(getAgencyRouteSlug(selectedAgency), moduleInput)
        setModules((current) => [
          ...current.filter((item) => item.key !== module.key),
          { ...module, source: 'Supabase' as const },
        ])
      } else {
        const module = saveLocalAgencyModule(selectedAgency, moduleInput)
        setModules((current) => [
          ...current.filter((item) => item.key !== module.key),
          module,
        ])
      }

      const successMessage = nextEnabled ? 'Module activé.' : 'Module désactivé.'
      setMessage(successMessage)
      onSaved(successMessage)
    } catch (error) {
      console.warn('Agency module save failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? formatSupabaseError(error)
          : 'Impossible d’enregistrer le module pour le moment.',
      )
    } finally {
      setSavingKey('')
    }
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Modules activables</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <div className="actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}`)}
        >
          Retour à la fiche agence
        </button>
      </div>

      {message && <p className="save-message">{message}</p>}

      <div className="list-grid">
        {agencyModuleDefinitions.map(([key, label]) => {
          const active = getModuleState(key)
          const source = getModuleSource(key)

          return (
            <article className="list-card" key={key}>
              <div>
                <p className="eyebrow">{active ? 'actif' : 'inactif'} · {source}</p>
                <h2>{label}</h2>
                <p>{key}</p>
              </div>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => toggleModule(key)}
                disabled={savingKey === key}
              >
                {savingKey === key ? 'Enregistrement...' : active ? 'Désactiver' : 'Activer'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function AgencyProfileActivationView({
  agencySlug,
  agencies,
  onNavigate,
  onActivated,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
  onActivated: FlashSetter
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const {
    pages: agencyPages,
    buttons: agencyButtons,
    modules: agencyModules,
    message: elementsMessage,
  } = useAgencyCustomElements(agency, agencySlug)
  const [status, setStatus] = useState(() => agency?.status ?? '')
  const [activating, setActivating] = useState(false)
  const [message, setMessage] = useState('')

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Activation</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency
  const routeSlug = getAgencyRouteSlug(selectedAgency)
  const publishedPages = agencyPages.filter((page) => page.status === 'publié')
  const activeButtons = agencyButtons.filter((button) => button.status === 'actif')
  const activeModules = agencyModules.filter((module) => module.enabled && module.key !== spaceDesignModuleKey)
  const activeLinks = [
    ['Lien public', `/demo/${routeSlug}/public`],
    ['Lien patron', `/demo/${routeSlug}/patron`],
    ['Lien agent', `/demo/${routeSlug}/agent`],
    ['Lien client / vendeur', `/demo/${routeSlug}/client`],
  ] as const
  const checklist: AgencyActivationChecklistItem[] = [
    {
      label: 'Apparence configurée',
      status: getActivationStatus(Boolean(selectedAgency.appearance?.heroTitle || selectedAgency.appearance?.logoText)),
    },
    {
      label: 'Démo dynamique disponible',
      status: 'prêt',
    },
    {
      label: 'Espaces public / patron / agent / client disponibles',
      status: 'prêt',
    },
    {
      label: 'Pages publiées prêtes',
      status: getActivationStatus(publishedPages.length > 0),
    },
    {
      label: 'Boutons actifs prêts',
      status: getActivationStatus(activeButtons.length > 0),
    },
    {
      label: 'Modules sélectionnés prêts',
      status: getActivationStatus(activeModules.length > 0),
    },
    {
      label: 'Liens d’accès prêts',
      status: 'prêt',
    },
    {
      label: 'Emails d’invitation à préparer plus tard',
      status: 'à vérifier',
    },
  ]

  async function activateAgency() {
    const confirmed = window.confirm('Cette agence va passer en statut active. Continuer ?')
    if (!confirmed) return

    setActivating(true)
    setMessage('')

    try {
      if (selectedAgency.syncBadge === 'Supabase connecté') {
        await updateAgencyStatusInSupabase(routeSlug, 'active')
      }

      updateAgencyStatusLocally(selectedAgency, 'active')
      setStatus('active')
      setMessage('Agence activée')
      onActivated('Agence activée')
    } catch (error) {
      console.warn('Agency activation failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? formatSupabaseError(error)
          : 'Activation impossible pour le moment.',
      )
    } finally {
      setActivating(false)
    }
  }

  function prepareEmail(label: string) {
    setMessage(`${label} : préparation des emails bientôt disponible.`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Activation</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <article className="agency-cockpit-hero">
        <div className="agency-cockpit-identity">
          <p className="eyebrow">Statut actuel</p>
          <h2>{status || selectedAgency.status}</h2>
          <p>Vérifiez les éléments avant d’activer cette agence.</p>
        </div>
        <div className="agency-cockpit-actions">
          <button className="primary-button" type="button" onClick={activateAgency} disabled={activating}>
            {activating ? 'Activation...' : 'Confirmer l’activation'}
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agencies/${routeSlug}`)}>
            Retour à la fiche agence
          </button>
        </div>
      </article>

      {(elementsMessage || message) && <p className="save-message">{message || elementsMessage}</p>}

      <section className="cockpit-section">
        <div>
          <p className="eyebrow">Checklist d’activation</p>
          <h2>Avant de passer active</h2>
        </div>
        <div className="cockpit-status-grid activation-checklist-grid">
          {checklist.map((item) => (
            <article
              className={`cockpit-status-card ${
                item.status === 'prêt'
                  ? 'activation-status-ready'
                  : item.status === 'manquant'
                    ? 'activation-status-missing'
                    : 'activation-status-check'
              }`}
              key={item.label}
            >
              <span>{item.status}</span>
              <strong>{item.status === 'prêt' ? 'OK' : item.status === 'manquant' ? '!' : '...'}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      {status === 'active' && (
        <section className="cockpit-section">
          <div>
            <p className="eyebrow">Liens actifs</p>
            <h2>Accès à partager</h2>
          </div>
          <div className="list-grid">
            {activeLinks.map(([label, path]) => {
              const fullUrl = `${window.location.origin}${path}`

              return (
                <article className="list-card" key={path}>
                  <div>
                    <p className="eyebrow">{label}</p>
                    <h2>{path}</h2>
                    <p>{fullUrl}</p>
                  </div>
                  <button
                    className="secondary-button compact"
                    type="button"
                    onClick={() => copyLocalText(fullUrl, setMessage, 'Lien copié')}
                  >
                    Copier
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <section className="cockpit-section">
        <div>
          <p className="eyebrow">Emails à préparer</p>
          <h2>Invitations bientôt disponibles</h2>
        </div>
        <div className="cockpit-action-grid">
          <button className="secondary-button" type="button" onClick={() => prepareEmail('Mail patron')}>
            Préparer le mail patron
          </button>
          <button className="secondary-button" type="button" onClick={() => prepareEmail('Mail agent')}>
            Préparer le mail agent
          </button>
          <button className="secondary-button" type="button" onClick={() => prepareEmail('Mail client / vendeur')}>
            Préparer le mail client / vendeur
          </button>
        </div>
      </section>
    </section>
  )
}

function AgencyProfileChatGptImportView({
  agencySlug,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const [rawProposal, setRawProposal] = useState('')
  const [draft, setDraft] = useState<ChatGptImportDraft | null>(null)
  const [preview, setPreview] = useState<AgencyAssistantApplication | null>(null)
  const [appliedItems, setAppliedItems] = useState<string[]>([])
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [message, setMessage] = useState('')

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Proposition ChatGPT</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function analyzeProposal(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    if (!rawProposal.trim()) {
      setMessage('Colle d’abord une proposition ChatGPT.')
      return
    }

    setDraft(createChatGptImportDraft(rawProposal))
    setPreview(null)
    setAppliedItems([])
    setApplied(false)
    setMessage('Proposition transformée en brouillon structuré.')
  }

  function previewDraft() {
    if (!draft) return

    setPreview(createChatGptImportApplication(draft))
    setMessage('Prévisualisation locale prête.')
  }

  async function applyDraft() {
    if (!draft || applied || applying) return

    const application = createChatGptImportApplication(draft)
    setApplying(true)
    setMessage('')

    try {
      const nextAppliedItems = await applyAgencyGeneratedElements(selectedAgency, application)

      setPreview(application)
      setAppliedItems(nextAppliedItems)
      setApplied(true)
      setMessage('Proposition ChatGPT appliquée. Les éléments déjà existants ont été conservés.')
    } catch (error) {
      console.warn('ChatGPT proposal apply failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? formatSupabaseError(error)
          : 'Impossible d’appliquer la proposition ChatGPT pour le moment.',
      )
    } finally {
      setApplying(false)
    }
  }

  function cancelDraft() {
    setDraft(null)
    setPreview(null)
    setAppliedItems([])
    setApplied(false)
    setMessage('Brouillon annulé.')
  }

  const routeSlug = getAgencyRouteSlug(selectedAgency)

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Proposition ChatGPT</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <form className="edit-panel form-grid" onSubmit={analyzeProposal}>
        <div className="form-section-title">
          <p className="eyebrow">Import local</p>
          <h2>Analyse préparée à côté</h2>
          <p>Collez ici une analyse préparée dans ChatGPT. Le Studio la transformera en brouillon avant application.</p>
        </div>

        <TextAreaField label="Proposition ChatGPT" value={rawProposal} onChange={setRawProposal} />

        <div className="actions form-actions">
          <button className="primary-button" type="submit">
            Analyser la proposition
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate(`/admin/agencies/${routeSlug}`)}
          >
            Retour à la fiche agence
          </button>
          {message && <p className="save-message">{message}</p>}
        </div>
      </form>

      {draft && (
        <article className="demo-panel">
          <p className="eyebrow">Brouillon structuré</p>
          <h2>Proposition prête à valider</h2>

          <div className="list-grid">
            <article className="list-card">
              <div>
                <p className="eyebrow">Douleur client</p>
                <h2>{draft.clientPain}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Failles détectées</p>
                <h2>{draft.weaknesses}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Angle de vente</p>
                <h2>{draft.salesAngle}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Page à créer</p>
                <h2>{draft.pageTitle}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Bouton à créer</p>
                <h2>{draft.buttonLabel}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Module à activer</p>
                <h2>{getAgencyModuleLabel(draft.moduleKey)}</h2>
                <p>{draft.moduleKey}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Titre proposé</p>
                <h2>{draft.heroTitle}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Sous-titre proposé</p>
                <h2>{draft.heroSubtitle}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Pitch commercial</p>
                <h2>{draft.salesPitch}</h2>
              </div>
            </article>
          </div>

          <div className="inline-actions">
            <button className="secondary-button compact" type="button" onClick={previewDraft}>
              Prévisualiser
            </button>
            <button
              className="primary-button compact"
              type="button"
              onClick={applyDraft}
              disabled={applied || applying}
            >
              {applying ? 'Application...' : applied ? 'Proposition appliquée' : 'Appliquer'}
            </button>
            <button className="secondary-button compact" type="button" onClick={cancelDraft}>
              Annuler
            </button>
          </div>
        </article>
      )}

      {preview && (
        <article className="demo-panel">
          <p className="eyebrow">Prévisualisation</p>
          <h2>Ce qui serait créé</h2>
          <div className="list-grid">
            <article className="list-card">
              <div>
                <p className="eyebrow">Page</p>
                <h2>{preview.page.title}</h2>
                <p>/{preview.page.slug} · {preview.page.space}</p>
                <p>{preview.page.content}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Bouton</p>
                <h2>{preview.button.label}</h2>
                <p>{preview.button.destination} · {preview.button.placement}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Module</p>
                <h2>{preview.module.name}</h2>
                <p>{preview.module.key}</p>
              </div>
            </article>
            {draft && (
              <article className="list-card">
                <div>
                  <p className="eyebrow">Textes proposés</p>
                  <h2>{draft.heroTitle}</h2>
                  <p>{draft.heroSubtitle}</p>
                  <p>{draft.salesPitch}</p>
                </div>
              </article>
            )}
          </div>
        </article>
      )}

      {appliedItems.length > 0 && (
        <article className="info-card">
          <p className="eyebrow">Application</p>
          <h2>Proposition ChatGPT appliquée.</h2>
          <div className="profile-facts">
            {appliedItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

function AgencyProfileAssistantView({
  agencySlug,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const importedAssistantRequest = getAssistantPrefillState()
  const [prompt, setPrompt] = useState(() => importedAssistantRequest?.prompt ?? '')
  const [proposal, setProposal] = useState<AgencyAssistantProposal | null>(null)
  const [preview, setPreview] = useState<AgencyAssistantApplication | null>(null)
  const [appliedItems, setAppliedItems] = useState<string[]>([])
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [message, setMessage] = useState(() => importedAssistantRequest?.message ?? '')

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Assistant IA</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function prepareProposal(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    if (!prompt.trim()) {
      setMessage('Décris d’abord ce que tu veux modifier.')
      return
    }

    setProposal(createAssistantDraft(prompt, selectedAgency))
    setPreview(null)
    setAppliedItems([])
    setApplied(false)
    setMessage('Brouillon préparé localement.')
  }

  function previewProposal() {
    if (!proposal) return

    setPreview(createAssistantApplication(proposal))
    setMessage('Prévisualisation locale prête.')
  }

  async function applyProposal() {
    if (!proposal || applied || applying) return

    const application = createAssistantApplication(proposal)
    setApplying(true)
    setMessage('')

    try {
      const nextAppliedItems = await applyAgencyGeneratedElements(selectedAgency, application)

      setPreview(application)
      setAppliedItems(nextAppliedItems)
      setApplied(true)
      setMessage('Proposition appliquée. Les éléments déjà existants ont été conservés.')
    } catch (error) {
      console.warn('Assistant proposal apply failed.', error)
      setMessage(
        selectedAgency.syncBadge === 'Supabase connecté'
          ? formatSupabaseError(error)
          : 'Impossible d’appliquer la proposition pour le moment.',
      )
    } finally {
      setApplying(false)
    }
  }

  function cancelProposal() {
    setProposal(null)
    setPreview(null)
    setAppliedItems([])
    setApplied(false)
    setMessage('Proposition annulée.')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Assistant IA</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <form className="edit-panel form-grid" onSubmit={prepareProposal}>
        <div className="form-section-title">
          <p className="eyebrow">Brouillon local</p>
          <h2>Copilote agence</h2>
          <p>Décris ce que tu veux modifier. L’assistant préparera un brouillon avant application.</p>
        </div>

        <TextAreaField label="Que veux-tu modifier ?" value={prompt} onChange={setPrompt} />

        <div className="actions form-actions">
          <button className="primary-button" type="submit">
            Préparer une proposition
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}`)}
          >
            Retour à la fiche agence
          </button>
          {message && <p className="save-message">{message}</p>}
        </div>
      </form>

      {proposal && (
        <article className="demo-panel">
          <p className="eyebrow">Proposition de l’assistant</p>
          <h2>Brouillon non appliqué</h2>

          <div className="list-grid">
            <article className="list-card">
              <div>
                <p className="eyebrow">Texte principal proposé</p>
                <h2>{proposal.heroTitle}</h2>
                <p>{proposal.heroSubtitle}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Pages recommandées</p>
                <h2>{proposal.pages.join(', ')}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Boutons recommandés</p>
                <h2>{proposal.buttons.join(', ')}</h2>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Modules recommandés</p>
                <h2>{proposal.modules.join(', ')}</h2>
              </div>
            </article>
          </div>

          <div className="inline-actions">
            <button
              className="secondary-button compact"
              type="button"
              onClick={previewProposal}
            >
              Prévisualiser
            </button>
            <button
              className="primary-button compact"
              type="button"
              onClick={applyProposal}
              disabled={applied || applying}
            >
              {applying ? 'Application...' : applied ? 'Proposition appliquée' : 'Appliquer'}
            </button>
            <button className="secondary-button compact" type="button" onClick={cancelProposal}>
              Annuler
            </button>
          </div>
        </article>
      )}

      {preview && (
        <article className="demo-panel">
          <p className="eyebrow">Prévisualisation locale</p>
          <h2>Éléments prêts à créer</h2>
          <div className="list-grid">
            <article className="list-card">
              <div>
                <p className="eyebrow">Page à créer · brouillon</p>
                <h2>{preview.page.title}</h2>
                <p>/{preview.page.slug} · {preview.page.space}</p>
                <p>{preview.page.content}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Bouton à créer · actif</p>
                <h2>{preview.button.label}</h2>
                <p>{preview.button.destination} · {preview.button.placement} · {preview.button.space}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Module à activer</p>
                <h2>{preview.module.name}</h2>
                <p>{preview.module.key}</p>
              </div>
            </article>
          </div>
        </article>
      )}

      {appliedItems.length > 0 && (
        <article className="info-card">
          <p className="eyebrow">Application</p>
          <h2>Proposition appliquée.</h2>
          <div className="profile-facts">
            {appliedItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

function AgencyProfileWebsiteAnalysisView({
  agencySlug,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const [siteUrl, setSiteUrl] = useState(() => agency?.currentSite?.trim() ?? '')
  const [analysis, setAnalysis] = useState<AgencyWebsiteAnalysisResult | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [message, setMessage] = useState('')

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Analyse du site actuel</p>
          <h1>Agence introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans la liste locale.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agencies')}>
          Retour aux agences
        </button>
      </section>
    )
  }
  const selectedAgency = agency

  function runAnalysis(event: FormEvent) {
    event.preventDefault()
    setAnalysis(createWebsiteAnalysis(selectedAgency))
    setPreviewVisible(false)
    setMessage('Analyse locale simulée prête.')
  }

  function prepareAssistantRequest() {
    if (!analysis) return

    onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}/assistant`, {
      assistantPrefill: {
        prompt: createAssistantPromptFromWebsiteAnalysis(analysis),
        message: 'Analyse importée dans l’Assistant IA.',
      },
    })
  }

  function cancelAnalysis() {
    setAnalysis(null)
    setPreviewVisible(false)
    setMessage('Analyse annulée.')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{selectedAgency.syncBadge}</p>
        <h1>Analyse du site actuel</h1>
        <p className="subtitle">{selectedAgency.name}</p>
      </div>

      <form className="edit-panel form-grid" onSubmit={runAnalysis}>
        <div className="form-section-title">
          <p className="eyebrow">Analyse locale</p>
          <h2>Site existant</h2>
          <p>Collez le site existant de l’entreprise. Le Studio préparera une proposition de démo.</p>
        </div>

        <TextField label="URL du site actuel" value={siteUrl} onChange={setSiteUrl} />

        <div className="actions form-actions">
          <button className="primary-button" type="submit">
            Analyser le site
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(selectedAgency)}`)}
          >
            Retour à la fiche agence
          </button>
          {message && <p className="save-message">{message}</p>}
        </div>
      </form>

      {analysis && (
        <article className="demo-panel">
          <p className="eyebrow">Résultat de l’analyse</p>
          <h2>Diagnostic local simulé</h2>

          <div className="list-grid">
            <article className="list-card">
              <div>
                <p className="eyebrow">Identité détectée</p>
                <h2>{analysis.detectedName}</h2>
                <p>{analysis.detectedSector} · {analysis.detectedCity}</p>
                {siteUrl && <p>{siteUrl}</p>}
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Style détecté</p>
                <h2>{analysis.detectedColors.join(', ')}</h2>
                <p>Ton proposé : {analysis.proposedTone.join(', ')}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Points faibles</p>
                <h2>À clarifier</h2>
                <p>{analysis.weaknesses.join(' · ')}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Recommandations</p>
                <h2>{analysis.recommendedPages.join(', ')}</h2>
                <p>Boutons : {analysis.recommendedButtons.join(', ')}</p>
              </div>
            </article>
            <article className="list-card">
              <div>
                <p className="eyebrow">Actions proposées</p>
                <h2>{analysis.recommendedModules.join(', ')}</h2>
                <p>Préparer une base de démo plus guidée sans modifier les données pour l’instant.</p>
              </div>
            </article>
          </div>

          <div className="inline-actions">
            <button className="secondary-button compact" type="button" onClick={() => setPreviewVisible(true)}>
              Prévisualiser la proposition
            </button>
            <button className="primary-button compact" type="button" onClick={prepareAssistantRequest}>
              Préparer dans l’Assistant IA
            </button>
            <button className="secondary-button compact" type="button" onClick={cancelAnalysis}>
              Annuler
            </button>
          </div>
        </article>
      )}

      {analysis && previewVisible && (
        <article className="info-card">
          <p className="eyebrow">Prévisualisation locale</p>
          <h2>Proposition de démo</h2>
          <div className="profile-facts">
            <span>Pages : {analysis.recommendedPages.join(', ')}</span>
            <span>Boutons : {analysis.recommendedButtons.join(', ')}</span>
            <span>Modules : {analysis.recommendedModules.join(', ')}</span>
            <span>Ton : {analysis.proposedTone.join(', ')}</span>
          </div>
        </article>
      )}
    </section>
  )
}

function NewAgencyView({ onNavigate, onCreated }: { onNavigate: Navigate; onCreated: FlashSetter }) {
  const [form, setForm] = useState({
    name: '',
    sector: 'Immobilier',
    city: 'Tarbes',
    currentSite: 'https://example.com',
    primary: '#071b33',
    secondary: '#f7f1e7',
    accent: '#d7b46a',
    logoText: 'SDC',
  })
  const [message, setMessage] = useState('')

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      setMessage('Le nom de l’entreprise est obligatoire.')
      return
    }

    try {
      const agency = createLocalAgency(form)
      const existingAgencies = readLocalCreatedAgencies()
      const nextAgencies = [
        ...existingAgencies.filter((item) => item.id !== agency.id),
        agency,
      ]

      writeLocalCreatedAgencies(nextAgencies)
      onCreated('Démo créée localement.')
      onNavigate('/admin/agencies')
    } catch {
      setMessage('Impossible d’enregistrer cette démo locale pour le moment.')
    }
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Créer une agence</h1>
        <p className="subtitle">Préparer une démo agence sans écriture de données pour le moment.</p>
      </div>

      <form className="edit-panel form-grid creation-form" onSubmit={submit}>
        <div className="form-section-title">
          <p className="eyebrow">Phase 2A</p>
          <h2>Agence</h2>
          <p>Le formulaire est prêt. La connexion à la création sera ajoutée ensuite.</p>
        </div>
        <TextField label="Nom de l’entreprise" value={form.name} onChange={(value) => updateField('name', value)} />
        <TextField label="Secteur" value={form.sector} onChange={(value) => updateField('sector', value)} />
        <TextField label="Ville" value={form.city} onChange={(value) => updateField('city', value)} />
        <TextField label="Site actuel" value={form.currentSite} onChange={(value) => updateField('currentSite', value)} />
        <TextField label="Couleur principale" value={form.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={form.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={form.accent} onChange={(value) => updateField('accent', value)} />
        <TextField label="Logo texte" value={form.logoText} onChange={(value) => updateField('logoText', value)} />

        <div className="actions form-actions">
          <div className="form-section-title">
            <p className="eyebrow">Création</p>
            <h2>Créer</h2>
            <p>{form.name || 'Nouvelle agence'} · {form.city} · {form.sector}</p>
          </div>
          <button className="primary-button" type="submit">
            Créer la démo
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>
            Annuler
          </button>
          {message && <p className="save-message">{message}</p>}
        </div>
      </form>
    </section>
  )
}

function AgencyDetailView({
  agencyId,
  onNavigate,
  setFlash,
}: {
  agencyId: string
  onNavigate: Navigate
  setFlash: FlashSetter
}) {
  const state = getLocalState()
  const agency = state.agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  const users = getAgencyUsers(agency.id)
  const properties = getAgencyProperties(agency.id)
  const pages = getAgencyPages(agency.id)
  const buttons = getAgencyButtons(agency.id)
  const activeModules = Object.values(agency.modules ?? {}).filter(Boolean).length
  const firstProperty = properties[0]
  const owner = users.find((user) => user.role === 'patron')
  const agent = users.find((user) => user.role === 'agent')
  const nextAction = !firstProperty
    ? {
        label: 'Créer une annonce',
        text: 'Ajoute le premier bien pour activer le parcours vendeur.',
        route: `/admin/agences/${agency.id}/annonces/new`,
      }
    : !agency.appearance?.heroImageUrl
      ? {
          label: 'Personnaliser apparence',
          text: 'Ajoute une image ou ajuste les couleurs avant audit.',
          route: `/admin/agences/${agency.id}/apparence`,
        }
      : {
          label: 'Voir la démo complète',
          text: 'Tout est prêt pour parcourir les espaces.',
          route: `/admin/agences/${agency.id}/demo`,
        }

  return (
    <section className="page-view agency-command">
      <div className="calm-heading">
        <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/agences')}>
          Retour
        </button>
        <p className="eyebrow">{agency.city} · {agency.sector}</p>
        <h1>{agency.name}</h1>
        <p className="subtitle">{agency.status}</p>
      </div>

      <article className="guided-card recommended-card">
        <div>
          <p className="eyebrow">Prochaine action recommandee</p>
          <h2>{nextAction.label}</h2>
          <p>{nextAction.text}</p>
          <p className="microcopy">Modification locale uniquement.</p>
        </div>
        <button className="primary-button compact" type="button" onClick={() => onNavigate(nextAction.route)}>
          Continuer
        </button>
      </article>

      <section className="calm-section">
        <p className="eyebrow">Parcours agence</p>
        <div className="step-cards">
          <article className="quiet-card">
            <span className="step-number">1</span>
            <h2>Identite</h2>
            <p>Nom, secteur, site actuel, coordonnees.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/analyse`)}>
              Modifier
            </button>
          </article>
          <article className="quiet-card">
            <span className="step-number">2</span>
            <h2>Apparence</h2>
            <p>Logo, couleurs, ambiance.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/apparence`)}>
              Modifier
            </button>
          </article>
          <article className="quiet-card">
            <span className="step-number">3</span>
            <h2>Annonces</h2>
            <p>Biens, descriptions, photos, visites.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces`)}>
              Gerer
            </button>
          </article>
          <article className="quiet-card">
            <span className="step-number">4</span>
            <h2>Espaces</h2>
            <p>Public, patron, agent, vendeur.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/demo`)}>
              Ouvrir
            </button>
          </article>
        </div>
      </section>



      <section className="calm-section">
        <p className="eyebrow">Activation</p>
        <div className="step-cards">
          {[
            ['Équipe', 'Patron, agents et vendeurs liés.', `/admin/agences/${agency.id}/equipe`],
            ['Invitations', 'Liens patron, agent et vendeur simulés.', `/admin/agences/${agency.id}/invitations`],
            ['Accès', 'Tokens, liens publics et espaces générés.', `/admin/agences/${agency.id}/acces`],
            ['Emails', 'Prévisualisation et envoi simulé.', `/admin/agences/${agency.id}/emails`],
            ['Paiement', 'Lien de paiement prêt à connecter.', `/admin/agences/${agency.id}/paiement`],
            ['Suivi', 'Mises à jour visibles côté vendeur.', `/admin/agences/${agency.id}/suivi`],
          ].map(([title, text, nextRoute]) => (
            <article className="quiet-card" key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(nextRoute)}>
                Ouvrir
              </button>
            </article>
          ))}
        </div>
      </section>

      <article className="guided-card compact-guided">
        <div>
          <p className="eyebrow">Voir le rendu</p>
          <h2>Liens rapides</h2>
        </div>
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}>
            Site public
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/agent`)}>
            Agent
          </button>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() =>
              firstProperty
                ? onNavigate(`/demo/immobilier/agence/${agency.id}/vendeur/${firstProperty.id}`)
                : setFlash('Creez une annonce pour generer un espace vendeur.')
            }
          >
            Vendeur
          </button>
        </div>
      </article>

      <details className="advanced-box">
        <summary>Personnalisation avancee</summary>
        <div className="advanced-links">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/equipe`)}>Équipe</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/invitations`)}>Invitations</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/emails`)}>Emails</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/paiement`)}>Paiement</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/suivi`)}>Suivi</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/pages`)}>Pages</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/buttons`)}>Boutons</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/modules`)}>Modules</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/analyse`)}>Analyse</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/export`)}>Export</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/acces`)}>Acces</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/ambiance`)}>Ambiance</button>
        </div>
      </details>

      <details className="advanced-box">
        <summary>Danger</summary>
        <div className="advanced-links">
          <button className="secondary-button compact danger-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/danger`)}>
            Ouvrir danger zone
          </button>
        </div>
      </details>

      <div className="page-heading">
        <h1>{agency.name}</h1>
        <p className="subtitle">Fiche agence locale</p>
      </div>

      <div className="card-grid">
        <InfoBlock title="Résumé agence" text={`${agency.sector} · ${agency.city} · ${agency.status}`} />
        <InfoBlock title="Apparence" text={`${agency.colors.primary} · ${agency.colors.secondary} · ${agency.colors.accent}`} />
        <InfoBlock title="Accès" text={`Patron : ${owner?.name ?? 'À compléter'} · Agent : ${agent?.name ?? 'À compléter'}`} />
        <InfoBlock title="Espaces créés" text={firstProperty ? 'Public, patron, agent et vendeur actifs.' : 'Public, patron et agent prêts. Vendeur vide.'} />
        <InfoBlock title="Pages personnalisées" text={`${pages.length} page${pages.length > 1 ? 's' : ''}`} />
        <InfoBlock title="Boutons personnalisés" text={`${buttons.length} bouton${buttons.length > 1 ? 's' : ''}`} />
        <InfoBlock title="Modules actifs" text={`${activeModules} module${activeModules > 1 ? 's' : ''} activé${activeModules > 1 ? 's' : ''}`} />
      </div>

      <article className="demo-panel">
        <p className="eyebrow">Liens rapides</p>
        <div className="inline-actions">
          <button className="primary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}>
            Voir site public
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/patron`)}>
            Ouvrir espace patron
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/agent`)}>
            Ouvrir espace agent
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces`)}>
            Voir les annonces
          </button>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() =>
              firstProperty
                ? onNavigate(`/demo/immobilier/agence/${agency.id}/vendeur/${firstProperty.id}`)
                : setFlash('Créez une annonce pour générer un espace vendeur.')
            }
          >
            Ouvrir espace vendeur
          </button>
        </div>
      </article>

      <section className="agency-panel">
        <div>
          <p className="eyebrow">Annonces</p>
          <h2>{properties.length} annonce{properties.length > 1 ? 's' : ''}</h2>
          <p>Créez une annonce pour alimenter le site public et l’espace vendeur.</p>
        </div>
        <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces/new`)}>
          Créer une annonce
        </button>
      </section>
      <CustomButtons agencyId={agency.id} placement="fiche agence" onNavigate={onNavigate} />

      <div className="list-grid">
        {properties.map((property) => (
          <article className="list-card" key={property.id}>
            <div>
              <p className="eyebrow">{property.status}</p>
              <h2>{property.title}</h2>
              <p>{property.city} · {property.price} · {property.surface}</p>
            </div>
            <div className="inline-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces/${property.id}`)}>
                Gérer
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/vendeur/${property.id}`)}
              >
                Vendeur
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/analyse`)}>
          Analyser / modifier analyse
        </button>
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces/new`)}>
          Créer une annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/apparence`)}>
          Modifier apparence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/ambiance`)}>
          Modifier ambiance
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/acces`)}>
          Voir les accès
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces`)}>
          Voir les annonces
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/pages`)}>
          Créer une page
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/buttons`)}>
          Créer un bouton
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/modules`)}>
          Modules
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/demo`)}>
          Prévisualiser tout
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/export`)}>
          Exporter démo
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>
          Retour aux agences
        </button>
      </div>
    </section>
  )
}

function AgencyAppearanceView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [form, setForm] = useState({
    logoText: agency?.appearance?.logoText ?? agency?.name ?? '',
    primary: agency?.colors.primary ?? 'bleu nuit',
    secondary: agency?.colors.secondary ?? 'crème',
    accent: agency?.colors.accent ?? 'doré doux',
    heroImageUrl: agency?.appearance?.heroImageUrl ?? '',
    backgroundColor: agency?.appearance?.backgroundColor ?? 'crème',
    textColor: agency?.appearance?.textColor ?? 'bleu nuit',
    buttonStyle: agency?.appearance?.buttonStyle ?? 'premium',
    fontStyle: agency?.appearance?.fontStyle ?? 'moderne',
  })
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function saveAppearance(event: FormEvent) {
    event.preventDefault()
    updateAgency(agencyId, {
      colors: {
        primary: form.primary,
        secondary: form.secondary,
        accent: form.accent,
      },
      appearance: {
        logoText: form.logoText,
        heroImageUrl: form.heroImageUrl,
        visualStyle: form.buttonStyle,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        buttonStyle: form.buttonStyle,
        fontStyle: form.fontStyle,
      },
    })
    onSaved('Apparence enregistrée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Modifier apparence</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>
      <form className={`edit-panel form-grid appearance-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={saveAppearance}>
        <div className="form-section-title">
          <p className="eyebrow">Essentiel</p>
          <h2>Identite visuelle</h2>
          <p>Vous pourrez modifier ca plus tard.</p>
        </div>
        <TextField label="Logo URL ou texte" value={form.logoText} onChange={(value) => updateField('logoText', value)} />
        <TextField label="Couleur principale" value={form.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={form.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={form.accent} onChange={(value) => updateField('accent', value)} />
        <TextField label="Image principale" value={form.heroImageUrl} onChange={(value) => updateField('heroImageUrl', value)} />
        <TextField label="Couleur fond" value={form.backgroundColor} onChange={(value) => updateField('backgroundColor', value)} />
        <TextField label="Couleur texte" value={form.textColor} onChange={(value) => updateField('textColor', value)} />
        <SelectField
          label="Style de boutons"
          value={form.buttonStyle}
          options={['arrondi', 'carré doux', 'premium']}
          onChange={(value) => updateField('buttonStyle', value)}
        />
        <SelectField
          label="Police simulée"
          value={form.fontStyle}
          options={['classique', 'moderne', 'luxe', 'institutionnelle']}
          onChange={(value) => updateField('fontStyle', value)}
        />
        <button className="primary-button" type="submit">
          Enregistrer
        </button>
      </form>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Prévisualiser site public
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyAccessView({
  agencyId,
  onNavigate,
  setFlash,
}: {
  agencyId: string
  onNavigate: Navigate
  setFlash: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const firstProperty = getAgencyProperties(agencyId)[0]
  const tokens = getAgencyAccessTokens(agencyId)
  const invitations = getAgencyInvitations(agencyId)
  const links = [
    { label: 'Lien public', route: `/demo/immobilier/agence/${agencyId}/public` },
    { label: 'Lien patron', route: `/demo/immobilier/agence/${agencyId}/patron` },
    { label: 'Lien agent', route: `/demo/immobilier/agence/${agencyId}/agent` },
    {
      label: 'Lien vendeur',
      route: firstProperty
        ? `/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`
        : `/admin/agences/${agencyId}/annonces/new`,
    },
  ]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Accès</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="list-grid">
        {links.map((link) => (
          <article className="list-card" key={link.label}>
            <div>
              <p className="eyebrow">{link.label}</p>
              <h2>{link.route}</h2>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(`${window.location.origin}${link.route}`, setFlash, 'Lien copié')}>
                Copier
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(link.route)}>
                Ouvrir
              </button>
            </div>
          </article>
        ))}
        {tokens.map((token) => (
          <article className="list-card" key={token.id}>
            <div>
              <p className="eyebrow">Token simulé · {token.status}</p>
              <h2>{token.type}</h2>
              <p>/access/{token.token}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(`${window.location.origin}/access/${token.token}`, setFlash, 'Token copié')}>
                Copier lien
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/access/${token.token}`)}>
                Ouvrir lien
              </button>
              <button className="secondary-button compact" type="button" onClick={() => { updateAccessToken(token.id, 'revoked'); setFlash('Accès révoqué localement') }}>
                Révoquer accès
              </button>
            </div>
          </article>
        ))}
        {invitations.map((invitation) => (
          <InfoBlock key={invitation.id} title={`Invitation ${invitation.type}`} text={`${invitation.email} · ${invitation.status}`} />
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/invitations`)}>
          Gérer invitations
        </button>
        <button className="secondary-button" type="button" onClick={() => { createAccessToken({ agencyId, type: 'agent', targetUrl: `/demo/immobilier/agence/${agencyId}/agent` }); setFlash('Accès régénéré localement') }}>
          Régénérer accès agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyTeamView({ agencyId, onNavigate, onSaved }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const members = getAgencyTeamMembers(agencyId)
  const [form, setForm] = useState({ name: '', email: '', type: 'agent' as InvitationRole, propertyId: properties[0]?.id ?? '' })

  function submit(event: FormEvent) {
    event.preventDefault()
    addTeamMember({ agencyId, name: form.name || 'Membre local', email: form.email || 'local@signature.test', type: form.type, propertyId: form.type === 'vendeur' ? form.propertyId : undefined })
    onSaved(`${form.type} ajouté localement`)
  }

  function remove(member: TeamMember) {
    const warning = member.type === 'patron' ? 'Cette agence n’aura plus de patron assigné. Continuer ?' : `Retirer ${member.name} ?`
    if (!window.confirm(warning)) return
    removeTeamMember(member.id)
    onSaved(`${member.type} retiré localement`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Équipe</h1>
        <p className="subtitle">{agency.name} · Fonctionnel localement</p>
      </div>
      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Nom" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
        <TextField label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
        <SelectField label="Rôle" value={form.type} options={['patron', 'agent', 'vendeur']} onChange={(value) => setForm((current) => ({ ...current, type: value as InvitationRole }))} />
        <SelectField label="Annonce vendeur" value={form.propertyId} options={properties.map((property) => property.id)} onChange={(value) => setForm((current) => ({ ...current, propertyId: value }))} />
        <button className="primary-button" type="submit">Ajouter {form.type}</button>
      </form>
      <div className="list-grid">
        {members.map((member) => (
          <article className="list-card" key={member.id}>
            <div>
              <p className="eyebrow">{member.type} · {member.status}</p>
              <h2>{member.name}</h2>
              <p>{member.email}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => remove(member)}>
              Retirer {member.type}
            </button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyInvitationsView({ agencyId, onNavigate, onSaved, setFlash }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter; setFlash: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const invitations = getAgencyInvitations(agencyId)
  const [forms, setForms] = useState<Record<InvitationRole, { name: string; email: string; propertyId: string }>>({
    patron: { name: agency.ownerName, email: agency.ownerEmail, propertyId: '' },
    agent: { name: agency.agentName, email: agency.agentEmail, propertyId: '' },
    vendeur: { name: 'Vendeur', email: 'vendeur@signature.test', propertyId: properties[0]?.id ?? '' },
  })

  function update(role: InvitationRole, key: 'name' | 'email' | 'propertyId', value: string) {
    setForms((current) => ({ ...current, [role]: { ...current[role], [key]: value } }))
  }

  function create(role: InvitationRole) {
    generateInvitation({ agencyId, type: role, name: forms[role].name, email: forms[role].email, propertyId: role === 'vendeur' ? forms[role].propertyId : undefined })
    onSaved(`Invitation ${role} générée localement`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Invitations</h1>
        <p className="subtitle">Emails simulés · aucun envoi réel</p>
      </div>
      <div className="list-grid">
        {(['patron', 'agent', 'vendeur'] as InvitationRole[]).map((role) => {
          const latest = [...invitations].reverse().find((item) => item.type === role)
          return (
            <article className="list-card" key={role}>
              <div>
                <p className="eyebrow">{role} · {latest?.status ?? 'draft'}</p>
                <h2>Invitation {role}</h2>
                <TextField label="Nom" value={forms[role].name} onChange={(value) => update(role, 'name', value)} />
                <TextField label="Email" value={forms[role].email} onChange={(value) => update(role, 'email', value)} />
                {role === 'vendeur' && <SelectField label="Annonce" value={forms[role].propertyId} options={properties.map((property) => property.id)} onChange={(value) => update(role, 'propertyId', value)} />}
                {latest && <p>{latest.emailPreview}</p>}
              </div>
              <div className="inline-actions">
                <button className="primary-button compact" type="button" onClick={() => create(role)}>Générer invitation</button>
                <button className="secondary-button compact" type="button" onClick={() => setFlash(latest?.emailPreview ?? 'Prévisualisation prête à générer')}>Prévisualiser email</button>
                <button className="secondary-button compact" type="button" onClick={() => latest && (copyLocalText(`${window.location.origin}${latest.targetUrl}`, setFlash, 'Lien copié'), updateInvitationStatus(latest.id, 'copied'))}>Copier lien</button>
                <button className="secondary-button compact" type="button" onClick={() => latest && (updateInvitationStatus(latest.id, 'revoked'), onSaved('Invitation révoquée localement'))}>Révoquer</button>
              </div>
            </article>
          )
        })}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyEmailsView({ agencyId, onNavigate, onSaved, setFlash }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter; setFlash: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const emails = getAgencySimulatedEmails(agencyId)
  const templates = emails.length > 0 ? emails : (['patron', 'agent', 'vendeur'] as InvitationRole[]).map((role) => ({
    id: `template-${role}`,
    agencyId,
    type: role,
    status: 'draft' as const,
    subject: `Votre accès ${agency.name}`,
    body: `Bonjour, votre accès ${role} sera généré depuis la page invitations.`,
    accessUrl: `${window.location.origin}/admin/agences/${agencyId}/invitations`,
    createdAt: '',
    updatedAt: '',
  }))

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Emails simulés</h1>
        <p className="subtitle">Aucun email réel n’est envoyé · {branchableBadge}</p>
      </div>
      <div className="list-grid">
        {templates.map((email) => (
          <article className="list-card" key={email.id}>
            <div>
              <p className="eyebrow">{email.type} · {email.status}</p>
              <h2>{email.subject}</h2>
              <p>{email.body}</p>
              <p>{email.accessUrl}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(`${email.subject}\n\n${email.body}`, setFlash, 'Email copié')}>Copier email</button>
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(email.accessUrl, setFlash, 'Lien copié')}>Copier lien</button>
              <button className="primary-button compact" type="button" onClick={() => email.id.startsWith('template-') ? setFlash('Générez d’abord une invitation') : (updateSimulatedEmailStatus(email.id, 'sent_simulated'), onSaved('Envoi simulé enregistré'))}>Marquer envoyé simulé</button>
            </div>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyPaymentView({ agencyId, onNavigate, onSaved, setFlash }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter; setFlash: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const payment = getAgencyPaymentLink(agencyId)
  const paymentUrl = `${window.location.origin}/payment/${agencyId}`

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Paiement simulé</h1>
        <p className="subtitle">Pas de Stripe réel · {branchableBadge}</p>
      </div>
      <div className="card-grid">
        <InfoBlock title="Offre" text={payment.offerName} />
        <InfoBlock title="Installation" text={payment.setupPrice} />
        <InfoBlock title="Mensualité" text={payment.monthlyPrice} />
        <InfoBlock title="Statut" text={payment.status} />
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'link_ready'); onSaved('Lien paiement généré localement') }}>Générer lien paiement</button>
        <button className="secondary-button" type="button" onClick={() => copyLocalText(paymentUrl, setFlash, 'Lien paiement copié')}>Copier lien paiement</button>
        <button className="secondary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'paid_simulated'); onSaved('Paiement marqué payé') }}>Marquer comme payé</button>
        <button className="secondary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'cancelled_simulated'); onSaved('Paiement annulé localement') }}>Annuler paiement</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/payment/${agencyId}`)}>Ouvrir page paiement</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
      </div>
    </section>
  )
}

function AgencyTrackingView({ agencyId, onNavigate, onSaved }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const activity = getAgencyActivity(agencyId)

  function addDocument(property: Property) {
    updateProperty(property.id, { visibleDocuments: [...property.visibleDocuments, 'Document ajouté localement'] })
    onSaved('Document ajouté au suivi vendeur')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Suivi vendeur</h1>
        <p className="subtitle">Agent met à jour · vendeur rassuré · patron garde le contrôle</p>
      </div>
      <div className="list-grid">
        {properties.map((property) => (
          <article className="list-card" key={property.id}>
            <div>
              <p className="eyebrow">Suivi vendeur actif · {property.status}</p>
              <h2>{property.title}</h2>
              <p>Étape actuelle : {property.currentStep}</p>
              <p>Prochaine visite : {property.nextVisit}</p>
              <p>Dernier compte rendu : {property.visitReport}</p>
              <p>Documents : {property.visibleDocuments.join(', ') || 'Aucun document visible'}</p>
              <p>Dernière mise à jour : {new Date(property.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => { const next = saleSteps[(saleSteps.indexOf(property.currentStep) + 1) % saleSteps.length]; updateProperty(property.id, { currentStep: next }); onSaved('Étape changée localement') }}>Changer étape</button>
              <button className="secondary-button compact" type="button" onClick={() => { updateProperty(property.id, { nextVisit: 'Samedi 22 juin à 14h30' }); onSaved('Visite programmée') }}>Programmer visite</button>
              <button className="secondary-button compact" type="button" onClick={() => { updateProperty(property.id, { visitReport: 'Compte rendu partagé au vendeur depuis le Studio Admin.' }); onSaved('Compte rendu ajouté') }}>Ajouter compte rendu</button>
              <button className="secondary-button compact" type="button" onClick={() => addDocument(property)}>Ajouter document</button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>Ouvrir espace vendeur</button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>Voir côté agent</button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/patron`)}>Voir côté patron</button>
            </div>
          </article>
        ))}
      </div>
      {activity.slice(-3).map((entry) => <InfoBlock key={entry.id} title={entry.type} text={`${entry.label} · ${entry.status}`} />)}
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyDangerView({ agencyId, onNavigate, onSaved }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)

  function confirmRun(message: string, action: () => void) {
    if (!window.confirm(message)) return
    action()
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Danger zone</h1>
        <p className="subtitle">Actions locales avec confirmation obligatoire</p>
      </div>
      <div className="list-grid">
        <InfoBlock title="Agence" text={`${agency.name} · ${agency.status}`} />
        <InfoBlock title="Annonces" text={`${properties.length} annonce(s) liées`} />
      </div>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => confirmRun('Désactiver cette agence ?', () => { updateAgency(agencyId, { status: 'inactive' }); onSaved('Agence désactivée localement') })}>Désactiver agence</button>
        <button className="secondary-button" type="button" onClick={() => confirmRun('Réactiver cette agence ?', () => { updateAgency(agencyId, { status: 'Démo active' }); onSaved('Agence réactivée localement') })}>Réactiver agence</button>
        <button className="secondary-button" type="button" onClick={() => confirmRun('Supprimer toutes les annonces ?', () => { properties.forEach((property) => deleteProperty(property.id)); onSaved('Annonces supprimées localement') })}>Supprimer toutes les annonces</button>
        <button className="secondary-button" type="button" onClick={() => confirmRun('Réinitialiser la démo de cette agence ?', () => { resetAgencyDemo(agencyId); onSaved('Démo agence réinitialisée') })}>Réinitialiser démo de cette agence</button>
        <button className="secondary-button danger-button" type="button" onClick={() => confirmRun('Supprimer cette agence et ses données locales liées ?', () => { deleteAgency(agencyId); onNavigate('/admin/agences') })}>Supprimer agence</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
      </div>
    </section>
  )
}

function AccessTokenView({ token, onNavigate }: { token: string; onNavigate: Navigate }) {
  const { accessToken, invitation } = getAccessByToken(token)
  const item = accessToken ?? invitation
  const status = accessToken?.status ?? invitation?.status
  const isValid = Boolean(item && status !== 'revoked' && status !== 'expired')

  if (!isValid || !item) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <h1>Lien invalide ou expiré</h1>
          <p className="subtitle">Aucune connexion réelle n’a été lancée.</p>
        </div>
        <div className="actions">
          <button className="primary-button" type="button" onClick={() => onNavigate('/')}>Retour accueil</button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>Retour admin</button>
        </div>
      </section>
    )
  }

  const validInvitation = invitation!
  const targetUrl = accessToken ? accessToken.targetUrl : validInvitation.targetUrl
  const role = accessToken ? accessToken.type : validInvitation.type
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Accès détecté</h1>
        <p className="subtitle">Rôle : {role} · simulation locale</p>
      </div>
      <InfoBlock title="Statut" text="Pas d’auth réelle. Fonction prête à connecter." />
      <button className="primary-button" type="button" onClick={() => onNavigate(targetUrl)}>Continuer vers mon espace</button>
    </section>
  )
}

function PaymentSimulationView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const payment = getAgencyPaymentLink(agencyId)
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Paiement simulé</h1>
        <p className="subtitle">{agency.name} · aucun Stripe réel</p>
      </div>
      <div className="card-grid">
        <InfoBlock title="Offre" text={payment.offerName} />
        <InfoBlock title="Installation" text={payment.setupPrice} />
        <InfoBlock title="Mensualité" text={payment.monthlyPrice} />
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'paid_simulated'); onNavigate(`/payment/${agencyId}/success`) }}>Payer maintenant</button>
        <button className="secondary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'cancelled_simulated'); onNavigate(`/payment/${agencyId}/cancel`) }}>Annuler</button>
      </div>
    </section>
  )
}

function PaymentResultView({ agencyId, status, onNavigate }: { agencyId: string; status: 'success' | 'cancel'; onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>{status === 'success' ? 'Paiement simulé réussi' : 'Paiement simulé annulé'}</h1>
        <p className="subtitle">Statut enregistré localement.</p>
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/paiement`)}>Retour paiement</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
      </div>
    </section>
  )
}

function AgencyPropertiesView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Annonces</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/new`)}>
        Créer une annonce
      </button>
      <div className="list-grid">
        {properties.length === 0 && <InfoBlock title="Aucune annonce" text="Créez une annonce pour générer le parcours vendeur." />}
        {properties.map((property) => (
          <article className="list-card" key={property.id}>
            <div>
              <p className="eyebrow">{property.status}</p>
              <h2>{property.title}</h2>
              <p>{property.city} · {property.price} · {property.surface}</p>
            </div>
            <div className="inline-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Gérer
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${property.id}`)}>
                Voir annonce
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>
                Ouvrir vendeur
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function AgencyModulesView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const moduleLabels = [
    ['publicSite', 'Site public', 'Affiche la vitrine publique de l’agence.'],
    ['ownerSpace', 'Espace patron', 'Active le tableau de bord dirigeant.'],
    ['agentSpace', 'Espace agent', 'Active la gestion des annonces cété agent.'],
    ['sellerSpace', 'Espace vendeur'],
    ['listings', 'Annonces', 'Permet de créer et publier des biens.'],
    ['documents', 'Documents'],
    ['visits', 'Visites'],
    ['reports', 'Comptes rendus'],
    ['customPages', 'Pages personnalisées'],
    ['customButtons', 'Boutons personnalisés'],
    ['sellerEstimate', 'Estimation vendeur'],
    ['agencyContact', 'Formulaire contact'],
    ['aiAnalysis', 'Analyse IA', 'Simulation d’analyse de site.'],
    ['importListings', 'Import annonces', 'Simulation d’import annonces.'],
    ['importBranding', 'Import logo/couleurs', 'Simulation import branding.'],
  ] as const
  const [modules, setModules] = useState<Record<string, boolean>>(() => agency?.modules ?? {})
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const visibleModuleLabels = detailMode === 'simple' ? moduleLabels.slice(0, 6) : moduleLabels

  function toggleModule(key: string) {
    setModules((current) => {
      const nextValue = !(current[key] ?? true)
      onSaved(nextValue ? 'Module activé localement' : 'Module désactivé localement')
      return { ...current, [key]: nextValue }
    })
  }

  function saveModules() {
    updateAgency(agencyId, { modules })
    onSaved('Modules enregistrès localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Modules</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>
      <p className="microcopy">Les modules restent locaux. Tu peux activer le detail quand tu en as besoin.</p>
      <div className="list-grid">
        {visibleModuleLabels.map(([key, label, description]) => (
          <article className="list-card" key={key}>
            <div>
              <p className="eyebrow">{modules[key] ?? true ? 'ON' : 'OFF'}</p>
              <h2>{label}</h2>
              <p>{description ?? 'Module activable localement.'}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => toggleModule(key)}>
              {modules[key] ?? true ? 'Désactiver' : 'Activer'}
            </button>
          </article>
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={saveModules}>
          Enregistrer modules
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyDemoView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const firstProperty = getAgencyProperties(agencyId)[0]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Démo agence</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="demo-buttons">
        <button type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Site public
        </button>
        <button type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/patron`)}>
          Espace patron
        </button>
        <button type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Espace agent
        </button>
        <button
          type="button"
          onClick={() =>
            firstProperty
              ? onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`)
              : onNavigate(`/admin/agences/${agencyId}/annonces/new`)
          }
        >
          Espace vendeur
        </button>
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function AgencyAnalysisView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [form, setForm] = useState({
    siteUrl: agency?.currentSite ?? 'https://signature-immobilier.example',
    sector: agency?.sector ?? 'Immobilier',
    city: agency?.city ?? 'Tarbes',
  })
  const [analysis, setAnalysis] = useState<AgencyAnalysis | undefined>(agency?.analysis)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const currentAgency = agency

  function relaunchAnalysis() {
    const nextAnalysis = makeSimulatedAnalysis(form.siteUrl, form.sector, form.city)
    setAnalysis(nextAnalysis)
    updateAgency(agencyId, { analysis: nextAnalysis })
    onSaved('Analyse simulée enregistrée localement')
  }

  function applyColors() {
    if (!analysis) return
    updateAgency(agencyId, { colors: analysis.colors })
    onSaved('Couleurs appliquées localement')
  }

  function applyTexts() {
    if (!analysis) return
    updateAgency(agencyId, {
      mood: {
        ...(currentAgency.mood ?? defaultMood(currentAgency.name)),
        homeTitle: analysis.detectedName,
        promise: analysis.promise,
        tone: analysis.tone,
      },
    })
    onSaved('Textes appliqués localement')
  }

  function importListings() {
    if (!analysis) return
    analysis.detectedListings.forEach((title) => {
      createProperty({
        ...formToPropertyInput(agencyId, defaultPropertyForm()),
        title,
        city: form.city,
      })
    })
    onSaved('Annonces détectées importées localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Analyse du site actuel</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <article className="edit-panel">
        <TextField label="URL du site actuel" value={form.siteUrl} onChange={(value) => setForm((current) => ({ ...current, siteUrl: value }))} />
        <TextField label="Secteur" value={form.sector} onChange={(value) => setForm((current) => ({ ...current, sector: value }))} />
        <TextField label="Ville" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
        <button className="primary-button compact" type="button" onClick={relaunchAnalysis}>
          Relancer l?analyse
        </button>
      </article>
      {analysis && <AnalysisCard analysis={analysis} />}
      <div className="actions">
        <button className="secondary-button" type="button" onClick={applyColors}>
          Appliquer couleurs
        </button>
        <button className="secondary-button" type="button" onClick={applyTexts}>
          Appliquer textes
        </button>
        <button className="secondary-button" type="button" onClick={importListings}>
          Importer annonces détectées
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyMoodView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [mood, setMood] = useState<AgencyMood>(() => agency?.mood ?? defaultMood(agency?.name ?? 'Agence'))
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function updateField(field: keyof AgencyMood, value: string) {
    setMood((current) => ({ ...current, [field]: value }))
  }

  function applyMood() {
    updateAgencyMood(agencyId, mood)
    onSaved('Ambiance appliquée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Ambiance visuelle</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>
      <article className={`edit-panel form-grid mood-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`}>
        <div className="form-section-title">
          <p className="eyebrow">Essentiel</p>
          <h2>Ambiance</h2>
          <p>Modification locale uniquement.</p>
        </div>
        <SelectField
          label="Ambiance"
          value={mood.moodName}
          options={['Premium sobre', 'Luxe discret', 'Familial rassurant', 'Moderne dynamique', 'Institutionnel', 'Apple / Airbnb']}
          onChange={(value) => updateField('moodName', value)}
        />
        <TextField label="Titre d’accueil" value={mood.homeTitle} onChange={(value) => updateField('homeTitle', value)} />
        <TextField label="Sous-titre" value={mood.subtitle} onChange={(value) => updateField('subtitle', value)} />
        <TextField label="Promesse principale" value={mood.promise} onChange={(value) => updateField('promise', value)} />
        <TextField label="Ton rrédactionnel" value={mood.tone} onChange={(value) => updateField('tone', value)} />
        <TextField label="Style des cartes" value={mood.cardStyle} onChange={(value) => updateField('cardStyle', value)} />
        <TextField label="Niveau de contraste" value={mood.contrast} onChange={(value) => updateField('contrast', value)} />
        <TextField label="Arrondis" value={mood.radius} onChange={(value) => updateField('radius', value)} />
        <SelectField
          label="Densité d’information"
          value={mood.density}
          options={['minimal', 'normal', 'détaillé']}
          onChange={(value) => updateField('density', value)}
        />
        <button className="primary-button" type="button" onClick={applyMood}>
          Appliquer l’ambiance
        </button>
      </article>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Voir site public
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyExportView({
  agencyId,
  onNavigate,
  setFlash,
}: {
  agencyId: string
  onNavigate: Navigate
  setFlash: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const pages = getAgencyPages(agencyId)
  const buttons = getAgencyButtons(agencyId)

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Export démo</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="card-grid">
        <InfoBlock title="Résumé démo" text={`${properties.length} annonces · ${pages.length} pages · ${buttons.length} boutons`} />
        <InfoBlock title="Liens à envoyer" text={`/demo/immobilier/agence/${agencyId}/public · /patron · /agent`} />
        <InfoBlock title="Checklist" text="Branding, annonce publiée, vendeur, documents, pages et boutons à relire." />
        <InfoBlock title="Simulé aujourd’hui" text="localStorage, fichiers, comptes, emails, paiements et analyse IA." />
        <InfoBlock title="À compléter plus tard" text="Ce bloc reste une simulation locale jusqu'à validation." />
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => setFlash('Résumé copié')}>
          Copier résumé démo
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function NewPropertyView({
  agencyId,
  onNavigate,
  onCreated,
}: {
  agencyId: string
  onNavigate: Navigate
  onCreated: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [form, setForm] = useState(defaultPropertyForm())
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function updateField(field: keyof ReturnType<typeof defaultPropertyForm>, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const property = createProperty(formToPropertyInput(agencyId, form))
    onCreated('Annonce créée localement.')
    onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Créer une annonce</h1>
        <p className="subtitle">{agency.name}</p>
      </div>

      <PropertyForm form={form} onChange={updateField} onSubmit={submit} submitLabel="Créer l’annonce" />

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function EditPropertyView({
  agencyId,
  propertyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  propertyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const property = getProperty(propertyId)
  const [form, setForm] = useState(() => propertyToForm(property))
  const [photoUrl, setPhotoUrl] = useState(property?.mainPhotoUrl ?? '')
  const [documentForm, setDocumentForm] = useState({
    name: 'Bon de visite',
    type: 'PDF',
    url: '',
    visibleToSeller: 'oui',
  })
  const [visitForm, setVisitForm] = useState({
    dateTime: property?.nextVisit ?? 'Samedi 22 juin à 14h30',
    comment: 'Visite programmée depuis le Studio Admin.',
  })
  const [reportText, setReportText] = useState(property?.visitReport ?? '')
  const [actionMessage, setActionMessage] = useState('')
  if (!property || property.agencyId !== agencyId) {
    return <MissingView title="Annonce introuvable" onNavigate={onNavigate} backRoute={`/admin/agences/${agencyId}`} backLabel="Retour fiche agence" />
  }
  const currentProperty = property

  function updateField(field: keyof ReturnType<typeof defaultPropertyForm>, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    updateProperty(propertyId, formToPropertyInput(agencyId, form))
    onSaved('Modifications enregistrées')
  }

  function addPhoto() {
    const nextUrl = photoUrl.trim()
    if (!nextUrl) {
      setActionMessage('Ajoutez une URL de photo pour afficher un aperçu.')
      return
    }

    updateProperty(propertyId, {
      mainPhotoUrl: nextUrl,
      photos: [...(currentProperty.photos ?? []), nextUrl],
    })
    setActionMessage('Photo ajoutée localement')
    onSaved('Photo ajoutée localement')
  }

  function addDocument() {
    const document: PropertyDocument = {
      id: `doc-${Date.now()}`,
      name: documentForm.name,
      type: documentForm.type,
      url: documentForm.url,
      visibleToSeller: documentForm.visibleToSeller === 'oui',
    }
    const nextDocuments = [...(currentProperty.documents ?? []), document]
    const nextVisibleDocuments = document.visibleToSeller
      ? [...currentProperty.visibleDocuments, document.name]
      : currentProperty.visibleDocuments

    updateProperty(propertyId, {
      documents: nextDocuments,
      visibleDocuments: nextVisibleDocuments,
    })
    setActionMessage('Document ajouté localement')
    onSaved('Document ajouté localement')
  }

  function addVisit() {
    const visit: PropertyVisit = {
      id: `visit-${Date.now()}`,
      dateTime: visitForm.dateTime,
      comment: visitForm.comment,
    }

    updateProperty(propertyId, {
      visits: [...(currentProperty.visits ?? []), visit],
      nextVisit: visit.dateTime,
    })
    setActionMessage('Visite programmée localement')
    onSaved('Visite programmée localement')
  }

  function addReport() {
    updateProperty(propertyId, {
      visitReport: reportText,
    })
    setActionMessage('Compte rendu ajouté localement')
    onSaved('Compte rendu ajouté localement')
  }

  function removeProperty() {
    const confirmed = window.confirm('Supprimer cette annonce locale ?')
    if (!confirmed) return

    deleteProperty(propertyId)
    onSaved('Annonce supprimée localement')
    onNavigate(`/admin/agences/${agencyId}/annonces`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Gestion annonce</h1>
        <p className="subtitle">{property.title}</p>
      </div>

      <PropertyForm form={form} onChange={updateField} onSubmit={submit} submitLabel="Enregistrer" />

      <article className="edit-panel">
        <h2>Actions simulées</h2>
        {actionMessage && <p className="save-message">{actionMessage}</p>}

        <div className="edit-preview">
          <p className="eyebrow">Ajouter photo</p>
          <TextField label="URL photo" value={photoUrl} onChange={setPhotoUrl} />
          <button className="secondary-button compact" type="button" onClick={addPhoto}>
            Ajouter photo
          </button>
          {photoUrl && <PropertyPhoto property={{ ...property, mainPhotoUrl: photoUrl }} />}
        </div>

        <div className="edit-preview">
          <p className="eyebrow">Ajouter document</p>
          <TextField label="Nom" value={documentForm.name} onChange={(value) => setDocumentForm((current) => ({ ...current, name: value }))} />
          <TextField label="Type" value={documentForm.type} onChange={(value) => setDocumentForm((current) => ({ ...current, type: value }))} />
          <TextField label="Document ou URL" value={documentForm.url} onChange={(value) => setDocumentForm((current) => ({ ...current, url: value }))} />
          <SelectField
            label="Visible vendeur"
            value={documentForm.visibleToSeller}
            options={['oui', 'non']}
            onChange={(value) => setDocumentForm((current) => ({ ...current, visibleToSeller: value }))}
          />
          <button className="secondary-button compact" type="button" onClick={addDocument}>
            Ajouter document
          </button>
          <div className="document-list">
            {(property.documents ?? []).map((document) => (
              <span key={document.id}>{document.name}</span>
            ))}
          </div>
        </div>

        <div className="edit-preview">
          <p className="eyebrow">Programmer visite</p>
          <TextField label="Date / heure" value={visitForm.dateTime} onChange={(value) => setVisitForm((current) => ({ ...current, dateTime: value }))} />
          <TextAreaField label="Commentaire" value={visitForm.comment} onChange={(value) => setVisitForm((current) => ({ ...current, comment: value }))} />
          <button className="secondary-button compact" type="button" onClick={addVisit}>
            Programmer visite
          </button>
          <div className="document-list">
            {(property.visits ?? []).map((visit) => (
              <span key={visit.id}>{visit.dateTime}</span>
            ))}
          </div>
        </div>

        <div className="edit-preview">
          <p className="eyebrow">Ajouter compte rendu</p>
          <TextAreaField label="Compte rendu" value={reportText} onChange={setReportText} />
          <button className="secondary-button compact" type="button" onClick={addReport}>
            Ajouter compte rendu
          </button>
        </div>
      </article>

      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${propertyId}`)}>
          Visualiser l’annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Ouvrir espace agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${propertyId}`)}>
          Ouvrir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
        <button className="secondary-button danger-button" type="button" onClick={removeProperty}>
          Supprimer annonce
        </button>
      </div>
    </section>
  )
}

function AgencyPagesView({
  agencyId,
  onNavigate,
  onCreated,
}: {
  agencyId: string
  onNavigate: Navigate
  onCreated: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const pages = getAgencyPages(agencyId)
  const [form, setForm] = useState({
    title: 'Guide vendeur',
    content: 'Une page locale pour expliquer le suivi vendeur.',
    placement: 'public',
    slug: 'guide-vendeur',
    status: 'publié',
    ctaLabel: 'Contacter l’agence',
    ctaDestination: `/demo/immobilier/agence/${agencyId}/preparation`,
  })
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function submit(event: FormEvent) {
    event.preventDefault()
    const page = createCustomPage({
      agencyId,
      title: form.title,
      content: form.content,
      placement: form.placement as 'public' | 'patron' | 'agent' | 'vendeur',
      slug: form.slug,
      status: form.status as 'brouillon' | 'publié',
      ctaLabel: form.ctaLabel,
      ctaDestination: form.ctaDestination,
    })
    onCreated('Page personnalisée créée localement.')
    onNavigate(`/demo/immobilier/agence/${agencyId}/page/${page.slug}`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Pages personnalisées</h1>
        <p className="subtitle">{agency.name}</p>
      </div>

      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Titre" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <TextField label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} />
        <SelectField
          label="Statut"
          value={form.status}
          options={['brouillon', 'publié']}
          onChange={(value) => setForm((current) => ({ ...current, status: value }))}
        />
        <SelectField
          label="Emplacement"
          value={form.placement}
          options={['public', 'patron', 'agent', 'vendeur']}
          onChange={(value) => setForm((current) => ({ ...current, placement: value }))}
        />
        <TextAreaField label="Contenu" value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} />
        <TextField label="Bouton CTA optionnel" value={form.ctaLabel} onChange={(value) => setForm((current) => ({ ...current, ctaLabel: value }))} />
        <TextField label="Destination CTA" value={form.ctaDestination} onChange={(value) => setForm((current) => ({ ...current, ctaDestination: value }))} />
        <button className="primary-button" type="submit">
          Créer la page
        </button>
      </form>

      <div className="list-grid">
        {pages.map((page) => (
          <article className="list-card" key={page.id}>
            <div>
              <p className="eyebrow">{page.placement}</p>
              <h2>{page.title}</h2>
              <p>/page/{page.slug}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/page/${page.slug}`)}>
                Voir page
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onCreated('Mode modification prêt à connecter localement.')}>
                Modifier
              </button>
              <button className="secondary-button compact danger-button" type="button" onClick={() => { deletePage(page.id); onCreated('Page supprimée localement.') }}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function AgencyButtonsView({
  agencyId,
  onNavigate,
  onCreated,
}: {
  agencyId: string
  onNavigate: Navigate
  onCreated: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const pages = getAgencyPages(agencyId)
  const buttons = getAgencyButtons(agencyId)
  const firstPageDestination = pages[0] ? `/demo/immobilier/agence/${agencyId}/page/${pages[0].slug}` : `/demo/immobilier/agence/${agencyId}/preparation`
  const [form, setForm] = useState({
    label: 'Lire le guide vendeur',
    placement: 'public',
    destination: firstPageDestination,
    destinationType: 'route interne',
    style: 'secondaire',
    status: 'actif',
  })
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function submit(event: FormEvent) {
    event.preventDefault()
    createCustomButton({
      agencyId,
      label: form.label,
      placement: form.placement as CustomButton['placement'],
      destination: form.destination,
      destinationType: form.destinationType as CustomButton['destinationType'],
      style: form.style as CustomButton['style'],
      status: form.status as CustomButton['status'],
    })
    onCreated('Bouton personnalisé créé localement.')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Boutons personnalisés</h1>
        <p className="subtitle">{agency.name}</p>
      </div>

      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>

      <form className={`edit-panel form-grid button-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={submit}>
        <div className="form-section-title">
          <p className="eyebrow">Essentiel</p>
          <h2>Nouveau bouton</h2>
          <p>Choisis le texte et la destination. Le style peut rester automatique.</p>
        </div>
        <TextField label="Texte du bouton" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} />
        <SelectField
          label="Emplacement"
          value={form.placement}
          options={['public', 'patron', 'agent', 'vendeur', 'fiche agence']}
          onChange={(value) => setForm((current) => ({ ...current, placement: value }))}
        />
        <SelectField
          label="Type destination"
          value={form.destinationType}
          options={['route interne', 'page personnalisée', 'téléphone', 'mail', 'formulaire simulé']}
          onChange={(value) => setForm((current) => ({ ...current, destinationType: value }))}
        />
        <SelectField
          label="Style"
          value={form.style}
          options={['principal', 'secondaire', 'discret']}
          onChange={(value) => setForm((current) => ({ ...current, style: value }))}
        />
        <SelectField
          label="Statut"
          value={form.status}
          options={['actif', 'inactif']}
          onChange={(value) => setForm((current) => ({ ...current, status: value }))}
        />
        <TextField label="Destination" value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} />
        <button className="primary-button" type="submit">
          Créer le bouton
        </button>
      </form>

      <div className="list-grid">
        {buttons.map((button) => (
          <article className="list-card" key={button.id}>
            <div>
              <p className="eyebrow">{button.placement}</p>
              <h2>{button.label}</h2>
              <p>{button.destination}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => openCustomDestination(button, agencyId, onNavigate)}>
                Tester bouton
              </button>
              <button className="secondary-button compact danger-button" type="button" onClick={() => { deleteButton(button.id); onCreated('Bouton supprimé localement.') }}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function DemoIndexView({ onNavigate }: { onNavigate: Navigate }) {
  const demoButtons = getGlobalButtonsByPlacement('démo immobilier')
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Démo Signature Immobilier</h1>
        <p className="subtitle">Une démonstration métier basée sur le suivi immobilier.</p>
      </div>

      <div className="demo-buttons">
        {hubLinks.slice(0, 4).map((link) => (
          <button key={link.route} type="button" onClick={() => onNavigate(link.route)}>
            {link.label}
          </button>
        ))}
      </div>

      <article className="demo-panel">
        <p className="eyebrow">{immobilierSector.sectorName}</p>
        <h2>{immobilierSector.promise}</h2>
        <p>{immobilierSector.moduleName} est le premier module métier de Signature Digital Core.</p>
        <div className="inline-actions">
          <button className="primary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier')}>
            Ouvrir le hub immobilier
          </button>
        </div>
      </article>
      {demoButtons.length > 0 && (
        <article className="demo-panel">
          <p className="eyebrow">Boutons globaux</p>
          <div className="inline-actions">
            {demoButtons.map((button) => (
              <button className="secondary-button compact" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
                {button.label}
              </button>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

function DynamicAgencyDemoView({
  agencySlug,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const {
    pages: demoPages,
    buttons: demoButtons,
    modules: demoModules,
  } = useAgencyCustomElements(agency, agencySlug)
  const {
    design,
  } = useAgencySpaceDesign(agency, agencySlug)

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Démo agence</p>
          <h1>Démo introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans le Studio Admin.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour au Studio
        </button>
      </section>
    )
  }

  const logoText = agency.appearance?.logoText?.trim() || agency.name
  const tokens = getSpaceVisualTokens(agency, design)
  const primary = tokens.heroText
  const secondary = tokens.heroBackground
  const accent = tokens.accent
  const publishedPages = demoPages.filter((page) => page.status === 'publié')
  const activeButtons = demoButtons.filter((button) => button.status === 'actif')
  const activeModules = demoModules.filter((module) => module.enabled && module.key !== spaceDesignModuleKey)
  const primaryAction = activeButtons[0]
  const experienceIntro = getAgencyHeroSubtitle(agency)

  return (
    <section className="page-view dynamic-demo-view">
      <article className="dynamic-demo-hero" style={{ backgroundColor: secondary, color: primary }}>
        <div>
          <p className="eyebrow" style={{ color: accent }}>{agency.sector} · {agency.city}</p>
          <span className="dynamic-logo" style={{ borderColor: accent, color: primary }}>
            {logoText}
          </span>
          <h1 style={{ color: primary }}>{agency.name}</h1>
          <p className="subtitle" style={{ color: primary }}>{experienceIntro}</p>
          <div className="inline-actions">
            <button
              className="primary-button compact"
              type="button"
              onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/public`)}
            >
              Découvrir l’expérience
            </button>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/patron`)}
            >
              Patron
            </button>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/agent`)}
            >
              Agent
            </button>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}/client`)}
            >
              Client
            </button>
          </div>
        </div>
        <div className="profile-facts">
          <span>{agency.sector}</span>
          <span>{agency.city}</span>
          <span>{publishedPages.length || 1} page prête</span>
          <span>{activeModules.length || 1} fonctionnalité incluse</span>
        </div>
      </article>

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">Ce que cette démo contient</p>
        <h2>Une expérience claire avant le premier échange.</h2>
        <div className="list-grid">
          {(publishedPages.length > 0 ? publishedPages.slice(0, 3) : [{
            id: 'default-page',
            title: 'Présentation de l’agence',
            content: 'Un espace simple pour expliquer la promesse, rassurer et guider le client.',
            source: 'Local' as const,
            agencyId: agency.id,
            slug: 'presentation',
            space: 'public' as const,
            status: 'publié' as const,
            createdAt: '',
          }]).map((page) => (
            <article className="list-card airy-card" key={`${page.source}-${page.id}-${page.title}`}>
              <div>
                <h2>{page.title}</h2>
                {page.content && <p>{getContentExcerpt(page.content)}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">Parcours proposé</p>
        <h2>Du premier contact au suivi client.</h2>
        <div className="journey-map">
          <span>Découvrir</span>
          <span>Être rassuré</span>
          <span>Demander un contact</span>
          <span>Suivre l’avancement</span>
        </div>
      </section>

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">Actions disponibles</p>
        <h2>{primaryAction ? 'Des actions simples, visibles et utiles.' : 'Les actions seront visibles ici.'}</h2>
        <div className="inline-actions">
          {(activeButtons.length > 0 ? activeButtons.slice(0, 4) : [{ id: 'default-action', label: 'Demander une estimation' }]).map((button) => (
            <button className="secondary-button compact" key={button.id} type="button" style={getSpaceButtonStyle(design, agency)}>
              {button.label}
            </button>
          ))}
        </div>
      </section>

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">Fonctionnalités incluses</p>
        <h2>Les modules qui rendent l’expérience plus fluide.</h2>
        <div className="list-grid compact-list">
          {(activeModules.length > 0 ? activeModules.slice(0, 4) : [{ id: 'default-module', name: 'Formulaire de rappel' }]).map((module) => (
            <article className="list-card airy-card" key={module.id}>
              <div>
                <h2>{module.name}</h2>
                <p>Un repère simple pour aider le client à avancer.</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(agency)}`)}>
        Retour à la fiche agence
      </button>
    </section>
  )
}

function DynamicAgencySpaceView({
  agencySlug,
  space,
  agencies,
  onNavigate,
}: {
  agencySlug: string
  space: DynamicAgencySpace
  agencies: ListedAgency[]
  onNavigate: Navigate
}) {
  const agency = findListedAgencyBySlug(agencies, agencySlug)
  const {
    pages: demoPages,
    buttons: demoButtons,
    modules: demoModules,
    message: customElementsMessage,
  } = useAgencyCustomElements(agency, agencySlug)
  const {
    design,
    message: designMessage,
  } = useAgencySpaceDesign(agency, agencySlug)

  if (!agency) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <p className="eyebrow">Espace agence</p>
          <h1>Démo introuvable</h1>
          <p className="subtitle">Cette agence n’existe pas encore dans le Studio Admin.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour au Studio
        </button>
      </section>
    )
  }

  const spaceConfig = getDynamicAgencySpaceConfig(space)
  const spaceCopy = getAgencySpaceCopy(design, space)
  const logoText = agency.appearance?.logoText?.trim() || agency.name
  const tokens = getSpaceVisualTokens(agency, design)
  const primary = tokens.heroText
  const secondary = tokens.heroBackground
  const accent = tokens.accent
  const publishedPages = demoPages.filter((page) => page.status === 'publié' && page.space === space)
  const activeButtons = demoButtons.filter((button) => button.status === 'actif' && button.space === space)
  const activeModules = demoModules.filter((module) => module.enabled && module.key !== spaceDesignModuleKey)
  const hasCustomContent = publishedPages.length > 0 || activeButtons.length > 0 || activeModules.length > 0

  return (
    <section className="page-view dynamic-demo-view">
      <article className="dynamic-demo-hero" style={{ backgroundColor: secondary, color: primary }}>
        <div>
          <p className="eyebrow" style={{ color: accent }}>{agency.sector} · {agency.city}</p>
          <span className="dynamic-logo" style={{ borderColor: accent, color: primary }}>
            {logoText}
          </span>
          <h1 style={{ color: primary }}>{spaceCopy.title}</h1>
          <p className="subtitle" style={{ color: primary }}>{spaceCopy.subtitle}</p>
        </div>
        <div className="profile-facts">
          <span>{agency.name}</span>
          <span>{agency.sector}</span>
          <span>{agency.city}</span>
        </div>
      </article>

      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/${getAgencyRouteSlug(agency)}`)} style={getSpaceButtonStyle(design, agency)}>
          Retour à la démo
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agencies/${getAgencyRouteSlug(agency)}`)} style={getSpaceButtonStyle(design, agency)}>
          Retour à la fiche agence
        </button>
      </div>

      {(customElementsMessage || designMessage) && <p className="save-message">Certains contenus personnalisés sont temporairement indisponibles.</p>}

      {!hasCustomContent && (
        <article className="info-card" style={getSpacePanelStyle(design, agency)}>
          <p className="eyebrow">À venir</p>
          <h2>{spaceConfig.emptyMessage}</h2>
        </article>
      )}

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">{spaceCopy.title}</p>
        <h2>Contenus prêts</h2>
        {publishedPages.length === 0 && <p>Les contenus de cet espace seront ajoutés ici.</p>}
        {publishedPages.length > 0 && (
          <div className="list-grid">
            {publishedPages.slice(0, 3).map((page) => (
              <article className="list-card airy-card" key={`${page.source}-${page.id}-${page.title}`}>
                <div>
                  <h2>{page.title}</h2>
                  {page.content && <p>{getContentExcerpt(page.content)}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">Actions</p>
        <h2>Avancer simplement</h2>
        {activeButtons.length === 0 && <p>Les actions principales apparaîtront ici.</p>}
        {activeButtons.length > 0 && (
          <div className="inline-actions">
            {activeButtons.slice(0, 3).map((button) => (
              <button className="secondary-button compact" type="button" key={`${button.source}-${button.id}`} style={getSpaceButtonStyle(design, agency)}>
                {button.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="demo-panel premium-demo-section" style={getSpacePanelStyle(design, agency)}>
        <p className="eyebrow">Inclus</p>
        <h2>Fonctionnalités utiles</h2>
        {activeModules.length === 0 && <p>Les fonctionnalités activées seront affichées ici.</p>}
        {activeModules.length > 0 && (
          <div className="list-grid">
            {activeModules.slice(0, 3).map((module) => (
              <article className="list-card airy-card" key={`${module.source}-${module.id}`}>
                <div>
                  <h2>{module.name}</h2>
                  <p>Un repère simple pour garder le parcours clair.</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function ImmobilierHubView({ agencies, onNavigate }: { agencies: Agency[]; onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>{immobilierSector.moduleName}</h1>
        <p className="subtitle">{immobilierSector.promise}</p>
      </div>

      <div className="module-card">
        <AgencyPreview />
        <div className="module-actions">
          {hubLinks.map((link) => (
            <button key={link.route} type="button" onClick={() => onNavigate(link.route)}>
              {link.label}
            </button>
          ))}
          <button type="button" onClick={() => onNavigate('/admin/agences')}>
            Gérer les agences locales
          </button>
        </div>
      </div>

      {agencies.length > 0 && (
        <section className="list-grid">
          {agencies.map((agency) => (
            <article className="list-card" key={agency.id}>
              <div>
                <p className="eyebrow">Agence locale</p>
                <h2>{agency.name}</h2>
                <p>{agency.city} · {agency.status}</p>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}>
                Ouvrir
              </button>
            </article>
          ))}
        </section>
      )}
    </section>
  )
}

function ImmobilierPublicView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{immobilierAgency.name}</p>
        <h1>Site public immobilier</h1>
        <p className="subtitle">Vendez votre bien sans rester dans le flou</p>
        <p className="intro">Une expérience claire pour suivre chaque étape de votre vente.</p>
      </div>

      <StaticPropertyCard showManageButton={false} onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Voir l’annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/vendeur')}>
          Estimer mon bien
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour au module
        </button>
      </div>
    </section>
  )
}

function ImmobilierPatronView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Espace patron</h1>
        <p className="subtitle">Résumé agence</p>
        <p className="intro">
          {immobilierAgency.name} · {immobilierAgency.city} · {immobilierAgency.status}
        </p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Biens" value="1" />
        <MetricCard label="Agents" value="1" />
        <MetricCard label="Vendeurs suivis" value="1" />
      </div>

      <StaticPropertyCard showManageButton={false} onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/agent')}>
          Voir espace agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Voir site public
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour au module
        </button>
      </div>
    </section>
  )
}

function ImmobilierAgentView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Espace agent</h1>
        <p className="subtitle">Les actions essentielles pour suivre le bien et le vendeur.</p>
      </div>

      <div className="filter-row" aria-label="Filtre biens">
        <span className="active">Tous les biens</span>
        <span>Mes biens</span>
      </div>

      <StaticPropertyCard onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/bien')}>
          Gérer le bien
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Voir annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/vendeur')}>
          Ouvrir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour au module
        </button>
      </div>
    </section>
  )
}

function ImmobilierVendeurView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view seller-view">
      <div className="page-heading">
        <h1>Espace vendeur</h1>
        <p className="subtitle">Un suivi simple, premium et transparent.</p>
      </div>

      <article className="seller-panel">
        <StaticPropertyPhoto />
        <div>
          <p className="eyebrow">{demoProperty.title}</p>
          <h2>Progression de vente</h2>
          <StepProgress currentStep={sellerTracking.currentStep} />
        </div>
      </article>

      <TrackingCards property={staticPropertyToGenerated()} onNavigate={onNavigate} backRoute="/demo/immobilier" backLabel="Retour démo" />
    </section>
  )
}

function ImmobilierBienView({ onNavigate }: { onNavigate: Navigate }) {
  const [title, setTitle] = useState(demoProperty.title)
  const [city, setCity] = useState(demoProperty.city)
  const [price, setPrice] = useState(demoProperty.price)
  const [surface, setSurface] = useState(demoProperty.surface)
  const [rooms, setRooms] = useState(String(demoProperty.rooms))
  const [status, setStatus] = useState(demoProperty.status)
  const [savedMessage, setSavedMessage] = useState('')

  function saveProperty() {
    setSavedMessage('Modifications enregistrées localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Gérer le bien</h1>
        <p className="subtitle">Une édition locale simple, sans upload réel pour l’instant.</p>
      </div>

      <article className="edit-panel">
        <TextField label="Titre" value={title} onChange={setTitle} />
        <TextField label="Ville" value={city} onChange={setCity} />
        <TextField label="Prix" value={price} onChange={setPrice} />
        <TextField label="Surface" value={surface} onChange={setSurface} />
        <TextField label="Pièces" value={rooms} onChange={setRooms} />
        <TextField label="Statut" value={status} onChange={setStatus} />
        <div className="edit-preview">
          <p className="eyebrow">Aperçu local</p>
          <h2>{title}</h2>
          <p>{city} · {price} · {surface} · {rooms} pièces · {status}</p>
        </div>
        {savedMessage && <p className="save-message">{savedMessage}</p>}
      </article>

      <div className="actions">
        <button className="primary-button" type="button" onClick={saveProperty}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Visualiser l’annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/vendeur')}>
          Ouvrir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/agent')}>
          Retour ? l?agent
        </button>
      </div>
    </section>
  )
}

function GeneratedPublicView({ agencyId, propertyId, onNavigate }: { agencyId: string; propertyId?: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [showEstimate, setShowEstimate] = useState(false)
  const [publicMessage, setPublicMessage] = useState('')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const publishedProperties = getAgencyProperties(agencyId).filter((property) => property.status === 'publié')
  const visibleProperties = propertyId
    ? publishedProperties.filter((property) => property.id === propertyId)
    : publishedProperties

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{agency.name}</p>
        <h1>Vendez votre bien sans rester dans le flou</h1>
        <p className="subtitle">Une expérience claire pour suivre chaque étape de votre vente.</p>
      </div>

      {visibleProperties.length === 0 && <InfoBlock title="Aucun bien publié" text="Publiez une annonce depuis l’admin pour alimenter ce site." />}
      {visibleProperties.map((property) => (
        <GeneratedPropertyCard key={property.id} agencyId={agencyId} property={property} onNavigate={onNavigate} />
      ))}
      <PublishedPages agencyId={agencyId} placement="public" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="public" onNavigate={onNavigate} />
      {publicMessage && <p className="flash-message">{publicMessage}</p>}
      {showEstimate && (
        <article className="edit-panel">
          <h2>Estimation vendeur</h2>
          <TextField label="Adresse du bien" value="Tarbes centre" onChange={() => undefined} />
          <TextField label="Surface estimée" value="82 m²" onChange={() => undefined} />
          <button className="primary-button compact" type="button" onClick={() => setPublicMessage('Demande dd’estimation enregistrée localement')}>
            Envoyer la demande
          </button>
        </article>
      )}

      <div className="actions">
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            visibleProperties[0]
              ? onNavigate(`/demo/immobilier/agence/${agencyId}/public/${visibleProperties[0].id}`)
              : setPublicMessage('Créez une annonce publiée pour ouvrir une annonce.')
          }
        >
          Voir annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => setShowEstimate((value) => !value)}>
          Estimer mon bien
        </button>
        <button className="secondary-button" type="button" onClick={() => setPublicMessage('Demande envoyée localement')}>
          Contacter l’agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour admin
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour démo
        </button>
      </div>
    </section>
  )
}

function GeneratedPatronView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const agents = getAgencyUsers(agencyId).filter((user) => user.role === 'agent')
  const firstProperty = properties[0]
  const alerts = properties.flatMap((property) => getPropertyAlerts(property))

  return (
    <section className="page-view patron-space">
      <div className="page-heading role-heading">
        <h1>Espace patron</h1>
        <p className="subtitle">Controler la qualite du suivi vendeur.</p>
        <p className="intro">{agency.name} · {agency.city} · {agency.status}</p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Biens suivis" value={String(properties.length)} />
        <MetricCard label="Agents" value={String(agents.length)} />
        <MetricCard label="Vendeurs" value={String(properties.length)} />
      </div>

      <article className="role-panel">
        <p className="eyebrow">Boucle de suivi</p>
        <h2>Agent met a jour, vendeur rassure, patron garde le controle</h2>
        <p>Chaque mise a jour visible vendeur permet de verifier la qualite du suivi.</p>
      </article>

      <section className="role-section">
        <p className="eyebrow">Dernieres mises a jour</p>
        <div className="list-grid">
          {properties.length === 0 && <InfoBlock title="Aucun bien suivi" text="Creez une annonce pour lancer le suivi vendeur." />}
          {properties.map((property) => (
            <article className="list-card" key={property.id}>
              <div>
                <p className="eyebrow">Suivi vendeur actif</p>
                <h2>{property.title}</h2>
                <p>Etape actuelle : {property.currentStep}</p>
                <p>Derniere mise a jour visible vendeur : {property.visitReport || 'A completer'}</p>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>
                Voir vendeur
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="role-section">
        <p className="eyebrow">Biens a surveiller</p>
        {alerts.length === 0 ? (
          <article className="quiet-card success-card">
            <h2>Tous les suivis vendeurs sont a jour.</h2>
            <p>Les comptes rendus, visites et documents essentiels sont visibles.</p>
          </article>
        ) : (
          <div className="list-grid">
            {alerts.map((alert) => (
              <article className="quiet-card alert-card" key={`${alert.propertyId}-${alert.text}`}>
                <p className="eyebrow">{alert.propertyTitle}</p>
                <h2>{alert.text}</h2>
                <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${alert.propertyId}`)}>
                  Corriger
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <PublishedPages agencyId={agencyId} placement="patron" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="patron" onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Voir espace agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Voir site public
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => firstProperty ? onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`) : onNavigate(`/admin/agences/${agencyId}/annonces/new`)}
        >
          Voir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Gérer agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour démo
        </button>
      </div>
    </section>
  )
}

function GeneratedAgentView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)

  return (
    <section className="page-view agent-space">
      <div className="page-heading role-heading">
        <h1>Espace agent</h1>
        <p className="subtitle">Mettre a jour le vendeur en moins d’une minute.</p>
        <p className="intro">{agency.name}</p>
      </div>

      <div className="filter-row" aria-label="Filtre biens">
        <span className="active">Tous les biens</span>
        <span>Mes biens</span>
      </div>

      <div className="list-grid agent-list">
        {properties.length === 0 && <InfoBlock title="Aucune annonce" text="Créez une annonce depuis la fiche agence." />}
        {properties.map((property) => (
          <article className="agent-property-card" key={property.id}>
            <PropertyPhoto property={property} />
            <div>
              <p className="eyebrow">{property.status}</p>
              <h2>{property.title}</h2>
              <div className="property-stats">
                <span>Statut actuel : {property.currentStep}</span>
                <span>Derniere mise a jour visible vendeur</span>
              </div>
              <p>{property.visitReport || 'Compte rendu a completer.'}</p>
              <p className="microcopy">Compte rendu partage au vendeur.</p>
            </div>
            <div className="quick-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Gerer le bien
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Programmer visite
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Ajouter compte rendu
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Ajouter document
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>
                Ouvrir espace vendeur
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${property.id}`)}>
                Voir annonce
              </button>
            </div>
          </article>
        ))}
      </div>
      <PublishedPages agencyId={agencyId} placement="agent" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="agent" onNavigate={onNavigate} />

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/new`)}>
        Créer annonce
      </button>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
        Retour démo
      </button>
    </section>
  )
}

function GeneratedSellerView({ agencyId, propertyId, onNavigate }: { agencyId: string; propertyId: string; onNavigate: Navigate }) {
  const property = getProperty(propertyId)
  if (!property || property.agencyId !== agencyId) {
    return <MissingView title="Annonce introuvable" onNavigate={onNavigate} backRoute={`/admin/agences/${agencyId}`} backLabel="Retour fiche agence" />
  }
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)

  return (
    <section className="page-view seller-view reassuring-seller">
      <PropertyPhoto property={property} />

      <div className="page-heading role-heading">
        <h1>{property.title}</h1>
        <p className="subtitle">Votre vente avance. Voici ou nous en sommes.</p>
      </div>

      <article className="quiet-card status-card">
        <p className="eyebrow">Suivi vendeur actif</p>
        <h2>Etape actuelle : {property.currentStep}</h2>
        <StepProgress currentStep={property.currentStep} />
      </article>

      <article className="quiet-card">
        <p className="eyebrow">Prochaine etape</p>
        <h2>{property.nextVisit || 'Retour attendu prochainement'}</h2>
        <p>Votre agent vous tiendra informe apres chaque action importante.</p>
      </article>

      <article className="quiet-card">
        <p className="eyebrow">Dernier compte rendu</p>
        <h2>Compte rendu partage au vendeur</h2>
        <p>{property.visitReport || 'Aucun compte rendu partage pour le moment.'}</p>
      </article>

      <article className="quiet-card">
        <p className="eyebrow">Documents visibles</p>
        <div className="document-list">
          {property.visibleDocuments.length > 0
            ? property.visibleDocuments.map((document) => <span key={document}>{document}</span>)
            : <span>Aucun document visible</span>}
        </div>
      </article>

      <PublishedPages agencyId={agencyId} placement="vendeur" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="vendeur" onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${propertyId}`)}>
          Retour annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Contact agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Espace agent
        </button>
        {agency && (
          <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
            Gerer agence
          </button>
        )}
      </div>
    </section>
  )
}

function GeneratedPropertyView({ agencyId, propertyId, onNavigate }: { agencyId: string; propertyId: string; onNavigate: Navigate }) {
  const property = getProperty(propertyId)
  if (!property || property.agencyId !== agencyId) {
    return <MissingView title="Annonce introuvable" onNavigate={onNavigate} backRoute={`/admin/agences/${agencyId}`} backLabel="Retour fiche agence" />
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Bien</h1>
        <p className="subtitle">{property.title}</p>
      </div>

      <GeneratedPropertyCard agencyId={agencyId} property={property} onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${propertyId}`)}>
          Modifier dans l’admin
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Voir annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Retour agent
        </button>
      </div>
    </section>
  )
}

function GeneratedCustomPageView({ agencyId, slug, onNavigate }: { agencyId: string; slug: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const page = getAgencyPageBySlug(agencyId, slug)
  if (!page) return <PreparationView agencyId={agencyId} onNavigate={onNavigate} />

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{agency.name} · {page.placement}</p>
        <h1>{page.title}</h1>
        <p className="subtitle">{page.content}</p>
      </div>
      <div className="actions">
        {page.ctaLabel && (
          <button className="primary-button" type="button" onClick={() => onNavigate(page.ctaDestination || `/demo/immobilier/agence/${agencyId}/preparation`)}>
            {page.ctaLabel}
          </button>
        )}
        <button className="secondary-button" type="button" onClick={() => onNavigate(getPlacementRoute(agencyId, page.placement))}>
          Retour espace
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/pages`)}>
          Modifier les pages
        </button>
      </div>
    </section>
  )
}

function PreparationView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Page en préparation</h1>
        <p className="subtitle">Cette destination existe comme action locale, mais son contenu n’est pas encore créé.</p>
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(agencyId ? `/admin/agences/${agencyId}/pages` : '/admin')}>
          Créer une page
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(agencyId ? `/admin/agences/${agencyId}` : '/admin')}>
          Retour
        </button>
      </div>
    </section>
  )
}

function CustomButtons({
  agencyId,
  placement,
  onNavigate,
}: {
  agencyId: string
  placement: CustomButton['placement']
  onNavigate: Navigate
}) {
  const buttons = getAgencyButtonsByPlacement(agencyId, placement).filter((button) => button.status !== 'inactif')
  if (buttons.length === 0) return null

  return (
    <article className="demo-panel">
      <p className="eyebrow">Actions personnalisées</p>
      <div className="inline-actions">
        {buttons.map((button) => (
          <button className="secondary-button compact" key={button.id} type="button" onClick={() => openCustomDestination(button, agencyId, onNavigate)}>
            {button.label}
          </button>
        ))}
      </div>
    </article>
  )
}

function openCustomDestination(button: CustomButton, agencyId: string, onNavigate: Navigate) {
  const destination = button.destination.trim()
  if (button.destinationType === 'téléphone' || button.destinationType === 'mail' || button.destinationType === 'formulaire simulé') {
    onNavigate(`/demo/immobilier/agence/${agencyId}/preparation`)
    return
  }
  const localPagePrefix = `/demo/immobilier/agence/${agencyId}/page/`
  const allowedPrefixes = [
    `/admin/agences/${agencyId}`,
    `/demo/immobilier/agence/${agencyId}/public`,
    `/demo/immobilier/agence/${agencyId}/patron`,
    `/demo/immobilier/agence/${agencyId}/agent`,
    `/demo/immobilier/agence/${agencyId}/vendeur`,
    `/demo/immobilier/agence/${agencyId}/bien`,
    localPagePrefix,
  ]

  if (allowedPrefixes.some((prefix) => destination.startsWith(prefix))) {
    onNavigate(destination)
    return
  }

  onNavigate(`/demo/immobilier/agence/${agencyId}/preparation`)
}

function PublishedPages({
  agencyId,
  placement,
  onNavigate,
}: {
  agencyId: string
  placement: 'public' | 'patron' | 'agent' | 'vendeur'
  onNavigate: Navigate
}) {
  const pages = getAgencyPages(agencyId).filter((page) => page.placement === placement && page.status !== 'brouillon')
  if (pages.length === 0) return null

  return (
    <article className="demo-panel">
      <p className="eyebrow">Pages personnalisées</p>
      <div className="inline-actions">
        {pages.map((page) => (
          <button className="secondary-button compact" key={page.id} type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/page/${page.slug}`)}>
            {page.title}
          </button>
        ))}
      </div>
    </article>
  )
}

function openGlobalDestination(button: GlobalButton, onNavigate: Navigate) {
  const destination = button.destination.trim()
  if (destination.startsWith('/')) {
    onNavigate(destination)
    return
  }
  onNavigate('/admin/preview')
}

function GlobalPageView({ slug, onNavigate }: { slug: string; onNavigate: Navigate }) {
  const page = getGlobalPageBySlug(slug)
  if (!page || page.status !== 'publié') {
    return (
      <section className="page-view">
        <div className="page-heading">
          <h1>Page en préparation</h1>
          <p className="subtitle">Cette page globale n’existe pas encore ou n’est pas publiée.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/pages')}>
          Gérer les pages
        </button>
      </section>
    )
  }

  const pageButtons = getGlobalButtonsByPlacement('page globale')

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{page.placement}</p>
        <h1>{page.title}</h1>
        <p className="subtitle">{page.content}</p>
      </div>
      <div className="actions">
        {page.ctaLabel && (
          <button className="primary-button" type="button" onClick={() => onNavigate(page.ctaDestination || '/')}>
            {page.ctaLabel}
          </button>
        )}
        {pageButtons.map((button) => (
          <button className="secondary-button" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
            {button.label}
          </button>
        ))}
        <button className="secondary-button" type="button" onClick={() => onNavigate('/')}>
          Retour accueil
        </button>
      </div>
    </section>
  )
}

function getPlacementRoute(agencyId: string, placement: CustomButton['placement']) {
  if (placement === 'vendeur') {
    const firstProperty = getAgencyProperties(agencyId)[0]
    return firstProperty
      ? `/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`
      : `/demo/immobilier/agence/${agencyId}/preparation`
  }

  return `/demo/immobilier/agence/${agencyId}/${placement}`
}

function PropertyForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
}: {
  form: ReturnType<typeof defaultPropertyForm>
  onChange: (field: keyof ReturnType<typeof defaultPropertyForm>, value: string) => void
  onSubmit: (event: FormEvent) => void
  submitLabel: string
}) {
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')

  return (
    <form className={`edit-panel form-grid property-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={onSubmit}>
      <div className="form-section-title">
        <p className="eyebrow">Mode de saisie</p>
        <h2>Annonce</h2>
        <p>Commence par les champs essentiels. Le detail reste modifiable ensuite.</p>
        <div className="filter-row">
          <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
            Simple
          </button>
          <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
            Avance
          </button>
        </div>
      </div>
      <TextField label="Titre du bien" value={form.title} onChange={(value) => onChange('title', value)} />
      <TextField label="Ville" value={form.city} onChange={(value) => onChange('city', value)} />
      <TextField label="Prix" value={form.price} onChange={(value) => onChange('price', value)} />
      <TextField label="Surface" value={form.surface} onChange={(value) => onChange('surface', value)} />
      <TextField label="Nombre de pièces" value={form.rooms} onChange={(value) => onChange('rooms', value)} />
      <SelectField label="Statut" value={form.status} options={['brouillon', 'publié']} onChange={(value) => onChange('status', value)} />
      <TextAreaField label="Description courte" value={form.shortDescription} onChange={(value) => onChange('shortDescription', value)} />
      <TextAreaField label="Description longue" value={form.longDescription} onChange={(value) => onChange('longDescription', value)} />
      <TextField label="Adresse approximative" value={form.approximateAddress} onChange={(value) => onChange('approximateAddress', value)} />
      <TextField label="Photo principale en URL texte" value={form.mainPhotoUrl} onChange={(value) => onChange('mainPhotoUrl', value)} />
      <TextField label="Photos secondaires en URL texte" value={form.secondaryPhotos} onChange={(value) => onChange('secondaryPhotos', value)} />
      <SelectField label="Étape actuelle" value={form.currentStep} options={saleSteps} onChange={(value) => onChange('currentStep', value)} />
      <TextField label="Prochaine visite" value={form.nextVisit} onChange={(value) => onChange('nextVisit', value)} />
      <TextAreaField label="Compte rendu de visite" value={form.visitReport} onChange={(value) => onChange('visitReport', value)} />
      <TextField label="Documents visibles vendeur" value={form.visibleDocuments} onChange={(value) => onChange('visibleDocuments', value)} />
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function makeSimulatedAnalysis(siteUrl: string, sector: string, city: string): AgencyAnalysis {
  const detectedName = siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('.')[0]
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Agence Locale'

  return {
    siteUrl,
    detectedName,
    logoUrl: 'https://placehold.co/320x140/0d1f36/fbf3e6?text=Logo',
    colors: {
      primary: 'bleu nuit',
      secondary: 'crème',
      accent: 'doré doux',
    },
    mood: 'Premium sobre',
    tone: `local, rassurant et expert ${sector}`,
    promise: `Une expérience ${sector.toLowerCase()} claire à ${city}.`,
    detectedListings: [`Appartement lumineux à ${city}`, `Maison familiale proche ${city}`],
    weaknesses: ['Navigation peu claire', 'Peu de suivi vendeur visible', 'Appels à action dispersés'],
    premiumSuggestion: 'Créer un parcours vendeur transparent avec espaces dédiés, documents et visites.',
    confidenceScore: '87%',
    recommendations: ['Moderniser la page publique', 'Créer un espace vendeur', 'Mettre en avant les comptes rendus'],
  }
}

function defaultMood(name: string): AgencyMood {
  return {
    moodName: 'Apple / Airbnb',
    homeTitle: name,
    subtitle: 'Une expérience immobilière claire et premium.',
    promise: 'Vendez votre bien sans rester dans le flou.',
    tone: 'clair, rassurant et premium',
    cardStyle: 'cartes arrondies',
    contrast: 'normal',
    radius: 'large',
    density: 'normal',
  }
}

function AnalysisCard({ analysis }: { analysis: AgencyAnalysis }) {
  return (
    <article className="demo-panel">
      <p className="eyebrow">Analyse détectée</p>
      <h2>{analysis.detectedName}</h2>
      <p>{analysis.promise}</p>
      <div className="document-list">
        <span>{analysis.colors.primary}</span>
        <span>{analysis.colors.secondary}</span>
        <span>{analysis.colors.accent}</span>
        <span>Score {analysis.confidenceScore}</span>
      </div>
      <p>{analysis.premiumSuggestion}</p>
      <div className="list-grid compact-list">
        <InfoBlock title="Annonces détectées" text={analysis.detectedListings.join(' · ')} />
        <InfoBlock title="Points faibles" text={analysis.weaknesses.join(' · ')} />
        <InfoBlock title="Recommandations" text={analysis.recommendations.join(' · ')} />
      </div>
    </article>
  )
}

function defaultPropertyForm() {
  return {
    title: 'Appartement lumineux à Tarbes',
    city: 'Tarbes',
    price: '189 000 €',
    surface: '82 m²',
    rooms: '4',
    status: 'publié',
    shortDescription: 'Appartement lumineux, calme et proche du centre-ville.',
    longDescription:
      'Un bien prêt à présenter avec une pièce de vie lumineuse, une circulation fluide et un suivi vendeur clair.',
    approximateAddress: 'Centre-ville de Tarbes',
    mainPhotoUrl: '',
    secondaryPhotos: '',
    currentStep: 'Visites',
    nextVisit: 'Samedi 22 juin à 14h30',
    visitReport: 'Visite positive, acheteurs intéressés, retour attendu sous 48h.',
    visibleDocuments: 'Mandat signé, Diagnostics, Offre reçue',
  }
}

function propertyToForm(property?: Property) {
  if (!property) return defaultPropertyForm()

  return {
    title: property.title,
    city: property.city,
    price: property.price,
    surface: property.surface,
    rooms: property.rooms,
    status: property.status,
    shortDescription: property.shortDescription,
    longDescription: property.longDescription,
    approximateAddress: property.approximateAddress,
    mainPhotoUrl: property.mainPhotoUrl,
    secondaryPhotos: property.photos.join(', '),
    currentStep: property.currentStep,
    nextVisit: property.nextVisit,
    visitReport: property.visitReport,
    visibleDocuments: property.visibleDocuments.join(', '),
  }
}

function formToPropertyInput(agencyId: string, form: ReturnType<typeof defaultPropertyForm>): CreatePropertyInput {
  return {
    agencyId,
    title: form.title,
    city: form.city,
    price: form.price,
    surface: form.surface,
    rooms: form.rooms,
    status: form.status === 'brouillon' ? 'brouillon' : 'publié',
    shortDescription: form.shortDescription,
    longDescription: form.longDescription,
    approximateAddress: form.approximateAddress,
    mainPhotoUrl: form.mainPhotoUrl,
    photos: form.secondaryPhotos
      .split(',')
      .map((photo) => photo.trim())
      .filter(Boolean),
    currentStep: form.currentStep,
    nextVisit: form.nextVisit,
    visitReport: form.visitReport,
    visibleDocuments: form.visibleDocuments
      .split(',')
      .map((document) => document.trim())
      .filter(Boolean),
  }
}

function getPropertyAlerts(property: Property) {
  const alerts: { propertyId: string; propertyTitle: string; text: string }[] = []

  if (!property.visitReport.trim()) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Compte rendu manquant',
    })
  }

  if (!property.nextVisit.trim()) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Aucune visite programmee',
    })
  }

  if (!property.visitReport.trim() && !property.nextVisit.trim()) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Vendeur sans mise a jour recente',
    })
  }

  if (property.visibleDocuments.length === 0) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Document absent',
    })
  }

  return alerts
}

function StaticPropertyCard({
  onNavigate,
  showManageButton = true,
}: {
  onNavigate: Navigate
  showManageButton?: boolean
}) {
  return (
    <article className="property-card">
      <StaticPropertyPhoto />
      <div className="property-content">
        <p className="eyebrow">{demoProperty.status}</p>
        <h2>{demoProperty.title}</h2>
        <p>{demoProperty.description}</p>
        <div className="property-stats">
          <span>{demoProperty.price}</span>
          <span>{demoProperty.surface}</span>
          <span>{demoProperty.rooms} pièces</span>
          <span>statut {demoProperty.status.toLowerCase()}</span>
        </div>
        {showManageButton && (
          <button className="secondary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier/bien')}>
            Gérer le bien
          </button>
        )}
      </div>
    </article>
  )
}

function GeneratedPropertyCard({
  agencyId,
  property,
  onNavigate,
}: {
  agencyId: string
  property: Property
  onNavigate: Navigate
}) {
  return (
    <article className="property-card">
      <PropertyPhoto property={property} />
      <div className="property-content">
        <p className="eyebrow">{property.status}</p>
        <h2>{property.title}</h2>
        <p>{property.shortDescription}</p>
        <div className="property-stats">
          <span>{property.price}</span>
          <span>{property.surface}</span>
          <span>{property.rooms} pièces</span>
          <span>{property.currentStep}</span>
        </div>
        <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/bien/${property.id}`)}>
          Gérer le bien
        </button>
      </div>
    </article>
  )
}

function StaticPropertyPhoto() {
  return (
    <div className="property-photo" role="img" aria-label={demoProperty.mainPhotoPlaceholder}>
      <span>{demoProperty.mainPhotoPlaceholder}</span>
    </div>
  )
}

function PropertyPhoto({ property }: { property: Property }) {
  if (property.mainPhotoUrl) {
    return (
      <div
        className="property-photo has-image"
        role="img"
        aria-label={property.title}
        style={{ backgroundImage: `linear-gradient(145deg, rgba(13, 31, 54, 0.18), rgba(217, 188, 125, 0.18)), url(${property.mainPhotoUrl})` }}
      >
        <span>{property.city}</span>
      </div>
    )
  }

  return (
    <div className="property-photo" role="img" aria-label={property.title}>
      <span>{property.city}</span>
    </div>
  )
}

function StepProgress({ currentStep }: { currentStep: string }) {
  return (
    <div className="step-list" aria-label="Progression de vente">
      {saleSteps.map((step) => (
        <span className={step === currentStep ? 'current' : ''} key={step}>
          {step}
        </span>
      ))}
    </div>
  )
}

function TrackingCards({
  property,
  onNavigate,
  backRoute,
  backLabel = 'Retour',
}: {
  property: Pick<Property, 'nextVisit' | 'visitReport' | 'visibleDocuments'> &
    Partial<Pick<Property, 'longDescription' | 'documents'>>
  onNavigate: Navigate
  backRoute: string
  backLabel?: string
}) {
  const [visibleSection, setVisibleSection] = useState<'description' | 'report' | 'documents'>('report')
  const [documentMessage, setDocumentMessage] = useState('')
  const sellerDocuments = property.documents?.length
    ? property.documents.filter((document) => document.visibleToSeller)
    : property.visibleDocuments.map((name) => ({
        id: name,
        name,
        type: 'Démo',
        url: '',
        visibleToSeller: true,
      }))

  function openDocument(document: PropertyDocument) {
    if (document.url) {
      window.open(document.url, '_blank')
      return
    }

    setDocumentMessage('Document de démonstration')
  }

  function downloadDocument(document: PropertyDocument) {
    if (document.url) {
      window.open(document.url, '_blank')
      return
    }

    setDocumentMessage('Téléchargement simulé')
  }

  return (
    <>
      <div className="card-grid">
        <article className="info-card">
          <h2>Prochaine visite</h2>
          <p>{property.nextVisit}</p>
        </article>
        <article className="info-card">
          <h2>Compte rendu</h2>
          <p>{property.visitReport}</p>
        </article>
      </div>

      <article className="demo-panel">
        <p className="eyebrow">Documents visibles</p>
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => setVisibleSection('description')}>
            Voir description du bien
          </button>
          <button className="secondary-button compact" type="button" onClick={() => setVisibleSection('report')}>
            Voir compte rendu
          </button>
          <button className="secondary-button compact" type="button" onClick={() => setVisibleSection('documents')}>
            Voir documents
          </button>
        </div>
        {visibleSection === 'description' && (
          <p>{property.longDescription ?? 'Description détaillée du bien disponible dans l’annonce publique.'}</p>
        )}
        {visibleSection === 'report' && <p>{property.visitReport}</p>}
        <div className="document-list">
          {sellerDocuments.map((document) => (
            <span key={document.id}>{document.name}</span>
          ))}
        </div>
        {visibleSection === 'documents' && (
          <div className="list-grid compact-list">
            {sellerDocuments.map((document) => (
              <article className="list-card" key={document.id}>
                <div>
                  <p className="eyebrow">{document.type}</p>
                  <h2>{document.name}</h2>
                </div>
                <div className="inline-actions">
                  <button className="secondary-button compact" type="button" onClick={() => openDocument(document)}>
                    Ouvrir document
                  </button>
                  <button className="secondary-button compact" type="button" onClick={() => downloadDocument(document)}>
                    T?l?charger document
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {documentMessage && <p className="save-message">{documentMessage}</p>}
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(backRoute)}>
            {backLabel}
          </button>
        </div>
      </article>
    </>
  )
}

function staticPropertyToGenerated(): Pick<Property, 'nextVisit' | 'visitReport' | 'visibleDocuments'> {
  return {
    nextVisit: sellerTracking.nextVisit,
    visitReport: sellerTracking.shortReport,
    visibleDocuments: sellerTracking.visibleDocuments,
  }
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <article className="info-card">
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

function AgencyPreview() {
  return (
    <aside className="agency-preview" aria-label="Aperçu agence">
      <p className="eyebrow">Expérience Signature</p>
      <h2>{immobilierAgency.name}</h2>
      <p>Un parcours clair pour présenter l’agence, rassurer le client et ouvrir les bons espaces.</p>
      <div className="agency-lines">
        <span>{immobilierSector.sectorName}</span>
        <span>{immobilierAgency.city}</span>
        <span>Démo prête</span>
      </div>
    </aside>
  )
}

function MissingView({
  title,
  onNavigate,
  backRoute = '/admin/agences',
  backLabel = 'Retour aux agences',
}: {
  title: string
  onNavigate: Navigate
  backRoute?: string
  backLabel?: string
}) {
  function resetLocalDemo() {
    resetDemoData()
    onNavigate('/admin')
    window.location.reload()
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>{title}</h1>
        <p className="subtitle">La donnée locale demandée n’existe pas ou a été réinitialisée.</p>
      </div>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(backRoute)}>
          {backLabel}
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences/new')}>
          Créer une agence
        </button>
        <button className="secondary-button" type="button" onClick={resetLocalDemo}>
          Réinitialiser les données locales
        </button>
      </div>
    </section>
  )
}

function InactiveAgencyView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Agence désactivée</h1>
        <p className="subtitle">Cet espace local est désactivé pour le moment.</p>
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>
        Retour admin
      </button>
    </section>
  )
}

function NotFoundView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Page introuvable</h1>
        <p className="subtitle">Cette route locale n’est pas encore déclarée.</p>
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour au Studio
      </button>
    </section>
  )
}

export default App
