import { useMemo, useState } from 'react'
import type { EmailKey, Project } from '../../data/projectStore'
import { buildCodexPrompt, buildProjectEmail, emailKeys, emailLabels, getTrackingUrl, projectStatuses } from '../../data/projectStore'
import { Badge, Button, Card, SectionTitle, StatusBadge, TextArea, TextInput, Timeline } from '../shared/DesignSystem'

type Navigate = (route: string) => void

export function ProjectDetail({
  project,
  onNavigate,
  onUpdate,
}: {
  project: Project
  onNavigate: Navigate
  onUpdate: (updates: Partial<Project>) => void
}) {
  const [prompt, setPrompt] = useState('')
  const activationReady = project.paymentStatus === 'reçu' &&
    project.codexStatus === 'validé' &&
    project.publicLinkTested &&
    project.formTested &&
    project.activationEmailReady &&
    project.hugoValidated
  const brief = useMemo(() => [
    `Entreprise : ${project.companyName}`,
    `Secteur : ${project.sector}`,
    `Ville : ${project.city}`,
    `Site actuel : ${project.currentWebsite}`,
    `Priorités : ${getList(project.pains, project.pain)}`,
    `Objectifs : ${getList(project.goals, project.goal)}`,
    `Angle commercial : ${getSalesAngle(project)}`,
    `Proposition de démo : ${getDemoProposal(project)}`,
  ].join('\n'), [project])

  function copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => undefined)
  }

  return (
    <div className="admin-view project-detail">
      <button className="back-link" type="button" onClick={() => onNavigate('/admin/projects')}>← Retour projets</button>
      <header className="project-detail-header">
        <div>
          <p className="sd-eyebrow">Fiche projet</p>
          <h1>{project.companyName}</h1>
          <p>{project.sector} · {project.city}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>

      <Card className="detail-block">
        <SectionTitle title="Bloc diagnostic" />
        <div className="detail-grid">
          <Info label="Site actuel" value={project.currentWebsite} />
          <Info label="Priorités sélectionnées" value={getList(project.pains, project.pain)} />
          <Info label="Objectifs sélectionnés" value={getList(project.goals, project.goal)} />
          <Info label="Angle commercial" value={getSalesAngle(project)} />
          <Info label="Proposition de démo" value={getDemoProposal(project)} />
        </div>
        <TextArea label="Notes d’analyse" value={project.analysisNotes} onChange={(value) => onUpdate({ analysisNotes: value })} />
        <Button variant="secondary" onClick={() => copy(brief)}>Copier le brief pour analyse</Button>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="Bloc démo visuelle" />
        <div className="field-grid">
          <TextInput label="Lien Lovable" value={project.lovableLink} onChange={(value) => onUpdate({ lovableLink: value })} />
          <label className="sd-field">
            <span>Statut visuel</span>
            <select value={project.visualStatus} onChange={(event) => onUpdate({ visualStatus: event.target.value as Project['visualStatus'] })}>
              <option>à créer</option>
              <option>en modification</option>
              <option>validé visuellement</option>
            </select>
          </label>
          <TextArea label="Notes de modification" value={project.visualNotes} onChange={(value) => onUpdate({ visualNotes: value })} />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => window.open(project.lovableLink || 'https://premium-digital-reveal.lovable.app/', '_blank')}>Ouvrir la démo Lovable</Button>
          <Button onClick={() => onUpdate({ visualStatus: 'validé visuellement', status: 'Visuel validé' })}>Marquer le visuel comme validé</Button>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="Bloc Codex / démo vivante" text="Codex doit rendre les boutons, formulaires, routes, paiement et activation fonctionnels sans modifier le visuel validé." />
        <div className="field-grid">
          <TextInput label="Lien GitHub PR" value={project.githubPrLink} onChange={(value) => onUpdate({ githubPrLink: value })} />
          <TextInput label="Lien Vercel Preview" value={project.vercelPreviewLink} onChange={(value) => onUpdate({ vercelPreviewLink: value })} />
          <label className="sd-field">
            <span>Statut Codex</span>
            <select value={project.codexStatus} onChange={(event) => onUpdate({ codexStatus: event.target.value as Project['codexStatus'] })}>
              <option>à lancer</option>
              <option>en cours</option>
              <option>preview prête</option>
              <option>validé</option>
            </select>
          </label>
          <TextArea label="Notes techniques internes" value={project.technicalNotes} onChange={(value) => onUpdate({ technicalNotes: value })} />
        </div>
        <div className="inline-actions">
          <Button onClick={() => setPrompt(buildCodexPrompt(project))}>Générer prompt Codex</Button>
          <Button variant="secondary" onClick={() => onUpdate({ codexStatus: 'preview prête', publicLinkTested: true, formTested: true })}>Preview testée</Button>
          <Button variant="secondary" onClick={() => onUpdate({ codexStatus: 'validé', status: 'Démo vivante prête' })}>Démo vivante prête</Button>
        </div>
        {prompt && <TextArea label="Prompt Codex copiable" value={prompt} onChange={setPrompt} />}
      </Card>

      <ClientTrackingBlock project={project} />
      <EmailBlock project={project} onUpdate={onUpdate} />
      <PaymentBlock project={project} onUpdate={onUpdate} />
      <ActivationBlock project={project} onUpdate={onUpdate} activationReady={activationReady} />

      <Card className="detail-block">
        <SectionTitle title="Bloc notes internes" />
        <TextArea label="Notes internes" value={project.internalNotes} onChange={(value) => onUpdate({ internalNotes: value })} />
        <TextInput label="Prochaine action" value={project.nextAction} onChange={(value) => onUpdate({ nextAction: value })} />
        <TextInput label="Date de relance éventuelle" value={project.reminderDate} onChange={(value) => onUpdate({ reminderDate: value })} />
        <label className="sd-field">
          <span>Statut projet</span>
          <select value={project.status} onChange={(event) => onUpdate({ status: event.target.value as Project['status'] })}>
            {projectStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </Card>
    </div>
  )
}

