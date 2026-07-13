import type { RealEstateProperty } from '../data/realEstateTemplate'

export type AgencyLifecycleBusinessStatus =
  | 'active'
  | 'paused'
  | 'archived'
  | 'deletion-requested'
  | 'deletion-scheduled'
  | 'deleted'
  | 'draft'
  | 'demo_ready'
  | 'sent'
  | 'validated'

export type AgencyLifecycleAction =
  | 'pause'
  | 'reactivate'
  | 'archive'
  | 'restore'
  | 'export'
  | 'deletion-request'
  | 'deletion-cancel'
  | 'deletion-execute'
  | 'status-change'

export type AgencyDeletionResourceStatus = 'local-deleted' | 'retained' | 'pending-external-cleanup' | 'not-found'

export type AgencyDeletionResourcePlan = {
  resource: 'agency' | 'project' | 'accounts' | 'invitations' | 'properties' | 'requests' | 'documents' | 'domain' | 'consents' | 'outbox' | 'stripe' | 'storage' | 'supabase'
  action: string
  status: AgencyDeletionResourceStatus
  detail: string
}

export type AgencyLifecycleAuditEntry = {
  id: string
  action: AgencyLifecycleAction
  actor: string
  timestamp: string
  reason?: string
  result: string
}

export type AgencyLifecycleExportEntry = {
  id: string
  exportedAt: string
  exportVersion: string
  actor: string
  scope: string[]
}

export type AgencyDeletionRequest = {
  requestedAt: string
  requestedBy: string
  scheduledDeletionAt: string
  confirmationValue: string
  reason?: string
  cancelledAt?: string
  cancelledBy?: string
}

export type AgencyLifecycleRetention = {
  deletionDelayDays: number
  minimumDeletionDelayDays: number
}

export type AgencyLifecycleState = {
  status: AgencyLifecycleBusinessStatus
  deletionRequest?: AgencyDeletionRequest
  retention: AgencyLifecycleRetention
  exportHistory: AgencyLifecycleExportEntry[]
  auditLog: AgencyLifecycleAuditEntry[]
}

export type AgencyExportPayload = {
  exportVersion: string
  exportedAt: string
  scope: string[]
  agency: unknown
  project?: unknown
  accounts: unknown[]
  invitations: unknown[]
  properties: RealEstateProperty[]
  requests: unknown[]
  documents: unknown[]
  domain: unknown
  compliance: unknown
  updateHistory: unknown[]
  lifecycle: AgencyLifecycleState
}

export const AGENCY_LIFECYCLE_EXPORT_VERSION = 'v1'
export const AGENCY_DELETION_DELAY_DAYS = 30
export const AGENCY_MIN_DELETION_DELAY_DAYS = 14

export function createDefaultAgencyLifecycleState(
  status: AgencyLifecycleBusinessStatus,
  existing?: Partial<AgencyLifecycleState>,
): AgencyLifecycleState {
  return {
    status: normalizeLifecycleStatus(existing?.status ?? status),
    deletionRequest: existing?.deletionRequest,
    retention: {
      deletionDelayDays: Math.max(
        existing?.retention?.deletionDelayDays ?? AGENCY_DELETION_DELAY_DAYS,
        existing?.retention?.minimumDeletionDelayDays ?? AGENCY_MIN_DELETION_DELAY_DAYS,
      ),
      minimumDeletionDelayDays: existing?.retention?.minimumDeletionDelayDays ?? AGENCY_MIN_DELETION_DELAY_DAYS,
    },
    exportHistory: existing?.exportHistory ?? [],
    auditLog: existing?.auditLog ?? [],
  }
}

