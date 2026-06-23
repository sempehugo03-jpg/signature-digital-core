import { useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, getConfirmationEmail } from '../../data/projectStore'
import type { ProjectInput } from '../../data/projectStore'
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
  goal: '',
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

  function toggleFeature(feature: string) {
    updateField('features', form.features.includes(feature)
      ? form.features.filter((item) => item !== feature)
      : [...form.features, feature])
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    if (step < total - 1) {
      setStep((current) => current + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const project = createProject(form)
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
            toggleFeature={toggleFeature}
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
  toggleFeature,
}: {
  step: number
  form: ProjectInput
  updateField: <Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) => void
  toggleFeature: (feature: string) => void
}) {
  if (step === 0) return <TextInput label="Nom de l’entreprise" value={form.companyName} onChange={(value) => updateField('companyName', value)} placeholder="Signature Immobilier" />
  if (step === 1) return <TextInput label="Secteur d’activité" value={form.sector} onChange={(value) => updateField('sector', value)} placeholder="Immobilier, avocats, clinique privée..." />
  if (step === 2) return <TextInput label="Ville" value={form.city} onChange={(value) => updateField('city', value)} placeholder="Tarbes" />
  if (step === 3) return <TextInput label="Site actuel" value={form.currentWebsite} onChange={(value) => updateField('currentWebsite', value)} placeholder="https://..." />
  if (step === 4) return <ChoiceGrid options={pains} selected={[form.pain]} onToggle={(value) => updateField('pain', value)} />
  if (step === 5) return <ChoiceGrid options={goals} selected={[form.goal]} onToggle={(value) => updateField('goal', value)} />
  if (step === 6) return <ChoiceGrid options={features} selected={form.features} onToggle={toggleFeature} multiple />
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
      <p>{form.pain}</p>
      <p>{form.goal}</p>
      <small>{getConfirmationEmail().split('\n').slice(0, 4).join(' ')}</small>
    </Card>
  )
}

const funnelSteps = [
  { eyebrow: 'Analyse', title: 'Commençons par le nom de votre entreprise.', text: 'La démo sera pensée autour de votre marque, pas autour d’un modèle générique.' },
  { eyebrow: 'Activité', title: 'Dans quel secteur évoluez-vous ?', text: 'Le niveau de confiance attendu change selon votre métier.' },
  { eyebrow: 'Ancrage', title: 'Dans quelle ville êtes-vous basé ?', text: 'Le contexte local peut influencer le message et la perception.' },
  { eyebrow: 'Site actuel', title: 'Quel site faut-il regarder ?', text: 'Indiquez l’adresse de votre présence digitale actuelle.' },
  { eyebrow: 'Douleur', title: 'Qu’est-ce qui bloque le plus aujourd’hui ?', text: 'Choisissez la douleur qui décrit le mieux votre situation.' },
  { eyebrow: 'Objectif', title: 'Quel est l’objectif principal ?', text: 'La démo sera orientée vers cette priorité.' },
  { eyebrow: 'Fonctions', title: 'Quelles fonctions souhaitez-vous voir ?', text: 'Sélectionnez tout ce qui pourrait rendre l’expérience plus concrète.' },
  { eyebrow: 'Style', title: 'Quelle direction visuelle vous attire ?', text: 'Le style sert de point de départ pour la proposition.' },
  { eyebrow: 'Contact', title: 'Où devons-nous vous envoyer la confirmation ?', text: 'Ces informations restent liées à votre demande de démo.' },
  { eyebrow: 'Confirmation', title: 'Confirmez votre demande.', text: 'Votre projet sera ajouté au cockpit interne pour analyse.' },
]

export function ConfirmationPage() {
  return (
    <main className="confirmation-page">
      <Card className="confirmation-card">
        <p className="sd-eyebrow">Demande envoyée</p>
        <h1>Votre demande de démo est bien prise en compte.</h1>
        <p>
          Nous avons reçu vos informations. Votre demande va être analysée afin de préparer une démo personnalisée,
          pensée autour de votre activité, de votre site actuel et de votre objectif principal.
        </p>
        <p className="muted">
          Vous allez recevoir un email de confirmation dans quelques instants. Votre première démo vous sera envoyée
          rapidement après analyse de votre demande.
        </p>
        <div className="confirmation-steps">
          {['Demande reçue', 'Analyse en cours', 'Démo personnalisée en préparation', 'Email envoyé'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </Card>
    </main>
  )
}
