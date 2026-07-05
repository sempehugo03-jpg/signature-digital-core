import { useState } from 'react'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'
import { fallbackPropertyImage, type RealEstateProperty } from '../../data/realEstateTemplate'
import { extractPropertyFromUrl, type ExtractedPropertyDraft } from '../../lib/propertyUrlExtractor'
import {
  canManageRealEstateAgency,
  isDuplicatedRealEstateAgency,
  listRealEstateAgencyRuntimes,
  normalizeAgencySlug,
  reactivateRealEstateAgency,
  saveRealEstateAgencyConfig,
  updateRealEstateAgencyStatus,
  type DuplicateRealEstateAgencyInput,
  type RealEstateBackgroundStyle,
  type RealEstateButtonStyle,
  type RealEstateHeroVariant,
  type RealEstateHeroLayout,
  type RealEstateImageTreatment,
  type RealEstateAgencyMode,
  type RealEstateAgencyRuntime,
  type RealEstateAgencyStatus,
  type RealEstateEnabledModules,
  type RealEstatePropertyCardStyle,
  type RealEstateSectionStyle,
  type RealEstateSpacingStyle,
  type RealEstateThemePreset,
  type RealEstateTypographyStyle,
  type RealEstateVisualPreset,
} from '../../data/realEstateAgencyConfig'

type AgencyFormState = {
  agencyName: string
  city: string
  agencySlug: string
  email: string
  phone: string
  address: string
  websiteUrl: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  painPoint: string
  objective: string
  visualStyle: string
  variant: string
  themePreset: RealEstateThemePreset
  heroVariant: RealEstateHeroVariant
  visualPreset: RealEstateVisualPreset
  heroLayout: RealEstateHeroLayout
  propertyCardStyle: RealEstatePropertyCardStyle
  sectionStyle: RealEstateSectionStyle
  typographyStyle: RealEstateTypographyStyle
  buttonStyle: RealEstateButtonStyle
  backgroundStyle: RealEstateBackgroundStyle
  imageTreatment: RealEstateImageTreatment
  spacingStyle: RealEstateSpacingStyle
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel: string
  sectionOrder: string
  importedProperties: RealEstateProperty[]
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
}

type PropertyUrlFormState = Omit<ExtractedPropertyDraft, 'gallery'> & {
  gallery: string
}

const templateRoutes = {
  public: '/demo/template-immobilier',
  estimation: '/demo/template-immobilier/estimation',
  login: '/demo/template-immobilier/connexion',
  seller: '/demo/template-immobilier/vendeur',
  agent: '/demo/template-immobilier/agent',
  owner: '/demo/template-immobilier/patron',
  property: '/demo/template-immobilier/bien/appartement-haussmannien',
}

const defaultEnabledModules: RealEstateEnabledModules = {
  estimation: true,
  sellerSpace: true,
  agentSpace: true,
  ownerSpace: true,
  publicProperties: true,
  propertyDetail: true,
  visits: true,
  documents: true,
  offers: true,
  reports: true,
  rentalPage: false,
  soldProperties: false,
  teamPage: false,
  blog: false,
  reviews: false,
}

const moduleLabels: Array<[keyof RealEstateEnabledModules, string]> = [
  ['estimation', 'Estimation'],
  ['sellerSpace', 'Espace vendeur'],
  ['agentSpace', 'Espace agent'],
  ['ownerSpace', 'Espace patron'],
  ['publicProperties', 'Biens publics'],
  ['propertyDetail', 'Fiche bien'],
  ['visits', 'Visites'],
  ['documents', 'Documents'],
  ['offers', 'Offres'],
  ['reports', 'Comptes rendus'],
  ['rentalPage', 'Page location'],
  ['soldProperties', 'Biens vendus'],
  ['teamPage', 'Equipe'],
  ['blog', 'Blog'],
  ['reviews', 'Avis'],
]

const signatureDirectionExample = `themePreset: premium_light
primaryColor: "#0B1E4F"
accentColor: "#D9B52C"
visualPreset: editorial_luxury
heroLayout: split_editorial
propertyCardStyle: magazine
sectionStyle: airy
typographyStyle: mixed_editorial
buttonStyle: pill
backgroundStyle: warm_cream
imageTreatment: cinematic
spacingStyle: airy
heroVariant: editorial
heroTitle: "Vendez votre bien avec une agence qui inspire confiance."
heroSubtitle: "Une experience immobiliere premium pensee pour rendre votre accompagnement evident."
primaryCtaLabel: "Estimer mon bien"
sectionOrder: hero,properties,trust,estimation,contact`

const agencyDataExample = `properties:
- title: "Appartement 3 pièces"
  city: "Montauban"
  price: "198 000 €"
  surface: "82 m²"
  imageUrl: "https://..."
  gallery:
    - "https://..."
    - "https://..."
  description: "Appartement lumineux..."
- title: "Maison familiale"
  city: "Montauban"
  price: "315 000 €"
  surface: "140 m²"
  imageUrl: "https://..."
  gallery:
    - "https://..."
    - "https://..."
  description: "Maison avec jardin..."`

