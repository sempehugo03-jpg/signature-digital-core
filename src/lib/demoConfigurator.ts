import { applyModuleConfiguration, getDefaultModules, normalizeSector } from './modules'
import type {
  Agency,
  AgencyModule,
  AgencySettings,
  DemoRequest,
  GeneratedPrompt,
  JsonValue,
  ModuleKey,
  QuestionnaireAnswer,
  SectorKey,
  VisualStyle,
} from '../types/signature-digital'

export type QuestionnaireInput = {
  companyName: string
  sector: string
  city: string
  websiteUrl: string
  hasWebsite?: boolean
  businessDescription?: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  pains: string[]
  goals: string[]
  features: string[]
  visualStyle: string
  notes: string
}

export type GeneratedDemoConfiguration = {
  agency: Agency
  settings: AgencySettings
  modules: AgencyModule[]
  demoRequest: DemoRequest
  questionnaireAnswers: QuestionnaireAnswer[]
  lovablePrompt: GeneratedPrompt
}

type ModuleConfiguration = Partial<Record<ModuleKey, boolean>>

const sectorModules: Record<SectorKey, ModuleKey[]> = {
  immobilier: ['estimation', 'seller_space', 'visit_request', 'documents', 'callback_request', 'premium_presentation', 'reports'],
  avocat: ['appointment', 'document_upload', 'client_space', 'qualification_form', 'notifications', 'premium_presentation'],
  notaire: ['appointment', 'document_upload', 'client_space', 'qualification_form', 'documents', 'premium_presentation'],
  architecte: ['project_tracking', 'appointment', 'documents', 'client_space', 'premium_presentation', 'reports'],
  clinique: ['appointment', 'qualification_form', 'client_space', 'notifications', 'premium_presentation', 'callback_request'],
  automobile: ['lead_form', 'appointment', 'premium_presentation', 'callback_request', 'services_pages'],
  constructeur: ['project_tracking', 'quote_request', 'documents', 'client_space', 'premium_presentation', 'reports'],
  patrimoine: ['appointment', 'client_space', 'documents', 'premium_presentation', 'reports', 'notifications'],
  autre: ['lead_form', 'callback_request', 'services_pages', 'premium_presentation', 'email_notifications'],
}

const featureModuleMap: Array<{ match: string[]; modules: ModuleKey[] }> = [
  { match: ['formulaire'], modules: ['lead_form'] },
  { match: ['rappel'], modules: ['callback_request'] },
  { match: ['rendez-vous', 'rdv'], modules: ['appointment'] },
  { match: ['espace client'], modules: ['client_space'] },
  { match: ['espace professionnel'], modules: ['professional_space'] },
  { match: ['suivi de dossier'], modules: ['project_tracking'] },
  { match: ['documents'], modules: ['documents', 'document_upload'] },
  { match: ['estimation'], modules: ['estimation'] },
  { match: ['paiement'], modules: ['payment'] },
  { match: ['pages services'], modules: ['services_pages'] },
  { match: ['presentation premium', 'presentation'], modules: ['premium_presentation'] },
  { match: ['notifications'], modules: ['notifications', 'email_notifications'] },
  { match: ['compte-rendu', 'compte rendu'], modules: ['reports'] },
]

