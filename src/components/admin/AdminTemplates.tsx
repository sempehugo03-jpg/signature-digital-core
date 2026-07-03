import { useState } from 'react'
import { Button, Card, SectionTitle } from '../shared/DesignSystem'
import {
  isDuplicatedRealEstateAgency,
  listRealEstateAgencyRuntimes,
  normalizeAgencySlug,
  reactivateRealEstateAgency,
  saveDuplicatedRealEstateAgency,
  updateRealEstateAgencyStatus,
  type DuplicateRealEstateAgencyInput,
  type RealEstateAgencyMode,
  type RealEstateAgencyRuntime,
  type RealEstateAgencyStatus,
  type RealEstateEnabledModules,
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
  painPoint: string
  objective: string
  visualStyle: string
  variant: string
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
  rentalPage: false,
  soldProperties: false,
  teamPage: false,
}

const moduleLabels: Array<[keyof RealEstateEnabledModules, string]> = [
  ['estimation', 'Estimation'],
  ['sellerSpace', 'Espace vendeur'],
  ['agentSpace', 'Espace agent'],
  ['ownerSpace', 'Espace patron'],
  ['rentalPage', 'Page location'],
  ['soldProperties', 'Biens vendus'],
  ['teamPage', 'Equipe'],
]

const statusLabels: Record<RealEstateAgencyStatus, string> = {
  draft: 'Brouillon',
  demo_ready: 'Demo prete',
  sent: 'Envoyee',
  validated: 'Validee',
  active: 'Active',
  paused: 'En pause',
  archived: 'Archivee',
}

export function AdminTemplates() {
  const [version, setVersion] = useState(0)
  const [form, setForm] = useState<AgencyFormState | null>(null)
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
    setForm(createDefaultForm())
  }

  function openEditForm(runtime: RealEstateAgencyRuntime) {
    setNotice('')
    setForm(createFormFromRuntime(runtime))
  }

  function submitAgency() {
    if (!form) return
    const agencySlug = normalizeAgencySlug(form.agencySlug)
    if (!agencySlug) {
      setNotice('Ajoutez un slug agence.')
      return
    }

    const staticRuntime = agencies.find((runtime) =>
      runtime.modelConfig.agencySlug === agencySlug && !isDuplicatedRealEstateAgency(agencySlug)
    )
    if (staticRuntime) {
      setNotice('Ce slug est reserve a une agence de base.')
      return
    }

    saveDuplicatedRealEstateAgency(toDuplicateInput({ ...form, agencySlug }))
    setForm(null)
    refresh('Agence configuree.')
  }

  function pauseAgency(runtime: RealEstateAgencyRuntime) {
    if (!window.confirm('Mettre cette agence en pause ?')) return
    updateRealEstateAgencyStatus(runtime.modelConfig.agencySlug, 'paused')
    refresh('Agence mise en pause.')
  }

  function archiveAgency(runtime: RealEstateAgencyRuntime) {
    if (!window.confirm('Archiver cette agence ?')) return
    updateRealEstateAgencyStatus(runtime.modelConfig.agencySlug, 'archived')
    refresh('Agence archivee.')
  }

  function reactivateAgency(runtime: RealEstateAgencyRuntime) {
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
          <Button onClick={openCreateForm}>Dupliquer pour une agence</Button>
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
            <AgencyRow
              key={runtime.modelConfig.agencyId}
              runtime={runtime}
              editable={isDuplicatedRealEstateAgency(runtime.modelConfig.agencySlug)}
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
              <AgencyRow
                key={runtime.modelConfig.agencyId}
                runtime={runtime}
                editable={isDuplicatedRealEstateAgency(runtime.modelConfig.agencySlug)}
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
          onChange={setForm}
          onClose={() => setForm(null)}
          onSubmit={submitAgency}
        />
      )}
    </div>
  )
}

