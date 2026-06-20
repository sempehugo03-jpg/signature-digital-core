export type Agency = {
  id: string
  name: string
  sector: string
  city: string
  currentSite: string
  phone?: string
  email?: string
  status: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  appearance?: {
    logoText: string
    heroImageUrl: string
    visualStyle: string
    backgroundColor?: string
    textColor?: string
    buttonStyle?: string
    fontStyle?: string
  }
  analysis?: AgencyAnalysis
  mood?: AgencyMood
  modules?: Record<string, boolean>
  ownerName: string
  ownerEmail: string
  agentName: string
  agentEmail: string
  createdAt: string
}

export type LocalUser = {
  id: string
  agencyId: string
  role: 'patron' | 'agent'
  name: string
  email: string
}

export type Property = {
  id: string
  agencyId: string
  title: string
  city: string
  price: string
  surface: string
  rooms: string
  status: 'brouillon' | 'publié'
  shortDescription: string
  longDescription: string
  approximateAddress: string
  mainPhotoUrl: string
  currentStep: string
  nextVisit: string
  visitReport: string
  visibleDocuments: string[]
  photos: string[]
  documents: PropertyDocument[]
  visits: PropertyVisit[]
  createdAt: string
  updatedAt: string
}

export type PropertyDocument = {
  id: string
  name: string
  type: string
  url: string
  visibleToSeller: boolean
}

export type PropertyVisit = {
  id: string
  dateTime: string
  comment: string
}

export type SellerSpace = {
  id: string
  agencyId: string
  propertyId?: string
  status: 'vide' | 'lié'
}

export type CustomPage = {
  id: string
  agencyId: string
  title: string
  content: string
  placement: 'public' | 'patron' | 'agent' | 'vendeur'
  slug: string
  status?: 'brouillon' | 'publié'
  ctaLabel?: string
  ctaDestination?: string
  createdAt: string
}

export type CustomButton = {
  id: string
  agencyId: string
  label: string
  placement: 'public' | 'patron' | 'agent' | 'vendeur' | 'fiche agence'
  destination: string
  destinationType?: 'route interne' | 'page personnalisée' | 'téléphone' | 'mail' | 'formulaire simulé'
  style?: 'principal' | 'secondaire' | 'discret'
  status?: 'actif' | 'inactif'
  createdAt: string
}

export type AgencyAnalysis = {
  siteUrl: string
  detectedName: string
  logoUrl: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  mood: string
  tone: string
  promise: string
  detectedListings: string[]
  weaknesses: string[]
  premiumSuggestion: string
  confidenceScore: string
  recommendations: string[]
}

export type AgencyMood = {
  moodName: string
  homeTitle: string
  subtitle: string
  promise: string
  tone: string
  cardStyle: string
  contrast: string
  radius: string
  density: 'minimal' | 'normal' | 'détaillé'
}

export type PublicSiteConfig = {
  title: string
  subtitle: string
  promise: string
  primaryButtonText: string
  primaryButtonDestination: string
  secondaryButtonText: string
  secondaryButtonDestination: string
  sections: Record<string, boolean>
}

export type GlobalAppearance = {
  primary: string
  secondary: string
  accent: string
  background: string
  style: string
  radius: string
  density: string
}

export type GlobalPage = {
  id: string
  title: string
  slug: string
  placement: 'site public' | 'admin' | 'aide' | 'secteur'
  content: string
  status: 'brouillon' | 'publié'
  ctaLabel: string
  ctaDestination: string
  createdAt: string
}

export type GlobalButton = {
  id: string
  label: string
  placement: 'accueil' | 'admin' | 'démo immobilier' | 'page globale'
  destination: string
  style: 'principal' | 'secondaire' | 'discret'
  status: 'actif' | 'inactif'
  createdAt: string
}

export type GlobalModule = {
  id: string
  name: string
  description: string
  active: boolean
  state: 'local' | 'simulé' | 'à connecter'
}

