import { cityaAgencyId, cityaLiveDemoPath, cityaLovableMockupUrl, cityaWebsiteUrl } from './cityaMontauban'
import { createSignatureDemoFromProject } from './signatureDigitalStore'

export const projectStatuses = [
  'request_received',
  'analysis_to_do',
  'lovable_demo_ready',
  'demo_sent',
  'demo_validated',
  'live_demo_to_prepare',
  'active',
  'lost',
] as const

export type ProjectStatus = (typeof projectStatuses)[number]
export const projectStatusLabels: Record<ProjectStatus, string> = {
  request_received: 'Demande reçue',
  analysis_to_do: 'Analyse / prompt Lovable à faire',
  lovable_demo_ready: 'Démo Lovable prête',
  demo_sent: 'Démo envoyée',
  demo_validated: 'Démo validée',
  live_demo_to_prepare: 'Démo vivante à préparer',
  active: 'Client actif',
  lost: 'Perdu',
}
export type EmailStatus = 'sent' | 'simulated' | 'failed'

export type EmailHistoryItem = {
  id: string
  type: EmailKey
  recipient: string
  subject: string
  status: EmailStatus
  provider: string
  sentAt: string
  providerMessageId: string
  errorMessage: string
}

export const realEstateModules = [
  {
    key: 'premium_presentation',
    label: 'Accueil premium',
    description: 'Page accueil premium / présentation haut de gamme.',
  },
  {
    key: 'property_listings',
    label: 'Biens à vendre',
    description: 'Page de biens à vendre avec cartes premium.',
  },
  {
    key: 'property_detail',
    label: 'Fiche bien détaillée',
    description: 'Page de détail pour valoriser un bien.',
  },
  {
    key: 'estimation',
    label: 'Parcours estimation vendeur',
    description: 'Parcours de demande d’estimation qualifiée.',
  },
  {
    key: 'seller_space',
    label: 'Espace vendeur privé',
    description: 'Espace de suivi pour propriétaires vendeurs.',
  },
  {
    key: 'visit_request',
    label: 'Demande de visite qualifiée',
    description: 'Formulaire de demande de visite avec qualification.',
  },
  {
    key: 'documents',
    label: 'Documents vendeur',
    description: 'Bloc documents liés au dossier vendeur.',
  },
  {
    key: 'reports',
    label: 'Comptes rendus / retours après visite',
    description: 'Retours structurés après visite.',
  },
  {
    key: 'callback_request',
    label: 'Rappel conseiller',
    description: 'Formulaire de rappel par un conseiller.',
  },
  {
    key: 'notifications',
    label: 'Notifications / suivi',
    description: 'Notifications et suivi des étapes importantes.',
  },
  {
    key: 'contact',
    label: 'Contact agence',
    description: 'Page ou section contact agence.',
  },
  {
    key: 'agency_value_page',
    label: 'Pourquoi nous confier votre bien',
    description: 'Page de valeur orientée propriétaire vendeur.',
  },
] as const

export type RealEstateModuleKey = (typeof realEstateModules)[number]['key']

export type DemoAssetType = 'logo' | 'website_screenshot' | 'listing_screenshot' | 'listing_photo' | 'reusable_image'

export type DemoAsset = {
  id: string
  url: string
  type: DemoAssetType
  fileName: string
  createdAt: string
}

export type DemoAssets = {
  logoUrl: string
  logoNotes: string
  logoAssets: DemoAsset[]
  websiteScreenshots: DemoAsset[]
  websiteScreenshotsNotes: string
  visualMood: string
  reusableImages: DemoAsset[]
  imageReferences: string
  offerReferences: string
  listingScreenshots: DemoAsset[]
  listingPhotoReferences: string
  listingPhotos: DemoAsset[]
  mustReuse: string
  mustAvoid: string
}

export type SignatureRecommendation = {
  moduleKey: RealEstateModuleKey
  priority: 'fort' | 'moyen' | 'faible'
  reason: string
}

export type Project = {
  id: string
  companyName: string
  sector: string
  city: string
  hasWebsite: boolean
  currentWebsite: string
  businessDescription: string
  pain: string
  pains: string[]
  goal: string
  goals: string[]
  diagnosticPriority: string
  diagnosticBlocker: string
  desiredFeeling: string
  diagnosticGoal: string
  features: string[]
  style: string
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  status: ProjectStatus
  createdAt: string
  demoLink: string
  paymentLink: string
  paymentStatus: 'en attente' | 'envoyé' | 'reçu'
  internalNotes: string
  nextAction: string
  lovableLink: string
  vercelPreviewLink: string
  githubPrLink: string
  visualStatus: 'à créer' | 'en modification' | 'validé visuellement'
  visualNotes: string
  codexStatus: 'à lancer' | 'en cours' | 'preview prête' | 'validé'
  technicalNotes: string
  analysisNotes: string
  reminderDate: string
  publicLinkTested: boolean
  formTested: boolean
  activationEmailReady: boolean
  hugoValidated: boolean
  emailLog: Record<EmailKey, boolean>
  emailHistory: EmailHistoryItem[]
  trackingToken: string
  callbackRequested: boolean
  callbackPhone: string
  callbackMoment: string
  callbackMessage: string
  clientPrecision: string
  adjustmentCategory: string
  adjustmentMessage: string
  lastClientAction: string
  clientSpaceCreated: boolean
  clientEmailConfirmed: boolean
  generatedAgencyId: string
  generatedPromptId: string
  lovableDemoStatus: 'pas encore créée' | 'prête' | 'envoyée' | 'validée' | 'refusée'
  lovableNotes: string
  proposedPrice: string
  depositRequested: string
  paymentSimpleStatus: 'non demandé' | 'en attente' | 'acompte reçu' | 'payé' | 'annulé'
  paymentNotes: string
  technicalStatus: 'à préparer' | 'en cours' | 'vivante prête' | 'active'
  liveRepoLink: string
  privateNotes: string
  hugoVision: string
  signatureRecommendationNotes: string
  demoAssets: DemoAssets
  modulesEnabled: RealEstateModuleKey[]
  modulesDisabled: RealEstateModuleKey[]
  chatGptPlannedCaptures: string
  chatGptListingsToReuse: string
  chatGptImagesToReuse: string
  chatGptHugoNotes: string
  chatGptMustKeep: string
  chatGptAvoid: string
}

