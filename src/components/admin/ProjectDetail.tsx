import { useMemo, useState } from 'react'
import type { Project } from '../../data/projectStore'
import { getProjectSourceAdminLabel, projectStatusLabels } from '../../data/projectStore'
import { fallbackPropertyImage, type RealEstateProperty } from '../../data/realEstateTemplate'
import {
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
  importedProperties: RealEstateProperty[]
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
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

const signatureDirectionPlaceholder = `themePreset: premium_light
primaryColor: "#0B1E4F"
accentColor: "#D9B52C"
heroVariant: editorial
heroTitle: "Vendez votre bien avec une agence qui inspire confiance."
heroSubtitle: "Une experience immobiliere premium pensee pour rendre votre accompagnement evident."
primaryCtaLabel: "Estimer mon bien"
sectionOrder: hero,properties,trust,estimation,contact`

const agencyDataPlaceholder = `properties:
- title: "Appartement 3 pieces"
  city: "Montauban"
  price: "198 000 EUR"
  surface: "82 m2"
  imageUrl: "https://..."
  gallery:
    - "https://..."
    - "https://..."
  description: "Appartement lumineux..."
- title: "Maison familiale"
  city: "Montauban"
  price: "315 000 EUR"
  surface: "140 m2"
  imageUrl: "https://..."
  gallery:
    - "https://..."
    - "https://..."
  description: "Maison avec jardin..."`

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
  const [signatureDirection, setSignatureDirection] = useState('')
  const [agencyData, setAgencyData] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const publicRoute = `/demo/${normalizeAgencySlug(form.agencySlug)}`
  const lovablePrompt = useMemo(() => buildPersonalizedLovablePrompt(project, form), [project, form])
  const hasLinkedAgency = Boolean(project.generatedAgencyId && linkedAgency)

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

  function interpretSignatureDirection() {
    const updates = parseSignatureDirection(signatureDirection)
    setForm((current) => ({ ...current, ...updates }))
    setNotice(Object.keys(updates).length ? 'Direction Signature interpretee.' : 'Aucun champ compatible trouve.')
    setError('')
  }

  function interpretAgencyData() {
    const agencySlug = normalizeAgencySlug(form.agencySlug || form.agencyName)
    const properties = parseAgencyProperties(agencyData, agencySlug)

    if (!properties.length) {
      setNotice('Aucune donnee agence interpretee.')
      setError('')
      return
    }

    setForm((current) => ({
      ...current,
      agencySlug,
      importedProperties: properties,
    }))
    setNotice(`${properties.length} bien${properties.length > 1 ? 's' : ''} pret${properties.length > 1 ? 's' : ''} a appliquer.`)
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
    if (existing && existing.modelConfig.agencySlug !== linkedAgency?.modelConfig.agencySlug) {
      setError('Ce slug agence existe deja.')
      return
    }

    const runtime = saveRealEstateAgencyConfig(toDuplicateInput({ ...form, agencyName, agencySlug }))
    onUpdate({
      generatedAgencyId: runtime.modelConfig.agencySlug,
      liveRepoLink: runtime.routes.public,
      technicalStatus: 'vivante prête',
      nextAction: hasLinkedAgency ? `Agence mise a jour : ${runtime.routes.public}` : `Agence creee : ${runtime.routes.public}`,
    })
    setForm(createAgencyFormFromProject(project, runtime))
    setNotice(hasLinkedAgency ? 'Agence mise a jour.' : 'Agence creee.')
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
          title="Creer l'agence depuis cette demande"
          text="La fiche projet devient le cockpit de production : configuration agence, direction visuelle, donnees et lien demo."
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
          text="Prompt maitre pre-rempli avec les informations client pour generer une direction Lovable compatible moteur."
        />
        <TextArea label="Prompt a copier" value={lovablePrompt} onChange={() => undefined} />
        <div className="inline-actions">
          <Button onClick={copyPrompt}>Copier le prompt</Button>
          {copiedPrompt && <span className="copy-feedback">Prompt copie.</span>}
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Direction Signature"
          text="Collez une extraction ChatGPT. Les champs compatibles seront remplis, puis resteront modifiables avant application."
        />
        <TextArea
          label="Direction Signature"
          value={signatureDirection}
          onChange={setSignatureDirection}
          placeholder={signatureDirectionPlaceholder}
        />
        <div className="inline-actions">
          <Button variant="secondary" onClick={interpretSignatureDirection}>Interpreter</Button>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Donnees agence"
          text="Collez une extraction simple de biens, photos et descriptions. Elle sera stockee dans dataConfig.properties."
        />
        <TextArea label="Biens importes" value={agencyData} onChange={setAgencyData} placeholder={agencyDataPlaceholder} />
        <div className="inline-actions">
          <Button variant="secondary" onClick={interpretAgencyData}>Interpreter les donnees</Button>
          <span className="copy-feedback">{form.importedProperties.length} bien(s) pret(s)</span>
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title="Configuration visuelle"
          text="Memes champs que la configuration agence Templates : direction, hero, CTA, statuts et modules."
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
      </Card>

      <Card className="detail-block">
        <SectionTitle
          title={hasLinkedAgency ? "Mettre a jour l'agence" : 'Action finale'}
          text="Aucune agence n'est creee automatiquement. La configuration est appliquee uniquement au clic."
        />
        {notice && <p className="copy-feedback">{notice}</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="detail-grid">
          <Info label="Route demo" value={publicRoute} />
          <Info label="AgencyId" value={normalizeAgencySlug(form.agencySlug)} />
          <Info label="Mode" value={form.mode} />
          <Info label="Statut" value={form.status} />
        </div>
        <div className="inline-actions">
          <Button onClick={submitAgency}>{hasLinkedAgency ? "Mettre a jour l'agence" : "Creer l'agence"}</Button>
          {project.generatedAgencyId && (
            <Button variant="secondary" onClick={() => window.open(`/demo/${project.generatedAgencyId}`, '_blank', 'noopener,noreferrer')}>
              Ouvrir la demo
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

Ton role :
Tu es directeur artistique, pas developpeur produit.
Tu dois creer une vision premium compatible avec un moteur immobilier existant.
Tu ne dois jamais recreer le CRM, l'authentification, les dashboards, les espaces vendeur/agent/patron ou les workflows metier.

Analyse a realiser :
1. Analyse le site actuel si disponible.
2. Recupere ou deduis logo, couleurs, annonces, photos, descriptions, coordonnees et preuves de confiance.
3. Comprends la douleur client.
4. Cree une vision premium qui rend la valeur de l'agence evidente en quelques secondes.

Interdictions absolues :
- Ne cree pas de route.
- Ne cree pas de logique metier.
- Ne modifie pas les permissions.
- Ne copie pas le moteur Signature Digital.
- Ne produis pas de code a coller dans le moteur.

Sortie attendue :
Produis uniquement une direction artistique et des donnees structurees compatibles avec Signature Digital.

Format attendu :

themePreset:
primaryColor:
accentColor:
heroVariant:
heroTitle:
heroSubtitle:
primaryCtaLabel:
sectionOrder:

properties:
- title:
  city:
  price:
  surface:
  imageUrl:
  gallery:
    - "https://..."
    - "https://..."
  description:`
}

function parseSignatureDirection(value: string): Partial<AgencyFormState> {
  const next: Partial<AgencyFormState> = {}

  value.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?)\s*$/)
    if (!match) return

    const key = match[1]
    const rawValue = cleanValue(match[2])

    if (key === 'themePreset' && themePresetValues.includes(rawValue as RealEstateThemePreset)) {
      next.themePreset = rawValue as RealEstateThemePreset
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
      current[itemMatch[1]] = cleanValue(itemMatch[2])
      return
    }

    const listItemMatch = line.match(/^\s+-\s*["']?(.+?)["']?\s*$/)
    if (listItemMatch && current && activeListKey) {
      const currentList = Array.isArray(current[activeListKey]) ? current[activeListKey] as string[] : []
      current[activeListKey] = [...currentList, cleanValue(listItemMatch[1])]
      return
    }

    const fieldMatch = line.match(/^\s+([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (!fieldMatch || !current) return
    activeListKey = fieldMatch[2] ? '' : fieldMatch[1]
    current[fieldMatch[1]] = fieldMatch[2] ? cleanValue(fieldMatch[2]) : []
  })

  return rows
    .filter((row) => row.title || row.description || row.imageUrl || row.gallery)
    .map((row, index) => createImportedProperty(row, agencyId, index))
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
  const numericValue = Number(value.replace(/[^\d]/g, ''))
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