const lovableRealEstateMasterPrompt = `Tu es directeur artistique Lovable pour une demo immobiliere Signature Digital.

Contexte agence :
- Nom agence : [Nom agence]
- Ville / zone : [Ville]
- Site actuel : [Site actuel]
- Douleur principale : [Douleur principale]
- Objectif principal : [Objectif principal]
- Angle commercial : [Angle commercial]

Philosophie obligatoire :
Lovable inspire.
ChatGPT interprete.
Signature Digital applique.
Le moteur Signature Digital reste maitre.

Nouvelle philosophie :
Lovable est directeur artistique et collecteur de contenu.
Signature Digital est le moteur, la plateforme et l'activation.
Lovable ne developpe jamais Signature Digital.

IMPORTANT :
Tu dois construire directement une demonstration visuelle navigable dans Lovable.
Ne reponds pas uniquement avec une configuration, un JSON, un YAML ou une analyse.
La maquette doit etre visible, navigable et presentable au client.

PHASE 1 - CREATION VISUELLE
Lovable doit creer directement une demo visuelle navigable et previsualisable.
Ne reponds pas uniquement avec du texte, JSON, YAML ou config.
La priorite est que Hugo puisse voir la demo dans Lovable et demander des modifications.

PHASE 2 - ITERATIONS
Hugo peut demander des ajustements visuels.
Lovable doit modifier la demo sans reinventer le moteur Signature Digital.

PHASE 3 - VALIDATION
Lovable ne doit generer les blocs DIRECTION SIGNATURE et DONNEES AGENCE qu'apres que Hugo ecrive explicitement :
"Démo validée"

Ton role :
Tu es directeur artistique, pas developpeur produit.
Tu es aussi collecteur de contenu pour extraire les donnees publiques utiles.
Tu dois creer une vision premium compatible avec un moteur immobilier existant.
Tu dois utiliser les vraies donnees recuperees quand elles sont disponibles.
Tu ne dois jamais recreer le produit, le CRM, l'authentification, les dashboards ou les workflows metier.

La demo doit etre construite avec les vraies donnees recuperees :
- logo
- couleurs
- annonces
- photos
- descriptions
- coordonnees
- elements de confiance

MISSION 1 - ANALYSER COMPLETEMENT LE SITE ACTUEL
Recupere :
- logo
- couleurs
- identite
- coordonnees
- telephone
- email
- adresse

MISSION 2 - RECUPERER TOUTES LES ANNONCES
Pour chaque annonce disponible, recupere obligatoirement :
- toutes les photos disponibles
- photo principale
- galerie complete si disponible
- titre
- type
- ville
- quartier
- prix
- surface
- pieces
- chambres
- terrain
- DPE
- description
- points forts
- reference

Aucune annonce ne doit etre ignoree.
Toutes les annonces visibles doivent etre recuperees.

MISSION 3 - CREER UNE NOUVELLE EXPERIENCE
Tu ne dois pas copier la page d'accueil, les slogans, les textes marketing, la hierarchie, les fonds, les CTA, les sections ou la narration.
Tu dois comprendre la douleur client, puis creer une nouvelle experience Signature Digital.
Le client doit penser :
"Signature Digital a parfaitement compris notre probleme."
Puis :
"Je vois notre agence... mais comme elle aurait toujours du etre."

Important :
Les annonces doivent rester reelles.
Les photos doivent rester reelles.
Les descriptions doivent rester fideles.
Le design doit etre completement repense.

MISSION 4 - CONSTRUIRE LA DEMONSTRATION VISUELLE
La priorite est la preview Lovable.
La demonstration doit etre visible, navigable et presentable au client.

MISSION 5 - ITERER DANS LOVABLE
Hugo peut demander autant de modifications qu'il le souhaite.
Tu modifies uniquement la demonstration.
Tu ne generes aucune extraction tant que Hugo n'a pas ecrit exactement :
Démo validée

MISSION 6 - EXTRACTION APRES VALIDATION
Apres le message exact "Démo validée", tu reponds uniquement avec :
1. DIRECTION SIGNATURE
2. DONNEES AGENCE

Analyse a realiser :
1. Analyse le site actuel de l'agence.
2. Recupere ou deduis les elements utiles :
   - logo
   - couleurs
   - annonces
   - photos
   - descriptions
   - coordonnees
   - preuves, avis ou signaux de confiance
3. Comprends la douleur client.
4. Cree une vision premium qui rend la valeur de l'agence evidente en quelques secondes.

Interdictions absolues :
- Ne recrée pas de CRM.
- Ne recrée pas d'authentification.
- Ne recrée pas de dashboard.
- Ne recrée pas d'espace vendeur.
- Ne recrée pas d'espace agent.
- Ne recrée pas d'espace patron.
- Ne modifie pas les permissions.
- Ne crée pas de workflow metier.
- Ne copie pas le moteur Signature Digital.
- Ne crée pas de routes produit.
- Ne crée pas de logique metier.

Ne recrée jamais les modules Signature Digital.
Ne recrée jamais les permissions.
Ne construis jamais un produit SaaS.

Sortie attendue avant validation :
Produis uniquement une vraie demonstration visuelle navigable dans Lovable.
La demonstration doit etre presentable au client.
Ne fournis pas encore de bloc DIRECTION SIGNATURE ou DONNEES AGENCE.

Sortie attendue apres le message exact "Démo validée" :
Reponds uniquement avec les deux blocs suivants, sans commentaire avant ou apres.
Ces blocs doivent etre faciles a copier dans Signature Digital.

1. DIRECTION SIGNATURE

Format cle: valeur compatible avec le bouton "Interpreter" :

themePreset: premium_light
primaryColor: "#0B1E4F"
accentColor: "#D9B52C"
visualPreset: editorial_luxury
heroLayout: split_editorial
propertyCardStyle: magazine
sectionStyle: airy
typographyStyle: mixed_editorial
buttonStyle: pill
backgroundStyle: warm_cream
imageTreatment: cinematic
spacingStyle: airy
heroVariant: premium
heroTitle: "..."
heroSubtitle: "..."
primaryCtaLabel: "..."
sectionOrder: hero,properties,trust,estimation,sellerSpace,reviews,contact

2. DONNEES AGENCE

Format compatible avec le bouton "Interpreter les donnees" :

Chaque bien doit avoir au minimum imageUrl.
Si plusieurs photos sont disponibles, mets-les dans gallery.

properties:
- title: "..."
  type: "..."
  city: "..."
  district: "..."
  price: "..."
  surface: "..."
  rooms: "..."
  bedrooms: "..."
  land: "..."
  dpe: "..."
  imageUrl: "..."
  gallery:
    - "https://..."
    - "https://..."
  description: "..."
  features: "..."
  highlights: "..."
  reference: "..."
  agencyPhone: "..."
  agencyEmail: "..."
  agencyAddress: "..."

Workflow attendu pour Hugo apres Lovable :
1. Visualiser la maquette.
2. Copier le bloc DIRECTION SIGNATURE.
3. Coller dans Signature Digital.
4. Copier le bloc DONNEES AGENCE.
5. Coller dans Signature Digital.

Pendant la creation visuelle et les iterations, tu peux proposer des sections, un ton, des preuves et une ambiance.
Apres "Démo validée", ne donne plus de recommandations libres : fournis uniquement les deux blocs d'extraction.`

