import type { EmailHistoryItem, EmailKey, Project } from '../data/projectStore'
import { getActivationPath, getDemoReadyPath, getProjectSourceLabel, getTrackingUrl } from '../data/projectStore'

type EmailRecipient = {
  email: string
  name?: string
}

type RenderedEmail = {
  subject: string
  body: string
}

type SendEmailInput = RenderedEmail & {
  type: EmailKey
  to: EmailRecipient
  projectId: string
}

export type SendEmailResult = {
  ok: boolean
  status: EmailHistoryItem['status']
  provider: string
  providerMessageId: string
  errorMessage: string
  reason: string
}

type ApiEmailResponse = {
  ok?: boolean
  status?: EmailHistoryItem['status']
  provider?: string
  providerMessageId?: string
  error?: string
  errorMessage?: string
  reason?: string
}

type ProjectEmailVariables = {
  firstName: string
  companyName: string
  trackingUrl: string
  demoUrl: string
  paymentUrl: string
  activeUrl: string
  projectAdminUrl: string
  sourceLabel: string
  callbackPhone: string
  callbackMoment: string
  callbackMessage: string
  adjustmentCategory: string
  adjustmentMessage: string
}

export const emailTemplates: Record<EmailKey, (variables: ProjectEmailVariables) => RenderedEmail> = {
  spaceCreated: ({ firstName, companyName, trackingUrl }) => ({
    subject: 'Votre espace de suivi Signature Digital est prêt',
    body: `Bonjour ${firstName},

Votre demande de démo pour ${companyName} est bien prise en compte.

Votre espace de suivi est maintenant disponible.

Vous pourrez y retrouver :

- l’avancement de votre demande
- les prochaines étapes
- votre démo lorsqu’elle sera prête
- la possibilité de demander un rappel
- la possibilité d’ajouter une précision
- la possibilité de demander des ajustements

Accéder à mon espace de suivi :
${trackingUrl}

Conservez ce lien, il vous permettra de retrouver votre espace à tout moment.

À très vite,

Signature Digital`,
  }),
  demoReady: ({ firstName, demoUrl }) => ({
    subject: 'Votre démo Signature Digital est prête',
    body: `Bonjour ${firstName},

Votre démo personnalisée est prête.

Elle a été préparée à partir de votre demande, de vos réponses et des objectifs que vous nous avez indiqués.

Vous pouvez la découvrir ici :
${demoUrl}

Depuis votre espace, vous pourrez :

- découvrir la démo
- voir les fonctionnalités prévues
- demander des ajustements
- demander un rappel
- valider la direction proposée

Certaines fonctionnalités sont visibles dans la démo, mais seront activées uniquement après validation et paiement.

À très vite,

Signature Digital`,
  }),
  adjustmentsReceived: ({ firstName, trackingUrl }) => ({
    subject: 'Vos ajustements sont bien pris en compte',
    body: `Bonjour ${firstName},

Nous avons bien reçu vos ajustements.

Nous allons les étudier afin d’affiner votre démo dans la bonne direction, sans perdre l’objectif principal : mieux montrer votre valeur et renforcer votre présence digitale.

Suivre l’avancement :
${trackingUrl}

Signature Digital`,
  }),
  callbackRequested: ({ firstName }) => ({
    subject: 'Votre demande de rappel est prise en compte',
    body: `Bonjour ${firstName},

Votre demande de rappel est bien prise en compte.

Nous reviendrons vers vous selon le créneau indiqué afin de faire le point sur votre démo et vos attentes.

Signature Digital`,
  }),
  paymentAvailable: ({ firstName, paymentUrl }) => ({
    subject: 'Votre démo est prête à être activée',
    body: `Bonjour ${firstName},

Votre démo a été validée et peut maintenant être activée.

L’activation comprend :

- la mise en place de l’expérience finale
- l’adaptation de la démo validée
- la configuration des accès
- la préparation des emails
- la mise en ligne
- l’accompagnement initial

Offre :
2 000 € d’installation
400 €/mois d’accompagnement et maintien de l’expérience

Accéder au paiement :
${paymentUrl}

Signature Digital`,
  }),
  paymentReceived: ({ firstName, trackingUrl }) => ({
    subject: 'Votre activation est lancée',
    body: `Bonjour ${firstName},

Nous avons bien reçu votre paiement.

Votre démo va maintenant être transformée en expérience active.
Vous serez informé dès que votre espace sera prêt.

Suivre l’activation :
${trackingUrl}

Signature Digital`,
  }),
  projectActivated: ({ firstName, activeUrl }) => ({
    subject: 'Votre expérience Signature Digital est active',
    body: `Bonjour ${firstName},

Votre expérience est maintenant active.

Vous pouvez accéder à votre espace ici :
${activeUrl}

Tout a été préparé pour que la prise en main soit simple, fluide et intuitive.

Signature Digital`,
  }),
}

