export const projectStatuses = [
  'Demande reçue',
  'À analyser',
  'Analyse faite',
  'Démo à créer',
  'Démo visuelle prête',
  'Visuel validé',
  'Codex à lancer',
  'Démo vivante prête',
  'Démo envoyée',
  'Paiement envoyé',
  'Paiement reçu',
  'À activer',
  'Activé',
  'Perdu',
] as const

export type ProjectStatus = (typeof projectStatuses)[number]

export type Project = {
  id: string
  companyName: string
  sector: string
  city: string
  currentWebsite: string
  pain: string
  goal: string
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
}

export type ProjectInput = Pick<
  Project,
  | 'companyName'
  | 'sector'
  | 'city'
  | 'currentWebsite'
  | 'pain'
  | 'goal'
  | 'features'
  | 'style'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'message'
>

export const emailKeys = [
  'confirmation',
  'demo',
  'relance',
  'paiement',
  'activation',
  'accesClient',
] as const

export type EmailKey = (typeof emailKeys)[number]

export const emailLabels: Record<EmailKey, string> = {
  confirmation: 'Email confirmation demande reçue',
  demo: 'Email envoi de démo',
  relance: 'Email relance',
  paiement: 'Email paiement',
  activation: 'Email activation',
  accesClient: 'Email accès client',
}

const storageKey = 'signature-digital-live-projects'

const defaultEmailLog = (): Record<EmailKey, boolean> => ({
  confirmation: false,
  demo: false,
  relance: false,
  paiement: false,
  activation: false,
  accesClient: false,
})

const seedProjects: Project[] = [
  createSeedProject({
    id: 'project-cc',
    companyName: 'Cc',
    sector: 'Constructeurs',
    city: 'Tarbes',
    pain: 'Je ne me différencie pas assez de mes concurrents',
    goal: 'Vendre une offre plus premium',
    status: 'Démo visuelle prête',
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
    status: 'À analyser',
    nextAction: 'Clarifier l’angle commercial avant création visuelle.',
  }),
  createSeedProject({
    id: 'project-vallat',
    companyName: 'Maison Vallat',
    sector: 'Immobilier',
    city: 'Lyon',
    pain: 'Mes visiteurs ne comprennent pas assez vite ma valeur',
    goal: 'Obtenir plus de contacts',
    status: 'Démo à créer',
    nextAction: 'Créer une première proposition visuelle sombre premium.',
  }),
  createSeedProject({
    id: 'project-aurore',
    companyName: 'Clinique Aurore',
    sector: 'Cliniques privées',
    city: 'Bordeaux',
    pain: 'Je veux rassurer davantage mes prospects',
    goal: 'Créer un espace client',
    status: 'Activé',
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
    currentWebsite: 'https://exemple-client.fr',
    pain: overrides.pain,
    goal: overrides.goal,
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
  }
}

export function readProjects() {
  if (typeof window === 'undefined') return seedProjects

  try {
    const raw = window.localStorage.getItem(storageKey)
    const projects = raw ? JSON.parse(raw) as Project[] : seedProjects

    return projects.length > 0 ? projects : seedProjects
  } catch {
    return seedProjects
  }
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
    status: 'Demande reçue',
    createdAt: now,
    demoLink: '',
    paymentLink: '',
    paymentStatus: 'en attente',
    internalNotes: '',
    nextAction: 'Analyser la demande et préparer l’angle de démo.',
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
      confirmation: true,
    },
  }
  const projects = [project, ...readProjects()]
  writeProjects(projects)

  return project
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

export function getConfirmationEmail() {
  return `Objet : Votre demande de démo Signature Digital est bien reçue

Bonjour,

Nous avons bien reçu votre demande de démo personnalisée.

À partir de votre site actuel, de vos réponses et de votre objectif principal, nous allons préparer une première proposition pensée pour mieux montrer votre valeur, rassurer vos prospects et améliorer votre présence digitale.

Vous recevrez votre démo dans les meilleurs délais.

À très vite,

Signature Digital`
}

export function buildProjectEmail(project: Project, emailKey: EmailKey) {
  if (emailKey === 'confirmation') return getConfirmationEmail()

  const subjects: Record<EmailKey, string> = {
    confirmation: 'Votre demande de démo Signature Digital est bien reçue',
    demo: `Votre première démo ${project.companyName} est prête`,
    relance: `Suite à votre demande Signature Digital`,
    paiement: `Lien de paiement pour activer votre démo ${project.companyName}`,
    activation: `Votre projet Signature Digital est activé`,
    accesClient: `Vos accès Signature Digital`,
  }

  return `Objet : ${subjects[emailKey]}

Bonjour ${project.firstName || ''},

Votre projet ${project.companyName} avance autour de l’objectif suivant : ${project.goal}.

Nous gardons comme priorité : ${project.pain}.

À très vite,

Signature Digital`
}

export function buildCodexPrompt(project: Project) {
  return `Travaille sur la démo Signature Digital pour ${project.companyName}.

Contexte projet :
- Entreprise : ${project.companyName}
- Secteur : ${project.sector}
- Ville : ${project.city}
- Site actuel : ${project.currentWebsite}
- Douleur principale : ${project.pain}
- Objectif principal : ${project.goal}
- Fonctionnalités souhaitées : ${project.features.join(', ')}
- Style souhaité : ${project.style}
- Lien Lovable validé : ${project.lovableLink || 'à compléter'}

Consigne stricte :
Ne casse pas le visuel validé. Conserve la direction sombre premium, fluide, mobile-first, technologique sobre, noir profond, bleu nuit et violet premium.

Mission :
Rendre vivants les boutons, formulaires, routes, paiement, emails simulés et activation, sans modifier la direction artistique validée.`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
