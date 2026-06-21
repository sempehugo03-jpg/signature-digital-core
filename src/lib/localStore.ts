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
    heroTitle?: string
    heroSubtitle?: string
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
  status: 'vide' | 'lié' | 'désactivé'
}

export type BranchableStatus = 'Fonctionnel localement' | 'Simulé' | 'Prêt à connecter' | 'Connecté plus tard'

export type InvitationRole = 'patron' | 'agent' | 'vendeur'

export type Invitation = {
  id: string
  agencyId: string
  type: InvitationRole
  name: string
  email: string
  token: string
  status: 'draft' | 'ready' | 'copied' | 'sent_simulated' | 'expired' | 'revoked'
  targetUrl: string
  emailPreview: string
  propertyId?: string
  createdAt: string
  updatedAt: string
}

export type AccessToken = {
  id: string
  agencyId: string
  type: InvitationRole | 'public'
  token: string
  status: 'active' | 'copied' | 'revoked' | 'expired'
  targetUrl: string
  propertyId?: string
  createdAt: string
  updatedAt: string
}

export type SimulatedEmail = {
  id: string
  agencyId: string
  type: InvitationRole
  status: 'draft' | 'copied' | 'sent_simulated'
  subject: string
  body: string
  accessUrl: string
  createdAt: string
  updatedAt: string
}

export type PaymentLink = {
  id: string
  agencyId: string
  type: 'payment'
  status: 'draft' | 'link_ready' | 'paid_simulated' | 'cancelled_simulated'
  offerName: string
  setupPrice: string
  monthlyPrice: string
  paymentUrl: string
  createdAt: string
  updatedAt: string
}

export type AgencySubscription = {
  id: string
  agencyId: string
  type: 'subscription'
  status: 'draft' | 'active_simulated' | 'cancelled_simulated'
  offerName: string
  createdAt: string
  updatedAt: string
}

export type TeamMember = {
  id: string
  agencyId: string
  type: InvitationRole
  status: 'active' | 'removed'
  name: string
  email: string
  propertyId?: string
  createdAt: string
  updatedAt: string
}

export type ActivityLogEntry = {
  id: string
  agencyId: string
  type: string
  status: string
  label: string
  createdAt: string
  updatedAt?: string
}

