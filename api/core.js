const moduleLabels = {
  lead_form: 'formulaire de contact',
  callback_request: 'demande de rappel',
  appointment: 'prise de rendez-vous',
  estimation: 'demande d estimation',
  documents: 'documents',
  document_upload: 'depot de documents',
  notifications: 'notifications',
  analytics: 'analytics',
  project_tracking: 'suivi de projet',
  visit_request: 'demande de visite',
  seller_space: 'espace vendeur',
  qualification_form: 'formulaire de qualification',
}

const demoAgencies = [
  {
    id: 'agency_client-a-immobilier_20260628190000',
    slug: 'client-a-immobilier-immobilier-tarbes',
    name: 'Client A Immobilier',
    status: 'demo',
    modules: {
      estimation: true,
      visit_request: true,
      seller_space: true,
      documents: true,
      callback_request: true,
      lead_form: true,
      appointment: false,
      payment: false,
      analytics: true,
    },
  },
  {
    id: 'agency_client-b-avocat_20260628190000',
    slug: 'client-b-avocat-avocat-pau',
    name: 'Client B Avocat',
    status: 'demo',
    modules: {
      appointment: true,
      document_upload: true,
      client_space: true,
      qualification_form: true,
      lead_form: true,
      notifications: true,
      analytics: true,
      estimation: false,
      seller_space: false,
    },
  },
  {
    id: 'citya-montauban',
    slug: 'citya-montauban',
    name: 'Citya Montauban',
    status: 'demo',
    modules: {
      estimation: true,
      visit_request: true,
      seller_space: true,
      documents: true,
      callback_request: true,
      lead_form: true,
      appointment: true,
      project_tracking: true,
      notifications: true,
      analytics: true,
      payment: false,
    },
  },
]

const actionModules = {
  createLead: 'lead_form',
  createCallbackRequest: 'callback_request',
  createAppointment: 'appointment',
  createDocument: 'documents',
  createProject: 'project_tracking',
  createNotification: 'notifications',
  trackAnalyticsEvent: 'analytics',
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, message: 'Method not allowed.' })
    return
  }

  const body = await readBody(request)
  const action = body.action
  const payload = body.payload ?? {}

  if (!action) {
    response.status(400).json({ ok: false, message: 'Action requise.' })
    return
  }

  if (action === 'getAgencyBySlug') {
    const agency = findAgencyBySlug(body.agencySlug || payload.slug)
    response.status(agency ? 200 : 404).json(agency ? { ok: true, agency } : { ok: false, message: 'Agence introuvable.' })
    return
  }

  if (action === 'getAgencyModules') {
    const agency = resolveAgency(body)
    if (!agency) {
      response.status(404).json({ ok: false, message: 'Agence introuvable.' })
      return
    }
    response.status(200).json({ ok: true, agencyId: agency.id, modules: agency.modules })
    return
  }

  if (action === 'checkModuleEnabled') {
    const agency = resolveAgency(body)
    const moduleKey = body.moduleKey || payload.moduleKey
    if (!agency) {
      response.status(404).json({ ok: false, message: 'Agence introuvable.' })
      return
    }
    response.status(200).json({ ok: true, agencyId: agency.id, moduleKey, enabled: isModuleEnabled(agency, moduleKey) })
    return
  }

  const agency = resolveAgency(body)
  if (!agency) {
    response.status(404).json({ ok: false, message: 'Agence introuvable.' })
    return
  }

  if (agency.status === 'disabled') {
    response.status(403).json({ ok: false, agencyId: agency.id, message: 'Client desactive.' })
    return
  }

  const moduleKey = payload.moduleKey || actionModules[action]
  if (moduleKey && !isModuleEnabled(agency, moduleKey)) {
    response.status(403).json({
      ok: false,
      agencyId: agency.id,
      moduleKey,
      message: `Module ${moduleLabels[moduleKey] || moduleKey} desactive pour ce client.`,
    })
    return
  }

  if (!actionModules[action]) {
    response.status(400).json({ ok: false, message: `Action core inconnue : ${action}.` })
    return
  }

  const now = new Date().toISOString()
  response.status(200).json({
    ok: true,
    action,
    agencyId: agency.id,
    moduleKey,
    data: {
      id: `${action}_${Date.now()}`,
      agencyId: agency.id,
      ...payload,
      createdAt: now,
    },
  })
}

async function readBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body
  try {
    return JSON.parse(request.body)
  } catch {
    return {}
  }
}

function resolveAgency(body) {
  if (body.agencyId) return demoAgencies.find((agency) => agency.id === body.agencyId)
  if (body.agencySlug) return findAgencyBySlug(body.agencySlug)
  return undefined
}

function findAgencyBySlug(slug) {
  if (!slug) return undefined
  return demoAgencies.find((agency) => agency.slug === slug)
}

function isModuleEnabled(agency, moduleKey) {
  if (!moduleKey) return true
  return Boolean(agency.modules?.[moduleKey])
}