export function createDemoFromQuestionnaire(answers: QuestionnaireInput): GeneratedDemoConfiguration {
  const now = new Date().toISOString()
  const sector = normalizeSector(answers.sector)
  const agencyId = createStableId('agency', answers.companyName, now)
  const demoRequestId = createStableId('demo_request', answers.companyName, now)
  const generatedPromptId = createStableId('prompt', answers.companyName, now)
  const commercialAngle = buildCommercialAngle(answers.companyName, answers.pains, answers.goals)
  const moduleConfig = buildModuleConfiguration(answers, sector)
  const modules = applyModuleConfiguration(agencyId, moduleConfig)
  const visualStyle = normalizeVisualStyle(answers.visualStyle)
  const agency: Agency = {
    id: agencyId,
    slug: slugify(`${answers.companyName}-${sector}-${answers.city}`),
    name: answers.companyName,
    sector,
    city: answers.city,
    websiteUrl: answers.hasWebsite === false ? '' : answers.websiteUrl,
    logoUrl: '',
    primaryColor: '#7C3AED',
    secondaryColor: '#0F172A',
    status: 'demo',
    commercialAngle,
    painPoint: answers.pains[0] ?? '',
    mainObjective: answers.goals[0] ?? '',
    emailReception: answers.contactEmail,
    notificationEmails: [answers.contactEmail].filter(Boolean),
    settings: {
      hasWebsite: answers.hasWebsite ?? Boolean(answers.websiteUrl),
      businessDescription: answers.businessDescription ?? '',
      visualStyle,
    },
    runtimeStatus: 'not_ready',
    createdAt: now,
    updatedAt: now,
  }
  const settings: AgencySettings = {
    id: createStableId('settings', answers.companyName, now),
    agencyId,
    theme: visualStyle === 'tres_haut_de_gamme' || visualStyle === 'luxe_sombre' ? 'luxury' : 'premium',
    tone: visualStyle === 'institutionnel' ? 'institutionnel' : visualStyle === 'tres_haut_de_gamme' ? 'haut_de_gamme' : 'premium',
    visualStyle,
    fontStyle: 'moderne',
    layoutIntensity: visualStyle === 'clair_minimal' ? 'minimal' : 'immersive',
    ctaStyle: sector === 'avocat' || sector === 'notaire' ? 'rappel_conseiller' : 'analyse_personnalisee',
    emailReception: answers.contactEmail,
    notificationEmails: [answers.contactEmail].filter(Boolean),
    settings: {
      hasWebsite: answers.hasWebsite ?? Boolean(answers.websiteUrl),
      businessDescription: answers.businessDescription ?? '',
      sourceLabel: answers.hasWebsite === false ? 'activite' : 'site_actuel',
    },
    createdAt: now,
    updatedAt: now,
  }
  const demoRequest: DemoRequest = {
    id: demoRequestId,
    companyName: answers.companyName,
    sector,
    city: answers.city,
    websiteUrl: answers.hasWebsite === false ? '' : answers.websiteUrl,
    contactFirstName: answers.contactFirstName,
    contactLastName: answers.contactLastName,
    contactEmail: answers.contactEmail,
    contactPhone: answers.contactPhone,
    painPoint: answers.pains[0] ?? '',
    mainObjective: answers.goals[0] ?? '',
    commercialAngle,
    selectedModules: modules.filter((module) => module.enabled).map((module) => module.moduleKey),
    visualStyle,
    notes: answers.notes,
    status: 'demo_generated',
    generatedAgencyId: agencyId,
    generatedPromptId,
    createdAt: now,
    updatedAt: now,
  }
  const questionnaireAnswers = buildQuestionnaireAnswers(demoRequestId, answers, now)
  const promptContent = generateLovablePromptFromConfig({ agency, settings, modules, demoRequest, answers })
  const lovablePrompt: GeneratedPrompt = {
    id: generatedPromptId,
    agencyId,
    demoRequestId,
    promptType: 'lovable_demo',
    content: promptContent,
    createdAt: now,
  }

  return {
    agency,
    settings,
    modules,
    demoRequest,
    questionnaireAnswers,
    lovablePrompt,
  }
}

