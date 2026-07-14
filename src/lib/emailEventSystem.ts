import { formatCommercialAmount, formatRecurringInterval, readActiveCommercialOffer } from '../data/commercialOfferStore'
import { getRealEstateAgencyRuntimeBySlug } from '../data/realEstateAgencyConfig'
import { resolveProjectClientBrief } from '../types/clientBrief'
import type { ClientBrief } from '../types/clientBrief'
import { resolveAgencyPublicUrls } from './agencyDomainSystem'
import { resolveAgencyContactIdentity } from './agencyContactLegalIdentity'
import { resolveExperienceCopy, type ExperienceRole } from './experienceCopy'

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
  'account-invitation-owner',
  'account-invitation-agent',
  'account-invitation-seller',
  'estimation-request-client',
  'estimation-request-agency',
  'visit-request-client',
  'visit-request-agency',
  'contact-request-client',
  'contact-request-agency',
  'callback-request-client',
  'callback-request-agency',
] as const

export type EmailEvent = (typeof emailEvents)[number]
export type EmailOutboxStatus = 'draft' | 'ready' | 'sending' | 'sent' | 'simulated' | 'cancelled' | 'failed' | 'error'
export type EmailDeliveryMode = 'simulation' | 'live'

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
  provider?: string
  providerMessageId?: string
  sentAt?: string
  lastError?: string
  attemptCount: number
  deliveryMode?: EmailDeliveryMode
  createdAt: string
  updatedAt: string
}

