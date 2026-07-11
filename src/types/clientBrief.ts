export const clientBriefPerceptions = [
  'trust',
  'premium',
  'human',
  'expert',
  'modern',
  'transparent',
] as const

export type ClientBriefPerception = (typeof clientBriefPerceptions)[number]

export const clientBriefDesiredOutcomes = [
  'generate-estimation-leads',
  'improve-property-presentation',
  'increase-visit-requests',
  'provide-seller-tracking',
  'centralize-documents-and-reports',
  'improve-team-workflow',
] as const

export type ClientBriefDesiredOutcome = (typeof clientBriefDesiredOutcomes)[number]

export type ClientBrief = {
  agency: {
    companyName: string
    city: string
    area: string
    hasWebsite: boolean
    currentWebsite: string
    businessDescription: string
  }
  contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  commercial: {
    primaryGoal: string
    mainBlocker: string
    targetClient: string
  }
  perception: {
    primaryPerception: ClientBriefPerception | ''
    secondaryPerceptions: ClientBriefPerception[]
  }
  desiredOutcomes: ClientBriefDesiredOutcome[]
  sources: {
    propertiesPageUrl: string
    listingUrls: string[]
    assetSourceNotes: string
  }
  notes: {
    additionalContext: string
  }
}

export type ClientBriefBuildInput = {
  clientBrief?: ClientBrief
  agency?: Partial<ClientBrief['agency']>
  contact?: Partial<ClientBrief['contact']>
  commercial?: Partial<ClientBrief['commercial']>
  perception?: Partial<ClientBrief['perception']>
  sources?: Partial<ClientBrief['sources']>
  notes?: Partial<ClientBrief['notes']>
  companyName?: string
  city?: string
  area?: string
  hasWebsite?: boolean
  currentWebsite?: string
  websiteUrl?: string
  businessDescription?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  primaryGoal?: string
  mainBlocker?: string
  targetClient?: string
  diagnosticGoal?: string
  goal?: string
  goals?: string[]
  diagnosticBlocker?: string
  pain?: string
  pains?: string[]
  desiredFeeling?: string
  style?: string
  visualStyle?: string
  perceptions?: string[]
  desiredOutcomes?: string[]
  features?: string[]
  requestedDemoElements?: string[]
  propertiesPageUrl?: string
  listingUrls?: string[] | string
  assetSourceNotes?: string
  chatGptListingsToReuse?: string
  chatGptImagesToReuse?: string
  freeText?: string
  message?: string
  additionalContext?: string
  legacyNotes?: string
}

export const desiredOutcomeModuleMap: Record<ClientBriefDesiredOutcome, string[]> = {
  'generate-estimation-leads': ['estimation', 'callback_request', 'lead_form'],
  'improve-property-presentation': ['property_listings', 'property_detail', 'premium_presentation'],
  'increase-visit-requests': ['visit_request', 'property_detail'],
  'provide-seller-tracking': ['seller_space', 'reports'],
  'centralize-documents-and-reports': ['documents', 'reports', 'seller_space'],
  'improve-team-workflow': ['professional_space', 'notifications', 'reports'],
}

export function buildClientBrief(input: ClientBriefBuildInput): ClientBrief {
  const agencyInput = input.agency ?? {}
  const contactInput = input.contact ?? {}
  const commercialInput = input.commercial ?? {}
  const perceptionInput = input.perception ?? {}
  const sourcesInput = input.sources ?? {}
  const notesInput = input.notes ?? {}
  const currentWebsite = normalizeUrl(agencyInput.currentWebsite || input.currentWebsite || input.websiteUrl || '')
  const hasWebsite = typeof agencyInput.hasWebsite === 'boolean'
    ? agencyInput.hasWebsite
    : typeof input.hasWebsite === 'boolean'
      ? input.hasWebsite
      : Boolean(currentWebsite)
  const perceptions = normalizePerceptions([
    perceptionInput.primaryPerception,
    ...(perceptionInput.secondaryPerceptions ?? []),
    input.desiredFeeling,
    input.style,
    input.visualStyle,
    ...(input.perceptions ?? []),
  ])
  const desiredOutcomes = normalizeDesiredOutcomes([
    ...(input.desiredOutcomes ?? []),
    ...(input.features ?? []),
    ...(input.requestedDemoElements ?? []),
    ...(input.goals ?? []),
    input.goal,
    input.diagnosticGoal,
    input.diagnosticBlocker,
    input.pain,
    ...(input.pains ?? []),
  ])

  return {
    agency: {
      companyName: cleanText(agencyInput.companyName || input.companyName),
      city: cleanText(agencyInput.city || input.city),
      area: cleanText(agencyInput.area || input.area),
      hasWebsite,
      currentWebsite: hasWebsite ? currentWebsite : '',
      businessDescription: cleanText(agencyInput.businessDescription || input.businessDescription),
    },
    contact: {
      firstName: cleanText(contactInput.firstName || input.firstName),
      lastName: cleanText(contactInput.lastName || input.lastName),
      email: cleanText(contactInput.email || input.email).toLowerCase(),
      phone: cleanText(contactInput.phone || input.phone),
    },
    commercial: {
      primaryGoal: cleanText(commercialInput.primaryGoal || input.primaryGoal || input.diagnosticGoal || input.goal || input.goals?.[0]),
      mainBlocker: cleanText(commercialInput.mainBlocker || input.mainBlocker || input.diagnosticBlocker || input.pain || input.pains?.[0]),
      targetClient: cleanText(commercialInput.targetClient || input.targetClient),
    },
    perception: {
      primaryPerception: perceptions[0] ?? '',
      secondaryPerceptions: perceptions.slice(1),
    },
    desiredOutcomes,
    sources: {
      propertiesPageUrl: normalizeUrl(sourcesInput.propertiesPageUrl || input.propertiesPageUrl),
      listingUrls: normalizeUrlList(sourcesInput.listingUrls ?? input.listingUrls ?? input.chatGptListingsToReuse),
      assetSourceNotes: cleanText(sourcesInput.assetSourceNotes || input.assetSourceNotes || input.chatGptImagesToReuse),
    },
    notes: {
      additionalContext: cleanText(notesInput.additionalContext || input.additionalContext || input.freeText || input.message || input.legacyNotes),
    },
  }
}