export type AdminCardConfig = {
  id: string
  title: string
  text: string
  buttonLabel: string
  route: string
  section: 'Production' | 'Personnalisation globale' | 'Système'
  visible: boolean
  order: number
}

export type AdminLayoutConfig = {
  title: string
  subtitle: string
  style: 'compact' | 'confortable' | 'premium'
  shortcutsVisible: boolean
  cards: AdminCardConfig[]
}

export type LocalState = {
  agencies: Agency[]
  users: LocalUser[]
  properties: Property[]
  sellerSpaces: SellerSpace[]
  customPages: CustomPage[]
  customButtons: CustomButton[]
  publicSiteConfig?: PublicSiteConfig
  globalAppearance?: GlobalAppearance
  globalPages: GlobalPage[]
  globalButtons: GlobalButton[]
  globalModules: GlobalModule[]
  adminLayout?: AdminLayoutConfig
}

export type CreateAgencyInput = Omit<Agency, 'id' | 'status' | 'createdAt'>
export type CreatePropertyInput = Omit<
  Property,
  'id' | 'createdAt' | 'updatedAt' | 'photos' | 'documents' | 'visits'
> &
  Partial<Pick<Property, 'photos' | 'documents' | 'visits'>>
export type CreateCustomPageInput = Omit<CustomPage, 'id' | 'createdAt'>
export type CreateCustomButtonInput = Omit<CustomButton, 'id' | 'createdAt'>

const STORE_KEY = 'signature-digital-core-local-store'

const emptyState: LocalState = {
  agencies: [],
  users: [],
  properties: [],
  sellerSpaces: [],
  customPages: [],
  customButtons: [],
  globalPages: [],
  globalButtons: [],
  globalModules: [],
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function readState(): LocalState {
  if (typeof window === 'undefined') return emptyState

  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    return raw ? { ...emptyState, ...JSON.parse(raw) } : emptyState
  } catch {
    return emptyState
  }
}

function writeState(state: LocalState) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state))
}

export function getLocalState() {
  return readState()
}

export function listAgencies() {
  return readState().agencies
}

export function getAgency(agencyId: string) {
  return readState().agencies.find((agency) => agency.id === agencyId)
}

export function getAgencyUsers(agencyId: string) {
  return readState().users.filter((user) => user.agencyId === agencyId)
}

export function createAgency(input: CreateAgencyInput) {
  const state = readState()
  const agency: Agency = {
    ...input,
    id: createId('agency'),
    status: 'Démo active',
    createdAt: new Date().toISOString(),
    appearance: {
      logoText: input.name,
      heroImageUrl: '',
      visualStyle: 'premium',
      backgroundColor: 'crème',
      textColor: 'bleu nuit',
      buttonStyle: 'premium',
      fontStyle: 'moderne',
    },
    mood: {
      moodName: 'Apple / Airbnb',
      homeTitle: input.name,
      subtitle: 'Une expérience immobilière claire et premium.',
      promise: 'Vendez votre bien sans rester dans le flou.',
      tone: 'clair, rassurant et premium',
      cardStyle: 'cartes arrondies',
      contrast: 'normal',
      radius: 'large',
      density: 'normal',
    },
    modules: {
      sellerSpace: true,
      documents: true,
      visits: true,
      reports: true,
      customPages: true,
      customButtons: true,
      sellerEstimate: true,
      agencyContact: true,
      publicSite: true,
      ownerSpace: true,
      agentSpace: true,
      listings: true,
      aiAnalysis: true,
      importListings: false,
      importBranding: false,
    },
  }

  const users: LocalUser[] = [
    {
      id: createId('user'),
      agencyId: agency.id,
      role: 'patron',
      name: input.ownerName,
      email: input.ownerEmail,
    },
    {
      id: createId('user'),
      agencyId: agency.id,
      role: 'agent',
      name: input.agentName,
      email: input.agentEmail,
    },
  ]

  const sellerSpace: SellerSpace = {
    id: createId('seller'),
    agencyId: agency.id,
    status: 'vide',
  }

  writeState({
    ...state,
    agencies: [...state.agencies, agency],
    users: [...state.users, ...users],
    sellerSpaces: [...state.sellerSpaces, sellerSpace],
  })

  return agency
}

