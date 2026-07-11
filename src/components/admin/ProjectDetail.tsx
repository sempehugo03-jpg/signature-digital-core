import { useMemo, useState } from 'react'
import type { Project } from '../../data/projectStore'
import { getProjectSourceAdminLabel, isValidExternalUrl, normalizeLovableUrl, projectStatusLabels } from '../../data/projectStore'
import { fallbackPropertyImage, type RealEstateProperty } from '../../data/realEstateTemplate'
import {
  canManageRealEstateAgency,
  getDefaultRealEstateEnabledModules,
  getRealEstateAgencyRuntimeBySlug,
  listRealEstateAgencyRuntimes,
  normalizeAgencySlug,
  saveRealEstateAgencyConfig,
  type DuplicateRealEstateAgencyInput,
  type RealEstateAgencyMode,
  type RealEstateAgencyRuntime,
  type RealEstateAgencyStatus,
  type RealEstateEnabledModules,
  type RealEstateHeroVariant,
  type RealEstateThemePreset,
} from '../../data/realEstateAgencyConfig'
import { extractPropertyFromUrl, type ExtractedPropertyDraft } from '../../lib/propertyUrlExtractor'
import { parseVisualBlueprintV1 } from '../../lib/visualBlueprint'
import { Button, Card, SectionTitle, StatusBadge, TextArea, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

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
  desiredFeeling: string
  visualStyle: string
  variant: string
  themePreset: RealEstateThemePreset
  heroVariant: RealEstateHeroVariant
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel: string
  sectionOrder: string
  visualBlueprint: string
  importedProperties: RealEstateProperty[]
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
}

type PropertyUrlFormState = Omit<ExtractedPropertyDraft, 'gallery'> & {
  gallery: string
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
  ['teamPage', 'Equipe'],
  ['soldProperties', 'Biens vendus'],
  ['rentalPage', 'Location'],
  ['blog', 'Blog'],
  ['reviews', 'Avis'],
]

const themePresetValues: RealEstateThemePreset[] = ['luxury_dark', 'premium_light', 'local_trust', 'modern_minimal']
const heroVariantValues: RealEstateHeroVariant[] = ['premium', 'trust', 'estimation', 'local']
const modeValues: RealEstateAgencyMode[] = ['demo', 'live']
const statusValues: RealEstateAgencyStatus[] = ['demo_ready', 'active', 'paused', 'archived']

const heroVariantAliases: Record<string, RealEstateHeroVariant> = {
  premium: 'premium',
  editorial: 'premium',
  editorial_premium: 'premium',
  trust: 'trust',
  confiance: 'trust',
  estimation: 'estimation',
  local: 'local',
}

const visualBlueprintPlaceholder = `VisualBlueprint:
  version: v1
  brand:
    logoUrl: "https://..."
    primaryColor: "#0B1E4F"
    accentColor: "#D9B52C"
  hero:
    layout: premium
    title: "Vendez votre bien avec une agence qui inspire confiance."
    subtitle: "Une experience immobiliere premium pensee pour rendre votre accompagnement evident."
    cta: "Estimer mon bien"
  sections:
    sectionOrder: hero,properties,trust,estimation,contact`