function AgencyRow({
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
    <article className="admin-agency-row">
      <div>
        <h3>{modelConfig.agencyName}</h3>
        <p>{modelConfig.city} - /demo/{modelConfig.agencySlug}</p>
        <div className="detail-grid">
          <Info label="Slug" value={modelConfig.agencySlug} />
          <Info label="Mode" value={modelConfig.mode} />
          <Info label="Status" value={statusLabels[modelConfig.status]} />
          <Info label="Lien public" value={routes.public} />
        </div>
      </div>
      <div className="admin-template-actions">
        <Button variant="secondary" onClick={() => onOpen(routes.public)}>Ouvrir</Button>
        <Button variant="secondary" onClick={() => editable && onEdit(runtime)} disabled={!editable}>Modifier</Button>
        {!isPaused && !isArchived && (
          <Button variant="secondary" onClick={() => editable && onPause(runtime)} disabled={!editable}>Mettre en pause</Button>
        )}
        {!isArchived && (
          <Button variant="secondary" onClick={() => editable && onArchive(runtime)} disabled={!editable}>Archiver</Button>
        )}
        {(isPaused || isArchived) && (
          <Button onClick={() => editable && onReactivate(runtime)} disabled={!editable}>Reactiver</Button>
        )}
      </div>
    </article>
  )
}

function AgencyFormModal({
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  form: AgencyFormState
  onChange: (form: AgencyFormState) => void
  onClose: () => void
  onSubmit: () => void
}) {
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

  return (
    <div className="locked-modal-backdrop" role="presentation">
      <Card className="locked-modal admin-agency-modal">
        <button className="admin-agency-close" type="button" onClick={onClose}>Fermer</button>
        <p className="sd-eyebrow">Duplication agence</p>
        <h2>Dupliquer pour une agence</h2>
        <div className="admin-agency-form">
          <Field label="Nom de l'agence" value={form.agencyName} onChange={updateName} />
          <Field label="Ville" value={form.city} onChange={(value) => update('city', value)} />
          <Field label="Slug agence" value={form.agencySlug} onChange={(value) => update('agencySlug', normalizeAgencySlug(value))} />
          <Field label="Email agence" type="email" value={form.email} onChange={(value) => update('email', value)} />
          <Field label="Telephone agence" value={form.phone} onChange={(value) => update('phone', value)} />
          <Field label="Adresse" value={form.address} onChange={(value) => update('address', value)} />
          <Field label="Site actuel" value={form.websiteUrl} onChange={(value) => update('websiteUrl', value)} />
          <Field label="Logo URL" value={form.logoUrl} onChange={(value) => update('logoUrl', value)} />
          <Field label="Couleur principale" type="color" value={form.primaryColor} onChange={(value) => update('primaryColor', value)} />
          <Field label="Couleur secondaire" type="color" value={form.secondaryColor} onChange={(value) => update('secondaryColor', value)} />
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
          <Button onClick={onSubmit}>Creer l'agence</Button>
        </div>
      </Card>
    </div>
  )
}

function createDefaultForm(): AgencyFormState {
  return {
    agencyName: 'Agence Duplication Test',
    city: 'Tarbes',
    agencySlug: 'agence-duplication-test',
    email: 'contact@agence-duplication-test.fr',
    phone: '05 62 00 00 00',
    address: '1 place de Verdun, 65000 Tarbes',
    websiteUrl: '',
    logoUrl: '',
    primaryColor: '#19191d',
    secondaryColor: '#f7f2ea',
    painPoint: 'Clarifier le suivi vendeur et fluidifier les demandes.',
    objective: 'Preparer une demo agence sans dupliquer le moteur.',
    visualStyle: 'Opus Domus compatible',
    variant: 'premium-editorial',
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
    painPoint: modelConfig.painPoint,
    objective: modelConfig.objective,
    visualStyle: modelConfig.visualStyle,
    variant: modelConfig.variant,
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
    },
    email: form.email,
    phone: form.phone,
    address: form.address,
    websiteUrl: form.websiteUrl,
    painPoint: form.painPoint,
    objective: form.objective,
    visualStyle: form.visualStyle,
    variant: form.variant,
    enabledModules: form.enabledModules,
    status: form.status,
    mode: form.mode,
    propertyLimit: 2,
  }
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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