export function resolveProjectClientBrief(input: ClientBriefBuildInput): ClientBrief {
  if (input.clientBrief) return buildClientBrief({ ...input.clientBrief })
  return buildClientBrief(input)
}

export function mapDesiredOutcomesToModules(outcomes: ClientBriefDesiredOutcome[]): string[] {
  return unique(outcomes.flatMap((outcome) => desiredOutcomeModuleMap[outcome] ?? []))
}

function normalizePerceptions(values: Array<string | undefined>): ClientBriefPerception[] {
  return unique(values.map(resolvePerception).filter((value): value is ClientBriefPerception => Boolean(value)))
}

function resolvePerception(value: string | undefined): ClientBriefPerception | '' {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  if (normalized.includes('confiance') || normalized.includes('rassur')) return 'trust'
  if (normalized.includes('premium') || normalized.includes('haut de gamme') || normalized.includes('excellence') || normalized.includes('luxe')) return 'premium'
  if (normalized.includes('humain') || normalized.includes('proche') || normalized.includes('accompagnement') || normalized.includes('local')) return 'human'
  if (normalized.includes('expert') || normalized.includes('serieux') || normalized.includes('credib') || normalized.includes('institutionnel')) return 'expert'
  if (normalized.includes('modern') || normalized.includes('fluide') || normalized.includes('innovation')) return 'modern'
  if (normalized.includes('transparent') || normalized.includes('clair')) return 'transparent'
  return ''
}

function normalizeDesiredOutcomes(values: Array<string | undefined>): ClientBriefDesiredOutcome[] {
  return unique(values.map(resolveDesiredOutcome).filter((value): value is ClientBriefDesiredOutcome => Boolean(value)))
}

function resolveDesiredOutcome(value: string | undefined): ClientBriefDesiredOutcome | '' {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  if (normalized.includes('estimation') || normalized.includes('mandat') || normalized.includes('vendeur') && normalized.includes('lead')) return 'generate-estimation-leads'
  if (normalized.includes('bien') || normalized.includes('annonce') || normalized.includes('presentation premium') || normalized.includes('valoriser')) return 'improve-property-presentation'
  if (normalized.includes('visite')) return 'increase-visit-requests'
  if (normalized.includes('espace vendeur') || normalized.includes('suivi vendeur') || normalized.includes('accompagnement')) return 'provide-seller-tracking'
  if (normalized.includes('document') || normalized.includes('rapport') || normalized.includes('compte rendu') || normalized.includes('compte-rendu')) return 'centralize-documents-and-reports'
  if (normalized.includes('workflow') || normalized.includes('equipe') || normalized.includes('agent') || normalized.includes('notifications')) return 'improve-team-workflow'
  return ''
}

function normalizeUrlList(value: string[] | string | undefined): string[] {
  const values = Array.isArray(value) ? value : splitList(value)
  return unique(values.map(normalizeUrl).filter(Boolean))
}

function normalizeUrl(value: string | undefined): string {
  const trimmed = cleanText(value)
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

function splitList(value: string | undefined): string[] {
  return cleanText(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function cleanText(value: string | undefined): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeText(value: string | undefined): string {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function unique<Item extends string>(values: Item[]): Item[] {
  return Array.from(new Set(values))
}