export type ProjectInput = Pick<
  Project,
  | 'companyName'
  | 'sector'
  | 'city'
  | 'hasWebsite'
  | 'currentWebsite'
  | 'businessDescription'
  | 'pain'
  | 'pains'
  | 'goal'
  | 'goals'
  | 'diagnosticPriority'
  | 'diagnosticBlocker'
  | 'desiredFeeling'
  | 'diagnosticGoal'
  | 'features'
  | 'style'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'message'
>

export const emailKeys = [
  'spaceCreated',
  'demoReady',
  'adjustmentsReceived',
  'callbackRequested',
  'paymentAvailable',
  'paymentReceived',
  'projectActivated',
] as const

export type EmailKey = (typeof emailKeys)[number]

export const emailLabels: Record<EmailKey, string> = {
  spaceCreated: 'Espace de suivi créé',
  demoReady: 'Démo prête',
  adjustmentsReceived: 'Ajustements reçus',
  callbackRequested: 'Rappel demandé',
  paymentAvailable: 'Paiement disponible',
  paymentReceived: 'Paiement reçu',
  projectActivated: 'Projet activé',
}

const storageKey = 'signature-digital-live-projects'

const defaultEmailLog = (): Record<EmailKey, boolean> => ({
  spaceCreated: false,
  demoReady: false,
  adjustmentsReceived: false,
  callbackRequested: false,
  paymentAvailable: false,
  paymentReceived: false,
  projectActivated: false,
})

const defaultDemoAssets = (): DemoAssets => ({
  logoUrl: '',
  logoNotes: '',
  logoAssets: [],
  websiteScreenshots: [],
  websiteScreenshotsNotes: '',
  visualMood: '',
  reusableImages: [],
  imageReferences: '',
  offerReferences: '',
  listingScreenshots: [],
  listingPhotoReferences: '',
  listingPhotos: [],
  mustReuse: '',
  mustAvoid: '',
})

const seedProjects: Project[] = [
  createSeedProject({
    id: 'project-cc',
    companyName: 'Cc',
    sector: 'Constructeurs',
    city: 'Tarbes',
    pain: 'Je ne me différencie pas assez de mes concurrents',
    goal: 'Vendre une offre plus premium',
    status: 'lovable_demo_ready',
    visualStatus: 'validé visuellement',
    codexStatus: 'preview prête',
    paymentStatus: 'envoyé',
    demoLink: 'https://premium-digital-reveal.lovable.app/',
    nextAction: 'Préparer la démo vivante sans casser le rendu validé.',
  }),
  createSeedProject({
    id: 'project-lemaire',
    companyName: 'Cabinet Lemaire & Associés',
    sector: 'Avocats',
    city: 'Paris',
    pain: 'Mon image n’est pas assez premium',
    goal: 'Être plus crédible',
    status: 'analysis_to_do',
    nextAction: 'Clarifier l’angle commercial avant création visuelle.',
  }),
  createSeedProject({
    id: 'project-vallat',
    companyName: 'Maison Vallat',
    sector: 'Immobilier',
    city: 'Lyon',
    pain: 'Mes visiteurs ne comprennent pas assez vite ma valeur',
    goal: 'Obtenir plus de contacts',
    status: 'analysis_to_do',
    nextAction: 'Créer une première proposition visuelle sombre premium.',
  }),
  createSeedProject({
    id: 'project-aurore',
    companyName: 'Clinique Aurore',
    sector: 'Cliniques privées',
    city: 'Bordeaux',
    pain: 'Je veux rassurer davantage mes prospects',
    goal: 'Créer un espace client',
    status: 'active',
    paymentStatus: 'reçu',
    codexStatus: 'validé',
    publicLinkTested: true,
    formTested: true,
    activationEmailReady: true,
    hugoValidated: true,
    nextAction: 'Surveiller les retours après activation.',
  }),
  createSeedProject({
    id: 'project-citya-montauban',
    companyName: 'Citya Montauban',
    sector: 'Immobilier',
    city: 'Montauban',
    pain: 'La demo doit ressembler a Citya Montauban modernisee, pas a une agence immobiliere generique.',
    goal: 'Rendre vivante une experience claire pour louer, vendre ou gerer un bien avec Citya Montauban.',
    status: 'live_demo_to_prepare',
    currentWebsite: cityaWebsiteUrl,
    firstName: 'Citya',
    lastName: 'Naudin',
    email: 'montauban@citya.fr',
    phone: '05 63 26 21 00',
    message: 'Version vivante Citya Montauban reliee au moteur Signature Digital Core.',
    lovableLink: cityaLovableMockupUrl,
    lovableDemoStatus: 'validée' as Project['lovableDemoStatus'],
    liveRepoLink: cityaLiveDemoPath,
    technicalStatus: 'vivante prête' as Project['technicalStatus'],
    generatedAgencyId: cityaAgencyId,
    codexStatus: 'validé' as Project['codexStatus'],
    visualStatus: 'validé visuellement' as Project['visualStatus'],
    nextAction: 'Tester la version vivante Citya et suivre les demandes entrantes.',
    hugoVision: 'Transformer la maquette Lovable Citya en version vivante reconnaissable : bleu Citya, annonces de location reelles de Montauban, estimation, visite, rappel et espace vendeur demo.',
    signatureRecommendationNotes: [
      'premium_presentation - priorite forte - clarifier rapidement Citya Montauban et ses activites location, vente, gestion et syndic.',
      'property_listings - priorite forte - reprendre les annonces reelles visibles, principalement des locations a Montauban.',
      'property_detail - priorite forte - creer une fiche bien detaillee depuis une annonce Citya visible.',
      'estimation - priorite forte - capter les demandes vendeurs.',
      'visit_request - priorite forte - qualifier les demandes de visite.',
      'seller_space - priorite moyenne - montrer le suivi vendeur Signature Digital.',
      'callback_request - priorite forte - permettre le rappel conseiller.',
    ].join('\n'),
    modulesEnabled: [
      'premium_presentation',
      'property_listings',
      'property_detail',
      'estimation',
      'seller_space',
      'visit_request',
      'documents',
      'reports',
      'callback_request',
      'notifications',
      'contact',
      'agency_value_page',
    ],
    modulesDisabled: [],
  }),
]

