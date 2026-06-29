import { useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, getTrackingPath } from '../../data/projectStore'
import type { Project, ProjectInput } from '../../data/projectStore'
import { Button, Card, ChoiceGrid, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const priorities = [
  'Être plus crédible',
  'Inspirer confiance plus vite',
  'Obtenir plus de demandes vendeurs',
  'Vendre une offre plus premium',
  'Moderniser mon image',
  'Mieux valoriser mes biens',
  'Me différencier des agences classiques',
  'Rassurer mes propriétaires vendeurs',
]

const blockers = [
  'Mon site ne reflète pas assez la qualité de mon agence',
  'Mes visiteurs ne comprennent pas assez vite ma valeur',
  'Mes biens ne sont pas assez bien présentés',
  'Les vendeurs ne se projettent pas assez',
  'Je manque de demandes d’estimation',
  'Mon image paraît trop classique',
  'Mon site est trop chargé',
  'Mon site ne donne pas assez confiance',
]

const feelings = [
  'Confiance',
  'Sérieux',
  'Proximité',
  'Haut de gamme',
  'Transparence',
  'Accompagnement',
  'Modernité',
  'Sécurité',
]

const styles = [
  'Très premium',
  'Sobre et élégant',
  'Moderne et rassurant',
  'Local et humain',
  'Luxe discret',
  'Clair et minimaliste',
]

const diagnosticGoals = [
  'Générer plus de demandes d’estimation',
  'Mieux convertir les vendeurs',
  'Valoriser une offre plus premium',
  'Rassurer les clients avant le premier contact',
  'Donner une image plus moderne',
  'Créer une expérience plus professionnelle',
]

const fixedRealEstateFeatures = [
  'Accueil premium',
  'Biens à vendre',
  'Fiche bien détaillée',
  'Parcours estimation vendeur',
  'Espace vendeur privé',
  'Demande de visite qualifiée',
  'Contact / rappel conseiller',
  'Pourquoi nous confier votre bien',
]

const initialForm: ProjectInput = {
  companyName: '',
  sector: '',
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
  const [stepError, setStepError] = useState('')
  const total = funnelSteps.length
  const currentStep = funnelSteps[step]

  function updateField<Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) {
    setForm((current) => ({ ...current, [field]: value }))
    setStepError('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    if (step < total - 1) {
      if (step === 3 && !isWebsiteStepValid(form)) {
        setStepError('Ajoutez quelques informations pour que nous puissions préparer une démo plus pertinente.')
        return
      }

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
      features: fixedRealEstateFeatures,
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
          />
          {stepError && <p className="login-error">{stepError}</p>}
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
}: {
  step: number
  form: ProjectInput
  updateField: <Key extends keyof ProjectInput>(field: Key, value: ProjectInput[Key]) => void
}) {
  if (step === 0) return <TextInput label="Nom de l’entreprise" value={form.companyName} onChange={(value) => updateField('companyName', value)} placeholder="Signature Immobilier" />
  if (step === 1) return <TextInput label="Secteur d’activité" value={form.sector} onChange={(value) => updateField('sector', value)} placeholder="Immobilier, avocats, clinique privée..." />
  if (step === 2) return <TextInput label="Ville" value={form.city} onChange={(value) => updateField('city', value)} placeholder="Tarbes" />
  if (step === 3) {
    return (
      <div className="website-step">
        <ChoiceGrid
          options={['Oui, j’ai déjà un site', 'Non, pas encore']}
          selected={[form.hasWebsite ? 'Oui, j’ai déjà un site' : 'Non, pas encore']}
          onToggle={(value) => updateField('hasWebsite', value === 'Oui, j’ai déjà un site')}
        />
        {form.hasWebsite ? (
          <TextInput
            label="Lien de votre site actuel"
            value={form.currentWebsite}
            onChange={(value) => updateField('currentWebsite', value)}
            placeholder="https://votre-site.fr"
          />
        ) : (
          <div className="business-description-block">
            <div>
              <h2>Décrivez votre activité</h2>
              <p>
                Plus vous êtes précis, plus votre démo pourra être fidèle à votre image, votre offre et vos objectifs.
              </p>
            </div>
            <TextArea
              label="Expliquez ce que fait votre entreprise, ce que vous vendez, à qui vous vous adressez, le style que vous imaginez et ce que vous aimeriez que votre future expérience digitale transmette."
              value={form.businessDescription}
              onChange={(value) => updateField('businessDescription', value)}
              placeholder="Exemple : Nous sommes une agence immobilière à Tarbes spécialisée dans les biens premium. Nous voulons rassurer les vendeurs, montrer notre sérieux et créer un espace de suivi clair pour nos clients."
            />
          </div>
        )}
      </div>
    )
  }
  if (step === 4) return <ChoiceGrid options={priorities} selected={[form.diagnosticPriority]} onToggle={(value) => updateField('diagnosticPriority', value)} />
  if (step === 5) return <ChoiceGrid options={blockers} selected={[form.diagnosticBlocker]} onToggle={(value) => updateField('diagnosticBlocker', value)} />
  if (step === 6) return <ChoiceGrid options={feelings} selected={[form.desiredFeeling]} onToggle={(value) => updateField('desiredFeeling', value)} />
  if (step === 7) return <ChoiceGrid options={styles} selected={[form.style]} onToggle={(value) => updateField('style', value)} />
  if (step === 8) return <ChoiceGrid options={diagnosticGoals} selected={[form.diagnosticGoal]} onToggle={(value) => updateField('diagnosticGoal', value)} />
  if (step === 9) {
    return (
      <div className="field-grid">
        <TextInput label="Prénom" value={form.firstName} onChange={(value) => updateField('firstName', value)} />
        <TextInput label="Nom" value={form.lastName} onChange={(value) => updateField('lastName', value)} />
        <TextInput label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} />
        <TextInput label="Téléphone" value={form.phone} onChange={(value) => updateField('phone', value)} />
        <TextArea label="Message libre" value={form.message} onChange={(value) => updateField('message', value)} placeholder="Expliquez rapidement ce que vous aimeriez améliorer ou ce que vous n’aimez pas dans votre site actuel." />
      </div>
    )
  }

  return (
    <Card className="review-card">
      <strong>{form.companyName || 'Votre entreprise'}</strong>
      <p>{form.sector} · {form.city}</p>
      <p>{form.diagnosticPriority || 'Priorité à confirmer'}</p>
      <p>{form.diagnosticBlocker || 'Douleur à confirmer'}</p>
      <small>Votre demande sera transformée en espace de suivi privé pour avancer étape par étape.</small>
    </Card>
  )
}

