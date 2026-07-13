import type { CommercialOfferSnapshot } from '../data/commercialOfferStore'
import type { StripeCheckoutMode } from '../data/projectStore'

export type CreateStripeCheckoutInput = {
  projectId: string
  activationToken: string
  agencyId: string
  agencySlug: string
  agencyStatus?: string
  clientEmail?: string
  offerSnapshot: CommercialOfferSnapshot
}

export type CreateStripeCheckoutResult = {
  ok: boolean
  url?: string
  sessionId?: string
  status?: 'pending' | 'error'
  mode?: StripeCheckoutMode
  message?: string
}

export async function createStripeCheckoutSession(input: CreateStripeCheckoutInput): Promise<CreateStripeCheckoutResult> {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })

  const result = await response.json().catch(() => ({})) as CreateStripeCheckoutResult

  if (!response.ok) {
    return {
      ok: false,
      status: 'error',
      message: result.message || 'Creation du paiement impossible.',
    }
  }

  return result
}
