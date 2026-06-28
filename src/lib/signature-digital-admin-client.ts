import type { ModuleKey } from '../types/signature-digital'

type AdminAction =
  | 'createAgency'
  | 'updateAgency'
  | 'listAgencies'
  | 'getAgency'
  | 'createDemoRequest'
  | 'updateDemoRequest'
  | 'generateConfiguration'
  | 'generateLovablePrompt'
  | 'activateDemoRuntime'
  | 'enableModule'
  | 'disableModule'
  | 'listModules'

export type AdminApiResponse<Data = unknown> = {
  ok: boolean
  message?: string
  agencyId?: string
  data?: Data
  prompt?: string
  checklist?: Array<{ key: string; label: string; done: boolean; detail: string }>
  runtimeStatus?: 'ready' | 'blocked'
}

export function postAdmin<Data = unknown>(
  action: AdminAction,
  body: { agencyId?: string; moduleKey?: ModuleKey; payload?: Record<string, unknown> } = {},
) {
  return fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  }).then((response) => response.json() as Promise<AdminApiResponse<Data>>)
}

export function generateLovablePromptAdmin(agencyId: string) {
  return postAdmin('generateLovablePrompt', { agencyId })
}

export function activateDemoRuntimeAdmin(agencyId: string) {
  return postAdmin('activateDemoRuntime', { agencyId })
}

export function setModuleEnabledAdmin(agencyId: string, moduleKey: ModuleKey, enabled: boolean) {
  return postAdmin(enabled ? 'enableModule' : 'disableModule', { agencyId, moduleKey })
}