export type EmailDeliveryResult = {
  ok: boolean
  status: EmailOutboxStatus
  provider: string
  providerMessageId: string
  errorMessage: string
  reason: string
  item?: EmailOutboxItem
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

type SendEmailServerResponse = {
  ok?: boolean
  status?: 'sent' | 'simulated' | 'failed'
  provider?: string
  reason?: string
  error?: string
  providerMessageId?: string
}

const emailOutboxStorageKey = 'signatureDigitalEmailOutbox'
const defaultSupportEmail = 'support@signature-digital.fr'

const accountInvitationBody = `Bonjour {{firstName}},

Votre acces {{role}} pour {{agencyName}} est pret.

Le lien ci-dessous permet de finaliser votre acces et de rejoindre l espace qui vous est reserve.`

const clientRequestConfirmationBody = `Bonjour {{firstName}},

Votre demande pour {{agencyName}} est bien recue.

Un conseiller va la relire et revenir vers vous avec les informations utiles.`

const agencyRequestNotificationBody = `Bonjour,

Une nouvelle demande est disponible pour {{agencyName}}.

Elle a ete enregistree dans la plateforme afin que l equipe puisse la traiter sans perdre le contexte.`

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
    body: accountInvitationBody,
    ctaLabel: 'Creer mon acces',
    ctaUrlVariable: 'invitationUrl',
    signature: 'Signature Digital',
  },
  'account-invitation-owner': {
    event: 'account-invitation-owner',
    subject: 'Votre acces patron pour {{agencyName}}',
    preheader: 'Votre acces principal est pret.',
    body: accountInvitationBody,
    ctaLabel: 'Creer mon acces patron',
    ctaUrlVariable: 'invitationUrl',
    signature: 'Signature Digital',
  },
  'account-invitation-agent': {
    event: 'account-invitation-agent',
    subject: 'Votre acces agent pour {{agencyName}}',
    preheader: 'Votre acces agent est pret.',
    body: accountInvitationBody,
    ctaLabel: 'Creer mon acces agent',
    ctaUrlVariable: 'invitationUrl',
    signature: 'Signature Digital',
  },
  'account-invitation-seller': {
    event: 'account-invitation-seller',
    subject: 'Votre espace vendeur pour {{agencyName}}',
    preheader: 'Votre espace vendeur est pret.',
    body: accountInvitationBody,
    ctaLabel: 'Creer mon acces vendeur',
    ctaUrlVariable: 'invitationUrl',
    signature: 'Signature Digital',
  },
  'estimation-request-client': {
    event: 'estimation-request-client',
    subject: 'Votre demande d estimation est bien recue',
    preheader: 'L agence va etudier votre demande.',
    body: clientRequestConfirmationBody,
    ctaLabel: 'Retour a la plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'estimation-request-agency': {
    event: 'estimation-request-agency',
    subject: 'Nouvelle demande d estimation pour {{agencyName}}',
    preheader: 'Une demande d estimation est a traiter.',
    body: agencyRequestNotificationBody,
    ctaLabel: 'Ouvrir la plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'visit-request-client': {
    event: 'visit-request-client',
    subject: 'Votre demande de visite est bien recue',
    preheader: 'L agence va revenir vers vous.',
    body: clientRequestConfirmationBody,
    ctaLabel: 'Retour a la plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'visit-request-agency': {
    event: 'visit-request-agency',
    subject: 'Nouvelle demande de visite pour {{agencyName}}',
    preheader: 'Une demande de visite est a traiter.',
    body: agencyRequestNotificationBody,
    ctaLabel: 'Ouvrir la plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'contact-request-client': {
    event: 'contact-request-client',
    subject: 'Votre message est bien recu',
    preheader: 'L agence va revenir vers vous.',
    body: clientRequestConfirmationBody,
    ctaLabel: 'Retour a la plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'contact-request-agency': {
    event: 'contact-request-agency',
    subject: 'Nouveau message pour {{agencyName}}',
    preheader: 'Un contact est a traiter.',
    body: agencyRequestNotificationBody,
    ctaLabel: 'Ouvrir la plateforme',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'callback-request-client': {
    event: 'callback-request-client',
    subject: 'Votre demande de rappel est bien recue',
    preheader: 'Nous reviendrons vers vous.',
    body: clientRequestConfirmationBody,
    ctaLabel: 'Suivre ma demande',
    ctaUrlVariable: 'demoUrl',
    signature: 'Signature Digital',
  },
  'callback-request-agency': {
    event: 'callback-request-agency',
    subject: 'Nouvelle demande de rappel pour {{agencyName}}',
    preheader: 'Un rappel client est a traiter.',
    body: agencyRequestNotificationBody,
    ctaLabel: 'Ouvrir le suivi',
    ctaUrlVariable: 'demoUrl',
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
    provider: '',
    providerMessageId: '',
    lastError: '',
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  writeEmailOutbox([item, ...readEmailOutbox()])

  return { item, reason: 'created' }
}

export function enqueueAndSendEmailEvent(input: EnqueueEmailEventInput) {
  const result = enqueueEmailEvent(input)
  if (result.item && result.reason === 'created' && canSendItem(result.item)) {
    void sendEmailOutboxItem(result.item.id)
  }
  return result
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

export function updateEmailOutboxItem(itemId: string, updates: Partial<EmailOutboxItem>) {
  const items = readEmailOutbox()
  const next = items.map((item) => item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)
  writeEmailOutbox(next)

  return next.find((item) => item.id === itemId)
}

export async function sendEmailOutboxItem(itemId: string): Promise<EmailDeliveryResult> {
  const item = readEmailOutbox().find((candidate) => candidate.id === itemId)
  if (!item) return createDeliveryResult(false, 'failed', 'unknown', '', 'Email introuvable.', '', undefined)
  if (!canSendItem(item)) return createDeliveryResult(true, item.status, item.provider || '', item.providerMessageId || '', '', 'already-processed', item)

  const sendingItem = updateEmailOutboxItem(item.id, {
    status: 'sending',
    attemptCount: item.attemptCount + 1,
    lastError: '',
  }) ?? item

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildServerPayload(sendingItem)),
    })
    const payload = await response.json().catch(() => ({})) as SendEmailServerResponse
    const provider = payload.provider || 'unknown'
    const providerMessageId = payload.providerMessageId || ''

    if (response.ok && payload.status === 'sent') {
      const sentAt = new Date().toISOString()
      const updated = updateEmailOutboxItem(item.id, {
        status: 'sent',
        provider,
        providerMessageId,
        sentAt,
        deliveryMode: 'live',
        lastError: '',
      })
      return createDeliveryResult(true, 'sent', provider, providerMessageId, '', '', updated)
    }

    if (response.ok && payload.status === 'simulated') {
      const updated = updateEmailOutboxItem(item.id, {
        status: 'simulated',
        provider,
        providerMessageId,
        deliveryMode: 'simulation',
        lastError: payload.reason || 'Mode simulation.',
      })
      return createDeliveryResult(true, 'simulated', provider, providerMessageId, '', payload.reason || 'simulation', updated)
    }

    const errorMessage = payload.error || `Erreur serveur email (${response.status}).`
    const updated = updateEmailOutboxItem(item.id, {
      status: 'failed',
      provider,
      providerMessageId,
      lastError: errorMessage,
    })
    return createDeliveryResult(false, 'failed', provider, providerMessageId, errorMessage, payload.reason || '', updated)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue pendant l envoi.'
    const updated = updateEmailOutboxItem(item.id, {
      status: 'failed',
      provider: 'network',
      lastError: errorMessage,
    })
    return createDeliveryResult(false, 'failed', 'network', '', errorMessage, '', updated)
  }
}

export function retryEmailOutboxItem(itemId: string) {
  return sendEmailOutboxItem(itemId)
}

