import { useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, getTrackingPath } from '../../data/projectStore'
import type { Project, ProjectInput } from '../../data/projectStore'
import { Button, Card, ChoiceGrid, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const realEstatePainOptions = [
  "Les vendeurs ne comprennent pas assez vite notre valeur.",
  "Notre image n'est pas assez premium.",
  "Nous ne générons pas assez de demandes d'estimation.",
  "Nous ressemblons trop aux autres agences.",
  "Notre accompagnement n'est pas assez visible.",
]

const realEstateGoalOptions = [
  'Obtenir plus de mandats.',
  'Inspirer davantage confiance.',
  'Vendre une image plus premium.',
  "Générer plus d'estimations.",
  'Montrer notre différence.',
]

const realEstateTargetOptions = [
  'Les vendeurs.',
  'Les propriétaires.',
  'Les acquéreurs.',
  'Les investisseurs.',
  'Les clients premium.',
]

const desiredFeelings = [
  'Confiance',
  'Premium',
  'Transparence',
  'Accompagnement',
  'Modernité',
  'Excellence',
]

const initialForm: ProjectInput = {
  companyName: '',
  sector: 'immobilier',
  city: '',
  hasWebsite: true,
  currentWebsite: '',
  businessDescription: '',
  pain: '',
  pains: [],
  goal: '',
  goals: [],
  diagnosticPriority: '',
  diagnosticBlocker: '',
  desiredFeeling: '',
  diagnosticGoal: '',
  targetClient: '',
  freeText: '',
  features: [],
  style: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  message: '',
}

export function AnalysisFunnel({ onNavigate, onCompleted }: { onNavigate: Navigate; onCompleted: (projectId: string) => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ProjectInput>(initialForm)
  const [stepError, setStepError] = useState('')
  const total = funnelSteps.length
  const currentStep = funnelSteps[step]

  function updateField<Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) {
    setForm((current) => ({ ...current, [field]: value }))
    setStepError('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    if (!isCurrentStepValid(step, form)) {
      setStepError('Complétez cette étape pour préparer un brief exploitable.')
      return
    }

    if (step < total - 1) {
      setStep((current) => current + 1)
      setStepError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const project = createProject({
      ...form,
      pain: form.diagnosticBlocker,
      pains: [form.diagnosticBlocker].filter(Boolean),
      goal: form.diagnosticGoal,
      goals: [form.diagnosticGoal].filter(Boolean),
      diagnosticPriority: form.diagnosticGoal,
      style: form.desiredFeeling,
      message: form.freeText,
    })
    onCompleted(project.id)
    onNavigate('/confirmation')
  }

  return (
    <main className="funnel-page">
      <Card className="funnel-card">
        <div className="funnel-progress">
          <span>Question {step + 1} / {total}</span>
          <div><i style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
        </div>
        <form onSubmit={submit}>
          <p className="sd-eyebrow">{currentStep.eyebrow}</p>
          <h1>{currentStep.title}</h1>
          <p className="funnel-intro">{currentStep.text}</p>
          <FunnelStep
            step={step}
            form={form}
            updateField={updateField}
          />
          {step === total - 1 && (
            <div className="review-card">
              <strong>Nous allons préparer une démonstration centrée sur :</strong>
              <ul>
                <li>{form.diagnosticBlocker || 'votre principal frein'}</li>
                <li>{form.diagnosticGoal || 'votre objectif'}</li>
                <li>{form.targetClient || 'le type de client à convaincre'}</li>
                <li>{form.desiredFeeling || "l'impression que votre agence doit transmettre"}</li>
              </ul>
              <small>Votre démonstration sera pensée pour rendre votre valeur évidente dès les premières secondes.</small>
            </div>
          )}
          {stepError && <p className="login-error">{stepError}</p>}
          <div className="funnel-actions">
            {step > 0 && <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>Retour</Button>}
            <Button type="submit">{step === total - 1 ? 'Préparer ma démonstration' : 'Continuer'}</Button>
          </div>
        </form>
      </Card>
    </main>
  )
}

function FunnelStep({
  step,
  form,
  updateField,
}: {
  step: number
  form: ProjectInput
  updateField: <Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) => void
}) {
  if (step === 0) return <TextInput label="Nom de l'agence" value={form.companyName} onChange={(value) => updateField('companyName', value)} placeholder="Signature Immobilier" />
  if (step === 1) return <TextInput label="Site actuel" value={form.currentWebsite} onChange={(value) => updateField('currentWebsite', value)} placeholder="https://votre-agence.fr" />
  if (step === 2) return <TextInput label="Ville" value={form.city} onChange={(value) => updateField('city', value)} placeholder="Tarbes" />
  if (step === 3) return <ChoiceGrid options={realEstatePainOptions} selected={[form.diagnosticBlocker]} onToggle={(value) => updateField('diagnosticBlocker', value)} />
  if (step === 4) return <ChoiceGrid options={realEstateGoalOptions} selected={[form.diagnosticGoal]} onToggle={(value) => updateField('diagnosticGoal', value)} />
  if (step === 5) return <ChoiceGrid options={realEstateTargetOptions} selected={[form.targetClient]} onToggle={(value) => updateField('targetClient', value)} />
  if (step === 6) return <ChoiceGrid options={desiredFeelings} selected={[form.desiredFeeling]} onToggle={(value) => updateField('desiredFeeling', value)} />
  if (step === 7) {
    return (
      <TextArea
        label="Si votre présence digitale était parfaite dans 30 jours, qu'est-ce qui aurait changé ?"
        value={form.freeText}
        onChange={(value) => {
          updateField('freeText', value)
          updateField('message', value)
        }}
        placeholder="Exemple : les vendeurs comprendraient plus vite notre valeur et demanderaient une estimation avec plus de confiance."
      />
    )
  }

  return (
    <div className="review-card">
      <p>Votre démonstration sera pensée pour rendre votre valeur évidente dès les premières secondes.</p>
    </div>
  )
}

function isCurrentStepValid(step: number, form: ProjectInput) {
  if (step === 0) return Boolean(form.companyName.trim())
  if (step === 1) return Boolean(form.currentWebsite.trim())
  if (step === 2) return Boolean(form.city.trim())
  if (step === 3) return Boolean(form.diagnosticBlocker.trim())
  if (step === 4) return Boolean(form.diagnosticGoal.trim())
  if (step === 5) return Boolean(form.targetClient.trim())
  if (step === 6) return Boolean(form.desiredFeeling.trim())
  if (step === 7) return Boolean(form.freeText.trim())

  return true
}

const funnelSteps = [
  { eyebrow: 'Agence', title: "Quel est le nom de votre agence ?", text: 'Votre démonstration partira de votre marque et de votre contexte réel.' },
  { eyebrow: 'Site actuel', title: 'Quel est votre site actuel ?', text: 'La première impression influence souvent la décision avant même le premier échange.' },
  { eyebrow: 'Ville', title: 'Dans quelle ville êtes-vous implanté ?', text: 'Le contexte local rend votre valeur plus concrète.' },
  { eyebrow: 'Difficulté', title: "Quelle est votre plus grande difficulté aujourd'hui ?", text: "L'objectif est de rendre visible ce qui fait déjà votre valeur." },
  { eyebrow: 'Objectif', title: 'Quel est votre objectif principal ?', text: "L'objectif n'est pas de montrer davantage de choses mais de rendre votre valeur plus évidente." },
  { eyebrow: 'Priorité', title: 'Qui souhaitez-vous convaincre en priorité ?', text: 'La confiance se construit souvent avant même la première visite.' },
  { eyebrow: 'Impression', title: 'Quelle impression doit ressentir un visiteur ?', text: 'Une impression claire aide le visiteur à comprendre immédiatement pourquoi vous choisir.' },
  { eyebrow: 'Projection', title: 'Si votre présence digitale était parfaite dans 30 jours, qu’est-ce qui aurait changé ?', text: 'Cette réponse permet de mieux comprendre ce qui compte vraiment pour votre agence.' },
  { eyebrow: 'Résumé', title: 'Votre angle de démonstration est prêt.', text: 'Nous allons préparer une démonstration centrée sur votre situation commerciale.' },
]

export function ConfirmationPage({
  project,
  onCreateSpace,
  onOpenSpace,
}: {
  project?: Project
  onNavigate: Navigate
  onCreateSpace: (projectId: string, email: string) => Promise<void> | void
  onOpenSpace: (projectId: string, email: string) => void
}) {
  const [email, setEmail] = useState(project?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [spaceReady, setSpaceReady] = useState(project?.clientSpaceCreated ?? false)
  const trackingPath = project ? getTrackingPath(project) : ''

  async function submitSpace(event: FormEvent) {
    event.preventDefault()

    if (!email.trim()) {
      setMessage('Indiquez votre email.')
      return
    }

    if (!password.trim()) {
      setMessage('Indiquez un mot de passe.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas.')
      return
    }

    if (!project) return

    await onCreateSpace(project.id, email)
    setMessage('')
    setSpaceReady(true)
  }

  if (!project) {
    return (
      <main className="confirmation-page">
        <Card className="confirmation-card">
          <p className="sd-eyebrow">Demande envoyée</p>
          <h1>Votre demande de démo est bien prise en compte.</h1>
          <p>Votre espace de suivi sera disponible depuis le lien reçu par email.</p>
        </Card>
      </main>
    )
  }

  if (spaceReady) {
    return (
      <main className="confirmation-page">
        <Card className="confirmation-card">
          <p className="sd-eyebrow">Espace créé</p>
          <h1>Votre espace de suivi est prêt</h1>
          <p>
            Votre demande est bien prise en compte. Votre espace de suivi est maintenant disponible pour suivre
            l'avancement de votre démo.
          </p>
          <p className="muted">
            Nous venons également de vous envoyer un email avec le lien de votre espace, afin que vous puissiez
            le retrouver à tout moment.
          </p>
          <div className="tracking-link-preview">
            <span>Lien permanent</span>
            <strong>{trackingPath}</strong>
          </div>
          <Button onClick={() => onOpenSpace(project.id, email)}>Accéder à mon espace de suivi</Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="confirmation-page">
      <Card className="confirmation-card">
        <p className="sd-eyebrow">Demande terminée</p>
        <h1>Créez votre espace de suivi</h1>
        <p>
          Votre demande de démo est bien prise en compte. Créez votre espace pour suivre l'avancement,
          recevoir votre démo et échanger avec Signature Digital si besoin.
        </p>
        <form className="client-space-form" onSubmit={submitSpace}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <TextInput label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={setConfirmPassword} />
          {message && <p className="login-error">{message}</p>}
          <Button type="submit">Créer mon espace</Button>
        </form>
        <p className="muted">Votre espace vous permettra de suivre chaque étape jusqu'à l'activation de votre démo.</p>
      </Card>
    </main>
  )
}
