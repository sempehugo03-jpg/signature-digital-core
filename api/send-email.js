import nodemailer from 'nodemailer'

const gmailHost = 'smtp.gmail.com'
const gmailPort = 465

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ status: 'failed', errorMessage: 'Method not allowed' })
    return
  }

  const provider = process.env.EMAIL_PROVIDER
  const gmailUser = process.env.GMAIL_USER
  const gmailPassword = process.env.GMAIL_APP_PASSWORD
  const from = process.env.EMAIL_FROM || 'Signature Digital <signature.digital.contact@gmail.com>'
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || gmailUser

  if (provider !== 'gmail' || !gmailUser || !gmailPassword) {
    response.status(200).json({
      status: 'simulated',
      providerMessageId: '',
      errorMessage: 'L’envoi automatique sera disponible après configuration Gmail.',
    })
    return
  }

  try {
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
    const recipient = payload?.to?.email === 'admin' ? adminEmail : payload?.to?.email

    if (!recipient || !payload?.subject || !payload?.body) {
      response.status(400).json({
        status: 'failed',
        providerMessageId: '',
        errorMessage: 'Email incomplet.',
      })
      return
    }

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
    })

    response.status(200).json({
      status: 'sent',
      providerMessageId: sent.messageId || '',
      errorMessage: '',
    })
  } catch (error) {
    response.status(200).json({
      status: 'failed',
      providerMessageId: '',
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue pendant l’envoi.',
    })
  }
}
