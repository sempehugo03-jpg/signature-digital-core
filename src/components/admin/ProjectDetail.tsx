import { useMemo, useState } from 'react'
import type { DemoAsset, DemoAssetType, Project } from '../../data/projectStore'
import { getProjectLovableUrl, getProjectSourceAdminLabel, getTrackingUrl, isValidExternalUrl, normalizeLovableUrl, projectStatusLabels, projectStatuses } from '../../data/projectStore'
import { Button, Card, SectionTitle, StatusBadge, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const lovableStatuses: Project['lovableDemoStatus'][] = ['pas encore créée', 'prête', 'envoyée', 'validée', 'refusée']
const paymentStatuses: Project['paymentSimpleStatus'][] = ['non demandé', 'en attente', 'acompte reçu', 'payé', 'annulé']
const technicalStatuses: Project['technicalStatus'][] = ['à préparer', 'en cours', 'vivante prête', 'active']
const maxImageSize = 5 * 1024 * 1024
const acceptedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

type DemoAssetArrayKey = 'logoAssets' | 'websiteScreenshots' | 'reusableImages' | 'listingScreenshots' | 'listingPhotos'

export function ProjectDetail({
  project,
  onNavigate,
  onUpdate,
}: {
  project: Project
  onNavigate: Navigate
  onUpdate: (updates: Partial<Project>) => void
}) {
  const [packCopied, setPackCopied] = useState(false)
  const [assetsSaved, setAssetsSaved] = useState(false)
  const [assetNotice, setAssetNotice] = useState('')
  const [assetError, setAssetError] = useState('')
  const [lovableLinkError, setLovableLinkError] = useState('')
  const directLovablePrompt = useMemo(() => buildDirectLovablePrompt(project), [project])
  const genericLovablePromptPreview = useMemo(() => buildGenericLovablePromptPreview(), [])
  const clientMail = useMemo(() => buildClientMail(project), [project])
  const codexBrief = useMemo(() => buildLiveDemoCodexBrief(project), [project])
  const liveBlockPriority = project.status === 'demo_validated' || project.status === 'live_demo_to_prepare'

  function copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => undefined)
  }

  function copyDirectLovablePrompt() {
    copy(directLovablePrompt)
    setPackCopied(true)
    window.setTimeout(() => setPackCopied(false), 2200)
  }

  function updateDemoAsset<K extends keyof Project['demoAssets']>(key: K, value: Project['demoAssets'][K]) {
    onUpdate({
      demoAssets: {
        ...project.demoAssets,
        [key]: value,
      },
    })
    setAssetsSaved(false)
  }

  async function addImages(assetKey: DemoAssetArrayKey, assetType: DemoAssetType, files: FileList | null) {
    if (!files?.length) return

    setAssetError('')
    setAssetNotice('')

    const nextAssets: DemoAsset[] = [...project.demoAssets[assetKey]]
    let usedLocalFallback = false

    for (const file of Array.from(files)) {
      if (!acceptedImageTypes.includes(file.type)) {
        setAssetError('Format non supporté. Ajoutez une image jpg, jpeg, png ou webp.')
        continue
      }

      if (file.size > maxImageSize) {
        setAssetError('Image trop lourde. Essayez une image de moins de 5 Mo.')
        continue
      }

      const dataUrl = await readFileAsDataUrl(file)
      const uploadedUrl = await uploadDemoAsset(project.id, assetType, file, dataUrl)
      usedLocalFallback = usedLocalFallback || !uploadedUrl
      nextAssets.push({
        id: createAssetId(),
        url: uploadedUrl || dataUrl,
        type: assetType,
        fileName: file.name || 'image',
        createdAt: new Date().toISOString(),
      })
    }

    updateDemoAsset(assetKey, nextAssets)
    setAssetNotice(usedLocalFallback ? 'Stockage image non configuré. Ajoutez une URL ou une note manuellement.' : 'Image ajoutée.')
  }

  function removeImage(assetKey: DemoAssetArrayKey, assetId: string) {
    updateDemoAsset(assetKey, project.demoAssets[assetKey].filter((asset) => asset.id !== assetId))
  }

  function saveDemoAssets() {
    onUpdate({ demoAssets: project.demoAssets })
    setAssetsSaved(true)
    window.setTimeout(() => setAssetsSaved(false), 2200)
  }

  function saveLovableLink() {
    const normalized = normalizeLovableUrl(project.lovableLink)

    if (normalized && !isValidExternalUrl(normalized)) {
      setLovableLinkError('Ajoutez un lien valide commençant par https://')
      return
    }

    setLovableLinkError('')
    onUpdate({
      lovableLink: normalized,
      nextAction: normalized ? 'Lien Lovable enregistré. Préparer le mail client.' : 'Lien Lovable supprimé. Ajouter un lien avant envoi client.',
    })
  }

  function markLovableReady() {
    const normalized = normalizeLovableUrl(project.lovableLink)
    if (!normalized || !isValidExternalUrl(normalized)) {
      setLovableLinkError('Ajoutez le lien Lovable avant de préparer le mail.')
      return
    }

    setLovableLinkError('')
    onUpdate({
      lovableLink: normalized,
      lovableDemoStatus: 'prête',
      status: 'lovable_demo_ready',
      nextAction: 'Envoyer le mail client avec le lien vers l’espace de suivi.',
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
        <SectionTitle title="Compte rendu client" text="Les informations utiles de la demande sont regroupées ici avant de préparer la démo Lovable." />
        <div className="detail-grid">
          <Info label="Agence" value={project.companyName} />
          <Info label="Ville" value={project.city} />
          <Info
            label="Site actuel"
            value={getWebsiteDisplay(project)}
            href={project.hasWebsite && project.currentWebsite ? project.currentWebsite : undefined}
          />
          <Info label="Contact" value={`${project.firstName} ${project.lastName}`} />
          <Info label="Email" value={project.email} />
          <Info label="Téléphone" value={project.phone} />
          <Info label="Douleur principale" value={project.diagnosticBlocker || project.pain} />
          <Info label="Objectif principal" value={project.diagnosticGoal || project.goal} />
          <Info label="Priorité" value={project.diagnosticPriority} />
          <Info label="Ressenti souhaité" value={project.desiredFeeling} />
          <Info label="Style souhaité" value={project.style} />
          <Info label="Message client" value={project.message} />
          <Info label="Statut du projet" value={projectStatusLabels[project.status]} />
        </div>
        <div className="field-grid">
          <TextArea label="Notes Hugo" value={project.privateNotes} onChange={(value) => onUpdate({ privateNotes: value })} />
          <TextArea
            label="Vision Hugo"
            value={project.hugoVision}
            onChange={(value) => onUpdate({ hugoVision: value })}
            placeholder="Le site actuel présente l’agence comme une vitrine classique. La démo doit montrer une expérience vendeur premium centrée sur la confiance, le suivi et la transparence."
          />
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="Prompt Lovable générique" text="Ce modèle sera ajouté au compte rendu client au moment de la copie." />
        <TextArea label="Modèle générique ajouté" value={genericLovablePromptPreview} onChange={() => undefined} />
        <div className="inline-actions">
          <Button onClick={copyDirectLovablePrompt}>Copier le prompt Lovable complet</Button>
          {packCopied && <span className="copy-feedback">Prompt Lovable copié.</span>}
        </div>
      </Card>

      <Card className="detail-block">
        <div className="demo-assets-block">
          <SectionTitle title="Éléments visuels pour la démo" text="Stockez ici les références utiles pour préparer la démo Lovable." />
          <div className="field-grid">
            <TextInput
              label="URL logo si disponible"
              value={project.demoAssets.logoUrl}
              onChange={(value) => updateDemoAsset('logoUrl', value)}
              placeholder="https://..."
            />
            <TextArea
              label="Notes logo"
              value={project.demoAssets.logoNotes}
              onChange={(value) => updateDemoAsset('logoNotes', value)}
              placeholder="Colle ici le lien du logo ou indique : capture fournie."
            />
            <AssetUploader
              label="Upload image logo / header"
              assets={project.demoAssets.logoAssets}
              onUpload={(files) => addImages('logoAssets', 'logo', files)}
              onRemove={(assetId) => removeImage('logoAssets', assetId)}
            />
            <TextArea
              label="Captures du site actuel"
              value={project.demoAssets.websiteScreenshotsNotes}
              onChange={(value) => updateDemoAsset('websiteScreenshotsNotes', value)}
              placeholder="Accueil, header, footer, page services, page biens..."
            />
            <AssetUploader
              label="Upload captures du site actuel"
              assets={project.demoAssets.websiteScreenshots}
              multiple
              onUpload={(files) => addImages('websiteScreenshots', 'website_screenshot', files)}
              onRemove={(assetId) => removeImage('websiteScreenshots', assetId)}
            />
            <TextArea
              label="Couleurs / ambiance visuelle"
              value={project.demoAssets.visualMood}
              onChange={(value) => updateDemoAsset('visualMood', value)}
              placeholder="Ex : noir, blanc cassé, doré, violet, ambiance premium, locale, moderne..."
            />
            <TextArea
              label="Images à réutiliser"
              value={project.demoAssets.imageReferences}
              onChange={(value) => updateDemoAsset('imageReferences', value)}
              placeholder="URLs ou notes sur les images à reprendre."
            />
            <AssetUploader
              label="Upload images à réutiliser"
              assets={project.demoAssets.reusableImages}
              multiple
              onUpload={(files) => addImages('reusableImages', 'reusable_image', files)}
              onRemove={(assetId) => removeImage('reusableImages', assetId)}
            />
            <TextArea
              label="Annonces / offres à réutiliser"
              value={project.demoAssets.offerReferences}
              onChange={(value) => updateDemoAsset('offerReferences', value)}
              placeholder="Ex : Appartement T3 Montauban — 240 000 € — 70 m² — lien ou capture fournie."
            />
            <AssetUploader
              label="Upload captures annonces / offres"
              assets={project.demoAssets.listingScreenshots}
              multiple
              onUpload={(files) => addImages('listingScreenshots', 'listing_screenshot', files)}
              onRemove={(assetId) => removeImage('listingScreenshots', assetId)}
            />
            <TextArea
              label="Photos d’annonces"
              value={project.demoAssets.listingPhotoReferences}
              onChange={(value) => updateDemoAsset('listingPhotoReferences', value)}
              placeholder="URLs ou notes : photos fournies."
            />
            <AssetUploader
              label="Upload photos d’annonces"
              assets={project.demoAssets.listingPhotos}
              multiple
              onUpload={(files) => addImages('listingPhotos', 'listing_photo', files)}
              onRemove={(assetId) => removeImage('listingPhotos', assetId)}
            />
            <TextArea
              label="Éléments à absolument reprendre"
              value={project.demoAssets.mustReuse}
              onChange={(value) => updateDemoAsset('mustReuse', value)}
              placeholder="Logo, ton, slogan, annonces, couleurs, photos, zones géographiques..."
            />
            <TextArea
              label="Éléments à éviter / améliorer"
              value={project.demoAssets.mustAvoid}
              onChange={(value) => updateDemoAsset('mustAvoid', value)}
              placeholder="Site trop chargé, trop de texte, manque de CTA, pas assez premium..."
            />
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={saveDemoAssets}>Enregistrer les éléments</Button>
            {assetsSaved && <span className="copy-feedback">Éléments enregistrés.</span>}
            {assetNotice && <span className="copy-feedback">{assetNotice}</span>}
            {assetError && <span className="form-error">{assetError}</span>}
          </div>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="2. Démo Lovable" text="Collez ici le lien de la démo créée manuellement dans Lovable." />
        <div className="field-grid">
          <TextInput label="Lien Lovable" value={project.lovableLink} onChange={(value) => {
            setLovableLinkError('')
            onUpdate({ lovableLink: value })
          }} />
          <label className="sd-field">
            <span>Statut démo</span>
            <select value={project.lovableDemoStatus} onChange={(event) => onUpdate({ lovableDemoStatus: event.target.value as Project['lovableDemoStatus'] })}>
              {lovableStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <TextArea label="Notes démo" value={project.lovableNotes} onChange={(value) => onUpdate({ lovableNotes: value })} />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={saveLovableLink}>Enregistrer le lien Lovable</Button>
          <Button variant="secondary" disabled={!getProjectLovableUrl(project)} onClick={() => window.open(getProjectLovableUrl(project), '_blank', 'noopener,noreferrer')}>Ouvrir la démo</Button>
          <Button onClick={markLovableReady}>Marquer comme démo prête</Button>
          <Button variant="secondary" onClick={markDemoSent}>Marquer comme envoyée</Button>
          <Button variant="secondary" onClick={markDemoValidated}>Marquer comme validée</Button>
          {lovableLinkError && <span className="form-error">{lovableLinkError}</span>}
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="3. Mail client" text="Le client découvrira la démo depuis son espace de suivi. Le lien Lovable n’est pas envoyé directement." />
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

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      {href ? (
        <a className="info-link" href={href} target="_blank" rel="noreferrer" title={href}>{value || 'À compléter'}</a>
      ) : (
        <strong>{value || 'À compléter'}</strong>
      )}
    </div>
  )
}

function AssetUploader({
  label,
  assets,
  multiple = false,
  onUpload,
  onRemove,
}: {
  label: string
  assets: DemoAsset[]
  multiple?: boolean
  onUpload: (files: FileList | null) => void
  onRemove: (assetId: string) => void
}) {
  return (
    <div className="asset-uploader">
      <label className="sd-field">
        <span>{label}</span>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple={multiple} onChange={(event) => onUpload(event.target.files)} />
      </label>
      {assets.length > 0 && (
        <div className="asset-preview-grid">
          {assets.map((asset) => (
            <div className="asset-preview-card" key={asset.id}>
              <img src={asset.url} alt={asset.fileName} />
              <small>{asset.fileName}</small>
              <button type="button" onClick={() => onRemove(asset.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function buildDirectLovablePrompt(project: Project) {
  return `DÉBUT PROMPT LOVABLE

Tu es Lovable.

Crée une démo premium pour une agence immobilière avec le modèle Signature Digital Immobilier.

Cette démo doit donner à l’agence l’impression de voir :
“Notre agence, mais en beaucoup plus clair, premium et rassurant.”

==================================================
COMPTE RENDU CLIENT

${buildClientReport(project)}

==================================================
${buildGenericLovablePrompt(project)}

FIN PROMPT LOVABLE`
}

function buildClientReport(project: Project) {
  return `Agence :
${valueOrMissing(project.companyName)}

Ville :
${valueOrMissing(project.city)}

Site actuel :
${valueOrMissing(getProjectSourceAdminLabel(project))}

Contact :
${valueOrMissing(`${project.firstName} ${project.lastName}`.trim())}
${valueOrMissing(project.email)}
${valueOrMissing(project.phone)}

Douleur principale :
${valueOrMissing(project.diagnosticBlocker || project.pain)}

Objectif principal :
${valueOrMissing(project.diagnosticGoal || project.goal)}

Priorité principale :
${valueOrMissing(project.diagnosticPriority)}

Ressenti souhaité :
${valueOrMissing(project.desiredFeeling)}

Style souhaité :
${valueOrMissing(project.style)}

Message libre client :
${valueOrMissing(project.message)}

Notes Hugo :
${valueOrMissing(project.privateNotes)}

Vision Hugo :
${valueOrMissing(project.hugoVision)}`
}

function buildGenericLovablePrompt(project: Project) {
  return `ANALYSE DU SITE ACTUEL

Analyse le site actuel fourni :
${valueOrMissing(getProjectSourceAdminLabel(project))}

Récupère les éléments publics utiles :

- logo de l’agence
- couleurs principales
- ambiance visuelle
- typographie approximative
- images principales
- annonces visibles
- photos de biens
- titres d’annonces
- prix
- villes
- surfaces
- descriptions de biens si disponibles
- ton éditorial de l’agence

Utilise ces éléments pour que la démo donne une sensation de sur-mesure.

Ne copie pas le site actuel à l’identique.
Reprends l’identité existante et transforme-la en expérience Signature Digital plus claire, plus premium et plus rassurante.

==================================================
MODÈLE SIGNATURE DIGITAL IMMOBILIER

Crée une expérience immobilière moderne, pensée pour :

- inspirer confiance plus vite
- valoriser les biens
- rassurer les propriétaires vendeurs
- qualifier les acheteurs
- augmenter les demandes qualifiées
- moderniser l’image de l’agence

Pages / sections à créer :

1. Accueil premium
2. Biens à vendre
3. Fiche bien détaillée
4. Parcours estimation vendeur
5. Espace vendeur privé
6. Demande de visite qualifiée
7. Contact / rappel conseiller
8. Page ou section “Pourquoi nous confier votre bien”

La douleur client doit influencer :

- le titre principal
- les textes
- l’ordre de priorité des sections
- les CTA
- les preuves mises en avant
- l’ambiance visuelle
- le niveau premium
- la manière de raconter l’accompagnement

Ne crée pas une usine à gaz.
Ne copie pas le site actuel.
Améliore fortement :

- la hiérarchie
- la clarté
- les CTA
- la présentation des biens
- l’expérience vendeur

==================================================
STYLE VISUEL

La démo doit être :

- premium
- claire
- mobile-first
- inspirée Apple / Airbnb / Zefir
- très lisible
- humaine
- rassurante
- avec peu de texte
- avec beaucoup d’espace
- avec des CTA visibles
- avec des biens bien valorisés

Ne pas faire :

- site vitrine classique
- gros pavés de texte
- footer énorme
- interface chargée
- design générique
- template banal
- jargon immobilier lourd`
}

function buildGenericLovablePromptPreview() {
  return `Créer une démo immobilière premium avec le modèle Signature Digital Immobilier.

Le prompt complet copié ajoutera automatiquement le compte rendu client, le site actuel, la douleur, l’objectif, la priorité, le style et la vision Hugo.

Le modèle demandé à Lovable vise une version plus claire, plus premium et plus rassurante de l’agence, sans copier le site actuel à l’identique.`
}

function getWebsiteDisplay(project: Project) {
  if (!project.hasWebsite) return 'Pas encore de site'
  if (!project.currentWebsite) return 'À compléter'

  return shortenUrl(project.currentWebsite)
}

function shortenUrl(url: string) {
  return url.length > 72 ? `${url.slice(0, 69)}...` : url
}

function valueOrMissing(value: string) {
  return value.trim() || 'Non renseigné pour l’instant.'
}

function createAssetId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()

  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function uploadDemoAsset(projectId: string, assetType: DemoAssetType, file: File, dataUrl: string) {
  try {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'uploadDemoAsset',
        projectId,
        assetType,
        fileName: file.name,
        contentType: file.type,
        dataUrl,
      }),
    })
    const result = await response.json()

    return result.ok && typeof result.url === 'string' ? result.url as string : ''
  } catch {
    return ''
  }
}

function buildClientMail(project: Project) {
  const trackingUrl = getTrackingUrl(project)

  return {
    subject: 'Votre démo Signature Digital est prête',
    body: `Bonjour ${project.firstName || ''},

Votre première démo personnalisée pour ${project.companyName} est prête.

Elle a été préparée à partir de votre demande, de ${project.hasWebsite ? 'votre site actuel' : 'votre activité'}, de vos priorités et des fonctionnalités sélectionnées.

Votre démo est disponible depuis votre espace de suivi Signature Digital.

Accéder à mon espace de suivi :
${trackingUrl}

Depuis cet espace, vous pourrez :

- découvrir votre démo
- suivre l’avancement
- demander un ajustement
- ajouter une précision
- valider la direction proposée

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