export function appendAgencyLifecycleAudit(
  state: AgencyLifecycleState,
  action: AgencyLifecycleAction,
  actor: string,
  result: string,
  reason?: string,
): AgencyLifecycleState {
  const entry: AgencyLifecycleAuditEntry = {
    id: `agency-lifecycle-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    action,
    actor,
    timestamp: new Date().toISOString(),
    reason,
    result,
  }

  return {
    ...state,
    auditLog: [entry, ...state.auditLog].slice(0, 30),
  }
}

export function recordAgencyExport(state: AgencyLifecycleState, actor = 'admin'): AgencyLifecycleState {
  const exportedAt = new Date().toISOString()
  const exportEntry: AgencyLifecycleExportEntry = {
    id: `agency-export-${Date.now()}`,
    exportedAt,
    exportVersion: AGENCY_LIFECYCLE_EXPORT_VERSION,
    actor,
    scope: [
      'configuration',
      'visualBlueprint',
      'contactLegalIdentity',
      'modules',
      'properties',
      'accounts-sanitized',
      'requests',
      'documents-metadata',
      'domain',
      'compliance',
      'updateHistory',
    ],
  }

  return appendAgencyLifecycleAudit({
    ...state,
    exportHistory: [exportEntry, ...state.exportHistory].slice(0, 10),
  }, 'export', actor, 'Export agence genere.')
}

export function requestAgencyDeletion(
  state: AgencyLifecycleState,
  confirmationValue: string,
  actor = 'admin',
  reason?: string,
): AgencyLifecycleState {
  const now = new Date()
  const delayDays = Math.max(state.retention.deletionDelayDays, state.retention.minimumDeletionDelayDays)
  const scheduledDeletionAt = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000).toISOString()

  return appendAgencyLifecycleAudit({
    ...state,
    status: 'deletion-scheduled',
    deletionRequest: {
      requestedAt: now.toISOString(),
      requestedBy: actor,
      scheduledDeletionAt,
      confirmationValue,
      reason,
    },
  }, 'deletion-request', actor, `Suppression definitive planifiee au ${scheduledDeletionAt}.`, reason)
}

export function cancelAgencyDeletion(state: AgencyLifecycleState, actor = 'admin'): AgencyLifecycleState {
  const cancelledAt = new Date().toISOString()
  return appendAgencyLifecycleAudit({
    ...state,
    status: 'archived',
    deletionRequest: state.deletionRequest
      ? { ...state.deletionRequest, cancelledAt, cancelledBy: actor }
      : undefined,
  }, 'deletion-cancel', actor, 'Suppression definitive annulee.')
}

export function resolveAgencyDeletionPlan(input: {
  agencyExists: boolean
  projectExists: boolean
  hasCustomDomain: boolean
  hasStripeSnapshot: boolean
  hasAccounts: boolean
  hasInvitations: boolean
  hasOutbox: boolean
  hasConsents: boolean
}): AgencyDeletionResourcePlan[] {
  return [
    {
      resource: 'agency',
      action: 'Retirer la configuration agence locale.',
      status: input.agencyExists ? 'local-deleted' : 'not-found',
      detail: input.agencyExists ? 'Suppression locale possible.' : 'Agence absente.',
    },
    {
      resource: 'project',
      action: 'Conserver le projet commercial en statut coherent et retirer le lien agence.',
      status: input.projectExists ? 'retained' : 'not-found',
      detail: input.projectExists ? 'Projet conserve pour audit commercial.' : 'Aucun projet lie.',
    },
    {
      resource: 'accounts',
      action: 'Retirer les comptes locaux lies a agencyId.',
      status: input.hasAccounts ? 'local-deleted' : 'not-found',
      detail: 'Aucun mot de passe ne doit etre exporte.',
    },
    {
      resource: 'invitations',
      action: 'Retirer les invitations locales et liens actifs.',
      status: input.hasInvitations ? 'local-deleted' : 'not-found',
      detail: 'Les tokens actifs ne sont pas conserves dans l export.',
    },
    {
      resource: 'properties',
      action: 'Retirer les annonces locales rattachees a la configuration agence.',
      status: input.agencyExists ? 'local-deleted' : 'not-found',
      detail: 'Les annonces sont incluses dans l export prealable.',
    },
    {
      resource: 'domain',
      action: 'Desactiver localement le domaine personnalise.',
      status: input.hasCustomDomain ? 'pending-external-cleanup' : 'not-found',
      detail: 'DNS/Vercel/registrar non appeles dans cette PR.',
    },
    {
      resource: 'consents',
      action: 'Retirer les preuves locales de consentement rattachees.',
      status: input.hasConsents ? 'local-deleted' : 'not-found',
      detail: 'Les obligations legales serveur futures restent hors stockage local.',
    },
    {
      resource: 'outbox',
      action: 'Annuler/retirer les emails locaux lies a l agence.',
      status: input.hasOutbox ? 'local-deleted' : 'not-found',
      detail: 'Aucun email deja remis au fournisseur ne peut etre rappele localement.',
    },
    {
      resource: 'stripe',
      action: 'Verifier et resilier manuellement les ressources Stripe si necessaire.',
      status: input.hasStripeSnapshot ? 'pending-external-cleanup' : 'not-found',
      detail: 'Aucun appel Stripe dans cette PR.',
    },
    {
      resource: 'storage',
      action: 'Nettoyage fichiers futur.',
      status: 'pending-external-cleanup',
      detail: 'Aucun stockage fichier persistant externe n est supprime localement.',
    },
    {
      resource: 'supabase',
      action: 'Nettoyage backend futur.',
      status: 'pending-external-cleanup',
      detail: 'Aucune suppression Supabase automatique dans cette PR.',
    },
  ]
}

export function sanitizeAccountForExport(account: Record<string, unknown>) {
  const {
    password,
    invitationToken,
    invitationUrl,
    token,
    ...safe
  } = account
  void password
  void invitationToken
  void invitationUrl
  void token
  return safe
}

function normalizeLifecycleStatus(value: unknown): AgencyLifecycleBusinessStatus {
  const allowed: AgencyLifecycleBusinessStatus[] = [
    'active',
    'paused',
    'archived',
    'deletion-requested',
    'deletion-scheduled',
    'deleted',
    'draft',
    'demo_ready',
    'sent',
    'validated',
  ]
  return allowed.includes(value as AgencyLifecycleBusinessStatus) ? value as AgencyLifecycleBusinessStatus : 'draft'
}