const themePresetValues: RealEstateThemePreset[] = ['luxury_dark', 'premium_light', 'local_trust', 'modern_minimal']
const visualPresetValues: RealEstateVisualPreset[] = ['editorial_luxury', 'warm_premium', 'modern_minimal', 'local_trust', 'dark_signature']
const heroLayoutValues: RealEstateHeroLayout[] = ['full_bleed', 'split_editorial', 'centered_statement', 'image_overlay']
const propertyCardStyleValues: RealEstatePropertyCardStyle[] = ['magazine', 'minimal', 'luxury_shadow', 'editorial_grid']
const sectionStyleValues: RealEstateSectionStyle[] = ['airy', 'compact', 'editorial', 'luxury_blocks']
const typographyStyleValues: RealEstateTypographyStyle[] = ['serif_premium', 'modern_sans', 'mixed_editorial']
const buttonStyleValues: RealEstateButtonStyle[] = ['pill', 'sharp', 'soft', 'luxury_gold']
const backgroundStyleValues: RealEstateBackgroundStyle[] = ['pure_white', 'warm_cream', 'soft_gradient', 'dark_navy']
const imageTreatmentValues: RealEstateImageTreatment[] = ['natural', 'rounded', 'cinematic', 'editorial_crop']
const spacingStyleValues: RealEstateSpacingStyle[] = ['airy', 'balanced', 'compact']

const heroVariantAliases: Record<string, RealEstateHeroVariant> = {
  premium: 'premium',
  editorial: 'premium',
  editorial_premium: 'premium',
  trust: 'trust',
  confiance: 'trust',
  estimation: 'estimation',
  local: 'local',
}

export function AdminTemplates() {
  const [version, setVersion] = useState(0)
  const [form, setForm] = useState<AgencyFormState | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [notice, setNotice] = useState('')
  const agencies = listRealEstateAgencyRuntimes()
  const visibleAgencies = agencies.filter((runtime) => runtime.modelConfig.status !== 'archived')
  const archivedAgencies = agencies.filter((runtime) => runtime.modelConfig.status === 'archived')
  void version

  function open(route: string) {
    window.open(route, '_blank', 'noopener,noreferrer')
  }

  function refresh(message: string) {
    setVersion((current) => current + 1)
    setNotice(message)
  }

  async function copyLovablePrompt() {
    await navigator.clipboard.writeText(lovableRealEstateMasterPrompt)
    setNotice('Prompt Lovable copié.')
  }

  function openCreateForm() {
    setNotice('')
    setFormMode('create')
    setForm(createDefaultForm())
  }

  function openEditForm(runtime: RealEstateAgencyRuntime) {
    setNotice('')
    setFormMode('edit')
    setForm(createFormFromRuntime(runtime))
  }

  function submitAgency() {
    if (!form) return
    const agencySlug = normalizeAgencySlug(form.agencySlug)
    const agencyName = form.agencyName.trim()
    if (!agencyName) {
      setNotice("Ajoutez un nom d'agence.")
      return
    }
    if (!agencySlug) {
      setNotice('Ajoutez un slug agence.')
      return
    }

    const staticRuntime = agencies.find((runtime) =>
      runtime.modelConfig.agencySlug === agencySlug && !isDuplicatedRealEstateAgency(agencySlug)
    )
    if (staticRuntime && !canManageRealEstateAgency(agencySlug)) {
      setNotice('Ce slug est reserve a une agence de base.')
      return
    }

    const isUpdate = agencies.some((runtime) => runtime.modelConfig.agencySlug === agencySlug)
    if (formMode === 'create' && isUpdate) {
      setNotice('Ce slug agence existe deja.')
      return
    }

    saveRealEstateAgencyConfig(toDuplicateInput({ ...form, agencyName, agencySlug }))
    setForm(null)
    refresh(isUpdate ? 'Agence mise à jour.' : 'Agence créée.')
  }

  function pauseAgency(runtime: RealEstateAgencyRuntime) {
    if (!window.confirm('Mettre cette agence en pause ?')) return
    updateRealEstateAgencyStatus(runtime.modelConfig.agencySlug, 'paused')
    refresh('Agence mise en pause.')
  }

  function archiveAgency(runtime: RealEstateAgencyRuntime) {
    if (!window.confirm('Archiver cette agence ? Cette action masque l agence de la liste principale sans supprimer ses donnees.')) return
    updateRealEstateAgencyStatus(runtime.modelConfig.agencySlug, 'archived')
    refresh('Agence archivee.')
  }

  function reactivateAgency(runtime: RealEstateAgencyRuntime) {
    if (!window.confirm('Reactiver cette agence ?')) return
    reactivateRealEstateAgency(runtime.modelConfig.agencySlug)
    refresh('Agence reactivee.')
  }

  return (
    <div className="admin-view">
      <SectionTitle
        eyebrow="Templates"
        title="Templates Signature Digital"
        text="Acces aux bases vivantes testables avant duplication client."
      />

      <Card className="detail-block admin-template-card">
        <div>
          <p className="sd-eyebrow">Base officielle</p>
          <h2>Template Signature Immobilier</h2>
          <div className="detail-grid">
            <Info label="Statut" value="Vivante" />
            <Info label="Secteur" value="Immobilier" />
            <Info label="Base" value="Opus Domus" />
            <Info label="Route" value={templateRoutes.public} />
          </div>
        </div>
        <div className="admin-template-actions">
          <Button onClick={() => open(templateRoutes.public)}>Template publique</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.estimation)}>Tunnel estimation</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.login)}>Connexion template</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.seller)}>Espace vendeur</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.agent)}>Espace agent</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.owner)}>Espace patron</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.property)}>Fiche bien demo</Button>
          <Button onClick={openCreateForm}>Créer une agence</Button>
        </div>
      </Card>

      <Card className="detail-block admin-template-card">
        <div>
          <p className="sd-eyebrow">Prompt Lovable Immobilier</p>
          <h2>Prompt Lovable Immobilier</h2>
          <p>
            Prompt maître à copier pour générer une maquette Lovable compatible avec le moteur Signature Digital.
          </p>
        </div>
        <label className="sd-field admin-agency-long-field">
          <span>Prompt maître</span>
          <textarea readOnly value={lovableRealEstateMasterPrompt} />
        </label>
        <div className="admin-template-actions">
          <Button onClick={() => void copyLovablePrompt()}>Copier le prompt</Button>
        </div>
      </Card>

      {notice && <p className="admin-agency-notice">{notice}</p>}

      <Card className="detail-block">
        <div>
          <p className="sd-eyebrow">Agences configurees</p>
          <h2>Instances du moteur immobilier</h2>
        </div>
        <div className="admin-agency-list">
          {visibleAgencies.map((runtime) => (
            <AgencyCard
              key={runtime.modelConfig.agencyId}
              runtime={runtime}
              editable={canManageRealEstateAgency(runtime.modelConfig.agencySlug)}
              onOpen={open}
              onEdit={openEditForm}
              onPause={pauseAgency}
              onArchive={archiveAgency}
              onReactivate={reactivateAgency}
            />
          ))}
        </div>
      </Card>

      {archivedAgencies.length > 0 && (
        <Card className="detail-block">
          <div>
            <p className="sd-eyebrow">Archives</p>
            <h2>Agences archivees</h2>
          </div>
          <div className="admin-agency-list">
            {archivedAgencies.map((runtime) => (
              <AgencyCard
                key={runtime.modelConfig.agencyId}
                runtime={runtime}
                editable={canManageRealEstateAgency(runtime.modelConfig.agencySlug)}
                onOpen={open}
                onEdit={openEditForm}
                onPause={pauseAgency}
                onArchive={archiveAgency}
                onReactivate={reactivateAgency}
              />
            ))}
          </div>
        </Card>
      )}

      {form && (
        <AgencyFormModal
          form={form}
          mode={formMode}
          onChange={setForm}
          onClose={() => setForm(null)}
          onSubmit={submitAgency}
        />
      )}
    </div>
  )
}