function createSeedProject(overrides: Partial<Project> & Pick<Project, 'id' | 'companyName' | 'sector' | 'city' | 'pain' | 'goal' | 'status' | 'nextAction'>): Project {
  const now = new Date('2026-06-23T10:00:00.000Z').toISOString()

  return {
    id: overrides.id,
    companyName: overrides.companyName,
    sector: overrides.sector,
    city: overrides.city,
    hasWebsite: overrides.hasWebsite ?? true,
    currentWebsite: overrides.currentWebsite ?? 'https://exemple-client.fr',
    businessDescription: overrides.businessDescription ?? '',
    pain: overrides.pain,
    pains: overrides.pains ?? [overrides.pain],
    goal: overrides.goal,
    goals: overrides.goals ?? [overrides.goal],
    diagnosticPriority: overrides.diagnosticPriority ?? overrides.goal,
    diagnosticBlocker: overrides.diagnosticBlocker ?? overrides.pain,
    desiredFeeling: overrides.desiredFeeling ?? 'Confiance',
    diagnosticGoal: overrides.diagnosticGoal ?? overrides.goal,
    features: overrides.features ?? ['Formulaire de contact', 'Demande de rappel', 'Presentation premium'],
    style: overrides.style ?? 'Luxe sombre',
    firstName: overrides.firstName ?? 'Hugo',
    lastName: overrides.lastName ?? 'Client',
    email: overrides.email ?? 'contact@exemple-client.fr',
    phone: overrides.phone ?? '06 00 00 00 00',
    message: overrides.message ?? 'Demande creee pour preparer une demo personnalisee.',
    status: overrides.status,
    createdAt: now,
    demoLink: overrides.demoLink ?? '',
    paymentLink: 'https://signature-digital.fr/paiement/demo',
    paymentStatus: overrides.paymentStatus ?? 'en attente',
    internalNotes: 'Préserver le visuel validé et avancer par blocs fonctionnels.',
    nextAction: overrides.nextAction,
    lovableLink: overrides.lovableLink ?? 'https://premium-digital-reveal.lovable.app/',
    vercelPreviewLink: '',
    githubPrLink: '',
    visualStatus: overrides.visualStatus ?? 'à créer',
    visualNotes: 'Direction sombre premium validée : noir profond, bleu nuit, violet lumineux.',
    codexStatus: overrides.codexStatus ?? 'à lancer',
    technicalNotes: 'Rendre boutons, formulaires, routes, paiement simulé et activation fonctionnels.',
    analysisNotes: 'Le site doit mieux faire ressentir la valeur, rassurer et guider vers l’action.',
    reminderDate: '',
    publicLinkTested: overrides.publicLinkTested ?? false,
    formTested: overrides.formTested ?? false,
    activationEmailReady: overrides.activationEmailReady ?? false,
    hugoValidated: overrides.hugoValidated ?? false,
    emailLog: defaultEmailLog(),
    emailHistory: overrides.emailHistory ?? [],
    trackingToken: overrides.trackingToken ?? overrides.id,
    callbackRequested: overrides.callbackRequested ?? false,
    callbackPhone: overrides.callbackPhone ?? '',
    callbackMoment: overrides.callbackMoment ?? '',
    callbackMessage: overrides.callbackMessage ?? '',
    clientPrecision: overrides.clientPrecision ?? '',
    adjustmentCategory: overrides.adjustmentCategory ?? '',
    adjustmentMessage: overrides.adjustmentMessage ?? '',
    lastClientAction: overrides.lastClientAction ?? '',
    clientSpaceCreated: overrides.clientSpaceCreated ?? true,
    clientEmailConfirmed: overrides.clientEmailConfirmed ?? true,
    generatedAgencyId: overrides.generatedAgencyId ?? '',
    generatedPromptId: overrides.generatedPromptId ?? '',
    lovableDemoStatus: overrides.lovableDemoStatus ?? 'pas encore créée',
    lovableNotes: overrides.lovableNotes ?? '',
    proposedPrice: overrides.proposedPrice ?? '2 000 € installation + 400 €/mois',
    depositRequested: overrides.depositRequested ?? '',
    paymentSimpleStatus: overrides.paymentSimpleStatus ?? 'non demandé',
    paymentNotes: overrides.paymentNotes ?? '',
    technicalStatus: overrides.technicalStatus ?? 'à préparer',
    liveRepoLink: overrides.liveRepoLink ?? '',
    privateNotes: overrides.privateNotes ?? '',
    hugoVision: overrides.hugoVision ?? '',
    signatureRecommendationNotes: overrides.signatureRecommendationNotes ?? '',
    demoAssets: { ...defaultDemoAssets(), ...overrides.demoAssets },
    modulesEnabled: overrides.modulesEnabled ?? getDefaultEnabledRealEstateModules(overrides.features ?? ['Présentation premium', 'Demande de rappel']),
    modulesDisabled: overrides.modulesDisabled ?? getDisabledRealEstateModules(overrides.modulesEnabled ?? getDefaultEnabledRealEstateModules(overrides.features ?? ['Présentation premium', 'Demande de rappel'])),
    chatGptPlannedCaptures: overrides.chatGptPlannedCaptures ?? '',
    chatGptListingsToReuse: overrides.chatGptListingsToReuse ?? '',
    chatGptImagesToReuse: overrides.chatGptImagesToReuse ?? '',
    chatGptHugoNotes: overrides.chatGptHugoNotes ?? '',
    chatGptMustKeep: overrides.chatGptMustKeep ?? '',
    chatGptAvoid: overrides.chatGptAvoid ?? '',
  }
}