export function getEmailVariablesFromProject(project: Project): ProjectEmailVariables {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://signature-digital.fr'

  return {
    firstName: project.firstName || '',
    companyName: project.companyName,
    trackingUrl: getTrackingUrl(project),
    demoUrl: `${origin}${getDemoReadyPath(project)}`,
    paymentUrl: project.paymentLink || `${origin}${getActivationPath(project)}`,
    activeUrl: project.demoLink || getTrackingUrl(project),
    projectAdminUrl: `${origin}/admin/projects/${project.id}`,
    sourceLabel: getProjectSourceLabel(project),
    callbackPhone: project.callbackPhone || project.phone,
    callbackMoment: project.callbackMoment,
    callbackMessage: project.callbackMessage,
    adjustmentCategory: project.adjustmentCategory,
    adjustmentMessage: project.adjustmentMessage,
  }
}

export function renderEmailTemplate(type: EmailKey, project: Project) {
  return emailTemplates[type](getEmailVariablesFromProject(project))
}

export async function sendClientEmail(project: Project, type: EmailKey) {
  const rendered = renderEmailTemplate(type, project)

  return sendEmail({
    ...rendered,
    type,
    projectId: project.id,
    to: {
      email: project.email,
      name: `${project.firstName} ${project.lastName}`.trim(),
    },
  })
}

export async function sendAdminNotification(project: Project, type: Extract<EmailKey, 'callbackRequested' | 'adjustmentsReceived'>) {
  const variables = getEmailVariablesFromProject(project)
  const rendered = type === 'callbackRequested'
    ? {
        subject: `Demande de rappel reçue pour ${variables.companyName}`,
        body: `Demande de rappel reçue pour ${variables.companyName}.

Téléphone :
${variables.callbackPhone || 'Non renseigné'}

Créneau préféré :
${variables.callbackMoment || 'Non renseigné'}

Message :
${variables.callbackMessage || 'Aucun message'}

Lien projet admin :
${variables.projectAdminUrl}`,
      }
    : {
        subject: `Nouvelle demande d’ajustement reçue pour ${variables.companyName}`,
        body: `Nouvelle demande d’ajustement reçue pour ${variables.companyName}.

Type :
${variables.adjustmentCategory || 'Non renseigné'}

Message :
${variables.adjustmentMessage || 'Aucun message'}

Lien projet admin :
${variables.projectAdminUrl}`,
      }

  return sendEmail({
    ...rendered,
    type,
    projectId: project.id,
    to: {
      email: 'admin',
      name: 'Signature Digital',
    },
  })
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const result = await readEmailResponse(response)

    if (!response.ok) {
      return {
        ok: false,
        status: result?.status ?? 'failed',
        provider: result?.provider ?? 'unknown',
        providerMessageId: '',
        errorMessage: 'L’envoi automatique sera disponible après configuration Gmail.',
        reason: result?.reason ?? '',
      }
    }

    return {
      ok: result?.ok ?? result?.status !== 'failed',
      status: result?.status ?? 'simulated',
      provider: result?.provider ?? (result?.status === 'simulated' ? 'simulation' : 'unknown'),
      providerMessageId: result?.providerMessageId ?? '',
      errorMessage: result?.error ?? result?.errorMessage ?? result?.reason ?? '',
      reason: result?.reason ?? '',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Route API email indisponible.'

    return {
      ok: true,
      status: 'simulated',
      provider: 'simulation',
      providerMessageId: '',
      reason: `api_unavailable: ${message}`,
      errorMessage: 'L’envoi automatique sera disponible après configuration Gmail.',
    }
  }
}

export function createEmailHistoryItem(type: EmailKey, recipient: string, rendered: RenderedEmail, result: SendEmailResult): EmailHistoryItem {
  return {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    recipient,
    subject: rendered.subject,
    status: result.status,
    provider: result.provider,
    sentAt: new Date().toISOString(),
    providerMessageId: result.providerMessageId,
    errorMessage: result.errorMessage,
  }
}

export async function sendTestEmail() {
  return sendEmail({
    type: 'spaceCreated',
    projectId: 'email-test',
    to: {
      email: 'admin',
      name: 'Signature Digital',
    },
    subject: 'Test email Signature Digital',
    body: 'Ceci est un test dâ€™envoi email depuis Signature Digital.',
  })
}

async function readEmailResponse(response: Response) {
  try {
    return await response.json() as ApiEmailResponse
  } catch {
    return undefined
  }
}