export function updateAgency(agencyId: string, updates: Partial<Agency>) {
  const state = readState()
  const agency = state.agencies.find((item) => item.id === agencyId)
  if (!agency) return undefined

  const updatedAgency: Agency = {
    ...agency,
    ...updates,
    id: agency.id,
  }

  writeState({
    ...state,
    agencies: state.agencies.map((item) => (item.id === agencyId ? updatedAgency : item)),
  })

  return updatedAgency
}

export function deleteAgency(agencyId: string) {
  const state = readState()
  writeState({
    ...state,
    agencies: state.agencies.filter((agency) => agency.id !== agencyId),
    users: state.users.filter((user) => user.agencyId !== agencyId),
    properties: state.properties.filter((property) => property.agencyId !== agencyId),
    sellerSpaces: state.sellerSpaces.filter((space) => space.agencyId !== agencyId),
    customPages: state.customPages.filter((page) => page.agencyId !== agencyId),
    customButtons: state.customButtons.filter((button) => button.agencyId !== agencyId),
  })
}

export function createAgencyFromAnalysis(input: CreateAgencyInput, analysis: AgencyAnalysis) {
  const agency = createAgency({
    ...input,
    name: input.name || analysis.detectedName,
    colors: analysis.colors,
    currentSite: analysis.siteUrl,
  })
  updateAgency(agency.id, { analysis })
  return agency
}

export function updateAgencyBranding(agencyId: string, updates: Partial<Agency>) {
  return updateAgency(agencyId, updates)
}

export function updateAgencyMood(agencyId: string, mood: AgencyMood) {
  return updateAgency(agencyId, { mood })
}

export function getAgencyProperties(agencyId: string) {
  return readState().properties.filter((property) => property.agencyId === agencyId)
}

export function getProperty(propertyId: string) {
  return readState().properties.find((property) => property.id === propertyId)
}

export function createProperty(input: CreatePropertyInput) {
  const state = readState()
  const now = new Date().toISOString()
  const property: Property = {
    ...input,
    photos: input.photos ?? [],
    documents: input.documents ?? [],
    visits: input.visits ?? [],
    id: createId('property'),
    createdAt: now,
    updatedAt: now,
  }

  const sellerSpace: SellerSpace = {
    id: createId('seller'),
    agencyId: input.agencyId,
    propertyId: property.id,
    status: 'lié',
  }

  writeState({
    ...state,
    properties: [...state.properties, property],
    sellerSpaces: [
      ...state.sellerSpaces.filter(
        (space) => !(space.agencyId === input.agencyId && space.status === 'vide'),
      ),
      sellerSpace,
    ],
  })

  return property
}

export function updateProperty(propertyId: string, updates: Partial<Property>) {
  const state = readState()
  const property = state.properties.find((item) => item.id === propertyId)
  if (!property) return undefined

  const updatedProperty: Property = {
    ...property,
    ...updates,
    id: property.id,
    agencyId: property.agencyId,
    updatedAt: new Date().toISOString(),
  }

  writeState({
    ...state,
    properties: state.properties.map((item) => (item.id === propertyId ? updatedProperty : item)),
  })

  return updatedProperty
}

export function deleteProperty(propertyId: string) {
  const state = readState()
  const property = state.properties.find((item) => item.id === propertyId)
  if (!property) return undefined

  writeState({
    ...state,
    properties: state.properties.filter((item) => item.id !== propertyId),
    sellerSpaces: state.sellerSpaces.filter((space) => space.propertyId !== propertyId),
  })

  return property
}