export function readProjects() {
  if (typeof window === 'undefined') return seedProjects

  try {
    const raw = window.localStorage.getItem(storageKey)
    const projects = raw ? JSON.parse(raw) as Project[] : seedProjects

    return ensureCityaProject(projects.length > 0 ? projects.map(normalizeProject) : seedProjects)
  } catch {
    return ensureCityaProject(seedProjects)
  }
}

function ensureCityaProject(projects: Project[]) {
  const cityaSeed = seedProjects.find((project) => project.id === 'project-citya-montauban')
  if (!cityaSeed) return projects

  const existing = projects.find((project) => (
    project.id === cityaSeed.id ||
    project.generatedAgencyId === cityaAgencyId ||
    (project.companyName.toLowerCase().includes('citya') && project.city.toLowerCase().includes('montauban'))
  ))

  if (!existing) return [...projects, cityaSeed]

  return projects.map((project) => (
    project.id === existing.id
      ? normalizeProject({
        ...project,
        generatedAgencyId: project.generatedAgencyId || cityaAgencyId,
        currentWebsite: project.currentWebsite || cityaWebsiteUrl,
        lovableLink: project.lovableLink || cityaLovableMockupUrl,
        liveRepoLink: project.liveRepoLink || cityaLiveDemoPath,
        technicalStatus: project.technicalStatus === 'à préparer' ? 'vivante prête' as Project['technicalStatus'] : project.technicalStatus,
        lovableDemoStatus: project.lovableDemoStatus === 'pas encore créée' ? 'validée' as Project['lovableDemoStatus'] : project.lovableDemoStatus,
      })
      : project
  ))
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    hasWebsite: project.hasWebsite ?? Boolean(project.currentWebsite),
    currentWebsite: project.currentWebsite ?? '',
    businessDescription: project.businessDescription ?? '',
    pains: project.pains ?? [project.pain].filter(Boolean),
    goals: project.goals ?? [project.goal].filter(Boolean),
    diagnosticPriority: project.diagnosticPriority ?? project.goals?.[0] ?? project.goal ?? '',
    diagnosticBlocker: project.diagnosticBlocker ?? project.pains?.[0] ?? project.pain ?? '',
    desiredFeeling: project.desiredFeeling ?? '',
    diagnosticGoal: project.diagnosticGoal ?? project.goal ?? '',
    emailLog: { ...defaultEmailLog(), ...project.emailLog },
    emailHistory: normalizeEmailHistory(project.emailHistory),
    trackingToken: project.trackingToken ?? project.id,
    callbackRequested: project.callbackRequested ?? false,
    callbackPhone: project.callbackPhone ?? '',
    callbackMoment: project.callbackMoment ?? '',
    callbackMessage: project.callbackMessage ?? '',
    clientPrecision: project.clientPrecision ?? '',
    adjustmentCategory: project.adjustmentCategory ?? '',
    adjustmentMessage: project.adjustmentMessage ?? '',
    lastClientAction: project.lastClientAction ?? '',
    clientSpaceCreated: project.clientSpaceCreated ?? false,
    clientEmailConfirmed: project.clientEmailConfirmed ?? false,
    generatedAgencyId: project.generatedAgencyId ?? '',
    generatedPromptId: project.generatedPromptId ?? '',
    lovableDemoStatus: project.lovableDemoStatus ?? getLegacyLovableStatus(project),
    lovableNotes: project.lovableNotes ?? project.visualNotes ?? '',
    proposedPrice: project.proposedPrice ?? '2 000 € installation + 400 €/mois',
    depositRequested: project.depositRequested ?? '',
    paymentSimpleStatus: project.paymentSimpleStatus ?? getLegacyPaymentSimpleStatus(project),
    paymentNotes: project.paymentNotes ?? '',
    technicalStatus: project.technicalStatus ?? getLegacyTechnicalStatus(project),
    liveRepoLink: project.liveRepoLink ?? project.githubPrLink ?? '',
    privateNotes: project.privateNotes ?? project.internalNotes ?? '',
    hugoVision: project.hugoVision ?? getDefaultHugoVision(project),
    signatureRecommendationNotes: project.signatureRecommendationNotes ?? '',
    demoAssets: normalizeDemoAssets(project),
    modulesEnabled: normalizeEnabledRealEstateModules(project),
    modulesDisabled: normalizeDisabledRealEstateModules(project),
    chatGptPlannedCaptures: project.chatGptPlannedCaptures ?? '',
    chatGptListingsToReuse: project.chatGptListingsToReuse ?? '',
    chatGptImagesToReuse: project.chatGptImagesToReuse ?? '',
    chatGptHugoNotes: project.chatGptHugoNotes ?? '',
    chatGptMustKeep: project.chatGptMustKeep ?? '',
    chatGptAvoid: project.chatGptAvoid ?? '',
  }
}

