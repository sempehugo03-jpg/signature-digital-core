import { createDemoFromQuestionnaire, seedDemoAgencyFromConfig } from '../lib/demoConfigurator'
import { disableModule, enableModule } from '../lib/modules'
import type { GeneratedDemoConfiguration, QuestionnaireInput } from '../lib/demoConfigurator'
import type { Project as FunnelProject } from './projectStore'
import type {
  Agency,
  AgencyModule,
  AgencySettings,
  AnalyticsEvent,
  Appointment,
  DemoRequest,
  Document as SignatureDocument,
  GeneratedPrompt,
  InviteToken,
  JsonValue,
  Lead,
  ModuleKey,
  Notification,
  Project,
  QuestionnaireAnswer,
} from '../types/signature-digital'

type SignatureDigitalState = {
  agencies: Agency[]
  agencyModules: AgencyModule[]
  agencySettings: AgencySettings[]
  demoRequests: DemoRequest[]
  questionnaireAnswers: QuestionnaireAnswer[]
  generatedPrompts: GeneratedPrompt[]
  leads: Lead[]
  projects: Project[]
  appointments: Appointment[]
  documents: SignatureDocument[]
  emails: Array<{ id: string; agencyId: string; type: string; subject: string; createdAt: string }>
  notifications: Notification[]
  analyticsEvents: AnalyticsEvent[]
  inviteTokens: InviteToken[]
}

const storageKey = 'signature-digital-multitenant-engine'

const emptyState: SignatureDigitalState = {
  agencies: [],
  agencyModules: [],
  agencySettings: [],
  demoRequests: [],
  questionnaireAnswers: [],
  generatedPrompts: [],
  leads: [],
  projects: [],
  appointments: [],
  documents: [],
  emails: [],
  notifications: [],
  analyticsEvents: [],
  inviteTokens: [],
}

export function createSignatureDemoFromProject(project: FunnelProject) {
  const config = createDemoFromQuestionnaire(projectToQuestionnaireInput(project))
  persistGeneratedDemo(config)

  return config
}

export function persistGeneratedDemo(config: GeneratedDemoConfiguration) {
  const state = readSignatureDigitalState()
  const demoSeed = seedDemoAgencyFromConfig(config)
  const demoProjects = demoSeed.projects.map((project, index): Project => ({
    id: `${config.agency.id}_project_${index + 1}`,
    agencyId: config.agency.id,
    title: project.title,
    sector: config.agency.sector,
    status: project.status,
    progressStep: project.progressStep,
    payload: project.payload,
    createdAt: demoSeed.createdAt,
    updatedAt: demoSeed.createdAt,
  }))
  const demoDocuments = demoSeed.documents.map((name, index): SignatureDocument => ({
    id: `${config.agency.id}_document_${index + 1}`,
    agencyId: config.agency.id,
    projectId: demoProjects[0]?.id,
    name,
    type: 'demo',
    url: '',
    visibleToClient: true,
    createdAt: demoSeed.createdAt,
  }))
  const demoLeads = demoSeed.leads.map((source, index): Lead => ({
    id: `${config.agency.id}_lead_${index + 1}`,
    agencyId: config.agency.id,
    moduleKey: source.toLowerCase().includes('visite') ? 'visit_request' : 'lead_form',
    firstName: 'Client',
    lastName: 'Demo',
    email: 'client.demo@signature-digital.fr',
    phone: '',
    source,
    status: 'new',
    payload: { generatedFromDemoRequest: config.demoRequest.id },
    createdAt: demoSeed.createdAt,
    updatedAt: demoSeed.createdAt,
  }))

  writeSignatureDigitalState({
    ...state,
    agencies: upsertById(state.agencies, config.agency),
    agencyModules: [
      ...state.agencyModules.filter((module) => module.agencyId !== config.agency.id),
      ...config.modules,
    ],
    agencySettings: upsertById(state.agencySettings, config.settings),
    demoRequests: upsertById(state.demoRequests, config.demoRequest),
    questionnaireAnswers: [
      ...state.questionnaireAnswers.filter((answer) => answer.demoRequestId !== config.demoRequest.id),
      ...config.questionnaireAnswers,
    ],
    generatedPrompts: upsertById(state.generatedPrompts, config.lovablePrompt),
    projects: [
      ...state.projects.filter((project) => project.agencyId !== config.agency.id),
      ...demoProjects,
    ],
    documents: [
      ...state.documents.filter((document) => document.agencyId !== config.agency.id),
      ...demoDocuments,
    ],
    leads: [
      ...state.leads.filter((lead) => lead.agencyId !== config.agency.id),
      ...demoLeads,
    ],
  })
}

export function readSignatureDigitalState(): SignatureDigitalState {
  if (typeof window === 'undefined') return createSeedState()

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) return { ...emptyState, ...JSON.parse(raw) } as SignatureDigitalState

    const seeded = createSeedState()
    writeSignatureDigitalState(seeded)
    return seeded
  } catch {
    return createSeedState()
  }
}