export function getSellerSpace(agencyId: string, propertyId?: string) {
  return readState().sellerSpaces.find(
    (space) =>
      space.agencyId === agencyId &&
      (propertyId ? space.propertyId === propertyId : space.status === 'vide'),
  )
}

export function getAgencyPages(agencyId: string) {
  return readState().customPages.filter((page) => page.agencyId === agencyId)
}

export function getAgencyPageBySlug(agencyId: string, slug: string) {
  return readState().customPages.find((page) => page.agencyId === agencyId && page.slug === slug)
}

export function createCustomPage(input: CreateCustomPageInput) {
  const state = readState()
  const page: CustomPage = {
    ...input,
    status: input.status ?? 'publié',
    slug: input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, ''),
    id: createId('page'),
    createdAt: new Date().toISOString(),
  }

  writeState({
    ...state,
    customPages: [...state.customPages.filter((item) => !(item.agencyId === page.agencyId && item.slug === page.slug)), page],
  })

  return page
}

export const createPage = createCustomPage

export function updatePage(pageId: string, updates: Partial<CustomPage>) {
  const state = readState()
  const page = state.customPages.find((item) => item.id === pageId)
  if (!page) return undefined
  const updatedPage = { ...page, ...updates, id: page.id }
  writeState({
    ...state,
    customPages: state.customPages.map((item) => (item.id === pageId ? updatedPage : item)),
  })
  return updatedPage
}

export function deletePage(pageId: string) {
  const state = readState()
  writeState({
    ...state,
    customPages: state.customPages.filter((page) => page.id !== pageId),
  })
}

export function getAgencyButtons(agencyId: string) {
  return readState().customButtons.filter((button) => button.agencyId === agencyId)
}

export function getAgencyButtonsByPlacement(agencyId: string, placement: CustomButton['placement']) {
  return readState().customButtons.filter(
    (button) => button.agencyId === agencyId && button.placement === placement,
  )
}

export function createCustomButton(input: CreateCustomButtonInput) {
  const state = readState()
  const button: CustomButton = {
    ...input,
    destinationType: input.destinationType ?? 'route interne',
    style: input.style ?? 'secondaire',
    status: input.status ?? 'actif',
    id: createId('button'),
    createdAt: new Date().toISOString(),
  }

  writeState({
    ...state,
    customButtons: [...state.customButtons, button],
  })

  return button
}

export const createButton = createCustomButton

export function updateButton(buttonId: string, updates: Partial<CustomButton>) {
  const state = readState()
  const button = state.customButtons.find((item) => item.id === buttonId)
  if (!button) return undefined
  const updatedButton = { ...button, ...updates, id: button.id }
  writeState({
    ...state,
    customButtons: state.customButtons.map((item) => (item.id === buttonId ? updatedButton : item)),
  })
  return updatedButton
}

export function deleteButton(buttonId: string) {
  const state = readState()
  writeState({
    ...state,
    customButtons: state.customButtons.filter((button) => button.id !== buttonId),
  })
}

export function toggleModule(agencyId: string, moduleKey: string) {
  const agency = getAgency(agencyId)
  if (!agency) return undefined
  const modules = agency.modules ?? {}
  const nextValue = !(modules[moduleKey] ?? true)
  updateAgency(agencyId, {
    modules: {
      ...modules,
      [moduleKey]: nextValue,
    },
  })
  return nextValue
}

export function resetDemoData() {
  writeState(emptyState)
}

export const getAgencies = listAgencies
export const resetLocalData = resetDemoData

export function getDefaultPublicSiteConfig(): PublicSiteConfig {
  return {
    title: 'Signature Digital Core',
    subtitle: 'Studio de création de démos métier personnalisées',
    promise: 'Créez, personnalisez et présentez des expériences digitales adaptées à chaque secteur.',
    primaryButtonText: 'Entrer dans le Studio',
    primaryButtonDestination: '/admin',
    secondaryButtonText: 'Voir la démo immobilier',
    secondaryButtonDestination: '/demo/immobilier',
    sections: {
      Hero: true,
      'Signature Immobilier': true,
      Secteurs: true,
      Méthode: true,
      Contact: true,
    },
  }
}