function normalizeEmailHistory(emailHistory: EmailHistoryItem[] = []) {
  return emailHistory.map((item) => ({
    ...item,
    provider: item.provider ?? getLegacyEmailProvider(item.status),
    providerMessageId: item.providerMessageId ?? '',
    errorMessage: item.errorMessage ?? '',
  }))
}

function normalizeDemoAssets(project: Project): DemoAssets {
  const legacyAssets = {
    websiteScreenshotsNotes: project.chatGptPlannedCaptures ?? '',
    imageReferences: project.chatGptImagesToReuse ?? '',
    offerReferences: project.chatGptListingsToReuse ?? '',
    mustReuse: project.chatGptMustKeep ?? '',
    mustAvoid: project.chatGptAvoid ?? '',
  }

  return {
    ...defaultDemoAssets(),
    ...legacyAssets,
    ...(project.demoAssets ?? {}),
  }
}

function normalizeEnabledRealEstateModules(project: Project): RealEstateModuleKey[] {
  const enabled = project.modulesEnabled?.length
    ? project.modulesEnabled
    : getDefaultEnabledRealEstateModules(project.features)

  return dedupeRealEstateModules(enabled)
}

function normalizeDisabledRealEstateModules(project: Project): RealEstateModuleKey[] {
  if (project.modulesDisabled?.length) return dedupeRealEstateModules(project.modulesDisabled)

  return getDisabledRealEstateModules(normalizeEnabledRealEstateModules(project))
}

function getDefaultEnabledRealEstateModules(features: string[] = []): RealEstateModuleKey[] {
  const normalizedFeatures = features.map((feature) => feature.toLowerCase())
  const enabled = new Set<RealEstateModuleKey>()

  const addIf = (moduleKey: RealEstateModuleKey, patterns: string[]) => {
    if (normalizedFeatures.some((feature) => patterns.some((pattern) => feature.includes(pattern)))) {
      enabled.add(moduleKey)
    }
  }

  addIf('premium_presentation', ['présentation premium', 'presentation premium'])
  addIf('estimation', ['estimation'])
  addIf('seller_space', ['espace vendeur'])
  addIf('visit_request', ['visite'])
  addIf('documents', ['documents'])
  addIf('reports', ['compte-rendu', 'compte rendu', 'suivi de dossier'])
  addIf('callback_request', ['rappel'])
  addIf('notifications', ['notifications'])
  addIf('contact', ['contact', 'formulaire'])
  addIf('agency_value_page', ['pages services', 'services'])

  if (!enabled.size) {
    enabled.add('premium_presentation')
    enabled.add('callback_request')
    enabled.add('contact')
  }

  return dedupeRealEstateModules([...enabled])
}

function getDisabledRealEstateModules(enabled: RealEstateModuleKey[]) {
  const enabledSet = new Set(enabled)

  return realEstateModules
    .map((module) => module.key)
    .filter((moduleKey) => !enabledSet.has(moduleKey))
}

function dedupeRealEstateModules(moduleKeys: RealEstateModuleKey[]) {
  const validKeys = new Set(realEstateModules.map((module) => module.key))

  return Array.from(new Set(moduleKeys)).filter((moduleKey): moduleKey is RealEstateModuleKey => validKeys.has(moduleKey))
}

export function getFixedRealEstateSkeletonModules(): RealEstateModuleKey[] {
  return [
    'premium_presentation',
    'property_listings',
    'property_detail',
    'estimation',
    'seller_space',
    'visit_request',
    'callback_request',
    'agency_value_page',
  ]
}

