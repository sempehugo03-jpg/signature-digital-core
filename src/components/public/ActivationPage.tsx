import type { Project } from '../../data/projectStore'
import { getProjectSourceLabel } from '../../data/projectStore'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'

export function ActivationPage({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  function activate() {
    onUpdate({
      paymentStatus: 'envoyé',
      paymentSimpleStatus: 'en attente',
      status: 'demo_validated',
      emailLog: { ...project.emailLog, paymentAvailable: true },
      lastClientAction: 'Activation consultée',
      nextAction: 'suivre le paiement client',
    })
  }

  return (
    <main className="activation-page">
      <section className="tracking-hero">
        <div>
          <p className="sd-eyebrow">Activation commerciale</p>
          <h1>Votre démo est prête à devenir active</h1>
          <p>
            Votre expérience a été préparée à partir de votre demande, de {getProjectSourceLabel(project)} et de vos priorités.
            Cette activation commerciale valide le lancement, le paiement et l'accompagnement. Le statut technique de la plateforme reste suivi par Signature Digital.
          </p>
        </div>
      </section>

      <Card className="value-card">
        <SectionTitle title="Ce que nous avons compris" />
        <div className="activation-grid">
          <TagPanel label="Priorités" values={project.pains} fallback={project.pain} />
          <TagPanel label="Objectifs" values={project.goals} fallback={project.goal} />
        </div>
      </Card>

      <Card className="value-card">
        <SectionTitle title="Ce que l’activation comprend" />
        <div className="included-grid">
          {[
            'Adaptation finale de la démo validée',
            'Mise en ligne',
            'Configuration des accès',
            'Préparation des emails',
            'Accompagnement initial',
            'Suivi après activation',
          ].map((item) => <span key={item}>{item}</span>)}
        </div>
      </Card>

      <Card className="offer-card">
        <div>
          <span>Installation</span>
          <strong>2 000 €</strong>
        </div>
        <div>
          <span>Accompagnement</span>
          <strong>400 €/mois</strong>
        </div>
        <p>
          Une mise en place sur mesure, pensée pour transformer la direction validée en expérience stable,
          lisible et exploitable.
        </p>
        <Button onClick={activate}>Valider l’activation commerciale</Button>
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
