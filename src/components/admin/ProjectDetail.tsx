import { useMemo, useState } from 'react'
import type { DemoAsset, DemoAssetType, Project, RealEstateModuleKey } from '../../data/projectStore'
import { getProjectSourceAdminLabel, projectStatusLabels, projectStatuses, realEstateModules } from '../../data/projectStore'
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
  const chatGptPack = useMemo(() => buildChatGptPack(project), [project])
  const clientMail = useMemo(() => buildClientMail(project), [project])
  const codexBrief = useMemo(() => buildLiveDemoCodexBrief(project), [project])
  const liveBlockPriority = project.status === 'demo_validated' || project.status === 'live_demo_to_prepare'
  const enabledModules = getEnabledRealEstateModules(project)
  const disabledModules = getDisabledRealEstateModules(project)

  function copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => undefined)
  }

  function copyChatGptPack() {
    copy(chatGptPack)
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

  function toggleRealEstateModule(moduleKey: RealEstateModuleKey) {
    const enabledSet = new Set(project.modulesEnabled)

    if (enabledSet.has(moduleKey)) {
      enabledSet.delete(moduleKey)
    } else {
      enabledSet.add(moduleKey)
    }

    const modulesEnabled = realEstateModules
      .map((module) => module.key)
      .filter((key) => enabledSet.has(key))
    const modulesDisabled = realEstateModules
      .map((module) => module.key)
      .filter((key) => !enabledSet.has(key))

    onUpdate({ modulesEnabled, modulesDisabled })
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
          <Info
            label="Site actuel"
            value={getWebsiteDisplay(project)}
            href={project.hasWebsite && project.currentWebsite ? project.currentWebsite : undefined}
          />
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
        <div className="real-estate-modules-panel">
          <SectionTitle
            title="Modules / pages immobiliers"
            text="Ces choix alimentent le pack ChatGPT. Seuls les modules cochés seront demandés dans Lovable."
          />
          <div className="real-estate-module-grid">
            {realEstateModules.map((module) => {
              const checked = project.modulesEnabled.includes(module.key)

              return (
                <label className={checked ? 'real-estate-module active' : 'real-estate-module'} key={module.key}>
                  <input type="checkbox" checked={checked} onChange={() => toggleRealEstateModule(module.key)} />
                  <span>
                    <strong>{module.label}</strong>
                    <small>{module.description}</small>
                  </span>
                </label>
              )
            })}
          </div>
          <div className="module-summary-grid">
            <Info label="Modules cochés" value={enabledModules.map((module) => module.label).join(', ')} />
            <Info label="Modules non cochés" value={disabledModules.map((module) => module.label).join(', ')} />
          </div>
        </div>
        <div className="demo-assets-block">
          <SectionTitle title="Éléments visuels pour la démo" text="Stockez ici les références que vous ajouterez ensuite dans ChatGPT pour préparer la démo Lovable." />
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
              placeholder="Colle ici le lien du logo ou indique : capture fournie dans ChatGPT."
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
              placeholder="URLs ou notes : photos fournies dans ChatGPT."
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
        <div className="inline-actions">
          <Button onClick={copyChatGptPack}>Copier le pack ChatGPT</Button>
          {packCopied && <span className="copy-feedback">Pack ChatGPT copié.</span>}
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

function buildChatGptPack(project: Project) {
  const demoAssetsSection = buildDemoAssetsBriefSection(project)
  const enabledModules = getEnabledRealEstateModules(project)
  const disabledModules = getDisabledRealEstateModules(project)

  return `DÉBUT DU PACK CHATGPT

Tu es mon expert Signature Digital spécialisé uniquement dans les démos Lovable pour agences immobilières.

Ta mission :
Transformer le brief client ci-dessous + les captures du site actuel + les attentes du client en un prompt Lovable premium, clair, rapide à produire et compatible avec le moteur Signature Digital.

Le but :
Créer une démo immobilière qui donne à l’agence l’impression de :
“C’est notre agence, mais en beaucoup plus clair, premium et rassurant.”

Important :
La démo doit donner une sensation de sur-mesure dès la première présentation, mais techniquement elle doit rester basée sur le modèle Signature Digital Immobilier.

Donc :

- même logique produit
- mêmes modules activables
- mêmes parcours métier
- mais identité visuelle personnalisée selon l’agence

==================================================
INFOS CLIENT

Agence :
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
${valueOrMissing(project.pain)}

Objectif principal :
${valueOrMissing(project.goal)}

Angle commercial :
${valueOrMissing(project.analysisNotes)}

Style souhaité :
${valueOrMissing(project.style)}

Notes client :
${valueOrMissing(project.message)}

Notes Hugo :
${valueOrMissing(project.privateNotes)}

==================================================
CHOIX DU CLIENT — À RESPECTER STRICTEMENT

Modules / pages cochés par le client :
${formatModuleList(enabledModules)}

Modules / pages non cochés :
${formatModuleList(disabledModules)}

Règle absolue :
Tu dois créer uniquement les pages et sections correspondant aux choix cochés.

Ne crée pas toutes les pages par défaut.
Ne montre pas les modules désactivés.
Ne rajoute pas des fonctionnalités non demandées.
Ne crée pas une usine à gaz.

Si un module n’est pas coché, il ne doit pas apparaître dans le prompt Lovable.

${demoAssetsSection}

==================================================
MODULES / PAGES POSSIBLES

Les modules Signature Digital Immobilier possibles sont :

1. premium_presentation
   Page accueil premium / présentation haut de gamme

2. property_listings
   Page biens à vendre

3. property_detail
   Fiche bien détaillée

4. estimation
   Parcours estimation vendeur

5. seller_space
   Espace vendeur privé

6. visit_request
   Demande de visite qualifiée

7. documents
   Documents vendeur

8. reports
   Comptes rendus / retours après visite

9. callback_request
   Demande de rappel conseiller

10. notifications
    Notifications / suivi des étapes

11. contact
    Page contact / coordonnées agence

12. agency_value_page
    Page “Pourquoi nous confier votre bien”

Règle :
Modules cochés = visibles dans la démo.
Modules non cochés = invisibles.

==================================================
STRUCTURE À UTILISER SELON LES MODULES COCHÉS

Si premium_presentation est coché :
Créer une page accueil premium.

Objectif :
Faire comprendre en moins de 5 secondes pourquoi un vendeur peut faire confiance à cette agence.

Sections possibles :

- hero clair et premium
- logo de l’agence
- phrase forte orientée vendeur
- CTA principal selon objectif
- CTA secondaire si utile
- preuve locale
- mise en avant de l’accompagnement
- aperçu des biens si property_listings coché
- aperçu estimation si estimation coché
- aperçu espace vendeur si seller_space coché
- contact / rappel si callback_request coché

Si property_listings est coché :
Créer une page “Biens à vendre”.

Objectif :
Présenter les biens de manière premium, lisible et rassurante.

Sections :

- grille de biens
- cartes grandes et aérées
- photo
- ville
- prix
- surface
- pièces
- type
- bouton “Voir le bien”

Ne jamais afficher les statuts internes :

- mandat signé
- offre reçue
- compromis
- vente en cours
- progression vendeur

Si property_detail est coché :
Créer une fiche bien détaillée.

Objectif :
Valoriser le bien sans noyer l’acheteur.

Sections :

- grande photo
- galerie simple
- titre
- localisation
- prix
- infos essentielles
- description courte
- points forts
- bouton appeler l’agence
- bouton demander une visite seulement si visit_request est coché

Si estimation est coché :
Créer un parcours estimation vendeur.

Objectif :
Transformer un propriétaire vendeur en demande qualifiée.

Parcours :

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
Le texte final doit rassurer :
“Votre demande a bien été transmise. Un conseiller vous rappellera rapidement.”

Si seller_space est coché :
Créer un espace vendeur privé.

Objectif :
Montrer la vraie différence Signature Digital.

Sections :

- photo du bien
- progression de vente
- prochaine visite
- compte rendu après visite si reports coché
- documents importants si documents coché
- message rassurant

Phrase centrale :
“Vous ne relancez plus l’agence. Vous voyez où en est votre vente.”

Si visit_request est coché :
Créer une demande de visite qualifiée.

Objectif :
Qualifier l’acheteur avant rappel.

Champs :

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

Si documents est coché :
Créer un bloc documents vendeur.

Documents possibles :

- mandat
- diagnostics
- offre
- compromis
- autres documents

Si reports est coché :
Créer un bloc comptes rendus / retours après visite.

Objectif :
Montrer que l’agence ne laisse pas le vendeur dans le flou.

Exemples :

- visite réalisée
- retour acheteur
- niveau d’intérêt
- prochaine action

Si callback_request est coché :
Créer un formulaire de rappel conseiller.

Champs :

- prénom
- nom
- téléphone
- email
- motif
- message

Si contact est coché :
Créer une page ou section contact.

Inclure :

- téléphone
- email
- adresse si fournie
- horaires si fournis
- CTA rappel

Si agency_value_page est coché :
Créer une page “Pourquoi nous confier votre bien”.

Objectif :
Expliquer la valeur de l’agence sans gros pavés de texte.

Sections possibles :

- expertise locale
- accompagnement
- stratégie de vente
- sélection acheteurs
- suivi clair
- comptes rendus
- CTA estimation si estimation coché
- CTA rappel si callback_request coché

==================================================
STYLE VISUEL SIGNATURE DIGITAL IMMOBILIER

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
- jargon immobilier lourd
- fausses fonctionnalités non cochées

==================================================
OBJECTIF COMMERCIAL

La démo doit montrer que l’agence peut :

- inspirer confiance plus vite
- rassurer les vendeurs
- présenter ses biens avec plus de valeur
- générer plus de demandes d’estimation
- qualifier les acheteurs
- moderniser son image
- se différencier des agences classiques

La promesse implicite :
“Vous gardez votre agence, votre image, vos biens et votre équipe. Signature Digital modernise l’expérience autour de votre marque.”

==================================================
FORMAT DE RÉPONSE OBLIGATOIRE

Réponds toujours avec seulement ces 3 blocs :

1. ANGLE DE DÉMO

Une phrase forte qui résume l’idée de la démo.

2. PROMPT LOVABLE FINAL

Un prompt complet prêt à copier-coller dans Lovable.

Le prompt doit préciser :

- nom de l’agence
- ville
- site actuel si fourni
- objectif
- douleur
- angle commercial
- style visuel
- couleurs approximatives à reprendre
- logo à reprendre
- images / annonces à réutiliser
- pages à créer uniquement selon les modules cochés
- pages à ne pas créer
- sections de chaque page
- CTA
- ton éditorial
- consignes mobile-first
- consignes de simplicité
- modules activés
- modules désactivés

Inclure obligatoirement cette phrase dans le prompt Lovable :
“La démo doit être visuellement personnalisée pour cette agence, mais elle doit rester compatible avec le moteur Signature Digital. Seuls les modules activés doivent apparaître. Les modules désactivés ne doivent pas être visibles.”

3. MAIL CLIENT

Un mail court, humain et premium pour présenter la démo au client.

Le mail doit être simple :

- dire que la démo est prête
- rappeler qu’elle reprend leur identité
- expliquer que c’est une première vision
- inviter à donner un retour
- ne pas critiquer leur site actuel directement

==================================================
RÈGLE FINALE

Ne cherche pas à être original à tout prix.

Cherche :

- clarté
- confiance
- rendu premium
- vitesse de production
- respect des modules cochés

Le modèle reste Signature Digital Immobilier.
La personnalisation vient de :

- logo
- couleurs
- ville
- annonces
- photos
- ton
- angle commercial
- pages cochées

Le but est de produire vite une démo premium qui donne l’impression de sur-mesure sans perdre de temps.

FIN DU PACK CHATGPT`
}

function buildDemoAssetsBriefSection(project: Project) {
  const assets = project.demoAssets
  const logo = [
    assets.logoUrl,
    formatAssetList(assets.logoAssets),
    assets.logoNotes,
  ].filter(Boolean).join('\n')

  return `==================================================
ÉLÉMENTS VISUELS FOURNIS

Logo / header :
${formatAssetValue(logo)}

Captures du site actuel :
${formatAssetValue([formatAssetList(assets.websiteScreenshots), assets.websiteScreenshotsNotes].filter(Boolean).join('\n'))}

Couleurs / ambiance visuelle :
${formatAssetValue(assets.visualMood)}

Images à réutiliser :
${formatAssetValue([formatAssetList(assets.reusableImages), assets.imageReferences].filter(Boolean).join('\n'))}

Annonces / offres à réutiliser :
${formatAssetValue(assets.offerReferences)}

Captures annonces / offres :
${formatAssetValue(formatAssetList(assets.listingScreenshots))}

Photos d’annonces :
${formatAssetValue([formatAssetList(assets.listingPhotos), assets.listingPhotoReferences].filter(Boolean).join('\n'))}

Éléments à absolument reprendre :
${formatAssetValue(assets.mustReuse)}

Éléments à éviter / améliorer :
${formatAssetValue(assets.mustAvoid)}

Important :
Si certaines images ne sont pas visibles via URL, je vais aussi les ajouter directement dans ChatGPT.
Analyse les captures pour déduire :

- les couleurs approximatives
- l’ambiance visuelle
- le style du logo
- les photos à reprendre
- les annonces à réutiliser
- les éléments à moderniser

Je ne connais pas forcément les codes couleurs.
Ne me demande pas de code hexadécimal.
Décris les couleurs simplement.

Exemples :

- noir profond, blanc cassé, doré
- bleu marine, beige, blanc
- violet, blanc, gris clair
- vert foncé, crème, bois`
}

function formatAssetValue(value: string) {
  return value.trim() || 'Non renseigné pour l’instant. À déduire depuis les captures si nécessaire.'
}

function formatAssetList(assets: DemoAsset[]) {
  return assets.map((asset) => `- ${asset.fileName} : ${asset.url.startsWith('data:') ? 'image locale dans la fiche, à ajouter directement dans ChatGPT' : asset.url}`).join('\n')
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

function getEnabledRealEstateModules(project: Project) {
  const enabledSet = new Set(project.modulesEnabled)

  return realEstateModules.filter((module) => enabledSet.has(module.key))
}

function getDisabledRealEstateModules(project: Project) {
  const disabledSet = new Set(project.modulesDisabled)
  const enabledSet = new Set(project.modulesEnabled)
  const disabledModules = project.modulesDisabled.length
    ? realEstateModules.filter((module) => disabledSet.has(module.key))
    : realEstateModules.filter((module) => !enabledSet.has(module.key))

  return disabledModules
}

function formatModuleList(modules: typeof realEstateModules[number][]) {
  return modules.length
    ? modules.map((module) => `- ${module.key} — ${module.label} : ${module.description}`).join('\n')
    : 'Non renseigné pour l’instant.'
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
