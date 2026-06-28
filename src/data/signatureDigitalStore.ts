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
  Lead,
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
  if (typeof window === 'undefined') return emptyState

  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? { ...emptyState, ...JSON.parse(raw) } as SignatureDigitalState : emptyState
  } catch {
    return emptyState
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

function writeSignatureDigitalState(state: SignatureDigitalState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(state))
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
