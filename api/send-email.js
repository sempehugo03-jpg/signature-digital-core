import nodemailer from 'nodemailer'

const gmailHost = 'smtp.gmail.com'
const gmailPort = 465
const defaultFrom = 'Signature Digital <signature.digital.contact@gmail.com>'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({
      ok: false,
      status: 'failed',
      provider: 'unknown',
      error: 'Method not allowed',
    })
    return
  }

  let payload
  try {
    payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
  } catch {
    response.status(400).json({
      ok: false,
      status: 'failed',
      provider: 'unknown',
      error: 'Payload JSON invalide.',
      providerMessageId: '',
    })
    return
  }

  const provider = process.env.EMAIL_PROVIDER
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD
  const emailFrom = process.env.EMAIL_FROM
  const from = emailFrom || defaultFrom
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  const recipient = payload?.to?.email === 'admin' ? adminEmail : payload?.to?.email

  if (!recipient || !payload?.subject || !payload?.body) {
    console.warn('[email] failed send: incomplete payload', {
      hasRecipient: Boolean(recipient),
      hasSubject: Boolean(payload?.subject),
      hasBody: Boolean(payload?.body),
    })
    response.status(400).json({
      ok: false,
      status: 'failed',
      provider: 'unknown',
      error: 'Email incomplet.',
      providerMessageId: '',
    })
    return
  }

  if (!isValidEmail(recipient)) {
    console.warn('[email] failed send: invalid recipient')
    response.status(400).json({
      ok: false,
      status: 'failed',
      provider: 'unknown',
      error: 'Destinataire invalide.',
      providerMessageId: '',
    })
    return
  }

  const missingVariables = getMissingVariables({ provider, emailFrom, gmailUser, gmailPassword, adminEmail })

  console.info('[email] provider detected', {
    provider: provider || 'missing',
    emailFromPresent: Boolean(emailFrom),
    gmailUserPresent: Boolean(gmailUser),
    gmailAppPasswordPresent: Boolean(gmailPassword),
    adminNotificationEmailPresent: Boolean(adminEmail),
  })

  if (missingVariables.length > 0) {
    const reason = `missing env vars: ${missingVariables.join(', ')}`
    console.warn('[email] simulated send', { reason })
    response.status(200).json({
      ok: true,
      status: 'simulated',
      provider: 'simulation',
      reason,
      providerMessageId: '',
    })
    return
  }

  try {
    console.info('[email] sending via Gmail SMTP', {
      to: recipient,
      subject: payload.subject,
      host: gmailHost,
      port: gmailPort,
    })

    const transporter = nodemailer.createTransport({
      host: gmailHost,
      port: gmailPort,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })

    const sent = await transporter.sendMail({
      from,
      to: recipient,
      subject: payload.subject,
      text: payload.body,
      html: payload.html,
    })

    console.info('[email] sent via Gmail SMTP', {
      to: recipient,
      providerMessageId: sent.messageId || '',
    })

    response.status(200).json({
      ok: true,
      status: 'sent',
      provider: 'gmail',
      providerMessageId: sent.messageId || '',
    })
  } catch (error) {
    const cleanedError = cleanError(error)
    console.error('[email] Gmail SMTP failed', { error: cleanedError })
    response.status(200).json({
      ok: false,
      status: 'failed',
      provider: 'gmail',
      error: cleanedError,
      providerMessageId: '',
    })
  }
}

function getMissingVariables({ provider, emailFrom, gmailUser, gmailPassword, adminEmail }) {
  const missing = []
  if (provider !== 'gmail') missing.push('EMAIL_PROVIDER')
  if (!emailFrom) missing.push('EMAIL_FROM')
  if (!gmailUser) missing.push('GMAIL_USER')
  if (!gmailPassword) missing.push('GMAIL_APP_PASSWORD')
  if (!adminEmail) missing.push('ADMIN_NOTIFICATION_EMAIL')

  return missing
}

function cleanError(error) {
  if (!(error instanceof Error)) return 'Erreur inconnue pendant l envoi.'

  return error.message
    .replace(/pass=["']?[^"',\s}]+/gi, 'pass=[hidden]')
    .replace(/GMAIL_APP_PASSWORD=["']?[^"',\s}]+/gi, 'GMAIL_APP_PASSWORD=[hidden]')
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