export function ProjectDetail({
  project,
  onNavigate,
  onUpdate,
}: {
  project: Project
  onNavigate: Navigate
  onUpdate: (updates: Partial<Project>) => void
}) {
  const linkedAgency = useMemo(
    () => project.generatedAgencyId ? getRealEstateAgencyRuntimeBySlug(project.generatedAgencyId) : undefined,
    [project.generatedAgencyId],
  )
  const [form, setForm] = useState<AgencyFormState>(() => createAgencyFormFromProject(project, linkedAgency))
  const [visualBlueprint, setVisualBlueprint] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [lovableLink, setLovableLink] = useState(project.lovableLink)
  const [lovableLinkNotice, setLovableLinkNotice] = useState('')
  const [lovableLinkError, setLovableLinkError] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [propertyUrl, setPropertyUrl] = useState('')
  const [propertyUrlDraft, setPropertyUrlDraft] = useState<PropertyUrlFormState | null>(null)
  const [propertyUrlNotice, setPropertyUrlNotice] = useState('')
  const [isAnalyzingPropertyUrl, setIsAnalyzingPropertyUrl] = useState(false)
  const normalizedAgencySlug = normalizeAgencySlug(form.agencySlug)
  const publicRoute = `/demo/${normalizedAgencySlug}`
  const lovablePrompt = useMemo(() => buildPersonalizedLovablePrompt(project, form), [project, form])
  const hasLinkedAgency = Boolean(project.generatedAgencyId && linkedAgency)
  const targetAgency = normalizedAgencySlug ? getRealEstateAgencyRuntimeBySlug(normalizedAgencySlug) : undefined
  const willUpdateExistingAgency = Boolean(targetAgency && canManageRealEstateAgency(normalizedAgencySlug))
  const demoRoute = publicRoute
  const normalizedLovableLink = normalizeLovableUrl(lovableLink)

  function updateForm<K extends keyof AgencyFormState>(key: K, value: AgencyFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice('')
    setError('')
  }

  async function copyPrompt() {
    await navigator.clipboard?.writeText(lovablePrompt).catch(() => undefined)
    setCopiedPrompt(true)
    window.setTimeout(() => setCopiedPrompt(false), 2200)
  }

  function saveLovableLink() {
    const normalized = normalizeLovableUrl(lovableLink)
    if (normalized && !isValidExternalUrl(normalized)) {
      setLovableLinkError('Ajoutez un lien Lovable valide commençant par https://')
      setLovableLinkNotice('')
      return
    }

    setLovableLink(normalized)
    setLovableLinkError('')
    setLovableLinkNotice(normalized ? 'Lien Lovable enregistré.' : 'Lien Lovable supprimé.')
    onUpdate({
      lovableLink: normalized,
      nextAction: normalized ? 'Modifier et valider la démo dans Lovable.' : 'Coller le lien Lovable après création de la maquette.',
    })
  }

  function openLovableLink() {
    if (!normalizedLovableLink || !isValidExternalUrl(normalizedLovableLink)) return
    window.open(normalizedLovableLink, '_blank', 'noopener,noreferrer')
  }

  function interpretVisualBlueprint() {
    const updates = parseVisualBlueprint(visualBlueprint)
    setForm((current) => ({ ...current, ...updates }))
    setNotice(Object.keys(updates).length ? 'Visual Blueprint interprete.' : 'Aucun champ compatible trouve.')
    setError('')
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
      setError('')
    } catch {
      setPropertyUrlDraft(null)
      setPropertyUrlNotice('')
      setError('Ajoutez une URL d annonce valide.')
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
    const agencySlug = normalizeAgencySlug(form.agencySlug || form.agencyName)
    const property = createImportedProperty(propertyUrlFormToPropertyRow(propertyUrlDraft), agencySlug, form.importedProperties.length)
    setForm((current) => ({
      ...current,
      agencySlug,
      importedProperties: [...current.importedProperties, property],
    }))
    setPropertyUrl('')
    setPropertyUrlDraft(null)
    setNotice(`${form.importedProperties.length + 1} bien(s) importé(s).`)
    setError('')
  }

  function submitAgency() {
    const agencyName = form.agencyName.trim()
    const agencySlug = normalizeAgencySlug(form.agencySlug)

    if (!agencyName) {
      setError("Ajoutez un nom d'agence.")
      return
    }

    if (!agencySlug) {
      setError('Ajoutez un slug agence.')
      return
    }

    const existing = listRealEstateAgencyRuntimes().find((runtime) => runtime.modelConfig.agencySlug === agencySlug)
    if (existing && !canManageRealEstateAgency(agencySlug)) {
      setError('Ce slug est reserve a une agence de base.')
      return
    }

    const formForSave = existing && !form.importedProperties.length
      ? { ...form, importedProperties: existing.modelConfig.importedProperties ?? [] }
      : form
    const runtime = saveRealEstateAgencyConfig(toDuplicateInput({ ...formForSave, agencyName, agencySlug }))
    onUpdate({
      generatedAgencyId: runtime.modelConfig.agencySlug,
      liveRepoLink: runtime.routes.public,
      technicalStatus: 'vivante prête',
      nextAction: existing ? `Agence existante mise a jour : ${runtime.routes.public}` : `Nouvelle agence creee : ${runtime.routes.public}`,
    })
    setForm(createAgencyFormFromProject(project, runtime))
    setNotice(existing ? 'Agence existante mise à jour' : 'Nouvelle agence créée')
    setError('')
  }

  return (
    <div className="admin-view project-detail project-agency-cockpit">
      <button className="back-link" type="button" onClick={() => onNavigate('/admin/projects')}>Retour projets</button>
      <header className="project-detail-header">
        <div>
          <p className="sd-eyebrow">Production agence immobiliere</p>
          <h1>{project.companyName}</h1>
          <p>{project.sector} - {project.city} - {getProjectSourceAdminLabel(project)}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>

      <Card className="detail-block">
        <SectionTitle
          title="Workflow de production"
          text="Signature Digital prepare. Lovable modifie et valide. Signature Digital applique la version validee."
        />
        <div className="detail-grid">
          <Info label="1" value="Copier le prompt Lovable" />
          <Info label="2" value="Créer et modifier la démo dans Lovable" />
          <Info label="3" value="Après validation, demander le Visual Blueprint" />
          <Info label="4" value="Coller Visual Blueprint" />
          <Info label="5" value="Ajouter les biens depuis URL" />
          <Info label="6" value="Créer / mettre à jour la démo moteur" />
          <Info label="7" value="Ouvrir la démo moteur" />
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Créer la démo moteur depuis cette demande"
          text="La fiche Projet est le workflow principal : configuration agence, direction visuelle, données et lien de plateforme."
        />
        <div className="detail-grid">
          <Info label="Demande" value={project.companyName} />
          <Info label="Ville" value={project.city} />
          <Info label="Site actuel" value={project.currentWebsite || 'Non renseigne'} href={project.currentWebsite || undefined} />
          <Info label="Statut projet" value={projectStatusLabels[project.status]} />
          <Info label="Douleur" value={project.diagnosticBlocker || project.pain || 'Non renseignee'} />
          <Info label="Objectif" value={project.diagnosticGoal || project.goal || 'Non renseigne'} />
        </div>
        <div className="field-grid">
          <TextInput label="Nom agence" value={form.agencyName} onChange={(value) => updateForm('agencyName', value)} />
          <TextInput
            label="Slug agence"
            value={form.agencySlug}
            onChange={(value) => updateForm('agencySlug', normalizeAgencySlug(value))}
          />
          <TextInput label="Ville" value={form.city} onChange={(value) => updateForm('city', value)} />
          <TextInput label="Site actuel" value={form.websiteUrl} onChange={(value) => updateForm('websiteUrl', value)} />
          <TextInput label="Email contact" value={form.email} onChange={(value) => updateForm('email', value)} />
          <TextInput label="Telephone contact" value={form.phone} onChange={(value) => updateForm('phone', value)} />
          <TextInput label="Logo URL optionnel" value={form.logoUrl} onChange={(value) => updateForm('logoUrl', value)} />
          <TextInput label="Adresse" value={form.address} onChange={(value) => updateForm('address', value)} />
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Prompt Lovable personnalise"
          text="Les modifications visuelles se font dans Lovable avant l'extraction."
        />
        <TextArea label="Prompt a copier" value={lovablePrompt} onChange={() => undefined} />
        <div className="inline-actions">
          <Button onClick={copyPrompt}>Copier le prompt Lovable</Button>
          {copiedPrompt && <span className="copy-feedback">Prompt copie.</span>}
        </div>
        <div className="field-grid">
          <TextInput label="Lien Lovable" value={lovableLink} onChange={setLovableLink} placeholder="https://..." />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={saveLovableLink}>Enregistrer le lien Lovable</Button>
          {normalizedLovableLink && isValidExternalUrl(normalizedLovableLink) && (
            <Button variant="secondary" onClick={openLovableLink}>Ouvrir Lovable</Button>
          )}
          {lovableLinkNotice && <span className="copy-feedback">{lovableLinkNotice}</span>}
          {lovableLinkError && <span className="form-error">{lovableLinkError}</span>}
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Visual Blueprint"
          text="Collez ici le VisualBlueprint v1 généré par Lovable après validation de la démo."
        />
        <TextArea
          label="Visual Blueprint"
          value={visualBlueprint}
          onChange={setVisualBlueprint}
          placeholder={visualBlueprintPlaceholder}
        />
        <div className="inline-actions">
          <Button variant="secondary" onClick={interpretVisualBlueprint}>Interpréter le Blueprint</Button>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Ajouter un bien depuis une URL"
          text="Collez le lien d’une annonce pour pré-remplir une fiche bien. Vous pourrez corriger avant validation."
        />
        <div className="field-grid">
          <TextInput label="URL de l'annonce" value={propertyUrl} onChange={setPropertyUrl} placeholder="https://..." />
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => void analyzePropertyUrl()} disabled={isAnalyzingPropertyUrl}>
            {isAnalyzingPropertyUrl ? 'Analyse en cours...' : "Analyser l'annonce"}
          </Button>
          {propertyUrlNotice && <span className="copy-feedback">{propertyUrlNotice}</span>}
          <span className="copy-feedback">{form.importedProperties.length} bien(s) importé(s)</span>
        </div>
        {propertyUrlDraft && (
          <>
            <div className="field-grid">
              <TextInput label="Titre" value={propertyUrlDraft.title} onChange={(value) => updatePropertyUrlDraft('title', value)} />
              <TextInput label="Type" value={propertyUrlDraft.type} onChange={(value) => updatePropertyUrlDraft('type', value)} />
              <TextInput label="Ville" value={propertyUrlDraft.city} onChange={(value) => updatePropertyUrlDraft('city', value)} />
              <TextInput label="Prix" value={propertyUrlDraft.price} onChange={(value) => updatePropertyUrlDraft('price', value)} />
              <TextInput label="Surface" value={propertyUrlDraft.surface} onChange={(value) => updatePropertyUrlDraft('surface', value)} />
              <TextInput label="Pièces" value={propertyUrlDraft.rooms} onChange={(value) => updatePropertyUrlDraft('rooms', value)} />
              <TextInput label="Chambres" value={propertyUrlDraft.bedrooms} onChange={(value) => updatePropertyUrlDraft('bedrooms', value)} />
              <TextInput label="Terrain" value={propertyUrlDraft.land} onChange={(value) => updatePropertyUrlDraft('land', value)} />
              <TextInput label="DPE" value={propertyUrlDraft.dpe} onChange={(value) => updatePropertyUrlDraft('dpe', value)} />
              <TextInput label="Référence" value={propertyUrlDraft.reference} onChange={(value) => updatePropertyUrlDraft('reference', value)} />
              <TextInput label="Image principale" value={propertyUrlDraft.imageUrl} onChange={(value) => updatePropertyUrlDraft('imageUrl', value)} />
              <TextInput label="URL source" value={propertyUrlDraft.sourceUrl} onChange={(value) => updatePropertyUrlDraft('sourceUrl', value)} />
            </div>
            <TextArea label="Galerie photos" value={propertyUrlDraft.gallery} onChange={(value) => updatePropertyUrlDraft('gallery', value)} />
            <TextArea label="Description" value={propertyUrlDraft.description} onChange={(value) => updatePropertyUrlDraft('description', value)} />
            <div className="inline-actions">
              <Button onClick={addPropertyUrlDraft}>Ajouter ce bien</Button>
            </div>
          </>
        )}
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Réglages avancés"
          text="La configuration visuelle complète reste disponible si un ajustement manuel est nécessaire."
        />
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => setShowAdvancedSettings((current) => !current)}>
            {showAdvancedSettings ? 'Masquer les réglages avancés' : 'Afficher les réglages avancés'}
          </Button>
        </div>

        {showAdvancedSettings && (
          <>
            <SectionTitle
              title="Configuration visuelle"
              text="Réglages techniques complémentaires. Le VisualBlueprint reste la source principale des décisions visuelles."
            />
            <div className="field-grid">
              <SelectField label="Theme preset" value={form.themePreset} options={themePresetValues} onChange={(value) => updateForm('themePreset', value as RealEstateThemePreset)} />
              <SelectField label="Hero variant" value={form.heroVariant} options={heroVariantValues} onChange={(value) => updateForm('heroVariant', value as RealEstateHeroVariant)} />
              <TextInput label="Couleur principale" type="color" value={form.primaryColor} onChange={(value) => updateForm('primaryColor', value)} />
              <TextInput label="Couleur secondaire" type="color" value={form.secondaryColor} onChange={(value) => updateForm('secondaryColor', value)} />
              <TextInput label="Couleur accent" type="color" value={form.accentColor} onChange={(value) => updateForm('accentColor', value)} />
              <TextInput label="CTA principal" value={form.primaryCtaLabel} onChange={(value) => updateForm('primaryCtaLabel', value)} />
              <SelectField label="Mode" value={form.mode} options={modeValues} onChange={(value) => updateForm('mode', value as RealEstateAgencyMode)} />
              <SelectField label="Statut" value={form.status} options={statusValues} onChange={(value) => updateForm('status', value as RealEstateAgencyStatus)} />
              <TextInput label="Style visuel" value={form.visualStyle} onChange={(value) => updateForm('visualStyle', value)} />
              <TextInput label="Variant" value={form.variant} onChange={(value) => updateForm('variant', value)} />
              <TextArea label="Hero title" value={form.heroTitle} onChange={(value) => updateForm('heroTitle', value)} />
              <TextArea label="Hero subtitle" value={form.heroSubtitle} onChange={(value) => updateForm('heroSubtitle', value)} />
              <TextArea label="Ordre des sections" value={form.sectionOrder} onChange={(value) => updateForm('sectionOrder', value)} />
              <TextArea label="Douleur principale" value={form.painPoint} onChange={(value) => updateForm('painPoint', value)} />
              <TextArea label="Objectif principal" value={form.objective} onChange={(value) => updateForm('objective', value)} />
              <TextArea label="Ressenti souhaite" value={form.desiredFeeling} onChange={(value) => updateForm('desiredFeeling', value)} />
            </div>

            <div className="admin-agency-modules">
              {moduleLabels.map(([key, label]) => (
                <label className="admin-agency-module" key={key}>
                  <input
                    type="checkbox"
                    checked={form.enabledModules[key]}
                    onChange={(event) => updateForm('enabledModules', { ...form.enabledModules, [key]: event.target.checked })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title={hasLinkedAgency || willUpdateExistingAgency ? 'Mettre à jour la démo moteur' : 'Créer la démo moteur'}
          text="Signature Digital applique la direction et les données validées. L’activation commerciale reste suivie séparément dans le projet."
        />
        {notice && <p className="copy-feedback">{notice}</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="detail-grid">
          <Info label="Route demo" value={publicRoute} />
          <Info label="AgencyId" value={normalizeAgencySlug(form.agencySlug)} />
          <Info label="Mode" value={form.mode} />
          <Info label="Statut technique agence" value={form.status} />
        </div>
        <div className="inline-actions">
          <Button onClick={submitAgency}>{hasLinkedAgency || willUpdateExistingAgency ? 'Mettre à jour la démo moteur' : 'Créer la démo moteur'}</Button>
          {normalizedAgencySlug && (
            <Button variant="secondary" onClick={() => window.open(demoRoute, '_blank', 'noopener,noreferrer')}>
              Ouvrir la démo moteur
            </Button>
          )}
          {project.generatedAgencyId && <span className="copy-feedback">Agence creee : /demo/{project.generatedAgencyId}</span>}
        </div>
      </Card>
    </div>
  )
}

function createAgencyFormFromProject(project: Project, runtime?: RealEstateAgencyRuntime): AgencyFormState {
  if (runtime) return createFormFromRuntime(runtime)

  const painPoint = project.diagnosticBlocker || project.pain || "Clarifier la valeur de l'agence des les premieres secondes."
  const objective = project.diagnosticGoal || project.goal || 'Generer plus de demandes qualifiees.'
  const desiredFeeling = project.desiredFeeling || project.style || 'Confiance et premium'
  const agencySlug = normalizeAgencySlug([project.companyName, project.city].filter(Boolean).join(' '))

  return {
    agencyName: project.companyName,
    city: project.city,
    agencySlug,
    email: project.email,
    phone: project.phone,
    address: project.city,
    websiteUrl: project.currentWebsite,
    logoUrl: project.demoAssets.logoUrl,
    primaryColor: '#19191d',
    secondaryColor: '#f7f2ea',
    accentColor: '#b08d57',
    painPoint,
    objective,
    desiredFeeling,
    visualStyle: desiredFeeling,
    variant: 'premium-editorial',
    themePreset: 'premium_light',
    heroVariant: 'premium',
    heroTitle: buildHeroTitle(project, objective),
    heroSubtitle: buildHeroSubtitle(painPoint, objective, desiredFeeling),
    primaryCtaLabel: 'Estimer mon bien',
    sectionOrder: 'hero, properties, trust, estimation, sellerSpace, reviews, contact',
    visualBlueprint: '',
    importedProperties: [],
    mode: 'demo',
    status: 'demo_ready',
    enabledModules: getDefaultRealEstateEnabledModules(),
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
    desiredFeeling: modelConfig.visualStyle,
    visualStyle: modelConfig.visualStyle,
    variant: modelConfig.variant,
    themePreset: modelConfig.themePreset,
    heroVariant: modelConfig.heroVariant,
    heroTitle: modelConfig.heroTitle,
    heroSubtitle: modelConfig.heroSubtitle,
    primaryCtaLabel: modelConfig.primaryCtaLabel,
    sectionOrder: modelConfig.sectionOrder,
    visualBlueprint: modelConfig.visualBlueprint ?? '',
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
    agencySlug: normalizeAgencySlug(form.agencySlug),
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
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    primaryCtaLabel: form.primaryCtaLabel,
    sectionOrder: form.sectionOrder,
    visualBlueprint: form.visualBlueprint,
    importedProperties: form.importedProperties.length ? form.importedProperties : undefined,
    enabledModules: form.enabledModules,
    status: form.status,
    mode: form.mode,
    propertyLimit: form.importedProperties.length ? form.importedProperties.length : 2,
  }
}

function buildHeroTitle(project: Project, objective: string) {
  const agencyName = project.companyName || 'Votre agence'
  if (objective) return `${agencyName} - une experience immobiliere pensee pour ${objective.toLowerCase()}.`
  return `${agencyName}, une agence qui inspire confiance.`
}

function buildHeroSubtitle(painPoint: string, objective: string, desiredFeeling: string) {
  return [
    painPoint ? `Repondre a l'enjeu : ${painPoint}.` : '',
    objective ? `Objectif : ${objective}.` : '',
    desiredFeeling ? `Impression recherchee : ${desiredFeeling}.` : '',
  ].filter(Boolean).join(' ')
}

function buildPersonalizedLovablePrompt(project: Project, form: AgencyFormState) {
  return `Tu es directeur artistique Lovable pour une demo immobiliere Signature Digital.

Contexte agence :
- Nom agence : ${form.agencyName || project.companyName}
- Ville / zone : ${form.city || project.city}
- Site actuel : ${form.websiteUrl || project.currentWebsite || 'Non renseigne'}
- Douleur principale : ${form.painPoint}
- Objectif principal : ${form.objective}
- Ressenti souhaite : ${form.desiredFeeling}
- Angle commercial : ${form.heroTitle}

Philosophie obligatoire :
Lovable inspire.
ChatGPT interprete.
Signature Digital applique.
Le moteur Signature Digital reste maitre.

PHASE 1 - CREATION VISUELLE
Lovable doit creer directement une demo visuelle navigable et previsualisable.
Ne reponds pas uniquement avec du texte, JSON, YAML ou config.
La priorite est que Hugo puisse voir la demo dans Lovable et demander des modifications.

PHASE 2 - ITERATIONS
Hugo peut demander des ajustements visuels.
Lovable doit modifier la demo sans reinventer le moteur Signature Digital.

PHASE 3 - VALIDATION
Lovable ne doit generer le VisualBlueprint v1 qu'apres que Hugo ecrive explicitement :
"Démo validée."

Ton role :
Tu es directeur artistique, pas developpeur produit.
Tu dois creer une vision premium compatible avec un moteur immobilier existant.
Tu ne dois jamais recreer le CRM, l'authentification, les dashboards, les espaces vendeur/agent/patron ou les workflows metier.

Analyse a realiser :
1. Analyse le site actuel si disponible.
2. Recupere ou deduis logo, couleurs, identite visuelle, ton, coordonnees et preuves de confiance.
3. Comprends la douleur client.
4. Cree une vision premium qui rend la valeur de l'agence evidente en quelques secondes.

Interdictions absolues :
- Ne cree pas de route.
- Ne cree pas de logique metier.
- Ne modifie pas les permissions.
- Ne copie pas le moteur Signature Digital.
- Ne produis pas de code a coller dans le moteur.

Sortie attendue :
Produis d'abord une vraie demonstration visuelle navigable dans Lovable.
Ajoute le VisualBlueprint uniquement apres validation explicite.

Apres le message exact "Démo validée", reponds uniquement avec :

VisualBlueprint:
  version: v1
  brand:
    logoUrl: "..."
    primaryColor: "#0B1E4F"
    accentColor: "#D9B52C"
    backgroundPalette: "..."
    typographyMood: "..."
  hero:
    imageUrl: "..."
    layout: premium
    height: "..."
    overlay: "..."
    titleAlignment: "..."
    titleWidth: "..."
    titleSize: "..."
    subtitleSize: "..."
    buttonStyle: "..."
    buttonPosition: "..."
    title: "..."
    subtitle: "..."
    cta: "..."
  navigation:
    style: "..."
    height: "..."
    background: "..."
    transparency: "..."
  sections:
    sectionOrder: hero,properties,trust,estimation,sellerSpace,reviews,contact
    sectionSpacing: "..."
    sectionBackgrounds: "..."
  propertyCards:
    cardStyle: "..."
    imageRatio: "..."
    imageTreatment: "..."
    cardRadius: "..."
    shadowStyle: "..."
    spacing: "..."
  buttons:
    shape: "..."
    background: "..."
    textColor: "..."
    borderStyle: "..."
    hoverStyle: "..."
  typography:
    titleStyle: "..."
    subtitleStyle: "..."
    bodyStyle: "..."
  images:
    heroImageStyle: "..."
    sectionImageStyle: "..."
    cropStyle: "..."
  responsive:
    heroMobileHeight: "..."
    mobileSpacing: "..."
    mobileTypographyScale: "..."

Le VisualBlueprint ne contient jamais d'annonces, prix, descriptions, surfaces, DPE, galeries de biens ou donnees metier.`
}

function parseVisualBlueprint(value: string): Partial<AgencyFormState> {
  const next: Partial<AgencyFormState> = {}
  const blueprint = parseVisualBlueprintV1(value)
  if (!blueprint) return next

  next.visualBlueprint = value.trim()

  const logoUrl = blueprint.brand.logoUrl
  if (logoUrl) next.logoUrl = logoUrl

  const primaryColor = blueprint.brand.primaryColor
  if (primaryColor && isHexColor(primaryColor)) next.primaryColor = primaryColor

  const accentColor = blueprint.brand.accentColor
  if (accentColor && isHexColor(accentColor)) next.accentColor = accentColor

  const heroLayout = blueprint.hero.layout
  if (heroLayout) {
    const heroVariant = heroVariantAliases[heroLayout.toLowerCase()]
    if (heroVariant) next.heroVariant = heroVariant
  }

  const heroTitle = blueprint.hero.title
  if (heroTitle) next.heroTitle = heroTitle

  const heroSubtitle = blueprint.hero.subtitle
  if (heroSubtitle) next.heroSubtitle = heroSubtitle

  const primaryCtaLabel = blueprint.hero.cta
  if (primaryCtaLabel) next.primaryCtaLabel = primaryCtaLabel

  const sectionOrder = blueprint.sections.sectionOrder
  if (sectionOrder) next.sectionOrder = sectionOrder

  const themePreset = blueprint.brand.themePreset
  if (themePreset && themePresetValues.includes(themePreset as RealEstateThemePreset)) {
    next.themePreset = themePreset as RealEstateThemePreset
  }

  return next
}

function createImportedProperty(row: Record<string, string | string[]>, agencyId: string, index: number): RealEstateProperty {
  const title = getTextValue(row.title) || `Bien importe ${index + 1}`
  const id = `${normalizeAgencySlug(title) || 'bien'}-${index + 1}`
  const galleryImages = getListValue(row.gallery)
  const imageUrl = getTextValue(row.imageUrl) || galleryImages[0] || fallbackPropertyImage
  const images = [...new Set([imageUrl, ...galleryImages])].filter(Boolean)
  const highlights = parseListValue(getTextValue(row.highlights) || getTextValue(row.features))
  const extraHighlights = [getTextValue(row.land), getTextValue(row.dpe)].filter(Boolean)

  return {
    id,
    agencyId,
    title,
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

function cleanValue(value: string) {
  return value.trim().replace(/^["']|["']$/g, '')
}

function getTextValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function getListValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return parseListValue(value)
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function parseListValue(value?: string) {
  if (!value) return []
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => cleanValue(item))
    .filter(Boolean)
}

function parsePriceValue(value?: string) {
  if (!value) return 0
  const withoutCents = value.trim().replace(/([,.]\d{2})(\s?€|\s?eur)?$/i, '')
  const numericValue = Number(withoutCents.replace(/[^\d]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
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

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">{value}</a>
      ) : (
        <strong>{value || 'Non renseigne'}</strong>
      )}
    </div>
  )
}