export function generateLovablePromptFromConfig(config: {
  agency: Agency
  settings: AgencySettings
  modules: AgencyModule[]
  demoRequest: DemoRequest
  answers?: QuestionnaireInput
}) {
  const enabledModules = config.modules.filter((module) => module.enabled).map((module) => module.moduleKey)
  const disabledModules = config.modules.filter((module) => !module.enabled).map((module) => module.moduleKey)
  const sourceLine = config.agency.websiteUrl
    ? `Site actuel : ${config.agency.websiteUrl}`
    : `Activite sans site existant : ${String(config.settings.settings.businessDescription ?? 'a decrire dans la demo')}`

  return [
    `Cree une demo Signature Digital premium pour ${config.agency.name}.`,
    '',
    'Contexte entreprise :',
    `- Nom entreprise : ${config.agency.name}`,
    `- Secteur : ${config.agency.sector}`,
    `- Ville : ${config.agency.city}`,
    `- ${sourceLine}`,
    `- Douleur principale : ${config.demoRequest.painPoint}`,
    `- Objectif principal : ${config.demoRequest.mainObjective}`,
    `- Angle commercial : ${config.agency.commercialAngle}`,
    `- Style visuel : ${config.settings.visualStyle}`,
    `- Ton editorial : ${config.settings.tone}`,
    '',
    'Modules actives a faire apparaitre :',
    formatModuleList(enabledModules),
    '',
    'Modules desactives a ne pas afficher :',
    formatModuleList(disabledModules),
    '',
    'Structure attendue :',
    '- hero clair avec promesse adaptee au secteur',
    '- preuve de comprehension de la douleur client',
    '- presentation premium des services ou du parcours',
    '- modules actives visibles uniquement si presents dans la configuration',
    '- CTA principal adapte au secteur et au style',
    '- experience mobile-first, fluide, sombre premium si le style le demande',
    '',
    'Contraintes Signature Digital :',
    'La demo doit etre visuellement personnalisee, mais elle doit respecter le moteur Signature Digital : seuls les modules actives doivent apparaitre. Les modules desactives ne doivent pas etre visibles.',
    'Ne pas montrer de modules morts. Ne pas afficher de fonctionnalite si elle est desactivee.',
    'Ne pas mentionner les outils internes, le code, les bases de donnees ou les workflows techniques.',
  ].join('\n')
}

export function seedDemoAgencyFromConfig(config: GeneratedDemoConfiguration) {
  const createdAt = new Date().toISOString()
  const basePayload = {
    agencyId: config.agency.id,
    sector: config.agency.sector,
    generatedFrom: config.demoRequest.id,
  }

  if (config.agency.sector === 'immobilier') {
    return {
      projects: [
        {
          title: 'Appartement premium en centre-ville',
          status: 'demo',
          progressStep: 'visites',
          payload: { ...basePayload, seller: 'Vendeur demo', estimate: '420000 EUR' },
        },
      ],
      documents: ['Mandat', 'Diagnostics', 'Compte rendu de visite'],
      leads: ['Demande estimation', 'Demande visite'],
      createdAt,
    }
  }

  if (config.agency.sector === 'avocat') {
    return {
      projects: [
        {
          title: 'Dossier client confidentiel',
          status: 'demo',
          progressStep: 'qualification',
          payload: { ...basePayload, appointment: 'Rendez-vous initial' },
        },
      ],
      documents: ['Pieces justificatives', 'Convention demo'],
      leads: ['Demande de rendez-vous'],
      createdAt,
    }
  }

  if (config.agency.sector === 'architecte') {
    return {
      projects: [
        {
          title: 'Projet de renovation premium',
          status: 'demo',
          progressStep: 'avant-projet',
          payload: { ...basePayload, report: 'Compte rendu chantier demo' },
        },
      ],
      documents: ['Plans', 'Compte rendu', 'Planning'],
      leads: ['Demande de consultation'],
      createdAt,
    }
  }

  if (config.agency.sector === 'automobile') {
    return {
      projects: [
        {
          title: 'Vehicule premium en preparation',
          status: 'demo',
          progressStep: 'essai',
          payload: { ...basePayload, testDrive: 'Demande essai' },
        },
      ],
      documents: ['Fiche vehicule', 'Garantie'],
      leads: ['Demande essai', 'Demande rappel'],
      createdAt,
    }
  }

  return {
    projects: [
      {
        title: `Experience demo ${config.agency.name}`,
        status: 'demo',
        progressStep: 'analyse',
        payload: basePayload,
      },
    ],
    documents: ['Brief demo', 'Compte rendu'],
    leads: ['Demande entrante'],
    createdAt,
  }
}

