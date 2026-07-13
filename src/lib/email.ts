import type { EmailHistoryItem, EmailKey, Project } from '../data/projectStore'
import { getActivationPath, getDemoReadyPath, getProjectSourceLabel, getTrackingUrl } from '../data/projectStore'

type EmailRecipient = {
  email: string
  name?: string
}

type RenderedEmail = {
  subject: string
  body: string
  html?: string
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


type ProjectEmailVariables = {
  firstName: string
  companyName: string
  sector: string
  city: string
  hasWebsite: boolean
  currentWebsite: string
  businessDescription: string
  pains: string[]
  goals: string[]
  features: string[]
  style: string
  message: string
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
  demoReady: (variables) => ({
    subject: 'Votre démo Signature Digital est prête',
    body: `Bonjour ${variables.firstName},

Votre première démo personnalisée pour ${variables.companyName} est prête.

Elle a été préparée à partir de votre demande, de ${variables.sourceLabel}, de vos priorités et des fonctionnalités sélectionnées.

Votre démo est disponible depuis votre espace de suivi Signature Digital.

Accéder à mon espace de suivi :
${variables.trackingUrl}

Depuis votre espace, vous pourrez :

- découvrir votre démo
- suivre l’avancement
- demander un ajustement
- ajouter une précision
- valider la direction proposée

À bientôt,

Hugo — Signature Digital`,
    html: renderDemoReadyHtml(variables),
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

emailTemplates.spaceCreated = createSpaceCreatedEmail

function createSpaceCreatedEmail(variables: ProjectEmailVariables): RenderedEmail {
  const siteText = variables.hasWebsite
    ? `Site actuel :
${variables.currentWebsite || 'Non renseigné'}`
    : `Site actuel :
Pas encore de site

Description de l’activité :
${variables.businessDescription || 'Description non renseignée'}`
  const messageText = variables.message || 'Aucun message complémentaire'
  const sourceText = variables.hasWebsite
    ? 'à partir de votre site actuel, de vos réponses et de vos objectifs'
    : 'à partir de votre activité, de vos réponses et de vos objectifs'

  const body = `Bonjour ${variables.firstName},

Votre demande de démo pour ${variables.companyName} est bien enregistrée.

Nous avons reçu les informations nécessaires pour préparer une première proposition personnalisée autour de votre activité, de vos objectifs et des points que vous souhaitez améliorer.

Récapitulatif de votre demande :

Entreprise :
${variables.companyName}

Secteur :
${variables.sector}

Ville :
${variables.city}

${siteText}

Priorités indiquées :
${renderTextList(variables.pains)}

Objectifs :
${renderTextList(variables.goals)}

Fonctionnalités souhaitées :
${renderTextList(variables.features)}

Style recherché :
${variables.style || 'Non renseigné'}

Message complémentaire :
${messageText}

Votre espace de suivi est disponible ici :
Accéder à mon espace de suivi
${variables.trackingUrl}

Conservez ce lien : il vous permettra de suivre l’avancement de votre demande, de retrouver votre démo lorsqu’elle sera prête, d’ajouter une précision ou de demander un rappel si besoin.

Votre démo sera préparée ${sourceText}.

À très vite,

Signature Digital`

  return {
    subject: 'Votre demande Signature Digital est bien enregistrée',
    body,
    html: renderSpaceCreatedHtml(variables, sourceText, messageText),
  }
}

export function getEmailVariablesFromProject(project: Project): ProjectEmailVariables {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://signature-digital.fr'

  return {
    firstName: project.firstName || '',
    companyName: project.companyName,
    sector: project.sector,
    city: project.city,
    hasWebsite: project.hasWebsite,
    currentWebsite: project.currentWebsite,
    businessDescription: project.businessDescription,
    pains: getEmailList(project.pains, project.pain),
    goals: getEmailList(project.goals, project.goal),
    features: project.features,
    style: project.style,
    message: project.message,
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

function renderSpaceCreatedHtml(variables: ProjectEmailVariables, sourceText: string, messageText: string) {
  const siteRows = variables.hasWebsite
    ? renderInfoRow('Site actuel', variables.currentWebsite || 'Non renseigné')
    : `${renderInfoRow('Site actuel', 'Pas encore de site')}
      ${renderInfoRow('Description de l’activité', variables.businessDescription || 'Description non renseignée')}`

  return `<!doctype html>
<html>
  <body style="margin:0;background:#050816;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <div style="border:1px solid #252B3A;border-radius:18px;background:#0E1320;padding:28px;">
        <p style="margin:0 0 18px;color:#8B5CF6;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Signature Digital</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#F8FAFC;">Votre demande est bien enregistrée</h1>
        <p style="margin:0 0 16px;color:#A7ADBC;line-height:1.7;">Bonjour ${escapeHtml(variables.firstName)},</p>
        <p style="margin:0 0 18px;color:#A7ADBC;line-height:1.7;">Votre demande de démo pour <strong style="color:#F8FAFC;">${escapeHtml(variables.companyName)}</strong> est bien enregistrée.</p>
        <p style="margin:0 0 24px;color:#A7ADBC;line-height:1.7;">Nous avons reçu les informations nécessaires pour préparer une première proposition personnalisée autour de votre activité, de vos objectifs et des points que vous souhaitez améliorer.</p>

        <h2 style="margin:0 0 14px;font-size:18px;color:#F8FAFC;">Récapitulatif de votre demande</h2>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 22px;">
          ${renderInfoRow('Entreprise', variables.companyName)}
          ${renderInfoRow('Secteur', variables.sector)}
          ${renderInfoRow('Ville', variables.city)}
          ${siteRows}
          ${renderInfoRow('Style recherché', variables.style || 'Non renseigné')}
        </table>

        <div style="margin:0 0 18px;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#F8FAFC;">Priorités indiquées</h3>
          ${renderHtmlList(variables.pains)}
        </div>
        <div style="margin:0 0 18px;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#F8FAFC;">Objectifs</h3>
          ${renderHtmlList(variables.goals)}
        </div>
        <div style="margin:0 0 18px;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#F8FAFC;">Fonctionnalités souhaitées</h3>
          ${renderHtmlList(variables.features)}
        </div>

        <div style="margin:0 0 22px;padding:16px;border:1px solid #252B3A;border-radius:14px;background:#111827;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#F8FAFC;">Message complémentaire</h3>
          <p style="margin:0;color:#A7ADBC;line-height:1.7;">${escapeHtml(messageText)}</p>
        </div>

        <p style="margin:0 0 18px;color:#A7ADBC;line-height:1.7;">Votre espace de suivi est disponible ici :</p>
        <a href="${escapeHtml(variables.trackingUrl)}" style="display:inline-block;margin:0 0 22px;padding:14px 18px;border-radius:999px;background:linear-gradient(135deg,#7C3AED,#0F172A);color:#ffffff;text-decoration:none;font-weight:700;">Accéder à mon espace de suivi</a>
        <p style="margin:0 0 16px;color:#A7ADBC;line-height:1.7;">Conservez ce lien : il vous permettra de suivre l’avancement de votre demande, de retrouver votre démo lorsqu’elle sera prête, d’ajouter une précision ou de demander un rappel si besoin.</p>
        <p style="margin:0 0 24px;color:#A7ADBC;line-height:1.7;">Votre démo sera préparée ${escapeHtml(sourceText)}.</p>
        <p style="margin:0;color:#F8FAFC;line-height:1.7;">À très vite,<br>Signature Digital</p>
      </div>
    </div>
  </body>
</html>`
}

function renderDemoReadyHtml(variables: ProjectEmailVariables) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#050816;color:#F8FAFC;font-family:Inter,Arial,sans-serif;">
    <div style="padding:28px 14px;background:#050816;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #252B3A;border-radius:24px;background:#0E1320;overflow:hidden;">
        <div style="padding:26px 24px;border-bottom:1px solid #252B3A;background:#070A12;">
          <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#A7ADBC;">Signature Digital</div>
          <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2;color:#F8FAFC;">Votre démo est prête</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;color:#F8FAFC;line-height:1.7;">Bonjour ${escapeHtml(variables.firstName)},</p>
          <p style="margin:0 0 16px;color:#A7ADBC;line-height:1.7;">Votre première démo personnalisée pour <strong style="color:#F8FAFC;">${escapeHtml(variables.companyName)}</strong> est prête.</p>
          <p style="margin:0 0 18px;color:#A7ADBC;line-height:1.7;">Elle a été préparée à partir de votre demande, de ${escapeHtml(variables.sourceLabel)}, de vos priorités et des fonctionnalités sélectionnées.</p>

          <div style="margin:0 0 22px;padding:16px;border:1px solid #252B3A;border-radius:14px;background:#111827;">
            <h2 style="margin:0 0 8px;font-size:17px;color:#F8FAFC;">Votre espace de suivi centralise la suite</h2>
            <p style="margin:0;color:#A7ADBC;line-height:1.7;">Vous pourrez y découvrir votre démo, suivre l’avancement, demander un ajustement, ajouter une précision ou valider la direction proposée.</p>
          </div>

          <a href="${escapeHtml(variables.trackingUrl)}" style="display:inline-block;margin:0 0 22px;padding:14px 18px;border-radius:999px;background:linear-gradient(135deg,#7C3AED,#0F172A);color:#ffffff;text-decoration:none;font-weight:700;">Accéder à mon espace de suivi</a>
          <p style="margin:0;color:#F8FAFC;line-height:1.7;">À bientôt,<br>Hugo — Signature Digital</p>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function renderTextList(values: string[]) {
  return values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : '- Non renseigné'
}

function renderInfoRow(label: string, value: string) {
  return `<tr>
    <td style="width:38%;padding:10px 12px 10px 0;border-top:1px solid #252B3A;color:#A7ADBC;font-size:13px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-top:1px solid #252B3A;color:#F8FAFC;font-size:14px;line-height:1.5;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`
}

function renderHtmlList(values: string[]) {
  const list = values.length > 0 ? values : ['Non renseigné']

  return `<ul style="margin:0;padding:0;list-style:none;">${list.map((value) => (
    `<li style="margin:0 0 8px;padding:10px 12px;border:1px solid #252B3A;border-radius:12px;background:#151B2E;color:#F8FAFC;">${escapeHtml(value)}</li>`
  )).join('')}</ul>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getEmailList(values: string[], fallback: string) {
  return values.length > 0 ? values : [fallback].filter(Boolean)
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
  void input

  return {
    ok: true,
    status: 'simulated',
    provider: 'email-event-system',
    providerMessageId: '',
    reason: 'simulated_outbox_only',
    errorMessage: '',
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
