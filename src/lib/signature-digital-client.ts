import {
  createSignatureAnalyticsEvent,
  createSignatureAppointment,
  createSignatureDocument,
  createSignatureInvite,
  createSignatureLead,
  createSignatureProject,
  getSignatureAgencyBySlug,
  getSignatureAgencyModules,
} from '../data/signatureDigitalStore'
import type { JsonValue, ModuleKey } from '../types/signature-digital'

type EnginePayload = Record<string, JsonValue>
type CoreAction =
  | 'createLead'
  | 'createCallbackRequest'
  | 'createAppointment'
  | 'createDocument'
  | 'createProject'
  | 'createNotification'
  | 'trackAnalyticsEvent'
  | 'getAgencyBySlug'
  | 'getAgencyModules'
  | 'checkModuleEnabled'

export type ApiResponse<Data = unknown> = {
  ok: boolean
  message?: string
  agencyId?: string
  moduleKey?: ModuleKey
  data?: Data
  agency?: Data
  modules?: Data
  enabled?: boolean
}

export function getAgencyBySlug(slug: string) {
  return postCore('getAgencyBySlug', { agencySlug: slug, payload: { slug } }, () => ({
    ok: true,
    agency: getSignatureAgencyBySlug(slug),
  }))
}

export function getAgencyModules(agencyId: string) {
  return postCore('getAgencyModules', { agencyId }, () => ({
    ok: true,
    agencyId,
    modules: getSignatureAgencyModules(agencyId),
  }))
}

export function isModuleEnabledForAgency(agencyId: string, moduleKey: ModuleKey) {
  return postCore('checkModuleEnabled', { agencyId, payload: { moduleKey } }, () => ({
    ok: true,
    agencyId,
    moduleKey,
    enabled: Boolean(getSignatureAgencyModules(agencyId).find((module) => module.moduleKey === moduleKey)?.enabled),
  }))
}

export function createLead(agencyId: string, payload: EnginePayload) {
  return postCore('createLead', { agencyId, payload }, () => ({
    ok: true,
    agencyId,
    data: createSignatureLead(agencyId, 'lead_form', payload),
  }))
}

export function createCallbackRequest(agencyId: string, payload: EnginePayload) {
  return postCore('createCallbackRequest', { agencyId, payload }, () => ({
    ok: true,
    agencyId,
    data: createSignatureLead(agencyId, 'callback_request', { ...payload, source: 'callback_request' }),
  }))
}

export function createAppointment(agencyId: string, payload: EnginePayload) {
  return postCore('createAppointment', { agencyId, payload }, () => ({
    ok: true,
    agencyId,
    data: createSignatureAppointment(agencyId, payload),
  }))
}

export function createDocumentRequest(agencyId: string, payload: EnginePayload) {
  return postCore('createDocument', { agencyId, payload }, () => ({
    ok: true,
    agencyId,
    data: createSignatureDocument(agencyId, payload),
  }))
}

export function createProject(agencyId: string, payload: EnginePayload) {
  return postCore('createProject', { agencyId, payload }, () => ({
    ok: true,
    agencyId,
    data: createSignatureProject(agencyId, payload),
  }))
}

export function createInvite(agencyId: string, payload: EnginePayload) {
  return postCore('createNotification', { agencyId, payload: { ...payload, type: 'invite_requested' } }, () => ({
    ok: true,
    agencyId,
    data: createSignatureInvite(agencyId, payload),
  }))
}

export function trackAnalyticsEvent(agencyId: string, event: EnginePayload) {
  return postCore('trackAnalyticsEvent', { agencyId, payload: event }, () => ({
    ok: true,
    agencyId,
    data: createSignatureAnalyticsEvent(agencyId, event),
  }))
}

async function postCore<Data>(
  action: CoreAction,
  body: { agencyId?: string; agencySlug?: string; payload?: EnginePayload },
  fallback: () => ApiResponse<Data>,
): Promise<ApiResponse<Data>> {
  try {
    const response = await fetch('/api/core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    })
    return await response.json() as ApiResponse<Data>
  } catch {
    return fallback()
  }
}
