import { useState } from 'react'
import {
  createCommercialOfferSnapshot,
  formatCommercialAmount,
  formatRecurringInterval,
  readActiveCommercialOffer,
  resolveCommercialOfferForProject,
} from '../../data/commercialOfferStore'
import type { Project } from '../../data/projectStore'
import { getProjectSourceLabel } from '../../data/projectStore'
import { getRealEstateAgencyRuntimeBySlug } from '../../data/realEstateAgencyConfig'
import {
  createConsentRecord,
  getOrCreateVisitorId,
  saveConsentRecord,
} from '../../lib/agencyCompliance'
import { createStripeCheckoutSession } from '../../lib/stripeCheckoutClient'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'

export function ActivationPage({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  const agencyName = project.companyName || project.generatedAgencyId || 'Votre agence'
  const offer = resolveCommercialOfferForProject(project)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  async function startCheckout() {
    if (pending) return
    setPending(true)
    setError('')

    if (!termsAccepted) {
      setError("Acceptez les conditions commerciales avant de continuer.")
      setPending(false)
      return
    }

    if (!project.generatedAgencyId) {
      setError("Agence introuvable. Creez d'abord la demo moteur avant le paiement.")
      setPending(false)
      return
    }

    const offerSnapshot = project.commercialOfferSnapshot ?? createCommercialOfferSnapshot(readActiveCommercialOffer())
    const agencyRuntime = project.generatedAgencyId
      ? getRealEstateAgencyRuntimeBySlug(project.generatedAgencyId)
      : undefined

    try {
      saveConsentRecord(createConsentRecord({
        agencyId: project.generatedAgencyId,
        visitorId: getOrCreateVisitorId(project.generatedAgencyId),
        purpose: 'commercial-terms',
        decision: 'accepted',
        policyVersion: offerSnapshot.capturedAt,
      }))
      const result = await createStripeCheckoutSession({
        projectId: project.id,
        activationToken: project.trackingToken || project.id,
        agencyId: project.generatedAgencyId,
        agencySlug: project.generatedAgencyId,
        agencyStatus: agencyRuntime?.modelConfig.status,
        clientEmail: project.email,
        offerSnapshot,
      })

      if (!result.ok || !result.url || !result.sessionId || !result.mode) {
        throw new Error(result.message || 'Paiement indisponible.')
      }

      onUpdate({
        commercialOfferSnapshot: offerSnapshot,
        paymentStatus: 'envoyé',
        paymentSimpleStatus: 'en attente',
        stripeCheckout: {
          sessionId: result.sessionId,
          status: 'pending',
          mode: result.mode,
          createdAt: new Date().toISOString(),
        },
        lastClientAction: 'Paiement Stripe ouvert',
        nextAction: 'Attendre confirmation Stripe via webhook avant activation.',
      })
      window.location.assign(result.url)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Paiement indisponible.')
      onUpdate({
        stripeCheckout: {
          ...project.stripeCheckout,
          status: 'error',
          mode: project.stripeCheckout.mode ?? 'test',
        },
      })
      setPending(false)
    }
  }

  return (
    <main className="activation-page">
      <section className="tracking-hero">
        <div>
          <p className="sd-eyebrow">Activation commerciale</p>
          <h1>{agencyName} peut passer en agence active</h1>
          <p>
            La plateforme complete est disponible apres activation. Le paiement est traite par Stripe Checkout,
            puis confirme cote serveur avant toute activation technique.
          </p>
        </div>
      </section>

      <Card className="value-card">
        <SectionTitle title="Ce que nous avons compris" />
        <div className="activation-grid">
          <TagPanel label="Priorites" values={project.pains} fallback={project.pain} />
          <TagPanel label="Objectifs" values={project.goals} fallback={project.goal} />
        </div>
      </Card>

      <Card className="value-card">
        <SectionTitle title="Ce que l'activation comprend" />
        <p className="activation-source">Prepare a partir de {getProjectSourceLabel(project)} et de vos priorites.</p>
        <div className="included-grid">
          {offer.includedFeatures.map((item) => <span key={item}>{item}</span>)}
        </div>
      </Card>

      <Card className="offer-card">
        <p className="sd-eyebrow">{offer.name}</p>
        <div>
          <span>Installation</span>
          <strong>{formatCommercialAmount(offer.installationAmount, offer.currency)}</strong>
        </div>
        <div>
          <span>Abonnement</span>
          <strong>{formatCommercialAmount(offer.recurringAmount, offer.currency)}/{formatRecurringInterval(offer.recurringInterval)}</strong>
        </div>
        <p>{offer.description}</p>
        <label className="activation-terms">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>J'accepte les conditions commerciales applicables a l'activation de cette agence.</span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <Button onClick={() => void startCheckout()} loading={pending} disabled={pending || !termsAccepted}>
          Continuer vers le paiement securise
        </Button>
      </Card>
    </main>
  )
}

function TagPanel({ label, values, fallback }: { label: string; values: string[]; fallback: string }) {
  const list = values.length > 0 ? values : [fallback].filter(Boolean)

  return (
    <div className="tracking-info">
      <span>{label}</span>
      <div className="tag-list">
        {list.map((item) => <i key={item}>{item}</i>)}
      </div>
    </div>
  )
}