function AgencyCard({
  runtime,
  editable,
  onOpen,
  onEdit,
  onPause,
  onArchive,
  onReactivate,
}: {
  runtime: RealEstateAgencyRuntime
  editable: boolean
  onOpen: (route: string) => void
  onEdit: (runtime: RealEstateAgencyRuntime) => void
  onPause: (runtime: RealEstateAgencyRuntime) => void
  onArchive: (runtime: RealEstateAgencyRuntime) => void
  onReactivate: (runtime: RealEstateAgencyRuntime) => void
}) {
  const { modelConfig, routes } = runtime
  const isPaused = modelConfig.status === 'paused'
  const isArchived = modelConfig.status === 'archived'

  return (
    <article className="admin-agency-card">
      <div className="admin-agency-card-main">
        <div className="admin-agency-card-top">
          <div>
            <p className="admin-agency-card-kicker">Agence configuree</p>
            <h3>{modelConfig.agencyName}</h3>
          </div>
          <div className="admin-agency-badges">
            <span className="admin-agency-badge">{modelConfig.mode}</span>
            <span className={`admin-agency-badge admin-agency-badge-${modelConfig.status}`}>
              {modelConfig.status}
            </span>
          </div>
        </div>
        <dl className="admin-agency-meta">
          <div>
            <dt>Slug</dt>
            <dd>{modelConfig.agencySlug}</dd>
          </div>
          <div>
            <dt>Ville</dt>
            <dd>{modelConfig.city || 'Non renseignee'}</dd>
          </div>
          <div>
            <dt>Route publique</dt>
            <dd>{routes.public}</dd>
          </div>
        </dl>
        <div className="admin-agency-modules-read">
          {moduleLabels
            .filter(([key]) => modelConfig.enabledModules[key])
            .map(([key, label]) => <span key={key}>{label}</span>)}
        </div>
      </div>
      <div className="admin-agency-card-actions">
        <Button variant="secondary" className="admin-agency-action" onClick={() => onOpen(routes.public)}>Ouvrir</Button>
        <Button variant="secondary" className="admin-agency-action" onClick={() => editable && onEdit(runtime)} disabled={!editable}>Modifier</Button>
        {!isPaused && !isArchived && (
          <Button variant="secondary" className="admin-agency-action" onClick={() => editable && onPause(runtime)} disabled={!editable}>Mettre en pause</Button>
        )}
        {!isArchived && (
          <Button variant="secondary" className="admin-agency-action" onClick={() => editable && onArchive(runtime)} disabled={!editable}>Archiver</Button>
        )}
        {(isPaused || isArchived) && (
          <Button className="admin-agency-action" onClick={() => editable && onReactivate(runtime)} disabled={!editable}>Reactiver</Button>
        )}
      </div>
    </article>
  )
}

