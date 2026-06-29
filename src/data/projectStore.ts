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
]

function createSeedProject(overrides: Partial<Project> & Pick<Project, 'id' | 'companyName' | 'sector' | 'city' | 'pain' | 'goal' | 'status' | 'nextAction'>): Project {
  const now = new Date('2026-06-23T10:00:00.000Z').toISOString()

  return {
    id: overrides.id,
    companyName: overrides.companyName,
    sector: overrides.sector,
    city: overrides.city,
    hasWebsite: overrides.hasWebsite ?? true,
    currentWebsite: 'https://exemple-client.fr',
    businessDescription: overrides.businessDescription ?? '',
    pain: overrides.pain,
    pains: overrides.pains ?? [overrides.pain],
    goal: overrides.goal,
    goals: overrides.goals ?? [overrides.goal],
    features: ['Formulaire de contact', 'Demande de rappel', 'Présentation premium'],
    style: 'Luxe sombre',
    firstName: 'Hugo',
    lastName: 'Client',
    email: 'contact@exemple-client.fr',
    phone: '06 00 00 00 00',
    message: 'Demande créée pour préparer une démo personnalisée.',
    status: overrides.status,
    createdAt: now,
    demoLink: overrides.demoLink ?? '',
    paymentLink: 'https://signature-digital.fr/paiement/demo',
    paymentStatus: overrides.paymentStatus ?? 'en attente',
    internalNotes: 'Préserver le visuel validé et avancer par blocs fonctionnels.',
    nextAction: overrides.nextAction,
    lovableLink: 'https://premium-digital-reveal.lovable.app/',
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

    return projects.length > 0 ? projects.map(normalizeProject) : seedProjects
  } catch {
    return seedProjects
  }
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    hasWebsite: project.hasWebsite ?? Boolean(project.currentWebsite),
    currentWebsite: project.currentWebsite ?? '',
    businessDescription: project.businessDescription ?? '',
    pains: project.pains ?? [project.pain].filter(Boolean),
    goals: project.goals ?? [project.goal].filter(Boolean),
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
    trackingToken: id,
    status: 'request_received',
    createdAt: now,
    demoLink: '',
    paymentLink: '',
    paymentStatus: 'en attente',
    internalNotes: '',
    nextAction: 'Copier le résumé dans ChatGPT et préparer le prompt Lovable.',
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
  const demoUrl = getDemoReadyPath(project)
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

Votre démo personnalisée est prête.

Elle a été préparée à partir de ${getProjectSourceLabel(project)}, de vos réponses et des objectifs que vous nous avez indiqués.

Vous pouvez la découvrir ici :
${demoUrl}

Depuis votre espace, vous pourrez :

- découvrir la démo
- voir les fonctionnalités prévues
- demander des ajustements
- demander un rappel
- valider la direction proposée

Certaines fonctionnalités sont visibles dans la démo, mais seront activées uniquement après validation et paiement.

À très vite,

Signature Digital`,
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
