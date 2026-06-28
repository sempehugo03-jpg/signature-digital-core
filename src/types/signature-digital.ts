export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type SectorKey =
  | 'immobilier'
  | 'avocat'
  | 'notaire'
  | 'architecte'
  | 'clinique'
  | 'automobile'
  | 'constructeur'
  | 'patrimoine'
  | 'autre'

export type AgencyStatus = 'draft' | 'demo' | 'active' | 'disabled'
export type RuntimeStatus = 'not_ready' | 'ready' | 'blocked'

export type ModuleKey =
  | 'lead_form'
  | 'callback_request'
  | 'appointment'
  | 'client_space'
  | 'professional_space'
  | 'documents'
  | 'document_upload'
  | 'estimation'
  | 'payment'
  | 'services_pages'
  | 'premium_presentation'
  | 'notifications'
  | 'reports'
  | 'analytics'
  | 'project_tracking'
  | 'visit_request'
  | 'seller_space'
  | 'buyer_space'
  | 'qualification_form'
  | 'quote_request'
  | 'demo_preview'
  | 'email_notifications'

export type ModuleCategory =
  | 'conversion'
  | 'client_experience'
  | 'operations'
  | 'content'
  | 'commercial'
  | 'analytics'
  | 'communication'

export type DemoRequestStatus = 'new' | 'analyzed' | 'demo_generated' | 'sent' | 'signed' | 'lost'
export type VisualStyle = 'premium_sobre' | 'luxe_sombre' | 'clair_minimal' | 'institutionnel' | 'tres_haut_de_gamme' | 'moderne_fluide'
export type Tone = 'sobre' | 'premium' | 'haut_de_gamme' | 'rassurant' | 'institutionnel' | 'direct'
export type PromptType = 'lovable_demo' | 'codex_task' | 'email' | 'commercial_analysis'

export type Agency = {
  id: string
  slug: string
  name: string
  sector: SectorKey
  city: string
  websiteUrl: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  status: AgencyStatus
  commercialAngle: string
  painPoint: string
  mainObjective: string
  emailReception: string
  notificationEmails: string[]
  settings: Record<string, JsonValue>
  runtimeStatus: RuntimeStatus
  createdAt: string
  updatedAt: string
}

export type SignatureModule = {
  id: string
  key: ModuleKey
  name: string
  description: string
  category: ModuleCategory
  defaultEnabled: boolean
  availableForSectors: SectorKey[]
  createdAt: string
}

export type AgencyModule = {
  id: string
  agencyId: string
  moduleKey: ModuleKey
  enabled: boolean
  config?: Record<string, JsonValue>
  createdAt: string
  updatedAt: string
}

export type AgencySettings = {
  id: string
  agencyId: string
  theme: string
  tone: Tone
  visualStyle: VisualStyle
  fontStyle: string
  layoutIntensity: string
  ctaStyle: string
  emailReception: string
  notificationEmails: string[]
  settings: Record<string, JsonValue>
  createdAt: string
  updatedAt: string
}

export type DemoRequest = {
  id: string
  companyName: string
  sector: SectorKey
  city: string
  websiteUrl: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  painPoint: string
  mainObjective: string
  commercialAngle: string
  selectedModules: ModuleKey[]
  visualStyle: VisualStyle
  notes: string
  status: DemoRequestStatus
  generatedAgencyId: string
  generatedPromptId: string
  createdAt: string
  updatedAt: string
}

export type QuestionnaireAnswer = {
  id: string
  demoRequestId: string
  questionKey: string
  answerValue: JsonValue
  createdAt: string
}

export type GeneratedPrompt = {
  id: string
  agencyId: string
  demoRequestId: string
  promptType: PromptType
  content: string
  createdAt: string
}

export type Lead = {
  id: string
  agencyId: string
  moduleKey: ModuleKey
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'won'
  payload: Record<string, JsonValue>
  createdAt: string
  updatedAt: string
}

export type Appointment = {
  id: string
  agencyId: string
  leadId: string
  title: string
  date: string
  time: string
  status: 'requested' | 'confirmed' | 'cancelled' | 'done'
  payload: Record<string, JsonValue>
  createdAt: string
  updatedAt: string
}

export type Document = {
  id: string
  agencyId: string
  projectId?: string
  leadId?: string
  name: string
  type: string
  url: string
  visibleToClient: boolean
  createdAt: string
}

export type Project = {
  id: string
  agencyId: string
  clientId?: string
  title: string
  sector: SectorKey
  status: string
  progressStep: string
  payload: Record<string, JsonValue>
  createdAt: string
  updatedAt: string
}

export type Notification = {
  id: string
  agencyId: string
  userId?: string
  type: string
  title: string
  message: string
  read: boolean
  payload: Record<string, JsonValue>
  createdAt: string
}

export type AnalyticsEvent = {
  id: string
  agencyId: string
  eventType: string
  page: string
  moduleKey?: ModuleKey
  payload: Record<string, JsonValue>
  createdAt: string
}

export type InviteToken = {
  id: string
  agencyId: string
  token: string
  type: 'manager_invite' | 'agent_invite' | 'client_invite' | 'seller_invite'
  status: 'active' | 'used' | 'revoked' | 'expired'
  email: string
  createdAt: string
  expiresAt?: string
}
