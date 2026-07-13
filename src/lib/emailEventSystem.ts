import { formatCommercialAmount, formatRecurringInterval, readActiveCommercialOffer } from '../data/commercialOfferStore'
import { resolveProjectClientBrief } from '../types/clientBrief'
import type { ClientBrief } from '../types/clientBrief'

export const emailEvents = [
  'project-request-received',
  'demo-ready',
  'client-changes-recorded',
  'revised-demo-ready',
  'activation-invitation',
  'payment-confirmed',
  'owner-account-setup',
  'agency-activated',
  'account-invitation',
] as const

export type EmailEvent = (typeof emailEvents)[number]
export type EmailOutboxStatus = 'draft' | 'ready' | 'simulated' | 'cancelled' | 'error'

export type EmailRecipient = {
  email: string
  name: string
  role?: string
}

export type EmailVariables = {
  firstName: string
  lastName: string
  agencyName: string
  projectName: string
  demoUrl: string
  activationUrl: string
  invitationUrl: string
  role: string
  offerName: string
  installationPrice: string
  recurringPrice: string
  supportEmail: string
}

export type EmailTemplate = {
  event: EmailEvent
  subject: string
  preheader: string
  body: string
  ctaLabel: string
  ctaUrlVariable: keyof Pick<EmailVariables, 'demoUrl' | 'activationUrl' | 'invitationUrl'>
  signature: string
}

export type GeneratedEmail = {
  event: EmailEvent
  recipient: EmailRecipient
  subject: string
  preheader: string
  body: string
  cta?: {
    label: string
    url: string
  }
}

export type EmailOutboxItem = GeneratedEmail & {
  id: string
  projectId?: string
  agencyId?: string
  idempotencyKey: string
  status: EmailOutboxStatus
  createdAt: string
  updatedAt: string
}

export type EmailProjectSource = {
  id?: string
  companyName?: string
  generatedAgencyId?: string
  trackingToken?: string
  email?: string
  firstName?: string
  lastName?: string
  clientBrief?: ClientBrief
  demoLink?: string
  status?: string
  liveRepoLink?: string
  paymentLink?: string
  commercialOfferSnapshot?: {
    offerId: string
    name: string
    installationAmount: number
    recurringAmount: number
    currency: 'EUR'
    recurringInterval: 'month'
    capturedAt: string
  }
}

export type EmailAccountSource = {
  agencyId?: string
  agencySlug?: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  invitationUrl?: string
}

export type EnqueueEmailEventInput = {
  event: EmailEvent
  project?: EmailProjectSource
  account?: EmailAccountSource
  variables?: Partial<EmailVariables>
  recipient?: Partial<EmailRecipient>
  agencyId?: string
  idempotencyKey?: string
}

const emailOutboxStorageKey = 'signatureDigitalEmailOutbox'
const defaultSupportEmail = 'support@signature-digital.fr'

