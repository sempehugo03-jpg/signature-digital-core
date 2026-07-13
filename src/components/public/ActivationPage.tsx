import type { Project } from '../../data/projectStore'
import { getProjectSourceLabel } from '../../data/projectStore'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'

export function ActivationPage({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  const agencyName = project.companyName || project.generatedAgencyId || 'Votre agence'

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
          {[
            'Adaptation finale de la demo validee',
            'Mise en ligne',
            'Configuration des acces',
            'Plateforme complete apres activation',
            'Accompagnement initial',
            'Suivi apres activation',
          ].map((item) => <span key={item}>{item}</span>)}
        </div>
      </Card>

      <Card className="offer-card">
        <div>
          <span>Installation</span>
          <strong>1 000 €</strong>
        </div>
        <div>
          <span>Abonnement</span>
          <strong>250 €/mois</strong>
        </div>
        <p>
          Ces montants sont informatifs a cette etape. Le paiement sera traite dans le parcours d'activation dedie.
        </p>
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
