import { useState } from 'react'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'
import { fallbackPropertyImage, type RealEstateProperty } from '../../data/realEstateTemplate'
import {
  canManageRealEstateAgency,
  isDuplicatedRealEstateAgency,
  listRealEstateAgencyRuntimes,
  normalizeAgencySlug,
  reactivateRealEstateAgency,
  saveRealEstateAgencyConfig,
  updateRealEstateAgencyStatus,
  type DuplicateRealEstateAgencyInput,
  type RealEstateHeroVariant,
  type RealEstateAgencyMode,
  type RealEstateAgencyRuntime,
  type RealEstateAgencyStatus,
  type RealEstateEnabledModules,
  type RealEstateThemePreset,
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
  heroTitle: string
  heroSubtitle: string
  primaryCtaLabel: string
  sectionOrder: string
  importedProperties: RealEstateProperty[]
  mode: RealEstateAgencyMode
  status: RealEstateAgencyStatus
  enabledModules: RealEstateEnabledModules
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
  description: "Appartement lumineux..."
- title: "Maison familiale"
  city: "Montauban"
  price: "315 000 €"
  surface: "140 m²"
  imageUrl: "https://..."
  description: "Maison avec jardin..."`

const themePresetValues: RealEstateThemePreset[] = ['luxury_dark', 'premium_light', 'local_trust', 'modern_minimal']

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

function isThemePreset(value: string): value is RealEstateThemePreset {
  return themePresetValues.includes(value as RealEstateThemePreset)
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function parseAgencyProperties(value: string, agencyId: string): RealEstateProperty[] {
  const rows: Array<Record<string, string>> = []
  let current: Record<string, string> | null = null

  value.split(/\r?\n/).forEach((line) => {
    const itemMatch = line.match(/^\s*-\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (itemMatch) {
      current = {}
      rows.push(current)
      current[itemMatch[1]] = cleanSignatureDirectionValue(itemMatch[2])
      return
    }

    const fieldMatch = line.match(/^\s+([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/)
    if (!fieldMatch || !current) return
    current[fieldMatch[1]] = cleanSignatureDirectionValue(fieldMatch[2])
  })

  return rows
    .filter((row) => row.title || row.description || row.imageUrl)
    .map((row, index) => createImportedProperty(row, agencyId, index))
}

function createImportedProperty(row: Record<string, string>, agencyId: string, index: number): RealEstateProperty {
  const title = row.title || `Bien importé ${index + 1}`
  const id = `${normalizeAgencySlug(title) || 'bien'}-${index + 1}`
  const imageUrl = row.imageUrl || fallbackPropertyImage
  const highlights = parseListValue(row.highlights || row.features)
  const extraHighlights = [row.land, row.dpe].filter(Boolean)

  return {
    id,
    agencyId,
    title,
    address: row.address || row.city || '',
    city: row.city || '',
    price: row.price || '',
    priceValue: parsePriceValue(row.price),
    surface: row.surface || '',
    rooms: row.rooms || '',
    bedrooms: row.bedrooms,
    type: row.type || 'Bien',
    description: row.description || '',
    highlights: [...highlights, ...extraHighlights],
    imageUrl,
    images: [imageUrl],
    photos: [imageUrl],
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
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
