import { useMemo, useState } from 'react'
import type { Project } from '../../data/projectStore'
import { getProjectSourceAdminLabel, projectStatusLabels, projectStatuses } from '../../data/projectStore'
import { Button, Card, SectionTitle, StatusBadge, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const lovableStatuses: Project['lovableDemoStatus'][] = ['pas encore créée', 'prête', 'envoyée', 'validée', 'refusée']
const paymentStatuses: Project['paymentSimpleStatus'][] = ['non demandé', 'en attente', 'acompte reçu', 'payé', 'annulé']
const technicalStatuses: Project['technicalStatus'][] = ['à préparer', 'en cours', 'vivante prête', 'active']

export function ProjectDetail({
  project,
  onNavigate,
  onUpdate,
}: {
  project: Project
  onNavigate: Navigate
  onUpdate: (updates: Partial<Project>) => void
}) {
  const [briefCopied, setBriefCopied] = useState(false)
  const chatGptSummary = useMemo(() => buildChatGptSummary(project), [project])
  const clientMail = useMemo(() => buildClientMail(project), [project])
  const codexBrief = useMemo(() => buildLiveDemoCodexBrief(project), [project])
  const liveBlockPriority = project.status === 'demo_validated' || project.status === 'live_demo_to_prepare'

  function copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => undefined)
  }

  function copyChatGptBrief() {
    copy(chatGptSummary)
    setBriefCopied(true)
    window.setTimeout(() => setBriefCopied(false), 2200)
  }

  function markLovableReady() {
    onUpdate({
      lovableDemoStatus: 'prête',
      status: 'lovable_demo_ready',
      nextAction: 'Envoyer la démo Lovable au client.',
    })
  }

  function markDemoSent() {
    onUpdate({
      lovableDemoStatus: 'envoyée',
      status: 'demo_sent',
      nextAction: 'Attendre le retour client et noter les ajustements.',
    })
  }

  function markDemoValidated() {
    onUpdate({
      lovableDemoStatus: 'validée',
      status: 'demo_validated',
      technicalStatus: 'à préparer',
      nextAction: 'Copier le brief Codex pour rendre la démo vivante.',
    })
  }

  function markLiveReady() {
    onUpdate({
      technicalStatus: 'vivante prête',
      status: 'live_demo_to_prepare',
      nextAction: 'Tester la version vivante puis activer le client.',
    })
  }

  function activateClient() {
    onUpdate({
      status: 'active',
      technicalStatus: 'active',
      paymentSimpleStatus: project.paymentSimpleStatus === 'payé' ? 'payé' : project.paymentSimpleStatus,
      nextAction: 'Client actif. Suivre les premiers retours.',
    })
  }

  return (
    <div className="admin-view project-detail">
      <button className="back-link" type="button" onClick={() => onNavigate('/admin/projects')}>← Retour projets</button>
      <header className="project-detail-header">
        <div>
          <p className="sd-eyebrow">Fiche projet simplifiée</p>
          <h1>{project.companyName}</h1>
          <p>{project.sector} · {project.city}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>

      <Card className="detail-block">
        <SectionTitle title="1. Résumé client" text="Copiez ce résumé dans ChatGPT pour faire l’analyse et préparer le prompt Lovable." />
        <div className="detail-grid">
          <Info label="Entreprise" value={project.companyName} />
          <Info label="Secteur" value={project.sector} />
          <Info label="Ville" value={project.city} />
          <Info label="Site actuel" value={getProjectSourceAdminLabel(project)} />
          <Info label="Contact" value={`${project.firstName} ${project.lastName}`} />
          <Info label="Email" value={project.email} />
          <Info label="Téléphone" value={project.phone} />
          <Info label="Douleur principale" value={project.pain} />
          <Info label="Objectif principal" value={project.goal} />
          <Info label="Modules demandés" value={project.features.join(', ')} />
          <Info label="Style demandé" value={project.style} />
          <Info label="Notes client" value={project.message} />
          <Info label="Statut du projet" value={projectStatusLabels[project.status]} />
        </div>
        <div className="chatgpt-assets-block">
          <SectionTitle title="Captures et éléments à ajouter dans ChatGPT" text="Champs optionnels pour guider l’analyse manuelle avec vos captures." />
          <div className="field-grid">
            <TextArea label="Captures prévues" value={project.chatGptPlannedCaptures} onChange={(value) => onUpdate({ chatGptPlannedCaptures: value })} />
            <TextArea label="Annonces à réutiliser" value={project.chatGptListingsToReuse} onChange={(value) => onUpdate({ chatGptListingsToReuse: value })} />
            <TextArea label="Images à réutiliser" value={project.chatGptImagesToReuse} onChange={(value) => onUpdate({ chatGptImagesToReuse: value })} />
            <TextArea label="Notes Hugo" value={project.chatGptHugoNotes} onChange={(value) => onUpdate({ chatGptHugoNotes: value })} />
            <TextArea label="Éléments à absolument reprendre" value={project.chatGptMustKeep} onChange={(value) => onUpdate({ chatGptMustKeep: value })} />
            <TextArea label="Éléments à éviter" value={project.chatGptAvoid} onChange={(value) => onUpdate({ chatGptAvoid: value })} />
          </div>
        </div>
        <div className="inline-actions">
          <Button onClick={copyChatGptBrief}>Copier le brief ChatGPT</Button>
          {briefCopied && <span className="copy-feedback">Brief copié.</span>}
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="2. Démo Lovable" text="Collez ici le lien de la démo créée manuellement dans Lovable." />
        <div className="field-grid">
          <TextInput label="Lien Lovable" value={project.lovableLink} onChange={(value) => onUpdate({ lovableLink: value })} />
          <label className="sd-field">
            <span>Statut démo</span>
            <select value={project.lovableDemoStatus} onChange={(event) => onUpdate({ lovableDemoStatus: event.target.value as Project['lovableDemoStatus'] })}>
              {lovableStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <TextArea label="Notes démo" value={project.lovableNotes} onChange={(value) => onUpdate({ lovableNotes: value })} />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => onUpdate({ nextAction: 'Lien Lovable enregistré. Préparer le mail client.' })}>Enregistrer le lien Lovable</Button>
          <Button variant="secondary" disabled={!project.lovableLink} onClick={() => window.open(project.lovableLink, '_blank')}>Ouvrir la démo</Button>
          <Button onClick={markLovableReady}>Marquer comme démo prête</Button>
          <Button variant="secondary" onClick={markDemoSent}>Marquer comme envoyée</Button>
          <Button variant="secondary" onClick={markDemoValidated}>Marquer comme validée</Button>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="3. Mail client" text="Mail simple à envoyer quand le lien Lovable est prêt." />
        <TextInput label="Objet du mail" value={clientMail.subject} onChange={() => undefined} />
        <TextArea label="Corps du mail" value={clientMail.body} onChange={() => undefined} />
        <div className="inline-actions">
          <Button onClick={() => copy(`Objet : ${clientMail.subject}\n\n${clientMail.body}`)}>Copier le mail</Button>
          <Button variant="secondary" onClick={() => window.open(buildGmailUrl(project.email, clientMail.subject, clientMail.body), '_blank')}>Ouvrir dans Gmail</Button>
          <Button variant="secondary" onClick={() => window.location.href = buildMailtoUrl(project.email, clientMail.subject, clientMail.body)}>Ouvrir l’application mail</Button>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="4. Validation / paiement" text="Suivi manuel uniquement, sans Stripe pour le moment." />
        <div className="field-grid">
          <TextInput label="Prix proposé" value={project.proposedPrice} onChange={(value) => onUpdate({ proposedPrice: value })} />
          <TextInput label="Acompte demandé" value={project.depositRequested} onChange={(value) => onUpdate({ depositRequested: value })} />
          <label className="sd-field">
            <span>Statut paiement</span>
            <select value={project.paymentSimpleStatus} onChange={(event) => onUpdate({ paymentSimpleStatus: event.target.value as Project['paymentSimpleStatus'] })}>
              {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <TextArea label="Notes paiement" value={project.paymentNotes} onChange={(value) => onUpdate({ paymentNotes: value })} />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => onUpdate({ paymentSimpleStatus: 'acompte reçu', nextAction: 'Préparer la version vivante après validation.' })}>Marquer acompte reçu</Button>
          <Button onClick={() => onUpdate({ paymentSimpleStatus: 'payé', nextAction: 'Activer le client dès que la démo vivante est prête.' })}>Marquer paiement reçu</Button>
          <Button variant="ghost" onClick={() => onUpdate({ status: 'lost', paymentSimpleStatus: 'annulé', nextAction: 'Projet perdu.' })}>Marquer perdu</Button>
        </div>
      </Card>

      <Card className={liveBlockPriority ? 'detail-block priority-block' : 'detail-block'}>
        <SectionTitle title="5. Démo vivante" text="À utiliser seulement après validation client de la démo Lovable." />
        <div className="detail-grid">
          <Info label="Lien Lovable validé" value={project.lovableLink} />
          <Info label="Modules à activer" value={project.features.join(', ')} />
          <Info label="AgencyId / clientId" value={project.generatedAgencyId || project.id} />
        </div>
        <div className="field-grid">
          <TextArea label="Notes techniques" value={project.technicalNotes} onChange={(value) => onUpdate({ technicalNotes: value })} />
          <TextInput label="Lien repo ou export Lovable" value={project.liveRepoLink} onChange={(value) => onUpdate({ liveRepoLink: value })} />
          <label className="sd-field">
            <span>Statut technique</span>
            <select value={project.technicalStatus} onChange={(event) => onUpdate({ technicalStatus: event.target.value as Project['technicalStatus'] })}>
              {technicalStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>
        <div className="inline-actions">
          <Button onClick={() => copy(codexBrief)}>Copier le brief Codex pour rendre vivante</Button>
          <Button variant="secondary" onClick={markLiveReady}>Marquer démo vivante prête</Button>
          <Button variant="secondary" onClick={activateClient}>Activer client</Button>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="6. Notes internes" />
        <TextArea label="Notes privées Hugo" value={project.privateNotes} onChange={(value) => onUpdate({ privateNotes: value })} />
        <TextInput label="Prochaine action" value={project.nextAction} onChange={(value) => onUpdate({ nextAction: value })} />
        <TextInput label="Date prochaine relance" value={project.reminderDate} onChange={(value) => onUpdate({ reminderDate: value })} />
        <label className="sd-field">
          <span>Statut projet</span>
          <select value={project.status} onChange={(event) => onUpdate({ status: event.target.value as Project['status'] })}>
            {projectStatuses.map((status) => <option key={status} value={status}>{projectStatusLabels[status]}</option>)}
          </select>
        </label>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => onUpdate({ privateNotes: project.privateNotes })}>Enregistrer les notes</Button>
          <Button variant="secondary" onClick={() => onUpdate({ nextAction: 'Relancer le client.', status: project.status })}>Marquer à relancer</Button>
          <Button onClick={() => onUpdate({ status: 'active', nextAction: 'Terminé.' })}>Marquer terminé</Button>
        </div>
      </Card>
    </div>
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

function buildChatGptSummary(project: Project) {
  const optionalFields = buildOptionalChatGptFields(project)

  return `Analyse ce client et prépare un prompt Lovable complet pour Signature Digital.

Entreprise :
${project.companyName}

Secteur :
${project.sector}

Ville :
${project.city}

Site actuel :
${getProjectSourceAdminLabel(project)}

Contact :
${project.firstName} ${project.lastName}
${project.email}
${project.phone}

Douleur principale :
${project.pain}

Objectif principal :
${project.goal}

Angle commercial :
${project.analysisNotes || 'À définir selon l’analyse du site et les réponses client.'}

Modules souhaités :
${formatProjectList(project.features)}

Style voulu :
${project.style || 'À définir'}

Notes client :
${project.message || 'Aucune note complémentaire.'}${optionalFields}

Éléments visuels :
Je vais ajouter les captures d’écran du site, du logo, des annonces, des photos et de la fiche annonce directement dans ChatGPT.
Je ne connais pas forcément les codes couleurs : déduis les couleurs, l’ambiance visuelle et le style à partir des captures.

Mission :

1. Analyse rapidement le site actuel.
2. Identifie les faiblesses visibles.
3. Déduis l’identité à reprendre : logo, couleurs approximatives, ambiance, ton, images, annonces.
4. Trouve l’angle commercial le plus fort.
5. Définis les modules Signature Digital à activer et à désactiver.
6. Crée la structure complète de la démo Lovable.
7. Génère le prompt Lovable complet prêt à copier-coller.
8. Écris un mail court pour présenter la démo au client.

Positionnement Signature Digital :
Signature Digital ne vend pas un simple site.
Signature Digital montre une expérience digitale premium, plus claire, plus rassurante et plus efficace pour convertir.

Important :
La démo doit donner une sensation de sur-mesure en reprenant l’identité du client, ses images, ses annonces, son logo, sa ville et son positionnement.
Mais elle doit rester compatible avec le moteur Signature Digital.
Seuls les modules activés doivent apparaître.
Les modules désactivés ne doivent pas être visibles.`
}

function buildOptionalChatGptFields(project: Project) {
  const fields = [
    ['Captures prévues', project.chatGptPlannedCaptures],
    ['Annonces à réutiliser', project.chatGptListingsToReuse],
    ['Images à réutiliser', project.chatGptImagesToReuse],
    ['Notes Hugo', project.chatGptHugoNotes],
    ['Éléments à absolument reprendre', project.chatGptMustKeep],
    ['Éléments à éviter', project.chatGptAvoid],
  ].filter(([, value]) => value.trim())

  if (!fields.length) return ''

  return `\n\n${fields.map(([label, value]) => `${label} :\n${value}`).join('\n\n')}`
}

function formatProjectList(values: string[]) {
  return values.length ? values.join(', ') : 'À définir'
}

function buildClientMail(project: Project) {
  return {
    subject: 'Votre démo Signature Digital est prête',
    body: `Bonjour ${project.firstName || ''},

J’ai préparé une première démo personnalisée pour ${project.companyName}.

Vous pouvez la consulter ici :
${project.lovableLink || '[Lien Lovable à ajouter]'}

L’objectif est de vous montrer comment votre expérience digitale peut devenir plus claire, plus premium et plus rassurante pour vos visiteurs.

Ce n’est pas une simple maquette graphique : c’est une première vision de ce que pourrait devenir votre parcours client.

Dites-moi ce que vous en pensez, et si vous souhaitez que l’on avance, je peux ensuite préparer la version vivante et fonctionnelle.

À bientôt,
Hugo — Signature Digital`,
  }
}

function buildLiveDemoCodexBrief(project: Project) {
  return `Rends cette démo Lovable vivante avec le moteur Signature Digital.

Client :
${project.companyName}

Secteur :
${project.sector}

AgencyId :
${project.generatedAgencyId || project.id}

Lien démo Lovable :
${project.lovableLink || 'À compléter'}

Modules à activer :
${project.features.join(', ')}

Objectif :
Transformer cette démo visuelle en version fonctionnelle et indépendante.

Règles :

- ne pas recréer un backend par client
- utiliser le moteur Signature Digital Core
- toutes les données doivent être liées à agencyId
- connecter les formulaires aux API communes
- activer uniquement les modules validés
- les modules désactivés doivent rester invisibles
- les leads, rendez-vous, documents et notifications doivent rester isolés pour ce client`
}

function buildGmailUrl(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildMailtoUrl(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