const templates: Record<EmailEvent, EmailTemplate> = {
  'project-request-received': {
    event: 'project-request-received',
    subject: 'Votre demande Signature Digital est bien recue',
    preheader: 'Nous avons les informations utiles pour preparer votre demo.',
    body: `Bonjour {{firstName}},

Votre demande pour {{agencyName}} est bien recue.

Nous allons nous appuyer sur vos reponses pour preparer une demonstration claire, utile et adaptee a votre agence.

La prochaine etape consiste a produire une premiere direction visuelle et fonctionnelle que vous pourrez consulter.`,
    ctaLabel: 'Suivre ma demande',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'demo-ready': {
    event: 'demo-ready',
    subject: 'Votre demo {{agencyName}} est prete',
    preheader: 'Vous pouvez consulter la plateforme de demonstration.',
    body: `Bonjour {{firstName}},

Votre demo {{agencyName}} est prete.

Vous pouvez la parcourir, verifier les contenus principaux et nous indiquer les ajustements utiles avant activation.`,
    ctaLabel: 'Voir la demo',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'client-changes-recorded': {
    event: 'client-changes-recorded',
    subject: 'Vos demandes de modification sont bien notees',
    preheader: 'Nous avons enregistre vos retours.',
    body: `Bonjour {{firstName}},

Vos demandes de modification pour {{agencyName}} sont bien notees.

Nous allons les relire et preparer une version corrigee de votre demonstration.`,
    ctaLabel: 'Suivre ma demande',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'revised-demo-ready': {
    event: 'revised-demo-ready',
    subject: 'La version corrigee de votre demo est prete',
    preheader: 'Votre demonstration a ete mise a jour.',
    body: `Bonjour {{firstName}},

La version corrigee de votre demo {{agencyName}} est prete.

Vous pouvez la consulter et confirmer si elle correspond a vos attentes.`,
    ctaLabel: 'Voir la demo corrigee',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'activation-invitation': {
    event: 'activation-invitation',
    subject: 'Activation de votre plateforme {{agencyName}}',
    preheader: 'Votre plateforme peut maintenant passer a l activation.',
    body: `Bonjour {{firstName}},

Votre plateforme {{agencyName}} est prete pour l activation.

Offre : {{offerName}}
Installation : {{installationPrice}}
Abonnement : {{recurringPrice}}

Le lien ci-dessous permet de poursuivre le parcours d activation.`,
    ctaLabel: 'Activer mon agence',
    ctaUrlVariable: 'activationUrl',
    signature: 'Signature Digital',
  },
  'payment-confirmed': {
    event: 'payment-confirmed',
    subject: 'Paiement confirme pour {{agencyName}}',
    preheader: 'Votre activation peut continuer.',
    body: `Bonjour {{firstName}},

Le paiement de {{agencyName}} est confirme.

Nous pouvons continuer la mise en service de votre plateforme.`,
    ctaLabel: 'Suivre mon activation',
    ctaUrlVariable: 'activationUrl',
    signature: 'Signature Digital',
  },
  'owner-account-setup': {
    event: 'owner-account-setup',
    subject: 'Configurez votre acces patron {{agencyName}}',
    preheader: 'Votre acces principal est pret a etre configure.',
    body: `Bonjour {{firstName}},

Votre acces patron pour {{agencyName}} est pret a etre configure.

Cet acces vous permettra de piloter les agents, les vendeurs et les informations de votre agence.`,
    ctaLabel: 'Configurer mon acces',
    ctaUrlVariable: 'invitationUrl',
    signature: 'Signature Digital',
  },
  'agency-activated': {
    event: 'agency-activated',
    subject: 'Votre agence {{agencyName}} est active',
    preheader: 'Votre plateforme est maintenant disponible.',
    body: `Bonjour {{firstName}},

Votre agence {{agencyName}} est active.

Vous pouvez maintenant utiliser votre plateforme et partager les acces avec votre equipe.`,
    ctaLabel: 'Ouvrir ma plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'account-invitation': {
    event: 'account-invitation',
    subject: 'Votre acces {{role}} pour {{agencyName}}',
    preheader: 'Un acces vous attend sur la plateforme de votre agence.',
    body: `Bonjour {{firstName}},

Votre acces {{role}} pour {{agencyName}} est pret.

Le lien ci-dessous permet de finaliser votre acces et de rejoindre l espace qui vous est reserve.`,
    ctaLabel: 'Creer mon acces',
    ctaUrlVariable: 'invitationUrl',
    signature: 'Signature Digital',
  },
}

export function enqueueEmailEvent(input: EnqueueEmailEventInput) {
  const recipient = resolveEmailRecipient(input)
  if (!recipient) return { item: undefined, reason: 'recipient-missing-or-invalid' }

  const generated = generateEmail(input.event, resolveEmailVariables(input), recipient)
  const now = new Date().toISOString()
  const idempotencyKey = input.idempotencyKey ?? createIdempotencyKey(input.event, recipient, input)
  const existing = readEmailOutbox().find((item) => item.idempotencyKey === idempotencyKey && item.status !== 'cancelled')
  if (existing) return { item: existing, reason: 'duplicate' }

  const item: EmailOutboxItem = {
    ...generated,
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    projectId: input.project?.id,
    agencyId: input.agencyId || input.account?.agencyId || input.project?.generatedAgencyId,
    idempotencyKey,
    status: 'ready',
    createdAt: now,
    updatedAt: now,
  }

  writeEmailOutbox([item, ...readEmailOutbox()])

  return { item, reason: 'created' }
}

export function readEmailOutbox() {
  if (typeof window === 'undefined') return [] as EmailOutboxItem[]

  try {
    const raw = window.localStorage.getItem(emailOutboxStorageKey)
    if (!raw) return []

    return (JSON.parse(raw) as Partial<EmailOutboxItem>[]).map(normalizeOutboxItem).filter(Boolean) as EmailOutboxItem[]
  } catch {
    return []
  }
}

export function updateEmailOutboxItem(itemId: string, updates: Partial<Pick<EmailOutboxItem, 'status'>>) {
  const items = readEmailOutbox()
  const next = items.map((item) => item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)
  writeEmailOutbox(next)

  return next.find((item) => item.id === itemId)
}

export function cancelEmailOutboxItem(itemId: string) {
  return updateEmailOutboxItem(itemId, { status: 'cancelled' })
}

export function markEmailOutboxItemSimulated(itemId: string) {
  return updateEmailOutboxItem(itemId, { status: 'simulated' })
}

export function formatEmailForCopy(item: EmailOutboxItem) {
  return [
    `Objet : ${item.subject}`,
    item.preheader,
    '',
    item.body,
    item.cta ? ['', `${item.cta.label} :`, item.cta.url].join('\n') : '',
  ].filter(Boolean).join('\n')
}

export function getEmailTemplates() {
  return Object.values(templates)
}

function generateEmail(event: EmailEvent, variables: EmailVariables, recipient: EmailRecipient): GeneratedEmail {
  const template = templates[event]
  const ctaUrl = variables[template.ctaUrlVariable]

  return {
    event,
    recipient,
    subject: renderTemplate(template.subject, variables),
    preheader: renderTemplate(template.preheader, variables),
    body: `${renderTemplate(template.body, variables)}\n\n${template.signature}`,
    cta: ctaUrl ? { label: template.ctaLabel, url: ctaUrl } : undefined,
  }
}

function resolveEmailRecipient(input: EnqueueEmailEventInput): EmailRecipient | null {
  const recipientEmail = clean(input.recipient?.email) || clean(input.account?.email) || getClientBrief(input.project).contact.email
  if (!isValidEmail(recipientEmail)) return null

  const firstName = clean(input.recipient?.name) || [input.account?.firstName, input.account?.lastName].filter(Boolean).join(' ') || getClientName(input.project)

  return {
    email: recipientEmail.toLowerCase(),
    name: firstName || recipientEmail,
    role: clean(input.recipient?.role) || clean(input.account?.role),
  }
}

function resolveEmailVariables(input: EnqueueEmailEventInput): EmailVariables {
  const brief = getClientBrief(input.project)
  const offer = input.project?.commercialOfferSnapshot ?? readActiveCommercialOffer()
  const accountFirstName = clean(input.account?.firstName)
  const accountLastName = clean(input.account?.lastName)
  const firstName = clean(input.variables?.firstName) || accountFirstName || brief.contact.firstName || 'Bonjour'
  const lastName = clean(input.variables?.lastName) || accountLastName || brief.contact.lastName
  const agencyName = clean(input.variables?.agencyName) || brief.agency.companyName || clean(input.project?.companyName) || 'votre agence'
  const recurringPrice = `${formatCommercialAmount(offer.recurringAmount, offer.currency)} / ${formatRecurringInterval(offer.recurringInterval)}`

  return {
    firstName,
    lastName,
    agencyName,
    projectName: clean(input.variables?.projectName) || clean(input.project?.companyName) || agencyName,
    demoUrl: clean(input.variables?.demoUrl) || buildDemoUrl(input.project),
    activationUrl: clean(input.variables?.activationUrl) || buildActivationUrl(input.project),
    invitationUrl: clean(input.variables?.invitationUrl) || clean(input.account?.invitationUrl),
    role: clean(input.variables?.role) || clean(input.account?.role) || 'utilisateur',
    offerName: clean(input.variables?.offerName) || offer.name,
    installationPrice: clean(input.variables?.installationPrice) || formatCommercialAmount(offer.installationAmount, offer.currency),
    recurringPrice: clean(input.variables?.recurringPrice) || recurringPrice,
    supportEmail: clean(input.variables?.supportEmail) || defaultSupportEmail,
  }
}

function getClientBrief(project?: EmailProjectSource): ClientBrief {
  return resolveProjectClientBrief(project ?? {})
}

function getClientName(project?: EmailProjectSource) {
  const brief = getClientBrief(project)
  return [brief.contact.firstName || project?.firstName, brief.contact.lastName || project?.lastName].filter(Boolean).join(' ')
}

function buildDemoUrl(project?: EmailProjectSource) {
  const origin = getOrigin()
  if (project?.liveRepoLink) return toAbsoluteUrl(project.liveRepoLink, origin)
  if (project?.demoLink) return toAbsoluteUrl(project.demoLink, origin)
  if (project?.generatedAgencyId) return `${origin}/demo/${project.generatedAgencyId}`
  if (project?.trackingToken || project?.id) return `${origin}/suivi/${project.trackingToken || project.id}`
  return ''
}

function buildActivationUrl(project?: EmailProjectSource) {
  if (!project?.trackingToken && !project?.id && !project?.generatedAgencyId) return ''
  const token = project.generatedAgencyId || project.trackingToken || project.id
  return `${getOrigin()}/activation/${token}`
}

function createIdempotencyKey(event: EmailEvent, recipient: EmailRecipient, input: EnqueueEmailEventInput) {
  return [
    event,
    input.project?.id || '',
    input.agencyId || input.account?.agencyId || input.project?.generatedAgencyId || '',
    recipient.email,
    input.account?.role || '',
    input.account?.invitationUrl || '',
  ].join('|')
}

function normalizeOutboxItem(item: Partial<EmailOutboxItem>): EmailOutboxItem | null {
  const event = emailEvents.includes(item.event as EmailEvent) ? item.event as EmailEvent : null
  const recipientEmail = clean(item.recipient?.email)
  if (!event || !isValidEmail(recipientEmail) || !item.id) return null

  return {
    id: String(item.id),
    event,
    projectId: clean(item.projectId),
    agencyId: clean(item.agencyId),
    recipient: {
      email: recipientEmail.toLowerCase(),
      name: clean(item.recipient?.name) || recipientEmail,
      role: clean(item.recipient?.role),
    },
    subject: clean(item.subject),
    preheader: clean(item.preheader),
    body: String(item.body || ''),
    cta: item.cta?.url ? { label: clean(item.cta.label) || 'Ouvrir', url: clean(item.cta.url) } : undefined,
    idempotencyKey: clean(item.idempotencyKey) || String(item.id),
    status: isEmailOutboxStatus(item.status) ? item.status : 'draft',
    createdAt: clean(item.createdAt) || new Date().toISOString(),
    updatedAt: clean(item.updatedAt) || clean(item.createdAt) || new Date().toISOString(),
  }
}

function writeEmailOutbox(items: EmailOutboxItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(emailOutboxStorageKey, JSON.stringify(items))
}

function renderTemplate(template: string, variables: EmailVariables) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: keyof EmailVariables) => variables[key] ?? '')
}

function toAbsoluteUrl(url: string, origin: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://signature-digital.fr'
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isEmailOutboxStatus(status: unknown): status is EmailOutboxStatus {
  return ['draft', 'ready', 'simulated', 'cancelled', 'error'].includes(String(status))
}

function clean(value: unknown) {
  return String(value ?? '').trim()
}
