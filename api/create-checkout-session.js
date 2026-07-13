import Stripe from 'stripe'

const stripeApiVersion = '2025-11-17.clover'
const allowedCurrencies = new Set(['EUR'])
const allowedIntervals = new Set(['month'])

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, message: 'Method not allowed.' })
    return
  }

  try {
    const body = await readBody(request)
    const checkoutMode = resolveCheckoutMode()
    const priceIds = resolveStripePriceIds(checkoutMode)
    const validation = validateCheckoutRequest(body, priceIds)

    if (!validation.ok) {
      response.status(validation.status).json({ ok: false, message: validation.message })
      return
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      response.status(500).json({ ok: false, message: 'Stripe non configure cote serveur.' })
      return
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion })
    const publicUrl = resolvePublicUrl(request)
    const offerSnapshot = body.offerSnapshot
    const idempotencyKey = [
      'activation-checkout',
      body.projectId,
      body.agencyId || body.generatedAgencyId,
      offerSnapshot.offerId,
      offerSnapshot.capturedAt || 'no-capture',
      checkoutMode,
    ].join(':')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: priceIds.recurring, quantity: 1 },
        { price: priceIds.installation, quantity: 1 },
      ],
      customer_email: normalizeEmail(body.clientEmail),
      success_url: `${publicUrl}/paiement/succes?projectId=${encodeURIComponent(body.projectId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/paiement/annule?projectId=${encodeURIComponent(body.projectId)}`,
      metadata: {
        projectId: body.projectId,
        agencyId: body.agencyId || body.generatedAgencyId,
        agencySlug: body.agencySlug || '',
        offerId: offerSnapshot.offerId,
        offerSnapshotCapturedAt: offerSnapshot.capturedAt || '',
        checkoutMode,
      },
      subscription_data: {
        metadata: {
          projectId: body.projectId,
          agencyId: body.agencyId || body.generatedAgencyId,
          agencySlug: body.agencySlug || '',
          offerId: offerSnapshot.offerId,
          offerSnapshotCapturedAt: offerSnapshot.capturedAt || '',
          checkoutMode,
        },
      },
    }, { idempotencyKey })

    response.status(200).json({
      ok: true,
      url: session.url,
      sessionId: session.id,
      status: 'pending',
      mode: checkoutMode,
    })
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Creation Stripe Checkout impossible.',
    })
  }
}

function validateCheckoutRequest(body, priceIds) {
  if (!body || typeof body !== 'object') return invalid('Requete invalide.')
  if (!body.projectId) return invalid('Projet introuvable.')
  if (!body.activationToken) return invalid("Token d'activation invalide.")
  if (!body.agencyId && !body.generatedAgencyId) return invalid('Agence introuvable.')
  if (!body.agencySlug) return invalid('Slug agence introuvable.')
  if (body.agencyStatus === 'active') return invalid('Agence deja active.', 409)
  if (!body.offerSnapshot || typeof body.offerSnapshot !== 'object') return invalid('Snapshot tarifaire absent ou invalide.')
  if (!body.offerSnapshot.offerId) return invalid('Offre tarifaire invalide.')
  if (!body.offerSnapshot.capturedAt) return invalid('Date de capture tarifaire absente.')
  if (!Number.isInteger(body.offerSnapshot.installationAmount) || body.offerSnapshot.installationAmount <= 0) return invalid("Montant d'installation invalide.")
  if (!Number.isInteger(body.offerSnapshot.recurringAmount) || body.offerSnapshot.recurringAmount <= 0) return invalid("Montant d'abonnement invalide.")
  if (!allowedCurrencies.has(body.offerSnapshot.currency)) return invalid('Devise invalide.')
  if (!allowedIntervals.has(body.offerSnapshot.recurringInterval)) return invalid('Periodicite invalide.')
  if (!priceIds.installation) return invalid('Price ID Stripe installation absent.', 500)
  if (!priceIds.recurring) return invalid('Price ID Stripe abonnement absent.', 500)
  if (body.offerSnapshot.stripeInstallationPriceId && body.offerSnapshot.stripeInstallationPriceId !== priceIds.installation) {
    return invalid('Price ID Stripe installation non autorise.', 403)
  }
  if (body.offerSnapshot.stripeRecurringPriceId && body.offerSnapshot.stripeRecurringPriceId !== priceIds.recurring) {
    return invalid('Price ID Stripe abonnement non autorise.', 403)
  }

  return { ok: true, status: 200, message: '' }
}

function invalid(message, status = 400) {
  return { ok: false, status, message }
}

function resolveCheckoutMode() {
  return process.env.STRIPE_CHECKOUT_MODE === 'live' ? 'live' : 'test'
}

function resolveStripePriceIds(mode) {
  const suffix = mode === 'live' ? 'LIVE' : 'TEST'

  return {
    installation: process.env[`STRIPE_INSTALLATION_PRICE_ID_${suffix}`] || process.env.STRIPE_INSTALLATION_PRICE_ID || '',
    recurring: process.env[`STRIPE_RECURRING_PRICE_ID_${suffix}`] || process.env.STRIPE_RECURRING_PRICE_ID || '',
  }
}

function resolvePublicUrl(request) {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.VITE_PUBLIC_APP_URL) return process.env.VITE_PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')

  const proto = request.headers['x-forwarded-proto'] || 'http'
  const host = request.headers.host || 'localhost:5173'
  return `${proto}://${host}`.replace(/\/$/, '')
}

function normalizeEmail(value) {
  const email = String(value || '').trim()
  return /.+@.+\..+/.test(email) ? email : undefined
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