export function cancelEmailOutboxItem(itemId: string) {
  return updateEmailOutboxItem(itemId, { status: 'cancelled' })
}

export function markEmailOutboxItemSimulated(itemId: string) {
  return updateEmailOutboxItem(itemId, { status: 'simulated', deliveryMode: 'simulation' })
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
  const agencyRecipient = resolveAgencyEventRecipient(input)
  const recipientEmail = clean(input.recipient?.email) || clean(input.account?.email) || agencyRecipient?.email || getClientBrief(input.project).contact.email
  if (!isValidRecipientEmail(recipientEmail)) return null

  const firstName = clean(input.recipient?.name) || agencyRecipient?.name || [input.account?.firstName, input.account?.lastName].filter(Boolean).join(' ') || getClientName(input.project)

  return {
    email: recipientEmail === 'admin' ? 'admin' : recipientEmail.toLowerCase(),
    name: firstName || recipientEmail,
    role: clean(input.recipient?.role) || clean(input.account?.role),
  }
}

function resolveAgencyEventRecipient(input: EnqueueEmailEventInput): EmailRecipient | null {
  if (!input.event.endsWith('-agency')) return null
  const agencySlug = input.agencyId || input.project?.generatedAgencyId || input.account?.agencySlug
  if (!agencySlug) return null
  const runtime = getRealEstateAgencyRuntimeBySlug(agencySlug)
  if (!runtime) return null
  const identity = resolveAgencyContactIdentity(runtime.agencyConfig)
  const eventRecipient = input.event.startsWith('estimation-')
    ? identity.recipients.estimation
    : input.event.startsWith('visit-')
      ? identity.recipients.visit
      : input.event.startsWith('callback-')
        ? identity.recipients.callback
        : identity.recipients.contact
  if (!eventRecipient) return null
  return {
    email: eventRecipient,
    name: runtime.modelConfig.agencyName,
  }
}

function resolveEmailVariables(input: EnqueueEmailEventInput): EmailVariables {
  const brief = getClientBrief(input.project)
  const offer = input.project?.commercialOfferSnapshot ?? readActiveCommercialOffer()
  const accountFirstName = clean(input.account?.firstName)
  const accountLastName = clean(input.account?.lastName)
  const resolvedAgencyName = clean(input.variables?.agencyName) || brief.agency.companyName || clean(input.project?.companyName)
  const copy = resolveExperienceCopy({
    firstName: clean(input.variables?.firstName) || accountFirstName || brief.contact.firstName,
    agencyName: resolvedAgencyName,
    role: emailEventRole(input.event),
    agencyMode: 'demo',
  })
  const agencyName = resolvedAgencyName || copy.activationCta.replace(/^Activer\s+/, '')
  const firstName = clean(input.variables?.firstName) || accountFirstName || brief.contact.firstName || ''
  const lastName = clean(input.variables?.lastName) || accountLastName || brief.contact.lastName
  const recurringPrice = `${formatCommercialAmount(offer.recurringAmount, offer.currency)} / ${formatRecurringInterval(offer.recurringInterval)}`

  return {
    firstName,
    lastName,
    agencyName,
    projectName: clean(input.variables?.projectName) || clean(input.project?.companyName) || agencyName,
    demoUrl: clean(input.variables?.demoUrl) || buildDemoUrl(input.project, input.account?.agencySlug),
    activationUrl: clean(input.variables?.activationUrl) || buildActivationUrl(input.project),
    invitationUrl: clean(input.variables?.invitationUrl) || clean(input.account?.invitationUrl),
    role: clean(input.variables?.role) || clean(input.account?.role) || 'utilisateur',
    offerName: clean(input.variables?.offerName) || offer.name,
    installationPrice: clean(input.variables?.installationPrice) || formatCommercialAmount(offer.installationAmount, offer.currency),
    recurringPrice: clean(input.variables?.recurringPrice) || recurringPrice,
    supportEmail: clean(input.variables?.supportEmail) || defaultSupportEmail,
  }
}

function emailEventRole(event: EmailEvent): ExperienceRole {
  if (event.includes('owner')) return 'owner'
  if (event.includes('agent')) return 'agent'
  if (event.includes('seller')) return 'seller'
  return 'public'
}

function getClientBrief(project?: EmailProjectSource): ClientBrief {
  return resolveProjectClientBrief(project ?? {})
}

function getClientName(project?: EmailProjectSource) {
  const brief = getClientBrief(project)
  return [brief.contact.firstName || project?.firstName, brief.contact.lastName || project?.lastName].filter(Boolean).join(' ')
}