function AgencyFormModal({
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
}: {
  form: AgencyFormState
  mode: 'create' | 'edit'
  onChange: (form: AgencyFormState) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const [signatureDirection, setSignatureDirection] = useState('')
  const [agencyData, setAgencyData] = useState('')
  const [propertyUrl, setPropertyUrl] = useState('')
  const [propertyUrlDraft, setPropertyUrlDraft] = useState<PropertyUrlFormState | null>(null)
  const [propertyUrlNotice, setPropertyUrlNotice] = useState('')
  const [isAnalyzingPropertyUrl, setIsAnalyzingPropertyUrl] = useState(false)

  function update<K extends keyof AgencyFormState>(key: K, value: AgencyFormState[K]) {
    onChange({ ...form, [key]: value })
  }

  function updateName(value: string) {
    onChange({
      ...form,
      agencyName: value,
      agencySlug: form.agencySlug ? form.agencySlug : normalizeAgencySlug(value),
    })
  }

  function updateModule(key: keyof RealEstateEnabledModules, checked: boolean) {
    onChange({
      ...form,
      enabledModules: {
        ...form.enabledModules,
        [key]: checked,
      },
    })
  }

  function interpretSignatureDirection() {
    onChange({ ...form, ...parseSignatureDirection(signatureDirection) })
  }

  function interpretAgencyData() {
    const agencySlug = normalizeAgencySlug(form.agencySlug || form.agencyName)
    const importedProperties = parseAgencyProperties(agencyData, agencySlug || 'agence')
    if (!importedProperties.length) return
    onChange({ ...form, importedProperties })
  }

  async function analyzePropertyUrl() {
    setIsAnalyzingPropertyUrl(true)
    setPropertyUrlNotice('')

    try {
      const draft = await extractPropertyFromUrl(propertyUrl)
      setPropertyUrlDraft(createPropertyUrlFormState(draft))
      setPropertyUrlNotice(
        draft.extractionStatus === 'empty'
          ? 'Extraction impossible depuis cette URL. Vous pouvez remplir les champs manuellement.'
          : 'Extraction partielle : vérifiez les champs avant d’ajouter le bien.',
      )
    } catch {
      setPropertyUrlDraft(null)
      setPropertyUrlNotice('Ajoutez une URL d annonce valide.')
    } finally {
      setIsAnalyzingPropertyUrl(false)
    }
  }

  function updatePropertyUrlDraft<K extends keyof PropertyUrlFormState>(key: K, value: PropertyUrlFormState[K]) {
    if (!propertyUrlDraft) return
    setPropertyUrlDraft({ ...propertyUrlDraft, [key]: value })
  }

  function addPropertyUrlDraft() {
    if (!propertyUrlDraft) return
    const agencySlug = normalizeAgencySlug(form.agencySlug || form.agencyName) || 'agence'
    const property = createImportedProperty(propertyUrlFormToPropertyRow(propertyUrlDraft), agencySlug, form.importedProperties.length)
    onChange({ ...form, importedProperties: [...form.importedProperties, property] })
    setPropertyUrl('')
    setPropertyUrlDraft(null)
    setPropertyUrlNotice(`${form.importedProperties.length + 1} bien(s) importé(s).`)
  }

  return (
    <div className="locked-modal-backdrop" role="presentation">
      <Card className="locked-modal admin-agency-modal">
        <button className="admin-agency-close" type="button" onClick={onClose}>Fermer</button>
        <p className="sd-eyebrow">Configuration agence</p>
        <h2>{mode === 'edit' ? 'Modifier une agence' : 'Créer une agence'}</h2>
        <div className="admin-agency-form">
          <Field label="Nom de l'agence" value={form.agencyName} onChange={updateName} />
          <Field label="Ville" value={form.city} onChange={(value) => update('city', value)} />
          <Field
            label="Slug agence"
            value={form.agencySlug}
            onChange={(value) => update('agencySlug', normalizeAgencySlug(value))}
            disabled={mode === 'edit'}
          />
          <Field label="Email contact" type="email" value={form.email} onChange={(value) => update('email', value)} />
          <Field label="Telephone contact" value={form.phone} onChange={(value) => update('phone', value)} />
          <Field label="Adresse" value={form.address} onChange={(value) => update('address', value)} />
          <Field label="Site actuel" value={form.websiteUrl} onChange={(value) => update('websiteUrl', value)} />
          <Field label="Logo URL optionnel" value={form.logoUrl} onChange={(value) => update('logoUrl', value)} />
          <div className="admin-agency-form-section">
            <p className="sd-eyebrow">✨ Direction Signature</p>
            <h3>Direction Signature</h3>
            <p>
              Collez ici une Direction Signature générée par ChatGPT.
              Signature Digital interprétera automatiquement les informations compatibles avec le moteur.
            </p>
          </div>
          <label className="sd-field admin-agency-long-field">
            <span>Direction Signature</span>
            <textarea
              value={signatureDirection}
              onChange={(event) => setSignatureDirection(event.target.value)}
              placeholder={signatureDirectionExample}
            />
          </label>
          <div className="admin-template-actions">
            <Button variant="secondary" onClick={interpretSignatureDirection}>Interpréter</Button>
          </div>
          <div className="admin-agency-form-section">
            <p className="sd-eyebrow">Données agence</p>
            <h3>Données agence</h3>
            <p>Collez ici une extraction de biens, photos et descriptions générée par ChatGPT.</p>
          </div>
          <label className="sd-field admin-agency-long-field">
            <span>Données agence</span>
            <textarea
              value={agencyData}
              onChange={(event) => setAgencyData(event.target.value)}
              placeholder={agencyDataExample}
            />
          </label>
          <div className="admin-template-actions">
            <Button variant="secondary" onClick={interpretAgencyData}>Interpréter les données</Button>
          </div>
          <div className="admin-agency-form-section">
            <p className="sd-eyebrow">Ajouter un bien</p>
            <h3>Ajouter un bien depuis une URL</h3>
            <p>Collez le lien d’une annonce pour pré-remplir une fiche bien. Vous pourrez corriger avant validation.</p>
          </div>
          <Field
            label="URL de l'annonce"
            value={propertyUrl}
            onChange={setPropertyUrl}
            placeholder="https://..."
          />
          <div className="admin-template-actions">
            <Button variant="secondary" onClick={() => void analyzePropertyUrl()} disabled={isAnalyzingPropertyUrl}>
              {isAnalyzingPropertyUrl ? 'Analyse en cours...' : "Analyser l'annonce"}
            </Button>
            <span className="copy-feedback">{form.importedProperties.length} bien(s) importé(s)</span>
          </div>
          {propertyUrlNotice && <p className="admin-agency-notice">{propertyUrlNotice}</p>}
          {propertyUrlDraft && (
            <>
              <div className="admin-agency-form-section">
                <p className="sd-eyebrow">Validation humaine</p>
                <h3>Fiche bien pre-remplie</h3>
              </div>
              <Field label="Titre" value={propertyUrlDraft.title} onChange={(value) => updatePropertyUrlDraft('title', value)} />
              <Field label="Type" value={propertyUrlDraft.type} onChange={(value) => updatePropertyUrlDraft('type', value)} />
              <Field label="Ville" value={propertyUrlDraft.city} onChange={(value) => updatePropertyUrlDraft('city', value)} />
              <Field label="Prix" value={propertyUrlDraft.price} onChange={(value) => updatePropertyUrlDraft('price', value)} />
              <Field label="Surface" value={propertyUrlDraft.surface} onChange={(value) => updatePropertyUrlDraft('surface', value)} />
              <Field label="Pièces" value={propertyUrlDraft.rooms} onChange={(value) => updatePropertyUrlDraft('rooms', value)} />
              <Field label="Chambres" value={propertyUrlDraft.bedrooms} onChange={(value) => updatePropertyUrlDraft('bedrooms', value)} />
              <Field label="Terrain" value={propertyUrlDraft.land} onChange={(value) => updatePropertyUrlDraft('land', value)} />
              <Field label="DPE" value={propertyUrlDraft.dpe} onChange={(value) => updatePropertyUrlDraft('dpe', value)} />
              <Field label="Référence" value={propertyUrlDraft.reference} onChange={(value) => updatePropertyUrlDraft('reference', value)} />
              <Field label="Image principale" value={propertyUrlDraft.imageUrl} onChange={(value) => updatePropertyUrlDraft('imageUrl', value)} />
              <LongField label="Galerie photos" value={propertyUrlDraft.gallery} onChange={(value) => updatePropertyUrlDraft('gallery', value)} />
              <LongField label="Description" value={propertyUrlDraft.description} onChange={(value) => updatePropertyUrlDraft('description', value)} />
              <Field label="URL source" value={propertyUrlDraft.sourceUrl} onChange={(value) => updatePropertyUrlDraft('sourceUrl', value)} />
              <div className="admin-template-actions">
                <Button onClick={addPropertyUrlDraft}>Ajouter ce bien</Button>
              </div>
            </>
          )}
          <div className="admin-agency-form-section">
            <p className="sd-eyebrow">Direction visuelle</p>
            <h3>Lovable via configuration</h3>
          </div>
          <label className="sd-field">
            <span>Theme preset</span>
            <select value={form.themePreset} onChange={(event) => update('themePreset', event.target.value as RealEstateThemePreset)}>
              <option value="luxury_dark">Luxury dark</option>
              <option value="premium_light">Premium light</option>
              <option value="local_trust">Local trust</option>
              <option value="modern_minimal">Modern minimal</option>
            </select>
          </label>
          <Field label="Couleur principale" type="color" value={form.primaryColor} onChange={(value) => update('primaryColor', value)} />
          <Field label="Couleur secondaire" type="color" value={form.secondaryColor} onChange={(value) => update('secondaryColor', value)} />
          <Field label="Couleur accent" type="color" value={form.accentColor} onChange={(value) => update('accentColor', value)} />
          <label className="sd-field">
            <span>Hero variant</span>
            <select value={form.heroVariant} onChange={(event) => update('heroVariant', event.target.value as RealEstateHeroVariant)}>
              <option value="premium">Premium</option>
              <option value="trust">Trust</option>
              <option value="estimation">Estimation</option>
              <option value="local">Local</option>
            </select>
          </label>
          <SelectField label="Visual preset" value={form.visualPreset} options={visualPresetValues} onChange={(value) => update('visualPreset', value as RealEstateVisualPreset)} />
          <SelectField label="Hero layout" value={form.heroLayout} options={heroLayoutValues} onChange={(value) => update('heroLayout', value as RealEstateHeroLayout)} />
          <SelectField label="Style cartes biens" value={form.propertyCardStyle} options={propertyCardStyleValues} onChange={(value) => update('propertyCardStyle', value as RealEstatePropertyCardStyle)} />
          <SelectField label="Style sections" value={form.sectionStyle} options={sectionStyleValues} onChange={(value) => update('sectionStyle', value as RealEstateSectionStyle)} />
          <SelectField label="Typographie" value={form.typographyStyle} options={typographyStyleValues} onChange={(value) => update('typographyStyle', value as RealEstateTypographyStyle)} />
          <SelectField label="Style boutons" value={form.buttonStyle} options={buttonStyleValues} onChange={(value) => update('buttonStyle', value as RealEstateButtonStyle)} />
          <SelectField label="Fond" value={form.backgroundStyle} options={backgroundStyleValues} onChange={(value) => update('backgroundStyle', value as RealEstateBackgroundStyle)} />
          <SelectField label="Traitement images" value={form.imageTreatment} options={imageTreatmentValues} onChange={(value) => update('imageTreatment', value as RealEstateImageTreatment)} />
          <SelectField label="Espacements" value={form.spacingStyle} options={spacingStyleValues} onChange={(value) => update('spacingStyle', value as RealEstateSpacingStyle)} />
          <Field label="Titre hero" value={form.heroTitle} onChange={(value) => update('heroTitle', value)} />
          <LongField label="Sous-titre hero" value={form.heroSubtitle} onChange={(value) => update('heroSubtitle', value)} />
          <Field label="CTA principal" value={form.primaryCtaLabel} onChange={(value) => update('primaryCtaLabel', value)} />
          <LongField label="Ordre des sections" value={form.sectionOrder} onChange={(value) => update('sectionOrder', value)} />
          <Field label="Style visuel" value={form.visualStyle} onChange={(value) => update('visualStyle', value)} />
          <Field label="Variant" value={form.variant} onChange={(value) => update('variant', value)} />
          <LongField label="Douleur principale" value={form.painPoint} onChange={(value) => update('painPoint', value)} />
          <LongField label="Objectif principal" value={form.objective} onChange={(value) => update('objective', value)} />
          <label className="sd-field">
            <span>Status</span>
            <select value={form.status} onChange={(event) => update('status', event.target.value as RealEstateAgencyStatus)}>
              <option value="demo_ready">Demo prete</option>
              <option value="active">Active</option>
              <option value="paused">En pause</option>
              <option value="archived">Archivee</option>
            </select>
          </label>
          <label className="sd-field">
            <span>Mode</span>
            <select value={form.mode} onChange={(event) => update('mode', event.target.value as RealEstateAgencyMode)}>
              <option value="demo">Demo</option>
              <option value="live">Live</option>
            </select>
          </label>
        </div>
        <div className="admin-agency-modules">
          {moduleLabels.map(([key, label]) => (
            <label key={key} className="admin-agency-checkbox">
              <input
                type="checkbox"
                checked={form.enabledModules[key]}
                onChange={(event) => updateModule(key, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="admin-template-actions">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={onSubmit}>{mode === 'edit' ? 'Appliquer' : "Créer l'agence"}</Button>
        </div>
      </Card>
    </div>
  )
}

function parseSignatureDirection(value: string): Partial<AgencyFormState> {
  const next: Partial<AgencyFormState> = {}

  value.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?)\s*$/)
    if (!match) return

    const key = match[1]
    const rawValue = cleanSignatureDirectionValue(match[2])

    if (key === 'themePreset' && isThemePreset(rawValue)) {
      next.themePreset = rawValue
      return
    }

    if (key === 'primaryColor' && isHexColor(rawValue)) {
      next.primaryColor = rawValue
      return
    }

    if (key === 'accentColor' && isHexColor(rawValue)) {
      next.accentColor = rawValue
      return
    }

    if (key === 'heroVariant') {
      const heroVariant = heroVariantAliases[rawValue.toLowerCase()]
      if (heroVariant) next.heroVariant = heroVariant
      return
    }

    if (key === 'visualPreset' && visualPresetValues.includes(rawValue as RealEstateVisualPreset)) {
      next.visualPreset = rawValue as RealEstateVisualPreset
      return
    }

    if (key === 'heroLayout' && heroLayoutValues.includes(rawValue as RealEstateHeroLayout)) {
      next.heroLayout = rawValue as RealEstateHeroLayout
      return
    }

    if (key === 'propertyCardStyle' && propertyCardStyleValues.includes(rawValue as RealEstatePropertyCardStyle)) {
      next.propertyCardStyle = rawValue as RealEstatePropertyCardStyle
      return
    }

    if (key === 'sectionStyle' && sectionStyleValues.includes(rawValue as RealEstateSectionStyle)) {
      next.sectionStyle = rawValue as RealEstateSectionStyle
      return
    }

    if (key === 'typographyStyle' && typographyStyleValues.includes(rawValue as RealEstateTypographyStyle)) {
      next.typographyStyle = rawValue as RealEstateTypographyStyle
      return
    }

    if (key === 'buttonStyle' && buttonStyleValues.includes(rawValue as RealEstateButtonStyle)) {
      next.buttonStyle = rawValue as RealEstateButtonStyle
      return
    }

    if (key === 'backgroundStyle' && backgroundStyleValues.includes(rawValue as RealEstateBackgroundStyle)) {
      next.backgroundStyle = rawValue as RealEstateBackgroundStyle
      return
    }

    if (key === 'imageTreatment' && imageTreatmentValues.includes(rawValue as RealEstateImageTreatment)) {
      next.imageTreatment = rawValue as RealEstateImageTreatment
      return
    }

    if (key === 'spacingStyle' && spacingStyleValues.includes(rawValue as RealEstateSpacingStyle)) {
      next.spacingStyle = rawValue as RealEstateSpacingStyle
      return
    }

    if (key === 'heroTitle') {
      next.heroTitle = rawValue
      return
    }

    if (key === 'heroSubtitle') {
      next.heroSubtitle = rawValue
      return
    }

    if (key === 'primaryCtaLabel') {
      next.primaryCtaLabel = rawValue
      return
    }

    if (key === 'sectionOrder') {
      next.sectionOrder = rawValue
    }
  })

  return next
}

function cleanSignatureDirectionValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, '')
}

function getTextValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function getListValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return parseListValue(value)
}

function isThemePreset(value: string): value is RealEstateThemePreset {
  return themePresetValues.includes(value as RealEstateThemePreset)
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function parseAgencyProperties(value: string, agencyId: string): RealEstateProperty[] {
  const rows: Array<Record<string, string | string[]>> = []
  let current: Record<string, string | string[]> | null = null
  let activeListKey = ''

  value.split(/\r?\n/).forEach((line) => {
    const itemMatch = line.match(/^\s*-\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (itemMatch) {
      current = {}
      activeListKey = ''
      rows.push(current)
      current[itemMatch[1]] = cleanSignatureDirectionValue(itemMatch[2])
      return
    }

    const listItemMatch = line.match(/^\s+-\s*["']?(.+?)["']?\s*$/)
    if (listItemMatch && current && activeListKey) {
      const currentList = Array.isArray(current[activeListKey]) ? current[activeListKey] as string[] : []
      current[activeListKey] = [...currentList, cleanSignatureDirectionValue(listItemMatch[1])]
      return
    }

    const fieldMatch = line.match(/^\s+([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (!fieldMatch || !current) return
    activeListKey = fieldMatch[2] ? '' : fieldMatch[1]
    current[fieldMatch[1]] = fieldMatch[2] ? cleanSignatureDirectionValue(fieldMatch[2]) : []
  })

  return rows
    .filter((row) => row.title || row.description || row.imageUrl || row.gallery)
    .map((row, index) => createImportedProperty(row, agencyId, index))
}

function createImportedProperty(row: Record<string, string | string[]>, agencyId: string, index: number): RealEstateProperty {
  const title = row.title || `Bien importé ${index + 1}`
  const titleText = getTextValue(title)
  const id = `${normalizeAgencySlug(titleText) || 'bien'}-${index + 1}`
  const galleryImages = getListValue(row.gallery)
  const imageUrl = getTextValue(row.imageUrl) || galleryImages[0] || fallbackPropertyImage
  const images = [...new Set([imageUrl, ...galleryImages])].filter(Boolean)
  const highlights = parseListValue(getTextValue(row.highlights) || getTextValue(row.features))
  const extraHighlights = [getTextValue(row.land), getTextValue(row.dpe)].filter(Boolean)

  return {
    id,
    agencyId,
    title: titleText,
    address: getTextValue(row.address) || getTextValue(row.city),
    city: getTextValue(row.city),
    price: getTextValue(row.price),
    priceValue: parsePriceValue(getTextValue(row.price)),
    surface: getTextValue(row.surface),
    rooms: getTextValue(row.rooms),
    bedrooms: getTextValue(row.bedrooms),
    type: getTextValue(row.type) || 'Bien',
    description: getTextValue(row.description),
    highlights: [...highlights, ...extraHighlights],
    imageUrl,
    images,
    photos: images,
    documents: [],
    visits: [],
    reports: [],
    offers: [],
    progress: 20,
    assignedAgentId: 'camille-aurel',
    sellerId: `seller-${id}`,
    isTemporary: true,
  }
}

function createPropertyUrlFormState(draft: ExtractedPropertyDraft): PropertyUrlFormState {
  return {
    ...draft,
    gallery: draft.gallery.join('\n'),
  }
}

function propertyUrlFormToPropertyRow(draft: PropertyUrlFormState): Record<string, string | string[]> {
  return {
    title: draft.title,
    type: draft.type,
    city: draft.city,
    price: draft.price,
    surface: draft.surface,
    rooms: draft.rooms,
    bedrooms: draft.bedrooms,
    land: draft.land,
    dpe: draft.dpe,
    description: draft.description,
    imageUrl: draft.imageUrl,
    gallery: draft.gallery.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    highlights: [draft.reference].filter(Boolean),
  }
}

function parseListValue(value?: string) {
  if (!value) return []
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => cleanSignatureDirectionValue(item))
    .filter(Boolean)
}

function parsePriceValue(value?: string) {
  if (!value) return 0
  const numericValue = Number(value.replace(/[^\d]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function createDefaultForm(): AgencyFormState {
  return {
    agencyName: '',
    city: '',
    agencySlug: '',
    email: '',
    phone: '',
    address: '',
    websiteUrl: '',
    logoUrl: '',
    primaryColor: '#19191d',
    secondaryColor: '#f7f2ea',
    accentColor: '#b08d57',
    painPoint: 'Clarifier le suivi vendeur et fluidifier les demandes.',
    objective: 'Creer une experience immobiliere claire et premium.',
    visualStyle: 'Opus Domus compatible',
    variant: 'premium-editorial',
    themePreset: 'premium_light',
    heroVariant: 'premium',
    visualPreset: 'warm_premium',
    heroLayout: 'full_bleed',
    propertyCardStyle: 'magazine',
    sectionStyle: 'airy',
    typographyStyle: 'mixed_editorial',
    buttonStyle: 'pill',
    backgroundStyle: 'pure_white',
    imageTreatment: 'rounded',
    spacingStyle: 'balanced',
    heroTitle: 'Votre bien merite une signature.',
    heroSubtitle: 'Une experience immobiliere claire, elegante et suivie a chaque etape.',
    primaryCtaLabel: 'Estimer mon bien',
    sectionOrder: 'hero, biens, methode, espace-vendeur, preuves, contact',
    importedProperties: [],
    mode: 'demo',
    status: 'demo_ready',
    enabledModules: defaultEnabledModules,
  }
}

function createFormFromRuntime(runtime: RealEstateAgencyRuntime): AgencyFormState {
  const { modelConfig } = runtime

  return {
    agencyName: modelConfig.agencyName,
    city: modelConfig.city,
    agencySlug: modelConfig.agencySlug,
    email: modelConfig.email,
    phone: modelConfig.phone,
    address: modelConfig.address,
    websiteUrl: modelConfig.websiteUrl,
    logoUrl: modelConfig.logoUrl,
    primaryColor: modelConfig.primaryColor,
    secondaryColor: modelConfig.secondaryColor,
    accentColor: modelConfig.accentColor,
    painPoint: modelConfig.painPoint,
    objective: modelConfig.objective,
    visualStyle: modelConfig.visualStyle,
    variant: modelConfig.variant,
    themePreset: modelConfig.themePreset,
    heroVariant: modelConfig.heroVariant,
    visualPreset: modelConfig.visualPreset,
    heroLayout: modelConfig.heroLayout,
    propertyCardStyle: modelConfig.propertyCardStyle,
    sectionStyle: modelConfig.sectionStyle,
    typographyStyle: modelConfig.typographyStyle,
    buttonStyle: modelConfig.buttonStyle,
    backgroundStyle: modelConfig.backgroundStyle,
    imageTreatment: modelConfig.imageTreatment,
    spacingStyle: modelConfig.spacingStyle,
    heroTitle: modelConfig.heroTitle,
    heroSubtitle: modelConfig.heroSubtitle,
    primaryCtaLabel: modelConfig.primaryCtaLabel,
    sectionOrder: modelConfig.sectionOrder,
    importedProperties: modelConfig.importedProperties ?? [],
    mode: modelConfig.mode,
    status: modelConfig.status,
    enabledModules: modelConfig.enabledModules,
  }
}

function toDuplicateInput(form: AgencyFormState): DuplicateRealEstateAgencyInput {
  return {
    agencyName: form.agencyName,
    city: form.city,
    agencySlug: form.agencySlug,
    logoUrl: form.logoUrl,
    colors: {
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      accentColor: form.accentColor,
    },
    email: form.email,
    phone: form.phone,
    address: form.address,
    websiteUrl: form.websiteUrl,
    painPoint: form.painPoint,
    objective: form.objective,
    visualStyle: form.visualStyle,
    variant: form.variant,
    themePreset: form.themePreset,
    heroVariant: form.heroVariant,
    visualPreset: form.visualPreset,
    heroLayout: form.heroLayout,
    propertyCardStyle: form.propertyCardStyle,
    sectionStyle: form.sectionStyle,
    typographyStyle: form.typographyStyle,
    buttonStyle: form.buttonStyle,
    backgroundStyle: form.backgroundStyle,
    imageTreatment: form.imageTreatment,
    spacingStyle: form.spacingStyle,
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    primaryCtaLabel: form.primaryCtaLabel,
    sectionOrder: form.sectionOrder,
    importedProperties: form.importedProperties.length ? form.importedProperties : undefined,
    enabledModules: form.enabledModules,
    status: form.status,
    mode: form.mode,
    propertyLimit: form.importedProperties.length ? form.importedProperties.length : 2,
  }
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function LongField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="sd-field admin-agency-long-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