function isWebsiteStepValid(form: ProjectInput) {
  if (form.hasWebsite) return Boolean(form.currentWebsite.trim())

  return Boolean(form.businessDescription.trim())
}

const funnelSteps = [
  { eyebrow: 'Analyse', title: 'Commençons par le nom de votre entreprise.', text: 'La démo sera pensée autour de votre marque, pas autour d’un modèle générique.' },
  { eyebrow: 'Activité', title: 'Dans quel secteur évoluez-vous ?', text: 'Le niveau de confiance attendu change selon votre métier.' },
  { eyebrow: 'Ancrage', title: 'Dans quelle ville êtes-vous basé ?', text: 'Le contexte local peut influencer le message et la perception.' },
  { eyebrow: 'Présence digitale', title: 'Avez-vous déjà un site internet ?', text: 'Si vous n’en avez pas encore, vous pouvez simplement décrire votre activité et ce que vous souhaitez créer.' },
  { eyebrow: 'Priorité', title: 'Quelle est votre priorité principale ?', text: 'Signature Digital s’appuie sur votre priorité pour orienter la démo.' },
  { eyebrow: 'Blocage', title: 'Qu’est-ce qui bloque le plus aujourd’hui ?', text: 'Votre douleur guide l’angle de la transformation digitale.' },
  { eyebrow: 'Ressenti', title: 'Qu’aimeriez-vous que vos visiteurs ressentent ?', text: 'La démo doit transmettre une impression claire dès les premières secondes.' },
  { eyebrow: 'Style', title: 'Quel style vous correspond le mieux ?', text: 'Le style sert de point de départ pour l’habillage visuel.' },
  { eyebrow: 'Objectif', title: 'Quel est votre objectif principal ?', text: 'Le squelette reste fixe, mais l’objectif change les priorités et les CTA.' },
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
