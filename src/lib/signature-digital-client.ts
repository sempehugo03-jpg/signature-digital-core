import {
  createSignatureAnalyticsEvent,
  createSignatureAppointment,
  createSignatureDocument,
  createSignatureInvite,
  createSignatureLead,
  createSignatureProject,
  getSignatureAgency,
  getSignatureAgencyBySlug,
  getSignatureAgencyModules,
} from '../data/signatureDigitalStore'
import type { Agency, JsonValue, ModuleKey } from '../types/signature-digital'

type EnginePayload = Record<string, JsonValue>
type EngineResult<Data> = {
  ok: boolean
  agencyId: string
  moduleKey?: ModuleKey
  data?: Data
  error?: string
}

export function getAgencyBySlug(slug: string) {
  return getSignatureAgencyBySlug(slug)
}

export { getSignatureAgencyModules as getAgencyModules }

export function isModuleEnabledForAgency(agencyId: string, moduleKey: ModuleKey) {
  return Boolean(getSignatureAgencyModules(agencyId).find((module) => module.moduleKey === moduleKey)?.enabled)
}

export function createLead(agencyId: string, payload: EnginePayload) {
  return withEnabledModule(agencyId, 'lead_form', () => createSignatureLead(agencyId, 'lead_form', payload))
}

export function createCallbackRequest(agencyId: string, payload: EnginePayload) {
  return withEnabledModule(agencyId, 'callback_request', () => createSignatureLead(agencyId, 'callback_request', {
    ...payload,
    source: 'callback_request',
  }))
}

export function createAppointment(agencyId: string, payload: EnginePayload) {
  return withEnabledModule(agencyId, 'appointment', () => createSignatureAppointment(agencyId, payload))
}

export function createDocumentRequest(agencyId: string, payload: EnginePayload) {
  return withEnabledModule(agencyId, 'document_upload', () => createSignatureDocument(agencyId, payload))
}

export function createProject(agencyId: string, payload: EnginePayload) {
  return withEnabledModule(agencyId, 'project_tracking', () => createSignatureProject(agencyId, payload))
}

export function createInvite(agencyId: string, payload: EnginePayload) {
  return withEnabledModule(agencyId, resolveInviteModule(agencyId), () => createSignatureInvite(agencyId, payload))
}

export function trackAnalyticsEvent(agencyId: string, event: EnginePayload) {
  return withEnabledModule(agencyId, 'analytics', () => createSignatureAnalyticsEvent(agencyId, event), true)
}

function withEnabledModule<Data>(
  agencyId: string,
  moduleKey: ModuleKey,
  createData: () => Data,
  allowIfModuleMissing = false,
): EngineResult<Data> {
  const agency = getSignatureAgency(agencyId)
  const agencyError = validateAgency(agency, agencyId)
  if (agencyError) return agencyError

  if (!allowIfModuleMissing && !isModuleEnabledForAgency(agencyId, moduleKey)) {
    return {
      ok: false,
      agencyId,
      moduleKey,
      error: `Module ${moduleKey} desactive pour ce client.`,
    }
  }

  return {
    ok: true,
    agencyId,
    moduleKey,
    data: createData(),
  }
}

function validateAgency(agency: Agency | undefined, agencyId: string): EngineResult<never> | undefined {
  if (!agency) {
    return {
      ok: false,
      agencyId,
      error: 'Agence introuvable.',
    }
  }

  if (agency.status === 'disabled') {
    return {
      ok: false,
      agencyId,
      error: 'Client desactive.',
    }
  }

  return undefined
}

function resolveInviteModule(agencyId: string): ModuleKey {
  if (isModuleEnabledForAgency(agencyId, 'client_space')) return 'client_space'
  if (isModuleEnabledForAgency(agencyId, 'professional_space')) return 'professional_space'

  return 'email_notifications'
}