function buildDemoUrl(project?: EmailProjectSource, agencySlug?: string) {
  const origin = getOrigin()
  if (project?.liveRepoLink) return toAbsoluteUrl(project.liveRepoLink, origin)
  if (project?.demoLink) return toAbsoluteUrl(project.demoLink, origin)
  if (project?.generatedAgencyId) {
    const runtime = getRealEstateAgencyRuntimeBySlug(project.generatedAgencyId)
    if (runtime) return resolveAgencyPublicUrls(runtime.modelConfig, project.trackingToken || project.id).primaryUrl
    return `${origin}/demo/${project.generatedAgencyId}`
  }
  if (agencySlug) {
    const runtime = getRealEstateAgencyRuntimeBySlug(agencySlug)
    if (runtime) return resolveAgencyPublicUrls(runtime.modelConfig).primaryUrl
    return `${origin}/demo/${agencySlug}`
  }
  if (project?.trackingToken || project?.id) return `${origin}/suivi/${project.trackingToken || project.id}`
  return ''
}

function buildActivationUrl(project?: EmailProjectSource) {
  if (!project?.trackingToken && !project?.id && !project?.generatedAgencyId) return ''
  if (project.generatedAgencyId) {
    const runtime = getRealEstateAgencyRuntimeBySlug(project.generatedAgencyId)
    if (runtime) return resolveAgencyPublicUrls(runtime.modelConfig, project.trackingToken || project.id).activationUrl
  }
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
  if (!event || !isValidRecipientEmail(recipientEmail) || !item.id) return null

  return {
    id: String(item.id),
    event,
    projectId: clean(item.projectId),
    agencyId: clean(item.agencyId),
    recipient: {
      email: recipientEmail === 'admin' ? 'admin' : recipientEmail.toLowerCase(),
      name: clean(item.recipient?.name) || recipientEmail,
      role: clean(item.recipient?.role),
    },
    subject: clean(item.subject),
    preheader: clean(item.preheader),
    body: String(item.body || ''),
    cta: item.cta?.url ? { label: clean(item.cta.label) || 'Ouvrir', url: clean(item.cta.url) } : undefined,
    idempotencyKey: clean(item.idempotencyKey) || String(item.id),
    status: isEmailOutboxStatus(item.status) ? item.status : 'draft',
    provider: clean(item.provider),
    providerMessageId: clean(item.providerMessageId),
    sentAt: clean(item.sentAt),
    lastError: clean(item.lastError),
    attemptCount: typeof item.attemptCount === 'number' && Number.isFinite(item.attemptCount) ? item.attemptCount : 0,
    deliveryMode: item.deliveryMode === 'live' || item.deliveryMode === 'simulation' ? item.deliveryMode : undefined,
    createdAt: clean(item.createdAt) || new Date().toISOString(),
    updatedAt: clean(item.updatedAt) || clean(item.createdAt) || new Date().toISOString(),
  }
}

function writeEmailOutbox(items: EmailOutboxItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(emailOutboxStorageKey, JSON.stringify(items))
}

function buildServerPayload(item: EmailOutboxItem) {
  return {
    type: item.event,
    projectId: item.projectId,
    agencyId: item.agencyId,
    idempotencyKey: item.idempotencyKey,
    to: item.recipient,
    subject: item.subject,
    body: formatBodyForDelivery(item),
  }
}

function formatBodyForDelivery(item: EmailOutboxItem) {
  return [
    item.preheader,
    '',
    item.body,
    item.cta ? ['', `${item.cta.label} :`, item.cta.url].join('\n') : '',
  ].filter(Boolean).join('\n')
}

function canSendItem(item: EmailOutboxItem) {
  return ['ready', 'failed', 'error', 'simulated'].includes(item.status)
}

function createDeliveryResult(
  ok: boolean,
  status: EmailOutboxStatus,
  provider: string,
  providerMessageId: string,
  errorMessage: string,
  reason: string,
  item?: EmailOutboxItem,
): EmailDeliveryResult {
  return { ok, status, provider, providerMessageId, errorMessage, reason, item }
}

function renderTemplate(template: string, variables: EmailVariables) {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key: keyof EmailVariables) => variables[key] ?? '')
    .replace(/Bonjour\s+,/g, 'Bonjour,')
    .replace(/\s+\n/g, '\n')
}

function toAbsoluteUrl(url: string, origin: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://signature-digital.fr'
}

function isValidRecipientEmail(email: string) {
  return email === 'admin' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isEmailOutboxStatus(status: unknown): status is EmailOutboxStatus {
  return ['draft', 'ready', 'sending', 'sent', 'simulated', 'cancelled', 'failed', 'error'].includes(String(status))
}

function clean(value: unknown) {
  return String(value ?? '').trim()
}
