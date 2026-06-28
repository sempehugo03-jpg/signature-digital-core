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

const agencies = [
  {
    id: 'agency_client-a-immobilier_20260628190000',
    slug: 'client-a-immobilier-immobilier-tarbes',
    name: 'Client A Immobilier',
    sector: 'immobilier',
    city: 'Tarbes',
    status: 'demo',
    modules: { estimation: true, visit_request: true, seller_space: true, documents: true, callback_request: true, appointment: false, payment: false },
  },
  {
    id: 'agency_client-b-avocat_20260628190000',
    slug: 'client-b-avocat-avocat-pau',
    name: 'Client B Avocat',
    sector: 'avocat',
    city: 'Pau',
    status: 'demo',
    modules: { appointment: true, document_upload: true, client_space: true, qualification_form: true, estimation: false, seller_space: false },
  },
]

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, message: 'Method not allowed.' })
    return
  }

  const body = await readBody(request)
  const action = body.action
  const agency = body.agencyId ? agencies.find((item) => item.id === body.agencyId) : undefined

  if (action === 'listAgencies') {
    response.status(200).json({ ok: true, agencies })
    return
  }

  if (action === 'listModules') {
    response.status(200).json({ ok: true, modules })
    return
  }

  if (action === 'getAgency') {
    response.status(agency ? 200 : 404).json(agency ? { ok: true, agency } : { ok: false, message: 'Agence introuvable.' })
    return
  }

  if (['generateLovablePrompt', 'activateDemoRuntime', 'enableModule', 'disableModule'].includes(action) && !agency) {
    response.status(404).json({ ok: false, message: 'Agence introuvable.' })
    return
  }

  if (action === 'generateLovablePrompt') {
    response.status(200).json({ ok: true, agencyId: agency.id, prompt: generatePrompt(agency) })
    return
  }

  if (action === 'activateDemoRuntime') {
    response.status(200).json({ ok: true, agencyId: agency.id, runtimeStatus: 'ready', checklist: buildRuntimeChecklist(agency) })
    return
  }

  if (action === 'enableModule' || action === 'disableModule') {
    response.status(200).json({
      ok: true,
      agencyId: agency.id,
      moduleKey: body.moduleKey,
      enabled: action === 'enableModule',
      message: 'Configuration module recue par /api/admin.',
    })
    return
  }

  if (['createAgency', 'updateAgency', 'createDemoRequest', 'updateDemoRequest', 'generateConfiguration'].includes(action)) {
    response.status(200).json({ ok: true, action, data: body.payload ?? {}, message: 'Action admin regroupee dans /api/admin.' })
    return
  }

  response.status(400).json({ ok: false, message: `Action admin inconnue : ${action}.` })
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

function generatePrompt(agency) {
  return [
    `Cree une demo Signature Digital premium pour ${agency.name}.`,
    `Secteur : ${agency.sector}`,
    `Ville : ${agency.city}`,
    'Modules actives :',
    ...Object.entries(agency.modules).filter(([, enabled]) => enabled).map(([key]) => `- ${key}`),
    'Modules desactives :',
    ...Object.entries(agency.modules).filter(([, enabled]) => !enabled).map(([key]) => `- ${key}`),
    'La demo doit etre visuellement personnalisee, mais elle doit respecter le moteur Signature Digital : seuls les modules actives doivent apparaitre. Les modules desactives ne doivent pas etre visibles.',
  ].join('\n')
}

function buildRuntimeChecklist(agency) {
  return [
    { key: 'agency_found', label: 'agency trouvee', done: true, detail: agency.name },
    { key: 'modules_loaded', label: 'modules charges', done: true, detail: Object.keys(agency.modules).join(', ') },
    { key: 'api_routes', label: 'routes API disponibles', done: true, detail: '/api/core, /api/admin, /api/invites' },
    { key: 'forms_connectable', label: 'formulaires branchables', done: true, detail: 'Les formulaires Lovable peuvent appeler /api/core.' },
  ]
}
