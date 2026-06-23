import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Project } from '../../data/projectStore'
import { formatDate, getActivationPath, getDemoReadyPath, getProjectSourceLabel } from '../../data/projectStore'
import { Button, Card, SectionTitle, TextArea, TextInput } from '../shared/DesignSystem'
import { InstallAppBanner } from './InstallAppBanner'

type ProjectUpdate = (updates: Partial<Project>) => void
type TimelineState = 'done' | 'current' | 'future'

const callbackMoments = ['Aujourd’hui', 'Demain matin', 'Demain après-midi', 'Cette semaine']
const adjustmentChoices = ['Texte', 'Couleurs', 'Style général', 'Section', 'Bouton', 'Fonctionnalité', 'Espace client', 'Autre']

export function ClientTrackingPage({ project, onUpdate }: { project: Project; onUpdate: ProjectUpdate }) {
  const [callbackPhone, setCallbackPhone] = useState(project.callbackPhone || project.phone)
  const [callbackMoment, setCallbackMoment] = useState(project.callbackMoment || callbackMoments[0])
  const [callbackMessage, setCallbackMessage] = useState(project.callbackMessage)
  const [precision, setPrecision] = useState('')
  const [adjustmentCategory, setAdjustmentCategory] = useState(project.adjustmentCategory || adjustmentChoices[0])
  const [adjustmentMessage, setAdjustmentMessage] = useState('')
  const [callbackSent, setCallbackSent] = useState(false)
  const [precisionSent, setPrecisionSent] = useState(false)
  const [adjustmentSent, setAdjustmentSent] = useState(false)
  const timeline = getTrackingTimeline(project)
  const demoReady = isDemoReady(project)
  const paymentAvailable = isPaymentAvailable(project)
  const activated = project.status === 'Activé'

  function submitCallback(event: FormEvent) {
    event.preventDefault()
    onUpdate({
      callbackRequested: true,
      callbackPhone,
      callbackMoment,
      callbackMessage,
      lastClientAction: 'Rappel demandé',
      nextAction: 'appeler le client',
      emailLog: { ...project.emailLog, callbackRequested: true },
    })
    setCallbackSent(true)
  }

  function submitPrecision(event: FormEvent) {
    event.preventDefault()
    onUpdate({
      clientPrecision: precision,
      lastClientAction: 'Précision ajoutée',
      nextAction: 'relire la précision client',
    })
    setPrecisionSent(true)
  }

  function submitAdjustment(event: FormEvent) {
    event.preventDefault()
    onUpdate({
      adjustmentCategory,
      adjustmentMessage,
      lastClientAction: 'Ajustements demandés',
      nextAction: 'traiter les ajustements',
      status: 'Ajustement demandé',
      emailLog: { ...project.emailLog, adjustmentsReceived: true },
    })
    setAdjustmentSent(true)
  }

  return (
    <main className="tracking-page">
      <section className="tracking-hero">
        <div>
          <p className="sd-eyebrow">Espace de suivi</p>
          <h1>Suivi de votre démo</h1>
          <p>Votre demande avance étape par étape. Vous serez informé à chaque moment important.</p>
        </div>
        <Card className="tracking-summary-card">
          <Info label="Entreprise" value={project.companyName} />
          <Info label="Secteur" value={project.sector} />
          <Info label="Ville" value={project.city} />
          <Info label="Date de demande" value={formatDate(project.createdAt)} />
          <TagInfo label="Priorités sélectionnées" values={project.pains} fallback={project.pain} />
          <TagInfo label="Objectifs sélectionnés" values={project.goals} fallback={project.goal} />
        </Card>
      </section>

      <Card className="tracking-timeline-card">
        <SectionTitle title="Avancement" text="Un suivi simple pour comprendre où en est votre expérience." />
        <div className="client-timeline compact-timeline">
          {timeline.map((item) => (
            <div className={`client-step ${item.state}`} key={item.label}>
              <span />
              <div>
                <strong>{item.label}</strong>
                <small>{item.state === 'done' ? 'terminé' : item.state === 'current' ? 'en cours' : 'à venir'}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <InstallAppBanner
        variant="card"
        dismissible={false}
        title="Gardez votre suivi à portée de main"
        text="Installez Signature Digital pour retrouver facilement votre demande, votre démo et vos prochaines étapes."
        installLabel="Installer l’application"
      />

      <Card className="tracking-reassurance">
        <h2>Votre démo n’est pas générique.</h2>
        <p>
          Elle est préparée à partir de {getProjectSourceLabel(project)}, de vos réponses et de vos priorités. L’objectif est de
          vous montrer une version plus claire, plus premium et plus convaincante de votre présence digitale.
        </p>
      </Card>

      <Card className="tracking-actions">
        <SectionTitle title="Actions disponibles" />
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => document.getElementById('callback-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Demander un rappel
          </Button>
          <Button variant="secondary" onClick={() => document.getElementById('precision-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Ajouter une précision
          </Button>
          {demoReady && <Button onClick={() => window.location.assign(getDemoReadyPath(project))}>Découvrir ma démo</Button>}
          {demoReady && <Button variant="secondary" onClick={() => document.getElementById('adjustment-form')?.scrollIntoView({ behavior: 'smooth' })}>Demander des ajustements</Button>}
          {demoReady && <Button variant="secondary" onClick={() => onUpdate({ lastClientAction: 'Direction validée', nextAction: 'préparer le paiement', status: 'Paiement envoyé' })}>Valider cette direction</Button>}
          {paymentAvailable && <Button onClick={() => window.location.assign(getActivationPath(project))}>Accéder au paiement</Button>}
          {activated && <Button onClick={() => window.open(project.demoLink || '/', '_blank')}>Accéder à mon espace actif</Button>}
        </div>
      </Card>

      <div className="tracking-form-grid">
        <Card className="tracking-form-card" id="callback-form">
          <form onSubmit={submitCallback}>
            <SectionTitle
              title="Vous préférez en parler directement ?"
              text="Un échange rapide permet de clarifier vos attentes et d’ajuster la démo dans la bonne direction."
            />
            <TextInput label="Téléphone" value={callbackPhone} onChange={setCallbackPhone} />
            <label className="sd-field">
              <span>Moment préféré</span>
              <select value={callbackMoment} onChange={(event) => setCallbackMoment(event.target.value)}>
                {callbackMoments.map((moment) => <option key={moment}>{moment}</option>)}
              </select>
            </label>
            <TextArea label="Message optionnel" value={callbackMessage} onChange={setCallbackMessage} />
            {callbackSent && <p className="client-success">Votre demande de rappel est bien prise en compte.</p>}
            <Button type="submit">Demander un rappel</Button>
          </form>
        </Card>

        <Card className="tracking-form-card" id="precision-form">
          <form onSubmit={submitPrecision}>
            <SectionTitle title="Ajouter une précision à votre demande" />
            <TextArea label="Expliquez ce que vous souhaitez préciser." value={precision} onChange={setPrecision} />
            {precisionSent && <p className="client-success">Votre précision a bien été transmise.</p>}
            <Button type="submit">Envoyer ma précision</Button>
          </form>
        </Card>

        {demoReady && (
          <Card className="tracking-form-card" id="adjustment-form">
            <form onSubmit={submitAdjustment}>
              <SectionTitle title="Quels ajustements souhaitez-vous ?" />
              <label className="sd-field">
                <span>Type d’ajustement</span>
                <select value={adjustmentCategory} onChange={(event) => setAdjustmentCategory(event.target.value)}>
                  {adjustmentChoices.map((choice) => <option key={choice}>{choice}</option>)}
                </select>
              </label>
              <TextArea label="Expliquez ce que vous souhaitez modifier." value={adjustmentMessage} onChange={setAdjustmentMessage} />
              {adjustmentSent && <p className="client-success">Vos ajustements ont bien été transmis.</p>}
              <Button type="submit">Envoyer mes ajustements</Button>
            </form>
          </Card>
        )}
      </div>
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

function isDemoReady(project: Project) {
  return [
    'Démo visuelle prête',
    'Visuel validé',
    'Démo vivante prête',
    'Démo prête',
    'Démo envoyée',
    'Paiement envoyé',
    'Paiement reçu',
    'À activer',
    'Activé',
    'Ajustement demandé',
  ].includes(project.status)
}

function isPaymentAvailable(project: Project) {
  return project.status === 'Paiement envoyé' || project.paymentStatus === 'envoyé' || project.paymentStatus === 'reçu'
}

function getTrackingTimeline(project: Project) {
  const activeIndex = getActiveStepIndex(project)

  return [
    'Demande reçue',
    'Démo en préparation',
    'Démo prête',
    'Validation & paiement',
    'Activation',
  ].map((label, index): { label: string; state: TimelineState } => ({
    label,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'future',
  }))
}

function getActiveStepIndex(project: Project) {
  if (project.status === 'Activé') return 4
  if (project.status === 'Paiement reçu' || project.status === 'À activer' || project.status === 'Paiement envoyé') return 3
  if (isDemoReady(project)) return 2
  if (project.status === 'Démo à créer' || project.status === 'Analyse faite' || project.status === 'À analyser') return 1

  return 1
}