function EmailBlock({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  const [openEmail, setOpenEmail] = useState<EmailKey>('spaceCreated')
  const body = buildProjectEmail(project, openEmail)

  function markSent(key: EmailKey) {
    onUpdate({ emailLog: { ...project.emailLog, [key]: true } })
  }

  return (
    <Card className="detail-block">
      <SectionTitle title="Communication client" />
      <div className="email-grid">
        {emailKeys.map((key) => (
          <button className={openEmail === key ? 'email-tab active' : 'email-tab'} key={key} type="button" onClick={() => setOpenEmail(key)}>
            <span>{emailLabels[key]}</span>
            {project.emailLog[key] && <Badge tone="green">envoyé</Badge>}
          </button>
        ))}
      </div>
      <TextArea label={emailLabels[openEmail]} value={body} onChange={() => undefined} />
      <div className="inline-actions">
        <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(body)}>Copier cet email</Button>
        <Button onClick={() => markSent(openEmail)}>Marquer email envoyé</Button>
      </div>
    </Card>
  )
}

function ClientTrackingBlock({ project }: { project: Project }) {
  const trackingUrl = getTrackingUrl(project)

  return (
    <Card className="detail-block">
      <SectionTitle title="Espace client" />
      <div className="detail-grid">
        <Info label="Email du client" value={project.email} />
        <Info label="Lien de suivi client" value={trackingUrl} />
        <Info label="Rappel demandé" value={project.callbackRequested ? `${project.callbackPhone} · ${project.callbackMoment}` : 'Non'} />
        <Info label="Précision ajoutée" value={project.clientPrecision || 'Aucune'} />
        <Info label="Ajustements demandés" value={project.adjustmentMessage ? `${project.adjustmentCategory} · ${project.adjustmentMessage}` : 'Aucun'} />
        <Info label="Dernière action client" value={project.lastClientAction || 'Aucune'} />
        <Info label="Prochaine action" value={project.nextAction} />
      </div>
      {project.callbackMessage && <TextArea label="Message rappel" value={project.callbackMessage} onChange={() => undefined} />}
      <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(trackingUrl)}>Copier le lien de suivi</Button>
    </Card>
  )
}

function PaymentBlock({ project, onUpdate }: { project: Project; onUpdate: (updates: Partial<Project>) => void }) {
  return (
    <Card className="detail-block">
      <SectionTitle title="Bloc paiement" />
      <TextInput label="Lien paiement" value={project.paymentLink} onChange={(value) => onUpdate({ paymentLink: value })} />
      <div className="inline-actions">
        <Badge tone={project.paymentStatus === 'reçu' ? 'green' : 'amber'}>Paiement {project.paymentStatus}</Badge>
        <Button variant="secondary" onClick={() => onUpdate({ paymentStatus: 'envoyé', status: 'Paiement envoyé' })}>Paiement envoyé</Button>
        <Button onClick={() => onUpdate({ paymentStatus: 'reçu', status: 'Paiement reçu' })}>Paiement reçu</Button>
      </div>
    </Card>
  )
}

function ActivationBlock({
  project,
  onUpdate,
  activationReady,
}: {
  project: Project
  onUpdate: (updates: Partial<Project>) => void
  activationReady: boolean
}) {
  const checklist = [
    { label: 'paiement reçu', done: project.paymentStatus === 'reçu' },
    { label: 'démo vivante prête', done: project.codexStatus === 'validé' },
    { label: 'lien public testé', done: project.publicLinkTested },
    { label: 'formulaire testé', done: project.formTested },
    { label: 'email activation prêt', done: project.activationEmailReady },
    { label: 'validation Hugo', done: project.hugoValidated },
  ]

  return (
    <Card className="detail-block">
      <SectionTitle title="Bloc activation" />
      <Timeline items={checklist} />
      <div className="check-actions">
        <label><input type="checkbox" checked={project.publicLinkTested} onChange={(event) => onUpdate({ publicLinkTested: event.target.checked })} /> Lien public testé</label>
        <label><input type="checkbox" checked={project.formTested} onChange={(event) => onUpdate({ formTested: event.target.checked })} /> Formulaire testé</label>
        <label><input type="checkbox" checked={project.activationEmailReady} onChange={(event) => onUpdate({ activationEmailReady: event.target.checked })} /> Email activation prêt</label>
        <label><input type="checkbox" checked={project.hugoValidated} onChange={(event) => onUpdate({ hugoValidated: event.target.checked })} /> Validation Hugo</label>
      </div>
      <Button variant={activationReady ? 'primary' : 'secondary'} disabled={!activationReady} onClick={() => onUpdate({ status: 'Activé' })}>
        Activer le projet
      </Button>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value || 'À compléter'}</strong>
    </div>
  )
}

function getSalesAngle(project: Project) {
  return `Montrer pourquoi ${project.companyName} mérite la confiance avant même le premier contact.`
}

function getDemoProposal(project: Project) {
  return `Une démo ${project.style || 'premium'} centrée sur ${project.goal.toLowerCase()} avec ${project.features.slice(0, 3).join(', ') || 'un parcours clair'}.`
}

function getList(values: string[], fallback: string) {
  const list = values.length > 0 ? values : [fallback].filter(Boolean)

  return list.join(', ')
}