export function listSignatureAgencies() {
  return readSignatureDigitalState().agencies
}

export function listSignatureDemoRequests() {
  return readSignatureDigitalState().demoRequests
}

export function listSignatureGeneratedPrompts() {
  return readSignatureDigitalState().generatedPrompts
}

export function getSignatureAgencyModules(agencyId: string) {
  return readSignatureDigitalState().agencyModules.filter((module) => module.agencyId === agencyId)
}

export function getSignatureAgency(agencyId: string) {
  return readSignatureDigitalState().agencies.find((agency) => agency.id === agencyId)
}

export function getSignatureAgencyBySlug(slug: string) {
  return readSignatureDigitalState().agencies.find((agency) => agency.slug === slug)
}

export function updateSignatureAgency(agencyId: string, updates: Partial<Agency>) {
  const state = readSignatureDigitalState()
  const agency = state.agencies.find((item) => item.id === agencyId)
  if (!agency) return undefined

  const updatedAgency: Agency = {
    ...agency,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  writeSignatureDigitalState({
    ...state,
    agencies: upsertById(state.agencies, updatedAgency),
  })

  return updatedAgency
}

export function updateSignatureAgencyModule(agencyId: string, moduleKey: AgencyModule['moduleKey'], enabled: boolean) {
  const state = readSignatureDigitalState()
  const now = new Date().toISOString()
  const current = state.agencyModules.find((module) => module.agencyId === agencyId && module.moduleKey === moduleKey)
  const nextModule: AgencyModule = {
    id: current?.id ?? `${agencyId}_${moduleKey}`,
    agencyId,
    moduleKey,
    enabled,
    config: current?.config ?? {},
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  }

  writeSignatureDigitalState({
    ...state,
    agencyModules: [
      ...state.agencyModules.filter((module) => !(module.agencyId === agencyId && module.moduleKey === moduleKey)),
      nextModule,
    ],
  })
  if (enabled) {
    enableModule(agencyId, moduleKey, nextModule.config)
  } else {
    disableModule(agencyId, moduleKey)
  }

  return nextModule
}

export function writeSignatureDigitalState(state: SignatureDigitalState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}

export function createSignatureLead(agencyId: string, moduleKey: ModuleKey, payload: Record<string, JsonValue>) {
  const state = readSignatureDigitalState()
  const now = new Date().toISOString()
  const lead: Lead = {
    id: createId('lead'),
    agencyId,
    moduleKey,
    firstName: String(payload.firstName ?? ''),
    lastName: String(payload.lastName ?? ''),
    email: String(payload.email ?? ''),
    phone: String(payload.phone ?? ''),
    source: String(payload.source ?? moduleKey),
    status: 'new',
    payload,
    createdAt: now,
    updatedAt: now,
  }

  writeSignatureDigitalState({ ...state, leads: [lead, ...state.leads] })
  return lead
}

export function createSignatureAppointment(agencyId: string, payload: Record<string, JsonValue>) {
  const state = readSignatureDigitalState()
  const now = new Date().toISOString()
  const appointment: Appointment = {
    id: createId('appointment'),
    agencyId,
    leadId: String(payload.leadId ?? ''),
    title: String(payload.title ?? 'Demande de rendez-vous'),
    date: String(payload.date ?? ''),
    time: String(payload.time ?? ''),
    status: 'requested',
    payload,
    createdAt: now,
    updatedAt: now,
  }

  writeSignatureDigitalState({ ...state, appointments: [appointment, ...state.appointments] })
  return appointment
}

export function createSignatureDocument(agencyId: string, payload: Record<string, JsonValue>) {
  const state = readSignatureDigitalState()
  const document: SignatureDocument = {
    id: createId('document'),
    agencyId,
    projectId: typeof payload.projectId === 'string' ? payload.projectId : undefined,
    leadId: typeof payload.leadId === 'string' ? payload.leadId : undefined,
    name: String(payload.name ?? 'Document demande'),
    type: String(payload.type ?? 'request'),
    url: String(payload.url ?? ''),
    visibleToClient: Boolean(payload.visibleToClient ?? false),
    createdAt: new Date().toISOString(),
  }

  writeSignatureDigitalState({ ...state, documents: [document, ...state.documents] })
  return document
}

export function createSignatureProject(agencyId: string, payload: Record<string, JsonValue>) {
  const state = readSignatureDigitalState()
  const agency = state.agencies.find((item) => item.id === agencyId)
  const now = new Date().toISOString()
  const project: Project = {
    id: createId('project'),
    agencyId,
    title: String(payload.title ?? 'Nouveau projet'),
    sector: agency?.sector ?? 'autre',
    status: String(payload.status ?? 'new'),
    progressStep: String(payload.progressStep ?? 'demande'),
    payload,
    createdAt: now,
    updatedAt: now,
  }

  writeSignatureDigitalState({ ...state, projects: [project, ...state.projects] })
  return project
}

export function createSignatureInvite(agencyId: string, payload: Record<string, JsonValue>) {
  const state = readSignatureDigitalState()
  const invite: InviteToken = {
    id: createId('invite'),
    agencyId,
    token: createId('token'),
    type: String(payload.type ?? 'client_invite') as InviteToken['type'],
    status: 'active',
    email: String(payload.email ?? ''),
    createdAt: new Date().toISOString(),
    expiresAt: typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
  }

  writeSignatureDigitalState({ ...state, inviteTokens: [invite, ...state.inviteTokens] })
  return invite
}

export function createSignatureAnalyticsEvent(agencyId: string, payload: Record<string, JsonValue>) {
  const state = readSignatureDigitalState()
  const event: AnalyticsEvent = {
    id: createId('analytics'),
    agencyId,
    eventType: String(payload.eventType ?? 'interaction'),
    page: String(payload.page ?? ''),
    moduleKey: typeof payload.moduleKey === 'string' ? payload.moduleKey as ModuleKey : undefined,
    payload,
    createdAt: new Date().toISOString(),
  }

  writeSignatureDigitalState({ ...state, analyticsEvents: [event, ...state.analyticsEvents] })
  return event
}

function projectToQuestionnaireInput(project: FunnelProject): QuestionnaireInput {
  return {
    companyName: project.companyName,
    sector: project.sector,
    city: project.city,
    websiteUrl: project.currentWebsite,
    hasWebsite: project.hasWebsite,
    businessDescription: project.businessDescription,
    contactFirstName: project.firstName,
    contactLastName: project.lastName,
    contactEmail: project.email,
    contactPhone: project.phone,
    pains: project.pains.length > 0 ? project.pains : [project.pain].filter(Boolean),
    goals: project.goals.length > 0 ? project.goals : [project.goal].filter(Boolean),
    features: project.features,
    visualStyle: project.style,
    notes: project.message,
  }
}

function upsertById<Item extends { id: string }>(items: Item[], item: Item) {
  return [...items.filter((current) => current.id !== item.id), item]
}

function createSeedState(): SignatureDigitalState {
  const clientA = createDemoFromQuestionnaire({
    companyName: 'Client A Immobilier',
    sector: 'immobilier',
    city: 'Tarbes',
    websiteUrl: 'https://client-a-immobilier.fr',
    hasWebsite: true,
    contactFirstName: 'Camille',
    contactLastName: 'Agence',
    contactEmail: 'client-a@signature.test',
    contactPhone: '0600000001',
    pains: ['Mes visiteurs ne comprennent pas assez vite ma valeur'],
    goals: ['Obtenir plus de contacts'],
    features: ['Estimation', 'Demande de rappel', 'Documents', 'Présentation premium', 'Compte-rendu'],
    visualStyle: 'Premium sobre',
    notes: 'Client test immobilier pour verifier estimation, visite, vendeur et documents.',
  })
  const clientB = createDemoFromQuestionnaire({
    companyName: 'Client B Avocat',
    sector: 'avocat',
    city: 'Pau',
    websiteUrl: 'https://client-b-avocat.fr',
    hasWebsite: true,
    contactFirstName: 'Maître',
    contactLastName: 'Demo',
    contactEmail: 'client-b@signature.test',
    contactPhone: '0600000002',
    pains: ['Mon image n’est pas assez premium'],
    goals: ['Vendre une offre plus premium'],
    features: ['Espace client', 'Prise de rendez-vous', 'Documents', 'Notifications'],
    visualStyle: 'Très haut de gamme',
    notes: 'Client test avocat pour verifier rendez-vous, documents et qualification.',
  })
  const seedState = { ...emptyState }
  ;[clientA, clientB].forEach((config) => {
    const demoSeed = seedDemoAgencyFromConfig(config)
    seedState.agencies = upsertById(seedState.agencies, config.agency)
    seedState.agencyModules = [...seedState.agencyModules, ...config.modules]
    seedState.agencySettings = upsertById(seedState.agencySettings, config.settings)
    seedState.demoRequests = upsertById(seedState.demoRequests, config.demoRequest)
    seedState.questionnaireAnswers = [...seedState.questionnaireAnswers, ...config.questionnaireAnswers]
    seedState.generatedPrompts = upsertById(seedState.generatedPrompts, config.lovablePrompt)
    seedState.projects = [
      ...seedState.projects,
      ...demoSeed.projects.map((project, index): Project => ({
        id: `${config.agency.id}_project_${index + 1}`,
        agencyId: config.agency.id,
        title: project.title,
        sector: config.agency.sector,
        status: project.status,
        progressStep: project.progressStep,
        payload: project.payload,
        createdAt: demoSeed.createdAt,
        updatedAt: demoSeed.createdAt,
      })),
    ]
  })

  return seedState
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}
