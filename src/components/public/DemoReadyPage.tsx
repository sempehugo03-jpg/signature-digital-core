import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Project } from '../../data/projectStore'
import { getActivationPath, getProjectLovableUrl, getProjectSourceLabel } from '../../data/projectStore'
import { enqueueAndSendEmailEvent } from '../../lib/emailEventSystem'
import { Button, Card, SectionTitle, TextArea } from '../shared/DesignSystem'

const demoFeatures = [
  'Formulaire de contact',
  'Demande de rappel',
  'Espace client',
  'Documents',
  'Prise de rendez-vous',
  'Paiement',
  'Suivi de dossier',
  'Notifications',
  'Estimation',
  'Pages services',
]

const adjustmentChoices = ['Texte', 'Couleurs', 'Style général', 'Section', 'Bouton', 'Fonctionnalité', 'Espace client', 'Autre']

export function DemoReadyPage({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  const [lockedMessage, setLockedMessage] = useState('')
  const [adjustmentCategory, setAdjustmentCategory] = useState(project.adjustmentCategory || adjustmentChoices[0])
  const [adjustmentMessage, setAdjustmentMessage] = useState('')
  const [sent, setSent] = useState(false)
  const activated = project.status === 'active'
  const demoUrl = getProjectLovableUrl(project)
  const plannedFeatures = project.features.length > 0 ? project.features : demoFeatures

  function handleLockedClick(feature: string) {
    if (activated) {
      setLockedMessage(`${feature} est disponible dans votre espace actif.`)
      return
    }

    setLockedMessage('Cette fonctionnalité fait partie de votre expérience finale. Elle sera activée après validation de votre projet et mise en service de votre espace.')
  }

  function requestCallback() {
    const updates: Partial<Project> = {
      callbackRequested: true,
      lastClientAction: 'Rappel demandé',
      nextAction: 'appeler le client',
    }
    const updatedProject = { ...project, ...updates }
    enqueueAndSendEmailEvent({ event: 'callback-request-client', project: updatedProject })
    enqueueAndSendEmailEvent({
      event: 'callback-request-agency',
      project: updatedProject,
      recipient: { email: 'admin', name: 'Signature Digital' },
      idempotencyKey: `callback-request-agency|${project.id}|${Date.now()}`,
    })
    onUpdate(updates)
  }

  function submitAdjustment(event: FormEvent) {
    event.preventDefault()
    const updates: Partial<Project> = {
      adjustmentCategory,
      adjustmentMessage,
      lastClientAction: 'Ajustements demandés',
      nextAction: 'traiter les ajustements',
      status: 'demo_sent',
    }
    const updatedProject = { ...project, ...updates }
    enqueueAndSendEmailEvent({ event: 'client-changes-recorded', project: updatedProject })
    onUpdate(updates)
    setSent(true)
  }

  return (
    <main className="demo-ready-page">
      <section className="tracking-hero">
        <div>
          <p className="sd-eyebrow">Démo prête</p>
          <h1>Votre démo est prête</h1>
          <p>
            Votre démo n’est pas une maquette générique. Elle a été préparée à partir de {getProjectSourceLabel(project)},
            de vos réponses et de vos objectifs.
          </p>
        </div>
        <Card className="tracking-summary-card">
          <Info label="Entreprise" value={project.companyName} />
          <TagInfo label="Priorités sélectionnées" values={project.pains} fallback={project.pain} />
          <TagInfo label="Objectifs sélectionnés" values={project.goals} fallback={project.goal} />
        </Card>
      </section>

      <Card className="value-card">
        <SectionTitle title="Ce qui a été préparé" />
        <p>
          Une expérience pensée pour rendre votre valeur plus lisible, rassurer avant le premier contact et
          installer une perception plus premium dès l’arrivée sur votre site.
        </p>
        <div className="inline-actions">
          <Button disabled={!demoUrl} onClick={() => window.open(demoUrl, '_blank', 'noopener,noreferrer')}>{demoUrl ? 'Découvrir ma démo' : 'Démo bientôt disponible'}</Button>
          <Button variant="secondary" onClick={() => document.getElementById('demo-adjustments')?.scrollIntoView({ behavior: 'smooth' })}>Demander des ajustements</Button>
          <Button variant="secondary" onClick={() => void requestCallback()}>Être rappelé</Button>
          <Button variant="secondary" onClick={() => onUpdate({ lastClientAction: 'Direction validée', nextAction: 'préparer le paiement', status: 'demo_validated', paymentSimpleStatus: 'en attente' })}>Valider cette direction</Button>
        </div>
      </Card>

      <Card className="value-card">
        <SectionTitle
          title="Fonctionnalités prévues"
          text="Vous pouvez voir l'ensemble de l'experience cible. Les actions engageantes deviennent disponibles apres validation et activation."
        />
        <div className="feature-lock-grid">
          {plannedFeatures.map((feature) => (
            <button type="button" key={feature} onClick={() => handleLockedClick(feature)}>
              <strong>{feature}</strong>
              <span>{activated ? 'Disponible' : 'Disponible après activation'}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="tracking-form-card" id="demo-adjustments">
        <form onSubmit={submitAdjustment}>
          <SectionTitle title="Demander des ajustements" />
          <label className="sd-field">
            <span>Type d’ajustement</span>
            <select value={adjustmentCategory} onChange={(event) => setAdjustmentCategory(event.target.value)}>
              {adjustmentChoices.map((choice) => <option key={choice}>{choice}</option>)}
            </select>
          </label>
          <TextArea label="Expliquez ce que vous souhaitez modifier." value={adjustmentMessage} onChange={setAdjustmentMessage} />
          {sent && <p className="client-success">Vos ajustements ont bien été transmis.</p>}
          <Button type="submit">Envoyer mes ajustements</Button>
        </form>
      </Card>

      <Card className="activation-teaser">
        <SectionTitle title="Prêt à activer ?" text="L’activation transforme cette démo en expérience utilisable, configurée et prête à être exploitée." />
        <Button onClick={() => window.location.assign(getActivationPath(project))}>Voir l’activation</Button>
      </Card>

      {lockedMessage && (
        <div className="locked-modal-backdrop" role="presentation">
          <Card className="locked-modal">
            <p className="sd-eyebrow">Disponible après activation</p>
            <h2>Disponible après activation</h2>
            <p>{lockedMessage}</p>
            <Button onClick={() => setLockedMessage('')}>Compris</Button>
          </Card>
        </div>
      )}
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="tracking-info">
      <span>{label}</span>
      <strong>{value || 'À compléter'}</strong>
    </div>
  )
}

function TagInfo({ label, values, fallback }: { label: string; values: string[]; fallback: string }) {
  const list = values.length > 0 ? values : [fallback].filter(Boolean)

  return (
    <div className="tracking-info wide-info">
      <span>{label}</span>
      <div className="tag-list">
        {list.map((item) => <i key={item}>{item}</i>)}
      </div>
    </div>
  )
}
