const modules = [
  'lead_form',
  'callback_request',
  'appointment',
  'client_space',
  'professional_space',
  'documents',
  'document_upload',
  'estimation',
  'payment',
  'services_pages',
  'premium_presentation',
  'notifications',
  'reports',
  'analytics',
  'project_tracking',
  'visit_request',
  'seller_space',
  'buyer_space',
  'qualification_form',
  'quote_request',
  'demo_preview',
  'email_notifications',
]

const moduleLabels = {
  lead_form: 'formulaire de contact',
  callback_request: 'demande de rappel',
  appointment: 'prise de rendez-vous',
  client_space: 'espace client',
  professional_space: 'espace professionnel',
  documents: 'documents',
  document_upload: 'depot de documents',
  estimation: 'estimation',
  payment: 'paiement',
  services_pages: 'pages services',
  premium_presentation: 'presentation premium',
  notifications: 'notifications',
  reports: 'comptes rendus',
  analytics: 'analytics',
  project_tracking: 'suivi de projet',
  visit_request: 'demande de visite',
  seller_space: 'espace vendeur',
  buyer_space: 'espace acheteur',
  qualification_form: 'formulaire de qualification',
  quote_request: 'demande de devis',
  demo_preview: 'preview de demo',
  email_notifications: 'emails automatiques',
}

export function createEngineHandler({ resource, requiredModule = '' }) {
  return async function handler(request, response) {
    const payload = await readPayload(request)
    const agencyId = payload.agencyId || request.query?.agencyId

    if (!agencyId) {
      response.status(400).json({
        ok: false,
        resource,
        error: 'agencyId requis.',
      })
      return
    }

    const moduleKey = payload.moduleKey || requiredModule
    if (moduleKey && !isModuleEnabled(payload, moduleKey)) {
      response.status(403).json({
        ok: false,
        resource,
        agencyId,
        moduleKey,
        error: `Module ${moduleLabels[moduleKey] || moduleKey} desactive pour ce client.`,
      })
      return
    }

    response.status(200).json({
      ok: true,
      resource,
      agencyId,
      moduleKey,
      mode: 'signature-digital-engine-simulated',
      data: request.method === 'GET' ? [] : payload,
    })
  }
}

export function listModulesHandler(_request, response) {
  response.status(200).json({
    ok: true,
    modules,
  })
}

async function readPayload(request) {
  if (request.method === 'GET') return {}
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body

  try {
    return JSON.parse(request.body)
  } catch {
    return {}
  }
}

function isModuleEnabled(payload, moduleKey) {
  if (!moduleKey) return true

  if (Array.isArray(payload.disabledModules) && payload.disabledModules.includes(moduleKey)) {
    return false
  }

  if (Array.isArray(payload.enabledModules)) {
    return payload.enabledModules.includes(moduleKey)
  }

  if (payload.modules && Object.prototype.hasOwnProperty.call(payload.modules, moduleKey)) {
    return Boolean(payload.modules[moduleKey])
  }

  return true
}
