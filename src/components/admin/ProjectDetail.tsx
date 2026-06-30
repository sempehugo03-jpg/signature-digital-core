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
  const genericLovablePromptPreview = useMemo(() => buildGenericLovablePrompt(), [])
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
          <Info label="Priorité principale" value={project.diagnosticPriority} />
          <Info label="Ressenti souhaité" value={project.desiredFeeling} />
          <Info label="Style souhaité" value={project.style} />
          <Info label="Message libre client" value={project.message} />
          <Info label="Statut du projet" value={projectStatusLabels[project.status]} />
        </div>
        <div className="field-grid">
          <TextArea label="Notes Hugo" value={project.privateNotes} onChange={(value) => onUpdate({ privateNotes: value })} placeholder="Non renseigné pour l’instant." />
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
        <a className="info-link" href={href} target="_blank" rel="noreferrer" title={href}>{value || 'Non renseigné pour l’instant.'}</a>
      ) : (
        <strong>{value || 'Non renseigné pour l’instant.'}</strong>
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
  return `COMPTE RENDU CLIENT

${buildClientReport(project)}

==================================================
${buildGenericLovablePrompt()}`
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

function buildGenericLovablePrompt() {
  return `DÉBUT PROMPT LOVABLE GÉNÉRIQUE

Tu es Lovable.

Ta mission est de créer directement une démo visuelle premium pour une agence immobilière avec le modèle Signature Digital Immobilier.

Ne réponds pas avec :

- une analyse
- un angle de démo
- un nouveau prompt
- un mail client

Construis directement l’interface et les pages demandées dans Lovable.

Cette démo doit donner à l’agence l’impression de voir :
“Notre agence, mais en beaucoup plus clair, premium et rassurant.”

La démo ne doit pas être un site vitrine classique.
Elle doit être une expérience immobilière moderne, pensée pour :

- inspirer confiance plus vite
- valoriser les biens
- rassurer les propriétaires vendeurs
- qualifier les acheteurs
- augmenter les demandes qualifiées
- moderniser l’image de l’agence

==================================================
PRIORITÉ ABSOLUE — REPRENDRE LA VRAIE IDENTITÉ DE L’AGENCE

Avant de créer la démo, analyse le site actuel fourni dans le compte rendu client.

Tu dois reprendre en priorité les éléments réels visibles sur le site :

- vrai logo de l’agence
- vraies couleurs dominantes
- vraie ambiance visuelle
- vraie typographie approximative
- vraies images principales
- vraies annonces visibles
- vrais types de biens
- vraies photos de biens si accessibles
- vrais titres d’annonces
- vrais prix
- vraies villes / quartiers
- vraies surfaces
- vraies descriptions de biens si disponibles
- vrai ton éditorial de l’agence
- vraie activité dominante visible sur le site : vente, location, gestion, estimation, syndic ou autre

N’invente pas une nouvelle identité si l’identité du site est identifiable.

Ne remplace pas l’agence par une ambiance générique.
Ne crée pas une marque fictive.
Ne change pas les couleurs principales si le site actuel possède une identité claire.
Ne crée pas uniquement des biens fictifs si des annonces réelles sont visibles.
Ne transforme pas une agence familiale en marque luxe si ce n’est pas cohérent avec son identité.
Ne transforme pas une agence nationale en agence boutique premium si le site montre une marque réseau clairement identifiable.

Si le site montre principalement des locations, la démo doit respecter cette réalité.
Si le site montre principalement des biens à vendre, la démo doit respecter cette réalité.
Si le site montre plusieurs activités, organise-les clairement sans surcharger.

Si certaines données ne sont pas accessibles, utilise des placeholders temporaires propres, mais indique visuellement qu’ils sont remplaçables.

La démo doit ressembler à :
“Cette agence précise, modernisée.”

Et non :
“Un template immobilier premium générique.”

==================================================
ANALYSE DU SITE ACTUEL

Analyse le site actuel fourni dans le compte rendu client.

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

Important :
Ne copie pas le site actuel à l’identique.
Reprends l’identité existante et transforme-la en expérience Signature Digital plus claire, plus premium et plus rassurante.

Formulation à respecter :
Analyse le site actuel fourni. Reprends le logo, les couleurs visibles, l’ambiance, les images, les annonces et les descriptions publiques disponibles. Utilise ces éléments pour créer une démo personnalisée qui ressemble à l’agence, mais en version beaucoup plus premium, claire et rassurante. Ne copie pas le site actuel : améliore fortement la hiérarchie, la clarté, les CTA, la présentation des biens et l’expérience vendeur.

==================================================
DOULEUR CLIENT — ADAPTER L’ANGLE SANS CHANGER L’IDENTITÉ

La douleur principale, l’objectif, la priorité, le ressenti souhaité et la vision Hugo sont fournis dans le compte rendu client.

Utilise ces éléments pour adapter :

- le titre principal
- le sous-titre
- les CTA
- l’ordre de priorité des sections
- les preuves mises en avant
- le vocabulaire
- la manière de présenter l’agence
- la manière de présenter le suivi vendeur
- la manière de rassurer les visiteurs

Mais ne change pas l’identité réelle de l’agence.

Exemples :
Si la douleur est “Mon site ne donne pas assez confiance” :

- renforcer la preuve locale
- rendre le parcours vendeur plus transparent
- montrer l’espace vendeur
- mettre en avant les comptes rendus et l’accompagnement
- utiliser des phrases courtes et rassurantes

Si la douleur est “Mon image n’est pas assez premium” :

- renforcer la hiérarchie visuelle
- augmenter l’espace blanc
- valoriser les photos
- créer une fiche bien plus haut de gamme
- réduire les gros pavés de texte

Si la douleur est “Mes visiteurs ne comprennent pas assez vite ma valeur” :

- clarifier la promesse dès le hero
- réduire le texte
- transformer les arguments en preuves visuelles
- créer une section “Pourquoi nous confier votre bien” très lisible

Si l’objectif est “Générer plus de demandes d’estimation” :

- rendre l’estimation très visible
- placer le CTA estimation haut dans la page
- créer un parcours estimation fluide
- rassurer avant la demande

Si l’objectif est “Créer une expérience plus professionnelle” :

- simplifier la navigation
- clarifier les parcours
- rendre les formulaires sérieux
- rendre les pages plus structurées
- éviter l’effet site bricolé ou trop chargé

==================================================
SQUELETTE SIGNATURE DIGITAL IMMOBILIER

Respecte ce squelette.

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
- les exemples
- l’ambiance visuelle
- le niveau premium
- les blocs à mettre en avant dans le hero
- la manière de raconter l’accompagnement

La douleur ne doit pas créer une nouvelle architecture.

Règle :
Squelette fixe.
Habillage personnalisé.
Angle adapté à la douleur client.
Identité réelle respectée.

==================================================
DÉTAIL DES PAGES À CRÉER

1. Accueil premium

Objectif :
Faire comprendre en moins de 5 secondes pourquoi un vendeur peut faire confiance à cette agence.

Créer :

- hero premium avec le vrai logo de l’agence si accessible
- phrase forte adaptée à la douleur client
- CTA principal “Estimer mon bien”
- CTA secondaire “Voir les biens”
- preuve locale
- aperçu des biens à vendre avec annonces cohérentes avec le site actuel
- bloc confiance
- aperçu estimation
- aperçu espace vendeur
- contact / rappel

2. Biens à vendre

Objectif :
Présenter les biens de manière premium, claire et lisible.

Créer :

- grille de biens
- cartes grandes et aérées
- photo
- ville
- prix
- surface
- pièces
- type
- bouton “Voir le bien”

Utilise en priorité les annonces réelles visibles sur le site actuel.
Si les annonces réelles ne sont pas accessibles, crée des biens temporaires cohérents avec :

- la ville de l’agence
- le type de biens visibles sur le site
- l’activité dominante du site : location ou vente
- le niveau de prix observé si disponible

Si les annonces sont temporaires, elles doivent rester crédibles et remplaçables.

Ne jamais afficher les statuts internes :

- mandat signé
- offre reçue
- compromis
- vente en cours
- progression vendeur

3. Fiche bien détaillée

Objectif :
Valoriser un bien sans noyer l’acheteur.

Créer :

- grande photo
- galerie simple
- titre
- localisation
- prix
- infos essentielles
- description courte
- points forts
- bouton appeler l’agence
- bouton demander une visite

La fiche bien doit reprendre le style et les types d’informations présents sur les annonces réelles si accessibles, mais les présenter de façon plus claire, premium et lisible.

4. Parcours estimation vendeur

Objectif :
Transformer un propriétaire vendeur en demande qualifiée.

Créer un parcours étape par étape :

- type de bien
- ville / adresse
- surface / pièces
- état du bien
- projet de vente
- coordonnées
- confirmation propre

Important :
Ne jamais ouvrir Gmail côté visiteur.
La demande doit sembler envoyée automatiquement.

Message de confirmation :
“Votre demande a bien été transmise. Un conseiller vous rappellera rapidement.”

5. Espace vendeur privé

Objectif :
Montrer la vraie différence Signature Digital.

Créer :

- photo du bien
- progression de vente
- prochaine visite
- compte rendu après visite
- documents importants
- message rassurant

Phrase centrale :
“Vous ne relancez plus l’agence. Vous voyez où en est votre vente.”

Cet espace doit être présenté comme une preuve de transparence et d’accompagnement, pas comme un gadget.

6. Demande de visite qualifiée

Objectif :
Qualifier l’acheteur avant rappel.

Créer un formulaire avec :

- prénom
- nom
- téléphone
- email
- situation acheteur
- financement
- délai d’achat
- message

Texte rassurant :
“Aucune visite n’est confirmée automatiquement. Un conseiller vous rappelle pour valider votre situation et le créneau.”

7. Contact / rappel conseiller

Créer :

- téléphone si visible sur le site actuel
- email si visible sur le site actuel
- adresse si visible sur le site actuel
- formulaire rappel
- CTA simple

8. Pourquoi nous confier votre bien

Objectif :
Expliquer la valeur de l’agence sans gros pavés de texte.

Créer des blocs courts :

- expertise locale
- accompagnement
- stratégie de vente
- sélection acheteurs
- suivi clair
- comptes rendus
- CTA estimation

Utilise les arguments déjà visibles sur le site actuel s’ils existent, mais transforme-les en preuves simples et lisibles.

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

Mais le style doit rester cohérent avec l’identité réelle de l’agence.

Ne pas faire :

- site vitrine classique
- gros pavés de texte
- footer énorme
- interface chargée
- design générique
- template banal
- jargon immobilier lourd
- identité visuelle inventée sans rapport avec l’agence
- biens fictifs incohérents avec l’activité réelle du site

==================================================
OBJECTIF FINAL

Créer une démo qui montre que cette agence peut :

- inspirer confiance plus vite
- rassurer les vendeurs
- présenter ses biens avec plus de valeur
- générer plus de demandes d’estimation
- qualifier les acheteurs
- moderniser son image
- se différencier des agences classiques

Phrase importante :
“La démo doit être visuellement personnalisée pour cette agence, mais elle doit rester compatible avec le moteur Signature Digital. La structure doit respecter le squelette fixe Signature Digital Immobilier. Aucune page hors squelette ne doit être ajoutée. La démo doit ressembler à cette agence précise modernisée, pas à une agence immobilière premium générique.”

FIN PROMPT LOVABLE GÉNÉRIQUE`
}

function getWebsiteDisplay(project: Project) {
  if (!project.hasWebsite) return 'Pas encore de site'
  if (!project.currentWebsite) return 'Non renseigné pour l’instant.'

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