export function getSignatureRecommendations(project: Pick<Project, 'diagnosticPriority' | 'diagnosticBlocker' | 'diagnosticGoal'>): SignatureRecommendation[] {
  const signals = [
    project.diagnosticPriority,
    project.diagnosticBlocker,
    project.diagnosticGoal,
  ].join(' ').toLowerCase()
  const recommendations = new Map<RealEstateModuleKey, SignatureRecommendation>()

  const add = (moduleKey: RealEstateModuleKey, priority: SignatureRecommendation['priority'], reason: string) => {
    const current = recommendations.get(moduleKey)
    if (current?.priority === 'fort') return
    recommendations.set(moduleKey, { moduleKey, priority, reason })
  }

  add('premium_presentation', 'fort', 'le squelette commence par une présentation premium pour clarifier la valeur de l’agence dès l’arrivée.')

  if (signals.includes('confiance') || signals.includes('crédible') || signals.includes('rassurer')) {
    add('seller_space', 'fort', 'la demande indique un besoin de confiance et de transparence pour les propriétaires vendeurs.')
    add('reports', 'fort', 'les comptes rendus rendent l’accompagnement plus concret et rassurant.')
    add('agency_value_page', 'fort', 'la page de valeur explique pourquoi confier son bien à l’agence.')
  }

  if (signals.includes('estimation') || signals.includes('demandes vendeurs') || signals.includes('convertir les vendeurs')) {
    add('estimation', 'fort', 'l’objectif est d’augmenter les demandes vendeurs avec un parcours d’estimation qualifié.')
    add('callback_request', 'moyen', 'le rappel conseiller permet de transformer une intention en échange direct.')
  }

  if (signals.includes('biens') || signals.includes('présentés') || signals.includes('valoriser')) {
    add('property_listings', 'fort', 'les biens doivent être présentés de façon plus premium et lisible.')
    add('property_detail', 'fort', 'la fiche bien détaillée valorise les annonces sans noyer l’acheteur.')
    add('visit_request', 'moyen', 'la demande de visite qualifiée transforme l’intérêt acheteur en contact utile.')
  }

  if (signals.includes('vendeurs ne se projettent') || signals.includes('propriétaires vendeurs') || signals.includes('accompagnement')) {
    add('seller_space', 'fort', 'l’espace vendeur aide le propriétaire à se projeter dans un suivi clair.')
    add('documents', 'moyen', 'les documents vendeur renforcent la perception d’un accompagnement structuré.')
    add('notifications', 'faible', 'les notifications peuvent soutenir le sentiment de suivi sans alourdir la démo.')
  }

  if (signals.includes('premium') || signals.includes('haut de gamme') || signals.includes('image')) {
    add('agency_value_page', 'fort', 'l’agence doit justifier une perception plus haut de gamme.')
    add('seller_space', 'moyen', 'l’espace vendeur montre une expérience plus aboutie qu’une vitrine classique.')
  }

  return [...recommendations.values()]
}

export function formatSignatureRecommendations(project: Pick<Project, 'diagnosticPriority' | 'diagnosticBlocker' | 'diagnosticGoal' | 'signatureRecommendationNotes'>) {
  if (project.signatureRecommendationNotes?.trim()) return project.signatureRecommendationNotes

  return getSignatureRecommendations(project)
    .map((recommendation) => {
      const module = realEstateModules.find((item) => item.key === recommendation.moduleKey)
      return `${recommendation.moduleKey} - ${module?.label ?? recommendation.moduleKey} - priorité ${recommendation.priority} - ${recommendation.reason}`
    })
    .join('\n')
}

function getDefaultHugoVision(project: Pick<Project, 'diagnosticBlocker' | 'diagnosticGoal' | 'desiredFeeling' | 'style' | 'city'>) {
  const blocker = project.diagnosticBlocker || 'une présence digitale trop classique'
  const goal = project.diagnosticGoal || 'renforcer la confiance avant le premier contact'
  const feeling = project.desiredFeeling || 'confiance'
  const style = project.style || 'premium clair'
  const city = project.city || 'son marché local'

  return `La démo doit montrer une expérience immobilière ${style}, ancrée à ${city}, qui répond à la douleur suivante : ${blocker}. Elle doit faire ressentir ${feeling.toLowerCase()} et soutenir l’objectif : ${goal}.`
}

function getLegacyEmailProvider(status: EmailStatus) {
  if (status === 'sent') return 'gmail'
  if (status === 'simulated') return 'simulation'

  return 'unknown'
}

function getLegacyLovableStatus(project: Project): Project['lovableDemoStatus'] {
  if (project.status === 'demo_sent') return 'envoyée'
  if (project.status === 'demo_validated' || project.status === 'live_demo_to_prepare' || project.status === 'active') return 'validée'
  if (project.status === 'lovable_demo_ready') return 'prête'

  return 'pas encore créée'
}

function getLegacyPaymentSimpleStatus(project: Project): Project['paymentSimpleStatus'] {
  if (project.paymentStatus === 'reçu') return 'payé'
  if (project.paymentStatus === 'envoyé') return 'en attente'

  return 'non demandé'
}

function getLegacyTechnicalStatus(project: Project): Project['technicalStatus'] {
  if (project.status === 'active') return 'active'
  if (project.status === 'live_demo_to_prepare') return 'à préparer'
  if (project.codexStatus === 'validé') return 'vivante prête'
  if (project.codexStatus === 'en cours') return 'en cours'

  return 'à préparer'
}

export function writeProjects(projects: Project[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(projects))
}