export function getPublicSiteConfig() {
  return readState().publicSiteConfig ?? getDefaultPublicSiteConfig()
}

export function updatePublicSiteConfig(config: PublicSiteConfig) {
  const state = readState()
  writeState({ ...state, publicSiteConfig: config })
}

export function getDefaultGlobalAppearance(): GlobalAppearance {
  return {
    primary: 'bleu nuit',
    secondary: 'crème',
    accent: 'doré doux',
    background: 'crème clair',
    style: 'premium sobre',
    radius: 'très arrondis',
    density: 'confortable',
  }
}

export function getGlobalAppearance() {
  return readState().globalAppearance ?? getDefaultGlobalAppearance()
}

export function updateGlobalAppearance(appearance: GlobalAppearance) {
  const state = readState()
  writeState({ ...state, globalAppearance: appearance })
}

export function getDefaultAdminCards(): AdminCardConfig[] {
  return [
    {
      id: 'agencies',
      title: 'Agences',
      text: 'Créer et gérer les agences.',
      buttonLabel: 'Ouvrir',
      route: '/admin/agences',
      section: 'Production',
      visible: true,
      order: 1,
    },
    {
      id: 'signature-immobilier',
      title: 'Signature Immobilier',
      text: 'Première démo métier active.',
      buttonLabel: 'Ouvrir la démo',
      route: '/demo/immobilier',
      section: 'Production',
      visible: true,
      order: 2,
    },
    {
      id: 'create-agency',
      title: 'Créer une agence',
      text: 'Générer une nouvelle démo métier.',
      buttonLabel: 'Créer',
      route: '/admin/agences/new',
      section: 'Production',
      visible: true,
      order: 3,
    },
    {
      id: 'site',
      title: 'Site Signature Digital',
      text: 'Modifier la page d’accueil, les textes et les CTA.',
      buttonLabel: 'Modifier',
      route: '/admin/site',
      section: 'Personnalisation globale',
      visible: true,
      order: 4,
    },
    {
      id: 'appearance',
      title: 'Apparence globale',
      text: 'Modifier couleurs, ambiance et style général.',
      buttonLabel: 'Modifier',
      route: '/admin/apparence',
      section: 'Personnalisation globale',
      visible: true,
      order: 5,
    },
    {
      id: 'pages',
      title: 'Pages globales',
      text: 'Ajouter des pages au site ou à l’admin.',
      buttonLabel: 'Gérer',
      route: '/admin/pages',
      section: 'Personnalisation globale',
      visible: true,
      order: 6,
    },
    {
      id: 'buttons',
      title: 'Boutons globaux',
      text: 'Ajouter des boutons dans le site ou l’admin.',
      buttonLabel: 'Gérer',
      route: '/admin/buttons',
      section: 'Personnalisation globale',
      visible: true,
      order: 7,
    },
    {
      id: 'modules',
      title: 'Modules',
      text: 'Activer ou désactiver les fonctionnalités.',
      buttonLabel: 'Gérer',
      route: '/admin/modules',
      section: 'Système',
      visible: true,
      order: 8,
    },
    {
      id: 'templates',
      title: 'Templates secteurs',
      text: 'Préparer immobilier, constructeurs, avocats, architectes.',
      buttonLabel: 'Gérer',
      route: '/admin/templates',
      section: 'Système',
      visible: true,
      order: 9,
    },
    {
      id: 'layout',
      title: 'Personnaliser l’admin',
      text: 'Modifier les cartes, raccourcis et textes du cockpit.',
      buttonLabel: 'Modifier',
      route: '/admin/layout',
      section: 'Système',
      visible: true,
      order: 10,
    },
    {
      id: 'assistant',
      title: 'Assistant IA',
      text: 'Demander une modification au système.',
      buttonLabel: 'Ouvrir',
      route: '/admin/assistant',
      section: 'Système',
      visible: true,
      order: 11,
    },
  ]
}