function buildModuleConfiguration(answers: QuestionnaireInput, sector: SectorKey): ModuleConfiguration {
  const config: ModuleConfiguration = {}

  getDefaultModules().forEach((module) => {
    config[module.key] = module.defaultEnabled
  })

  sectorModules[sector].forEach((moduleKey) => {
    config[moduleKey] = true
  })

  answers.goals.forEach((goal) => {
    const value = normalizeText(goal)
    if (value.includes('premium') || value.includes('haut de gamme')) {
      config.premium_presentation = true
      config.reports = true
      config.client_space = true
      config.notifications = true
    }
    if (value.includes('contact')) config.lead_form = true
    if (value.includes('credib')) config.premium_presentation = true
    if (value.includes('espace client')) config.client_space = true
    if (value.includes('differencier')) config.premium_presentation = true
  })

  answers.pains.forEach((pain) => {
    const value = normalizeText(pain)
    if (value.includes('comprennent pas assez vite') || value.includes('valeur')) {
      config.premium_presentation = true
      config.services_pages = true
      config.lead_form = true
    }
    if (value.includes('demandes')) config.lead_form = true
    if (value.includes('rassurer')) {
      config.client_space = true
      config.notifications = true
      config.premium_presentation = true
    }
    if (value.includes('premium')) config.premium_presentation = true
  })

  answers.features.forEach((feature) => {
    const value = normalizeText(feature)
    featureModuleMap.forEach((mapping) => {
      if (mapping.match.some((match) => value.includes(match))) {
        mapping.modules.forEach((moduleKey) => {
          config[moduleKey] = true
        })
      }
    })
  })

  if (sector === 'immobilier') {
    config.payment = false
  }
  if (sector === 'avocat') {
    config.estimation = false
    config.seller_space = false
    config.visit_request = false
  }

  return config
}

function buildQuestionnaireAnswers(demoRequestId: string, answers: QuestionnaireInput, createdAt: string): QuestionnaireAnswer[] {
  const entries: Array<[string, JsonValue]> = [
    ['companyName', answers.companyName],
    ['sector', answers.sector],
    ['city', answers.city],
    ['websiteUrl', answers.websiteUrl],
    ['hasWebsite', answers.hasWebsite ?? Boolean(answers.websiteUrl)],
    ['businessDescription', answers.businessDescription ?? ''],
    ['pains', answers.pains],
    ['goals', answers.goals],
    ['features', answers.features],
    ['visualStyle', answers.visualStyle],
    ['notes', answers.notes],
  ]

  return entries.map(([questionKey, answerValue]) => ({
    id: createStableId('answer', `${demoRequestId}-${questionKey}`, createdAt),
    demoRequestId,
    questionKey,
    answerValue,
    createdAt,
  }))
}

function buildCommercialAngle(companyName: string, pains: string[], goals: string[]) {
  const pain = pains[0] || 'clarifier la valeur percue'
  const goal = goals[0] || 'renforcer la confiance avant le premier contact'

  return `Montrer pourquoi ${companyName} merite la confiance avant meme le premier contact, en repondant a "${pain}" pour atteindre "${goal}".`
}

function normalizeVisualStyle(style: string): VisualStyle {
  const value = normalizeText(style)
  if (value.includes('luxe')) return 'luxe_sombre'
  if (value.includes('clair')) return 'clair_minimal'
  if (value.includes('institutionnel')) return 'institutionnel'
  if (value.includes('haut de gamme')) return 'tres_haut_de_gamme'
  if (value.includes('fluide')) return 'moderne_fluide'

  return 'premium_sobre'
}

function formatModuleList(moduleKeys: ModuleKey[]) {
  if (moduleKeys.length === 0) return '- Aucun'

  return moduleKeys.map((moduleKey) => `- ${moduleKey}`).join('\n')
}

function createStableId(prefix: string, source: string, now: string) {
  return `${prefix}_${slugify(source).slice(0, 32)}_${now.replace(/\D/g, '').slice(0, 14)}`
}

function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'signature-digital'
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
