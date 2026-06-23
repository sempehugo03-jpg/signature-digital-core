import { useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, getTrackingPath } from '../../data/projectStore'
import type { Project, ProjectInput } from '../../data/projectStore'
import { Button, Card, ChoiceGrid, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const pains = [
  'Je ne reçois pas assez de demandes',
  'Mon site ne reflète pas mon niveau',
  'Mes visiteurs ne comprennent pas assez vite ma valeur',
  'Mon image n’est pas assez premium',
  'Mon parcours client n’est pas assez clair',
  'Je ne me différencie pas assez de mes concurrents',
  'Je veux rassurer davantage mes prospects',
]

const goals = [
  'Être plus crédible',
  'Obtenir plus de contacts',
  'Mieux présenter mes services',
  'Montrer une image plus haut de gamme',
  'Créer un espace client',
  'Vendre une offre plus premium',
  'Me différencier de mes concurrents',
  'Rassurer avant le premier contact',
]

const features = [
  'Formulaire de contact',
  'Demande de rappel',
  'Prise de rendez-vous',
  'Espace client',
  'Espace professionnel',
  'Suivi de dossier',
  'Documents',
  'Estimation',
  'Paiement',
  'Pages services',
  'Présentation premium',
  'Notifications',
  'Compte-rendu',
]

const styles = [
  'Premium sobre',
  'Luxe sombre',
  'Clair et minimal',
  'Institutionnel sérieux',
  'Très haut de gamme',
  'Moderne et fluide',
]

const initialForm: ProjectInput = {
  companyName: '',
  sector: '',
  city: '',
  currentWebsite: '',
  pain: '',
  pains: [],
  goal: '',
  goals: [],
  features: [],
  style: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
}

export function AnalysisFunnel({ onNavigate, onCompleted }: { onNavigate: Navigate; onCompleted: (projectId: string) => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ProjectInput>(initialForm)
  const total = funnelSteps.length
  const currentStep = funnelSteps[step]

  function updateField<Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleArrayField(field: 'pains' | 'goals' | 'features', value: string) {
    setForm((current) => {
      const selected = current[field]

      return {
        ...current,
        [field]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      }
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    if (step < total - 1) {
      setStep((current) => current + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const project = createProject({
      ...form,
      pain: form.pains[0] ?? form.pain,
      goal: form.goals[0] ?? form.goal,
    })
    onCompleted(project.id)
    onNavigate('/confirmation')
  }

  return (
    <main className="funnel-page">
      <Card className="funnel-card">
        <div className="funnel-progress">
          <span>Étape {step + 1} / {total}</span>
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
            toggleArrayField={toggleArrayField}
          />
          <div className="funnel-actions">
            {step > 0 && <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>Retour</Button>}
            <Button type="submit">{step === total - 1 ? 'Valider ma demande' : 'Continuer'}</Button>
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
  toggleArrayField,
}: {
  step: number
  form: ProjectInput
  updateField: <Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) => void
  toggleArrayField: (field: 'pains' | 'goals' | 'features', value: string) => void
}) {
  if (step === 0) return <TextInput label="Nom de l’entreprise" value={form.companyName} onChange={(value) => updateField('companyName', value)} placeholder="Signature Immobilier" />
  if (step === 1) return <TextInput label="Secteur d’activité" value={form.sector} onChange={(value) => updateField('sector', value)} placeholder="Immobilier, avocats, clinique privée..." />
  if (step === 2) return <TextInput label="Ville" value={form.city} onChange={(value) => updateField('city', value)} placeholder="Tarbes" />
  if (step === 3) return <TextInput label="Site actuel" value={form.currentWebsite} onChange={(value) => updateField('currentWebsite', value)} placeholder="https://..." />
  if (step === 4) return <ChoiceGrid options={pains} selected={form.pains} onToggle={(value) => toggleArrayField('pains', value)} multiple />
  if (step === 5) return <ChoiceGrid options={goals} selected={form.goals} onToggle={(value) => toggleArrayField('goals', value)} multiple />
  if (step === 6) return <ChoiceGrid options={features} selected={form.features} onToggle={(value) => toggleArrayField('features', value)} multiple />
  if (step === 7) return <ChoiceGrid options={styles} selected={[form.style]} onToggle={(value) => updateField('style', value)} />
  if (step === 8) {
    return (
      <div className="field-grid">
        <TextInput label="Prénom" value={form.firstName} onChange={(value) => updateField('firstName', value)} />
        <TextInput label="Nom" value={form.lastName} onChange={(value) => updateField('lastName', value)} />
        <TextInput label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} />
        <TextInput label="Téléphone" value={form.phone} onChange={(value) => updateField('phone', value)} />
        <TextArea label="Message" value={form.message} onChange={(value) => updateField('message', value)} placeholder="Ce que vous voulez préciser..." />
      </div>
    )
  }

  return (
    <Card className="review-card">
      <strong>{form.companyName || 'Votre entreprise'}</strong>
      <p>{form.sector} · {form.city}</p>
      <p>{form.pains.join(', ') || 'Priorités à confirmer'}</p>
      <p>{form.goals.join(', ') || 'Objectifs à confirmer'}</p>
      <small>Votre demande sera transformée en espace de suivi privé pour avancer étape par étape.</small>
    </Card>
  )
}

const funnelSteps = [
  { eyebrow: 'Analyse', title: 'Commençons par le nom de votre entreprise.', text: 'La démo sera pensée autour de votre marque, pas autour d’un modèle générique.' },
  { eyebrow: 'Activité', title: 'Dans quel secteur évoluez-vous ?', text: 'Le niveau de confiance attendu change selon votre métier.' },
  { eyebrow: 'Ancrage', title: 'Dans quelle ville êtes-vous basé ?', text: 'Le contexte local peut influencer le message et la perception.' },
  { eyebrow: 'Site actuel', title: 'Quel site faut-il regarder ?', text: 'Indiquez l’adresse de votre présence digitale actuelle.' },
  { eyebrow: 'Priorités', title: 'Quels points vous freinent aujourd’hui ?', text: 'Vous pouvez sélectionner plusieurs réponses.' },
  { eyebrow: 'Objectifs', title: 'Quels objectifs voulez-vous atteindre ?', text: 'Sélectionnez tout ce qui correspond à votre situation.' },
  { eyebrow: 'Expérience', title: 'Quelles fonctionnalités pourraient renforcer votre expérience ?', text: 'Sélectionnez tout ce qui pourrait rendre la démo plus concrète.' },
  { eyebrow: 'Style', title: 'Quelle direction visuelle vous attire ?', text: 'Le style sert de point de départ pour la proposition.' },
  { eyebrow: 'Contact', title: 'Où devons-nous rattacher votre espace ?', text: 'Ces informations restent liées à votre demande de démo.' },
  { eyebrow: 'Confirmation', title: 'Confirmez votre demande.', text: 'Votre demande sera ajoutée au suivi privé de votre démo.' },
]

export function ConfirmationPage({
  project,
  onCreateSpace,
  onOpenSpace,
}: {
  project?: Project
  onNavigate: Navigate
  onCreateSpace: (projectId: string, email: string) => void
  onOpenSpace: (projectId: string, email: string) => void
}) {
  const [email, setEmail] = useState(project?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [spaceReady, setSpaceReady] = useState(project?.clientSpaceCreated ?? false)
  const trackingPath = project ? getTrackingPath(project) : ''

  function submitSpace(event: FormEvent) {
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

    onCreateSpace(project.id, email)
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
            l’avancement de votre démo.
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
          Votre demande de démo est bien prise en compte. Créez votre espace pour suivre l’avancement,
          recevoir votre démo et échanger avec Signature Digital si besoin.
        </p>
        <form className="client-space-form" onSubmit={submitSpace}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <TextInput label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={setConfirmPassword} />
          {message && <p className="login-error">{message}</p>}
          <Button type="submit">Créer mon espace</Button>
        </form>
        <p className="muted">Votre espace vous permettra de suivre chaque étape jusqu’à l’activation de votre démo.</p>
      </Card>
    </main>
  )
}
