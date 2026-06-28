import {
  getSignatureAgency,
  getSignatureAgencyModules,
  readSignatureDigitalState,
  updateSignatureAgency,
} from '../data/signatureDigitalStore'

type RuntimeChecklistItem = {
  key: string
  label: string
  done: boolean
  detail: string
}

export type RuntimeActivationResult = {
  ok: boolean
  agencyId: string
  runtimeStatus: 'ready' | 'blocked'
  checklist: RuntimeChecklistItem[]
}

const requiredRoutes = [
  '/api/core',
  '/api/admin',
  '/api/invites',
]

export function activateDemoRuntime(agencyId: string): RuntimeActivationResult {
  const state = readSignatureDigitalState()
  const agency = getSignatureAgency(agencyId)
  const modules = getSignatureAgencyModules(agencyId)
  const settings = state.agencySettings.find((item) => item.agencyId === agencyId)
  const hasClientSpace = modules.some((module) => module.moduleKey === 'client_space' && module.enabled)
  const hasProfessionalSpace = modules.some((module) => module.moduleKey === 'professional_space' && module.enabled)
  const checklist: RuntimeChecklistItem[] = [
    {
      key: 'agency_found',
      label: 'agency trouvee',
      done: Boolean(agency),
      detail: agency ? agency.name : 'Aucune agency ne correspond a cet id.',
    },
    {
      key: 'modules_loaded',
      label: 'modules charges',
      done: modules.length > 0,
      detail: `${modules.filter((module) => module.enabled).length} module(s) actif(s)`,
    },
    {
      key: 'settings_present',
      label: 'settings presents',
      done: Boolean(settings),
      detail: settings?.visualStyle ?? 'Settings manquants.',
    },
    {
      key: 'email_reception',
      label: 'emails de reception presents',
      done: Boolean(agency?.emailReception || agency?.notificationEmails.length),
      detail: agency?.emailReception || agency?.notificationEmails.join(', ') || 'Aucun email de reception configure.',
    },
    {
      key: 'api_routes',
      label: 'routes API disponibles',
      done: requiredRoutes.length === 3,
      detail: requiredRoutes.join(', '),
    },
    {
      key: 'forms_connectable',
      label: 'formulaires branchables',
      done: modules.some((module) => module.enabled && ['lead_form', 'callback_request', 'appointment', 'qualification_form'].includes(module.moduleKey)),
      detail: 'Connecteur front Signature Digital disponible.',
    },
    {
      key: 'client_space',
      label: 'espace client disponible si module actif',
      done: !hasClientSpace || modules.some((module) => module.moduleKey === 'client_space' && module.enabled),
      detail: hasClientSpace ? 'client_space actif.' : 'client_space non requis.',
    },
    {
      key: 'professional_space',
      label: 'espace professionnel disponible si module actif',
      done: !hasProfessionalSpace || modules.some((module) => module.moduleKey === 'professional_space' && module.enabled),
      detail: hasProfessionalSpace ? 'professional_space actif.' : 'professional_space non requis.',
    },
    {
      key: 'invites_available',
      label: 'invitations disponibles si espace actif',
      done: !(hasClientSpace || hasProfessionalSpace) || modules.some((module) => module.moduleKey === 'email_notifications' && module.enabled),
      detail: 'Les invitations passent par invite_tokens et /api/invites.',
    },
  ]
  const ok = checklist.every((item) => item.done)
  const runtimeStatus = ok ? 'ready' : 'blocked'

  if (agency) {
    updateSignatureAgency(agencyId, { runtimeStatus })
  }

  return {
    ok,
    agencyId,
    runtimeStatus,
    checklist,
  }
}