export function getDefaultAdminLayout(): AdminLayoutConfig {
  return {
    title: 'Studio Signature',
    subtitle: 'Pilotez vos agences, vos démos et votre système digital depuis un seul endroit.',
    style: 'premium',
    shortcutsVisible: true,
    cards: getDefaultAdminCards(),
  }
}

export function getAdminLayout() {
  const layout = readState().adminLayout
  if (!layout || !Array.isArray(layout.cards)) return getDefaultAdminLayout()
  return {
    ...getDefaultAdminLayout(),
    ...layout,
    cards: layout.cards.length > 0 ? layout.cards : getDefaultAdminCards(),
  }
}

export function updateAdminLayout(layout: AdminLayoutConfig) {
  const state = readState()
  writeState({ ...state, adminLayout: layout })
}

export function getGlobalPages() {
  return readState().globalPages
}

export function getGlobalPageBySlug(slug: string) {
  return readState().globalPages.find((page) => page.slug === slug)
}

export function createGlobalPage(input: Omit<GlobalPage, 'id' | 'createdAt'>) {
  const state = readState()
  const page: GlobalPage = {
    ...input,
    slug: input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, ''),
    id: createId('global-page'),
    createdAt: new Date().toISOString(),
  }
  writeState({ ...state, globalPages: [...state.globalPages.filter((item) => item.slug !== page.slug), page] })
  return page
}

export function getGlobalButtons() {
  return readState().globalButtons
}

export function getGlobalButtonsByPlacement(placement: GlobalButton['placement']) {
  return readState().globalButtons.filter((button) => button.placement === placement && button.status === 'actif')
}

export function createGlobalButton(input: Omit<GlobalButton, 'id' | 'createdAt'>) {
  const state = readState()
  const button: GlobalButton = {
    ...input,
    id: createId('global-button'),
    createdAt: new Date().toISOString(),
  }
  writeState({ ...state, globalButtons: [...state.globalButtons, button] })
  return button
}

export function getDefaultGlobalModules(): GlobalModule[] {
  return [
    ['studio-admin', 'Studio Admin', 'Cockpit central local.', 'local'],
    ['signature-immobilier', 'Signature Immobilier', 'Premier module métier actif.', 'local'],
    ['templates', 'Templates secteurs', 'Préparation des secteurs.', 'simulé'],
    ['global-pages', 'Pages globales', 'Pages du site et de l’aide.', 'local'],
    ['global-buttons', 'Boutons globaux', 'Boutons réutilisables.', 'local'],
    ['agency-pages', 'Pages agences', 'Pages propres aux agences.', 'local'],
    ['agency-buttons', 'Boutons agences', 'Boutons propres aux agences.', 'local'],
    ['ai-analysis', 'Analyse IA simulée', 'Analyse sans API externe.', 'simulé'],
    ['site-import', 'Import site actuel', 'Simulation sans scraping.', 'simulé'],
    ['brand-import', 'Import logo/couleurs', 'Simulation locale.', 'simulé'],
    ['listing-import', 'Import annonces', 'Simulation locale.', 'simulé'],
    ['demo-export', 'Export démo', 'Résumé prêt à envoyer.', 'local'],
    ['preview', 'Prévisualisation', 'Liens rapides locaux.', 'local'],
  ].map(([id, name, description, state]) => ({
    id,
    name,
    description,
    state: state as GlobalModule['state'],
    active: !String(id).startsWith('future-'),
  }))
}

export function getGlobalModules() {
  const modules = readState().globalModules
  return modules.length > 0 ? modules : getDefaultGlobalModules()
}

export function updateGlobalModules(modules: GlobalModule[]) {
  const state = readState()
  writeState({ ...state, globalModules: modules })
}
