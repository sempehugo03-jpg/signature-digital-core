import {
  formatCommercialAmount,
  formatRecurringInterval,
  resolveCommercialOfferForProject,
} from '../../data/commercialOfferStore'
import type { Project } from '../../data/projectStore'
import { getProjectSourceLabel } from '../../data/projectStore'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'

export function ActivationPage({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  const agencyName = project.companyName || project.generatedAgencyId || 'Votre agence'
  const offer = resolveCommercialOfferForProject(project)

  function activate() {
    onUpdate({
      paymentStatus: 'envoyé',
      paymentSimpleStatus: 'en attente',
      status: 'approved',
      emailLog: { ...project.emailLog, paymentAvailable: true },
      lastClientAction: 'Activation consultee',
      nextAction: 'Validation commerciale recue. Creer les acces puis activer techniquement l agence.',
    })
  }

  return (
    <main className="activation-page">
      <section className="tracking-hero">
        <div>
          <p className="sd-eyebrow">Activation commerciale</p>
          <h1>{agencyName} peut passer en agence active</h1>
          <p>
            La plateforme complete est disponible apres activation. La demo reste consultable, mais les actions reelles
            restent verrouillees jusqu'a la validation commerciale et technique par Signature Digital.
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
        <Button onClick={activate}>Continuer vers l'activation</Button>
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