export type DeletionLogEntry = {
  id: string
  agencyId: string
  type: string
  status: string
  label: string
  createdAt: string
  updatedAt?: string
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
  invitations: Invitation[]
  accessTokens: AccessToken[]
  simulatedEmails: SimulatedEmail[]
  paymentLinks: PaymentLink[]
  agencySubscriptions: AgencySubscription[]
  teamMembers: TeamMember[]
  activityLog: ActivityLogEntry[]
  deletionLog: DeletionLogEntry[]
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
const DEMO_AGENCY_ID = 'demo-agency'
const DEMO_PROPERTY_ID = 'demo-property'

const emptyState: LocalState = {
  agencies: [],
  users: [],
  properties: [],
  sellerSpaces: [],
  invitations: [],
  accessTokens: [],
  simulatedEmails: [],
  paymentLinks: [],
  agencySubscriptions: [],
  teamMembers: [],
  activityLog: [],
  deletionLog: [],
  customPages: [],
  customButtons: [],
  globalPages: [],
  globalButtons: [],
  globalModules: [],
}

function createDefaultState(): LocalState {
  const createdAt = '2026-06-20T00:00:00.000Z'
  const baseAccessUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const agency: Agency = {
    id: DEMO_AGENCY_ID,
    name: 'Signature Immobilier',
    sector: 'Immobilier',
    city: 'Tarbes',
    currentSite: 'https://signature-immobilier.example',
    phone: '05 62 00 00 00',
    email: 'contact@signature.test',
    status: 'Démo active',
    colors: {
      primary: 'bleu nuit',
      secondary: 'crème',
      accent: 'doré doux',
    },
    appearance: {
      logoText: 'Signature Immobilier',
      heroImageUrl: '',
      visualStyle: 'premium',
      backgroundColor: 'crème',
      textColor: 'bleu nuit',
      buttonStyle: 'premium',
      fontStyle: 'moderne',
    },
    mood: {
      moodName: 'Apple / Airbnb',
      homeTitle: 'Signature Immobilier',
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
    ownerName: 'Camille Patron',
    ownerEmail: 'camille@signature.test',
    agentName: 'Alex Agent',
    agentEmail: 'alex@signature.test',
    createdAt,
  }

  const property: Property = {
    id: DEMO_PROPERTY_ID,
    agencyId: DEMO_AGENCY_ID,
    title: 'Appartement lumineux à Tarbes',
    city: 'Tarbes',
    status: 'publié',
    price: '189 000 €',
    surface: '82 m²',
    rooms: '4',
    shortDescription: 'Appartement lumineux, calme et proche du centre-ville.',
    longDescription: 'Un bien prêt à présenter avec un suivi vendeur clair.',
    approximateAddress: 'Centre-ville de Tarbes',
    mainPhotoUrl: '',
    currentStep: 'Visites',
    nextVisit: 'Samedi 22 juin à 14h30',
    visitReport: 'Visite positive, acheteurs intéressés, retour attendu sous 48h.',
    visibleDocuments: ['Mandat signé', 'Diagnostics', 'Offre reçue'],
    photos: [],
    documents: [],
    visits: [],
    createdAt,
    updatedAt: createdAt,
  }

  return {
    ...emptyState,
    agencies: [agency],
    users: [
      {
        id: 'demo-user-patron',
        agencyId: DEMO_AGENCY_ID,
        role: 'patron',
        name: agency.ownerName,
        email: agency.ownerEmail,
      },
      {
        id: 'demo-user-agent',
        agencyId: DEMO_AGENCY_ID,
        role: 'agent',
        name: agency.agentName,
        email: agency.agentEmail,
      },
    ],
    properties: [property],
    sellerSpaces: [
      {
        id: 'demo-seller-space',
        agencyId: DEMO_AGENCY_ID,
        propertyId: DEMO_PROPERTY_ID,
        status: 'lié',
      },
    ],
    invitations: [],
    accessTokens: [
      {
        id: 'demo-access-patron',
        agencyId: DEMO_AGENCY_ID,
        type: 'patron',
        token: 'demo-token-patron',
        status: 'active',
        targetUrl: '/demo/immobilier/agence/demo-agency/patron',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'demo-access-agent',
        agencyId: DEMO_AGENCY_ID,
        type: 'agent',
        token: 'demo-token-agent',
        status: 'active',
        targetUrl: '/demo/immobilier/agence/demo-agency/agent',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'demo-access-vendeur',
        agencyId: DEMO_AGENCY_ID,
        type: 'vendeur',
        token: 'demo-token-vendeur',
        status: 'active',
        targetUrl: '/demo/immobilier/agence/demo-agency/vendeur/demo-property',
        propertyId: DEMO_PROPERTY_ID,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    simulatedEmails: [],
    paymentLinks: [
      {
        id: 'demo-payment-link',
        agencyId: DEMO_AGENCY_ID,
        type: 'payment',
        status: 'draft',
        offerName: 'Signature Immobilier Starter',
        setupPrice: '490 €',
        monthlyPrice: '89 € / mois',
        paymentUrl: `${baseAccessUrl}/payment/${DEMO_AGENCY_ID}`,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    agencySubscriptions: [
      {
        id: 'demo-subscription',
        agencyId: DEMO_AGENCY_ID,
        type: 'subscription',
        status: 'draft',
        offerName: 'Signature Immobilier Starter',
        createdAt,
        updatedAt: createdAt,
      },
    ],
    teamMembers: [
      {
        id: 'demo-team-patron',
        agencyId: DEMO_AGENCY_ID,
        type: 'patron',
        status: 'active',
        name: agency.ownerName,
        email: agency.ownerEmail,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'demo-team-agent',
        agencyId: DEMO_AGENCY_ID,
        type: 'agent',
        status: 'active',
        name: agency.agentName,
        email: agency.agentEmail,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'demo-team-vendeur',
        agencyId: DEMO_AGENCY_ID,
        type: 'vendeur',
        status: 'active',
        name: 'Vendeur démo',
        email: 'vendeur@signature.test',
        propertyId: DEMO_PROPERTY_ID,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    activityLog: [
      {
        id: 'demo-activity',
        agencyId: DEMO_AGENCY_ID,
        type: 'system',
        status: 'Fonctionnel localement',
        label: 'Données démo initialisées localement.',
        createdAt,
      },
    ],
    deletionLog: [],
  }
}

function ensureUsableState(state: LocalState): LocalState {
  const nextState = { ...emptyState, ...state }
  return nextState.agencies.length > 0 ? nextState : createDefaultState()
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : ''
}

function createPaymentDraft(agencyId: string, createdAt = new Date().toISOString()): PaymentLink {
  return {
    id: createId('payment'),
    agencyId,
    type: 'payment',
    status: 'draft',
    offerName: 'Signature Immobilier Starter',
    setupPrice: '490 €',
    monthlyPrice: '89 € / mois',
    paymentUrl: `${getOrigin()}/payment/${agencyId}`,
    createdAt,
    updatedAt: createdAt,
  }
}

function appendActivity(state: LocalState, agencyId: string, type: string, label: string, status = 'Fonctionnel localement') {
  const now = new Date().toISOString()
  return [
    ...state.activityLog,
    {
      id: createId('activity'),
      agencyId,
      type,
      status,
      label,
      createdAt: now,
    },
  ]
}

function readState(): LocalState {
  if (typeof window === 'undefined') return createDefaultState()

  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    const parsedState = raw ? { ...emptyState, ...JSON.parse(raw) } : createDefaultState()
    const state = ensureUsableState(parsedState)
    if (!raw || parsedState.agencies.length === 0) writeState(state)
    return state
  } catch {
    const state = createDefaultState()
    writeState(state)
    return state
  }
}

function writeState(state: LocalState) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state))
  } catch {
    // Local persistence is optional; keep the UI renderable if storage is blocked.
  }
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
    teamMembers: [
      ...state.teamMembers,
      {
        id: createId('team'),
        agencyId: agency.id,
        type: 'patron',
        status: 'active',
        name: input.ownerName,
        email: input.ownerEmail,
        createdAt: agency.createdAt,
        updatedAt: agency.createdAt,
      },
      {
        id: createId('team'),
        agencyId: agency.id,
        type: 'agent',
        status: 'active',
        name: input.agentName,
        email: input.agentEmail,
        createdAt: agency.createdAt,
        updatedAt: agency.createdAt,
      },
    ],
    paymentLinks: [
      ...state.paymentLinks,
      createPaymentDraft(agency.id, agency.createdAt),
    ],
    agencySubscriptions: [
      ...state.agencySubscriptions,
      {
        id: createId('subscription'),
        agencyId: agency.id,
        type: 'subscription',
        status: 'draft',
        offerName: 'Signature Immobilier Starter',
        createdAt: agency.createdAt,
        updatedAt: agency.createdAt,
      },
    ],
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
  const now = new Date().toISOString()
  writeState({
    ...state,
    agencies: state.agencies.filter((agency) => agency.id !== agencyId),
    users: state.users.filter((user) => user.agencyId !== agencyId),
    properties: state.properties.filter((property) => property.agencyId !== agencyId),
    sellerSpaces: state.sellerSpaces.filter((space) => space.agencyId !== agencyId),
    invitations: state.invitations.filter((invitation) => invitation.agencyId !== agencyId),
    accessTokens: state.accessTokens.filter((token) => token.agencyId !== agencyId),
    simulatedEmails: state.simulatedEmails.filter((email) => email.agencyId !== agencyId),
    paymentLinks: state.paymentLinks.filter((payment) => payment.agencyId !== agencyId),
    agencySubscriptions: state.agencySubscriptions.filter((subscription) => subscription.agencyId !== agencyId),
    teamMembers: state.teamMembers.filter((member) => member.agencyId !== agencyId),
    customPages: state.customPages.filter((page) => page.agencyId !== agencyId),
    customButtons: state.customButtons.filter((button) => button.agencyId !== agencyId),
    deletionLog: [
      ...state.deletionLog,
      {
        id: createId('deletion'),
        agencyId,
        type: 'agency',
        status: 'deleted_local',
        label: 'Agence supprimée localement avec ses données liées.',
        createdAt: now,
      },
    ],
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

export function getAgencyTeamMembers(agencyId: string) {
  return readState().teamMembers.filter((member) => member.agencyId === agencyId)
}

export function addTeamMember(input: Omit<TeamMember, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
  const state = readState()
  const now = new Date().toISOString()
  const member: TeamMember = {
    ...input,
    id: createId('team'),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  writeState({
    ...state,
    teamMembers: [...state.teamMembers, member],
    activityLog: appendActivity(state, input.agencyId, 'team', `${input.type} ajouté localement.`),
  })
  return member
}

export function removeTeamMember(memberId: string) {
  const state = readState()
  const member = state.teamMembers.find((item) => item.id === memberId)
  if (!member) return undefined
  const now = new Date().toISOString()
  writeState({
    ...state,
    teamMembers: state.teamMembers.map((item) =>
      item.id === memberId ? { ...item, status: 'removed', updatedAt: now } : item,
    ),
    sellerSpaces: member.type === 'vendeur'
      ? state.sellerSpaces.map((space) =>
          space.propertyId === member.propertyId ? { ...space, status: 'désactivé' } : space,
        )
      : state.sellerSpaces,
    activityLog: appendActivity(state, member.agencyId, 'team', `${member.type} retiré localement.`),
  })
  return member
}

export function getAgencyInvitations(agencyId: string) {
  return readState().invitations.filter((invitation) => invitation.agencyId === agencyId)
}

export function getAgencyAccessTokens(agencyId: string) {
  return readState().accessTokens.filter((token) => token.agencyId === agencyId)
}

export function getAccessByToken(token: string) {
  const state = readState()
  const accessToken = state.accessTokens.find((item) => item.token === token)
  const invitation = state.invitations.find((item) => item.token === token)
  return { accessToken, invitation }
}

export function createAccessToken(input: Omit<AccessToken, 'id' | 'token' | 'status' | 'createdAt' | 'updatedAt'>) {
  const state = readState()
  const now = new Date().toISOString()
  const accessToken: AccessToken = {
    ...input,
    id: createId('access'),
    token: createId('token'),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  writeState({
    ...state,
    accessTokens: [...state.accessTokens, accessToken],
    activityLog: appendActivity(state, input.agencyId, 'access', `Accès ${input.type} généré localement.`, 'Simulé'),
  })
  return accessToken
}

export function updateAccessToken(tokenId: string, status: AccessToken['status']) {
  const state = readState()
  const now = new Date().toISOString()
  const accessToken = state.accessTokens.find((item) => item.id === tokenId)
  if (!accessToken) return undefined
  writeState({
    ...state,
    accessTokens: state.accessTokens.map((item) => (item.id === tokenId ? { ...item, status, updatedAt: now } : item)),
    activityLog: appendActivity(state, accessToken.agencyId, 'access', `Accès ${accessToken.type} marqué ${status}.`, 'Simulé'),
  })
  return { ...accessToken, status, updatedAt: now }
}

export function generateInvitation(input: Pick<Invitation, 'agencyId' | 'type' | 'name' | 'email' | 'propertyId'>) {
  const state = readState()
  const agency = state.agencies.find((item) => item.id === input.agencyId)
  const property = input.propertyId ? state.properties.find((item) => item.id === input.propertyId) : undefined
  const now = new Date().toISOString()
  const token = createId('invite')
  const targetUrl = `/access/${token}`
  const invitation: Invitation = {
    ...input,
    id: createId('invitation'),
    token,
    status: 'ready',
    targetUrl,
    emailPreview: `Bonjour ${input.name || input.email}, votre accès ${input.type} pour ${agency?.name ?? 'Signature Digital Core'} est prêt : ${getOrigin()}${targetUrl}${property ? `\nAnnonce : ${property.title}` : ''}`,
    createdAt: now,
    updatedAt: now,
  }
  const accessToken: AccessToken = {
    id: createId('access'),
    agencyId: input.agencyId,
    type: input.type,
    token,
    status: 'active',
    targetUrl: input.type === 'patron'
      ? `/demo/immobilier/agence/${input.agencyId}/patron`
      : input.type === 'agent'
        ? `/demo/immobilier/agence/${input.agencyId}/agent`
        : `/demo/immobilier/agence/${input.agencyId}/vendeur/${input.propertyId ?? state.properties.find((item) => item.agencyId === input.agencyId)?.id ?? ''}`,
    propertyId: input.propertyId,
    createdAt: now,
    updatedAt: now,
  }
  const email: SimulatedEmail = {
    id: createId('email'),
    agencyId: input.agencyId,
    type: input.type,
    status: 'draft',
    subject: `Votre accès ${agency?.name ?? 'Signature Digital Core'}`,
    body: invitation.emailPreview,
    accessUrl: `${getOrigin()}${targetUrl}`,
    createdAt: now,
    updatedAt: now,
  }
  writeState({
    ...state,
    invitations: [...state.invitations, invitation],
    accessTokens: [...state.accessTokens, accessToken],
    simulatedEmails: [...state.simulatedEmails, email],
    activityLog: appendActivity(state, input.agencyId, 'invitation', `Invitation ${input.type} générée localement.`, 'Simulé'),
  })
  return invitation
}

export function updateInvitationStatus(invitationId: string, status: Invitation['status']) {
  const state = readState()
  const invitation = state.invitations.find((item) => item.id === invitationId)
  if (!invitation) return undefined
  const now = new Date().toISOString()
  writeState({
    ...state,
    invitations: state.invitations.map((item) => (item.id === invitationId ? { ...item, status, updatedAt: now } : item)),
    accessTokens: status === 'revoked'
      ? state.accessTokens.map((token) => (token.token === invitation.token ? { ...token, status: 'revoked', updatedAt: now } : token))
      : state.accessTokens,
    activityLog: appendActivity(state, invitation.agencyId, 'invitation', `Invitation ${invitation.type} marquée ${status}.`, 'Simulé'),
  })
  return { ...invitation, status, updatedAt: now }
}

export function getAgencySimulatedEmails(agencyId: string) {
  return readState().simulatedEmails.filter((email) => email.agencyId === agencyId)
}

export function updateSimulatedEmailStatus(emailId: string, status: SimulatedEmail['status']) {
  const state = readState()
  const email = state.simulatedEmails.find((item) => item.id === emailId)
  if (!email) return undefined
  const now = new Date().toISOString()
  writeState({
    ...state,
    simulatedEmails: state.simulatedEmails.map((item) => (item.id === emailId ? { ...item, status, updatedAt: now } : item)),
    activityLog: appendActivity(state, email.agencyId, 'email', `Email ${email.type} marqué ${status}.`, 'Simulé'),
  })
  return { ...email, status, updatedAt: now }
}

export function getAgencyPaymentLink(agencyId: string) {
  const state = readState()
  return state.paymentLinks.find((payment) => payment.agencyId === agencyId) ?? createPaymentDraft(agencyId)
}

export function upsertPaymentLink(agencyId: string, status: PaymentLink['status'] = 'link_ready') {
  const state = readState()
  const now = new Date().toISOString()
  const existing = state.paymentLinks.find((payment) => payment.agencyId === agencyId)
  const payment: PaymentLink = existing
    ? { ...existing, status, paymentUrl: `${getOrigin()}/payment/${agencyId}`, updatedAt: now }
    : { ...createPaymentDraft(agencyId, now), status }
  writeState({
    ...state,
    paymentLinks: [...state.paymentLinks.filter((item) => item.agencyId !== agencyId), payment],
    agencySubscriptions: [
      ...state.agencySubscriptions.filter((item) => item.agencyId !== agencyId),
      {
        id: state.agencySubscriptions.find((item) => item.agencyId === agencyId)?.id ?? createId('subscription'),
        agencyId,
        type: 'subscription',
        status: status === 'paid_simulated' ? 'active_simulated' : status === 'cancelled_simulated' ? 'cancelled_simulated' : 'draft',
        offerName: payment.offerName,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      },
    ],
    activityLog: appendActivity(state, agencyId, 'payment', `Paiement marqué ${status}.`, 'Simulé'),
  })
  return payment
}

export function getAgencyActivity(agencyId: string) {
  return readState().activityLog.filter((entry) => entry.agencyId === agencyId)
}

export function getBranchableStatuses() {
  return [
    ['emails', 'Emails', 'Simulé'],
    ['paiement', 'Paiement', 'Simulé'],
    ['auth', 'Auth', 'Prêt à connecter'],
    ['storage', 'Storage', 'Prêt à connecter'],
    ['ia', 'IA', 'Simulé'],
    ['import-site', 'Import site', 'Simulé'],
    ['supabase', 'Supabase', 'Connecté plus tard'],
    ['stripe', 'Stripe', 'Connecté plus tard'],
  ] as const
}

export function resetAgencyDemo(agencyId: string) {
  const state = readState()
  const now = new Date().toISOString()
  writeState({
    ...state,
    invitations: state.invitations.filter((item) => item.agencyId !== agencyId),
    accessTokens: state.accessTokens.filter((item) => item.agencyId !== agencyId),
    simulatedEmails: state.simulatedEmails.filter((item) => item.agencyId !== agencyId),
    paymentLinks: [...state.paymentLinks.filter((item) => item.agencyId !== agencyId), createPaymentDraft(agencyId, now)],
    activityLog: appendActivity(state, agencyId, 'reset', 'Démo agence réinitialisée localement.'),
  })
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
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORE_KEY)
  }
  writeState(createDefaultState())
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