export function createProject(input: ProjectInput) {
  const now = new Date().toISOString()
  const id = `project-${now.replace(/\D/g, '')}`
  const project: Project = {
    ...input,
    id,
    pain: input.pains[0] ?? input.pain,
    goal: input.goals[0] ?? input.goal,
    diagnosticPriority: input.diagnosticPriority,
    diagnosticBlocker: input.diagnosticBlocker,
    desiredFeeling: input.desiredFeeling,
    diagnosticGoal: input.diagnosticGoal,
    trackingToken: id,
    status: 'request_received',
    createdAt: now,
    demoLink: '',
    paymentLink: '',
    paymentStatus: 'en attente',
    internalNotes: '',
    nextAction: 'Préparer le prompt Lovable et créer la démo.',
    lovableLink: '',
    vercelPreviewLink: '',
    githubPrLink: '',
    visualStatus: 'à créer',
    visualNotes: '',
    codexStatus: 'à lancer',
    technicalNotes: '',
    analysisNotes: '',
    reminderDate: '',
    publicLinkTested: false,
    formTested: false,
    activationEmailReady: false,
    hugoValidated: false,
    emailLog: {
      ...defaultEmailLog(),
      spaceCreated: false,
    },
    emailHistory: [],
    callbackRequested: false,
    callbackPhone: '',
    callbackMoment: '',
    callbackMessage: '',
    clientPrecision: '',
    adjustmentCategory: '',
    adjustmentMessage: '',
    lastClientAction: 'Demande envoyée',
    clientSpaceCreated: false,
    clientEmailConfirmed: false,
    generatedAgencyId: '',
    generatedPromptId: '',
    lovableDemoStatus: 'pas encore créée',
    lovableNotes: '',
    proposedPrice: '2 000 € installation + 400 €/mois',
    depositRequested: '',
    paymentSimpleStatus: 'non demandé',
    paymentNotes: '',
    technicalStatus: 'à préparer',
    liveRepoLink: '',
    privateNotes: '',
    hugoVision: getDefaultHugoVision(input),
    signatureRecommendationNotes: '',
    demoAssets: defaultDemoAssets(),
    modulesEnabled: getDefaultEnabledRealEstateModules(input.features),
    modulesDisabled: getDisabledRealEstateModules(getDefaultEnabledRealEstateModules(input.features)),
    chatGptPlannedCaptures: '',
    chatGptListingsToReuse: '',
    chatGptImagesToReuse: '',
    chatGptHugoNotes: '',
    chatGptMustKeep: '',
    chatGptAvoid: '',
  }
  const generatedDemo = createSignatureDemoFromProject(project)
  const enrichedProject: Project = {
    ...project,
    generatedAgencyId: generatedDemo.agency.id,
    generatedPromptId: generatedDemo.lovablePrompt.id,
    internalNotes: [
      'Configuration moteur Signature Digital generee depuis le questionnaire.',
      `AgencyId : ${generatedDemo.agency.id}`,
      `Modules actifs : ${generatedDemo.modules.filter((module) => module.enabled).map((module) => module.moduleKey).join(', ')}`,
    ].join('\n'),
  }
  const projects = [enrichedProject, ...readProjects()]
  writeProjects(projects)

  return enrichedProject
}

export function updateProject(projectId: string, updates: Partial<Project>) {
  const projects = readProjects()
  const nextProjects = projects.map((project) => (
    project.id === projectId ? { ...project, ...updates } : project
  ))
  writeProjects(nextProjects)

  return nextProjects.find((project) => project.id === projectId)
}

export function getProject(projectId: string) {
  return readProjects().find((project) => project.id === projectId)
}

export function getProjectByTrackingToken(trackingToken: string) {
  return readProjects().find((project) => project.trackingToken === trackingToken || project.id === trackingToken)
}

export function updateProjectByTrackingToken(trackingToken: string, updates: Partial<Project>) {
  const project = getProjectByTrackingToken(trackingToken)
  if (!project) return undefined

  return updateProject(project.id, updates)
}

export function getTrackingPath(project: Project) {
  return `/suivi/${project.trackingToken || project.id}`
}

export function getTrackingUrl(project: Project) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://signature-digital.fr'

  return `${origin}${getTrackingPath(project)}`
}

export function getProjectSourceLabel(project: Project) {
  return project.hasWebsite ? 'votre site actuel' : 'votre activité'
}

export function getProjectSourceAdminLabel(project: Project) {
  return project.hasWebsite ? project.currentWebsite : 'Pas encore de site'
}

export function normalizeLovableUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function isValidExternalUrl(value: string) {
  const normalized = normalizeLovableUrl(value)
  if (!normalized) return false

  try {
    const url = new URL(normalized)

    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getProjectLovableUrl(project: Project) {
  const liveLink = project.liveRepoLink?.trim()
  const liveReady = project.technicalStatus === 'vivante prête' || project.technicalStatus === 'active' || project.status === 'active'

  if (liveReady && liveLink) {
    if (liveLink.startsWith('/')) return liveLink

    const normalizedLive = normalizeLovableUrl(liveLink)
    if (isValidExternalUrl(normalizedLive)) return normalizedLive
  }

  const normalized = normalizeLovableUrl(project.lovableLink)

  return isValidExternalUrl(normalized) ? normalized : ''
}

export function getConfirmationEmail(project?: Project, trackingUrl?: string) {
  if (project) {
    return `Objet : Votre espace de suivi Signature Digital est prêt

Bonjour ${project.firstName || ''},

Votre demande de démo pour ${project.companyName} est bien prise en compte.

Votre espace de suivi est maintenant disponible.

Vous pourrez y retrouver :

- l’avancement de votre demande
- les prochaines étapes
- votre démo lorsqu’elle sera prête
- la possibilité de demander un rappel
- la possibilité d’ajouter une précision
- la possibilité de demander des ajustements

Accéder à mon espace de suivi :
${trackingUrl ?? getTrackingUrl(project)}

Conservez ce lien, il vous permettra de retrouver votre espace à tout moment.

À très vite,

Signature Digital`
  }

  return `Objet : Votre demande de démo Signature Digital est bien reçue

Bonjour,

Nous avons bien reçu votre demande de démo personnalisée.

À partir de votre activité, de vos réponses et de votre objectif principal, nous allons préparer une première proposition pensée pour mieux montrer votre valeur, rassurer vos prospects et améliorer votre présence digitale.

Vous recevrez votre démo dans les meilleurs délais.

À très vite,

Signature Digital`
}

export function buildProjectEmail(project: Project, emailKey: EmailKey) {
  const trackingUrl = getTrackingUrl(project)
  const paymentUrl = getActivationPath(project)
  const firstName = project.firstName || ''

  const emails: Record<EmailKey, string> = {
    spaceCreated: `Objet : Votre espace de suivi Signature Digital est prêt

Bonjour ${firstName},

Votre demande de démo pour ${project.companyName} est bien prise en compte.

Votre espace de suivi est maintenant disponible.

Vous pourrez y retrouver :

- l’avancement de votre demande
- les prochaines étapes
- votre démo lorsqu’elle sera prête
- la possibilité de demander un rappel
- la possibilité d’ajouter une précision
- la possibilité de demander des ajustements

Accéder à mon espace de suivi :
${trackingUrl}

Conservez ce lien, il vous permettra de retrouver votre espace à tout moment.

À très vite,

Signature Digital`,
    demoReady: `Objet : Votre démo Signature Digital est prête

Bonjour ${firstName},

Votre première démo personnalisée pour ${project.companyName} est prête.

Elle a été préparée à partir de votre demande, de ${getProjectSourceLabel(project)}, de vos priorités et des fonctionnalités sélectionnées.

Votre démo est disponible depuis votre espace de suivi Signature Digital.

Accéder à mon espace de suivi :
${trackingUrl}

Depuis votre espace, vous pourrez :

- découvrir votre démo
- suivre l’avancement
- demander un ajustement
- ajouter une précision
- valider la direction proposée

À bientôt,

Hugo - Signature Digital`,
    adjustmentsReceived: `Objet : Vos ajustements sont bien pris en compte

Bonjour ${firstName},

Nous avons bien reçu vos ajustements.

Nous allons les étudier afin d’affiner votre démo dans la bonne direction, sans perdre l’objectif principal : mieux montrer votre valeur et renforcer votre présence digitale.

Suivre l’avancement :
${trackingUrl}

Signature Digital`,
    callbackRequested: `Objet : Votre demande de rappel est prise en compte

Bonjour ${firstName},

Votre demande de rappel est bien prise en compte.

Nous reviendrons vers vous selon le créneau indiqué afin de faire le point sur votre démo et vos attentes.

Signature Digital`,
    paymentAvailable: `Objet : Votre démo est prête à être activée

Bonjour ${firstName},

Votre démo a été validée et peut maintenant être activée.

L’activation comprend :

- la mise en place de l’expérience finale
- l’adaptation de la démo validée
- la configuration des accès
- la préparation des emails
- la mise en ligne
- l’accompagnement initial

Offre :
2 000 € d’installation
400 €/mois d’accompagnement et maintien de l’expérience

Accéder au paiement :
${paymentUrl}

Signature Digital`,
    paymentReceived: `Objet : Votre activation est lancée

Bonjour ${firstName},

Nous avons bien reçu votre paiement.

Votre démo va maintenant être transformée en expérience active.
Vous serez informé dès que votre espace sera prêt.

Suivre l’activation :
${trackingUrl}

Signature Digital`,
    projectActivated: `Objet : Votre expérience Signature Digital est active

Bonjour ${firstName},

Votre expérience est maintenant active.

Vous pouvez accéder à votre espace ici :
${project.demoLink || trackingUrl}

Tout a été préparé pour que la prise en main soit simple, fluide et intuitive.

Signature Digital`,
  }

  return emails[emailKey]
}

export function getDemoReadyPath(project: Project) {
  return `/demo-ready/${project.trackingToken || project.id}`
}

export function getActivationPath(project: Project) {
  return `/activation/${project.trackingToken || project.id}`
}

export function buildCodexPrompt(project: Project) {
  return `Travaille sur la démo Signature Digital pour ${project.companyName}.

Contexte projet :
- Entreprise : ${project.companyName}
- Secteur : ${project.sector}
- Ville : ${project.city}
- Site actuel : ${getProjectSourceAdminLabel(project)}
${project.hasWebsite ? '' : `- Description de l’activité : ${project.businessDescription}`}
- Priorités sélectionnées : ${getList(project.pains, project.pain)}
- Objectifs sélectionnés : ${getList(project.goals, project.goal)}
- Fonctionnalités souhaitées : ${project.features.join(', ')}
- Style souhaité : ${project.style}
- Lien Lovable validé : ${project.lovableLink || 'à compléter'}

Consigne stricte :
Ne casse pas le visuel validé. Conserve la direction sombre premium, fluide, mobile-first, technologique sobre, noir profond, bleu nuit et violet premium.

Mission :
Rendre vivants les boutons, formulaires, routes, paiement, emails simulés et activation, sans modifier la direction artistique validée.`
}

function getList(values: string[], fallback: string) {
  const list = values.length > 0 ? values : [fallback].filter(Boolean)

  return list.join(', ')
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
