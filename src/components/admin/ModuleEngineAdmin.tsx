import { useMemo, useState } from 'react'
import { activateDemoRuntime } from '../../lib/demoRuntime'
import { getDefaultModules, getModulesForSector } from '../../lib/modules'
import { activateDemoRuntimeAdmin, generateLovablePromptAdmin, setModuleEnabledAdmin } from '../../lib/signature-digital-admin-client'
import {
  getSignatureAgencyModules,
  listSignatureAgencies,
  listSignatureDemoRequests,
  listSignatureGeneratedPrompts,
  readSignatureDigitalState,
  updateSignatureAgencyModule,
} from '../../data/signatureDigitalStore'
import type { Agency, ModuleKey } from '../../types/signature-digital'
import { Badge, Button, Card, SectionTitle, TextArea } from '../shared/DesignSystem'
import type { RuntimeActivationResult } from '../../lib/demoRuntime'

export function ModuleEngineAdmin() {
  const [version, setVersion] = useState(0)
  const [runtimeResult, setRuntimeResult] = useState<RuntimeActivationResult | undefined>()
  const [adminNotice, setAdminNotice] = useState('')
  const state = useMemo(() => readSignatureDigitalState(), [version])
  const agencies = useMemo(() => listSignatureAgencies(), [version])
  const demoRequests = useMemo(() => listSignatureDemoRequests(), [version])
  const prompts = useMemo(() => listSignatureGeneratedPrompts(), [version])
  const [selectedAgencyId, setSelectedAgencyId] = useState(() => agencies[0]?.id ?? '')
  const selectedAgency = agencies.find((agency) => agency.id === selectedAgencyId) ?? agencies[0]
  const selectedPrompt = selectedAgency
    ? prompts.find((prompt) => prompt.agencyId === selectedAgency.id)
    : undefined
  const modules = selectedAgency ? getSignatureAgencyModules(selectedAgency.id) : []
  const selectedLeads = selectedAgency ? state.leads.filter((lead) => lead.agencyId === selectedAgency.id) : []
  const selectedAppointments = selectedAgency ? state.appointments.filter((appointment) => appointment.agencyId === selectedAgency.id) : []
  const enabledCount = modules.filter((module) => module.enabled).length

  function refresh() {
    setVersion((current) => current + 1)
  }

  function toggleModule(agency: Agency, moduleKey: ModuleKey, enabled: boolean) {
    updateSignatureAgencyModule(agency.id, moduleKey, enabled)
    void setModuleEnabledAdmin(agency.id, moduleKey, enabled)
    refresh()
  }

  async function makeRuntimeReady(agency: Agency) {
    const apiResult = await activateDemoRuntimeAdmin(agency.id)
    const result = activateDemoRuntime(agency.id)
    setAdminNotice(apiResult.ok ? 'Runtime verifie via /api/admin.' : apiResult.message ?? '')
    setRuntimeResult(result)
    refresh()
  }

  async function copyPromptFromAdmin(agency: Agency, fallbackPrompt: string) {
    const result = await generateLovablePromptAdmin(agency.id)
    const prompt = result.prompt || fallbackPrompt
    await navigator.clipboard?.writeText(prompt)
    setAdminNotice(result.ok ? 'Prompt Lovable genere via /api/admin.' : result.message ?? '')
  }

  return (
    <div className="admin-view">
      <SectionTitle
        eyebrow="Moteur Signature Digital"
        title="Configuration technique du moteur générique."
        text="Zone technique des modules Signature Digital. La création des agences immobilières reste dans les fiches Projet."
      />

      <div className="metric-grid">
        <Card className="metric-card">
          <span>Demandes de demo</span>
          <strong>{demoRequests.length}</strong>
        </Card>
        <Card className="metric-card">
          <span>Agences / clients</span>
          <strong>{agencies.length}</strong>
        </Card>
        <Card className="metric-card">
          <span>Modules standards</span>
          <strong>{getDefaultModules().length}</strong>
        </Card>
        <Card className="metric-card">
          <span>Prompts generes</span>
          <strong>{prompts.length}</strong>
        </Card>
      </div>

      <Card className="detail-block">
        <SectionTitle title="Demandes de demo" text="Chaque demande genere une agency demo, des settings, des modules et un prompt Lovable." />
        <div className="project-list">
          {demoRequests.length === 0 && <p className="muted">Aucune demande multi-tenant generee pour le moment. Lancez le tunnel public pour creer une configuration.</p>}
          {demoRequests.map((request) => (
            <article className="project-card" key={request.id}>
              <div>
                <h2>{request.companyName}</h2>
                <p>{request.sector} · {request.city}</p>
                <small>{request.painPoint}</small>
              </div>
              <div className="project-card-meta">
                <Badge tone="violet">{request.status}</Badge>
                <span>{request.selectedModules.length} modules</span>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card className="detail-block">
        <SectionTitle title="Agences / clients" text="Toutes les donnees sont rattachees a agencyId pour eviter les melanges entre clients." />
        <div className="filter-row">
          {agencies.map((agency) => (
            <button
              className={selectedAgency?.id === agency.id ? 'active' : ''}
              key={agency.id}
              type="button"
              onClick={() => setSelectedAgencyId(agency.id)}
            >
              {agency.name}
            </button>
          ))}
        </div>
        {selectedAgency && (
          <div className="detail-grid">
            <Info label="AgencyId" value={selectedAgency.id} />
            <Info label="Secteur" value={selectedAgency.sector} />
            <Info label="Statut" value={selectedAgency.status} />
            <Info label="Runtime" value={selectedAgency.runtimeStatus} />
            <Info label="Ville" value={selectedAgency.city} />
            <Info label="Angle commercial" value={selectedAgency.commercialAngle} />
            <Info label="Modules actifs" value={`${enabledCount} / ${modules.length}`} />
          </div>
        )}
        {selectedAgency && (
          <div className="inline-actions">
            <Button onClick={() => makeRuntimeReady(selectedAgency)}>Rendre la demo vivante</Button>
          </div>
        )}
        {adminNotice && <p className="muted">{adminNotice}</p>}
      </Card>

      {runtimeResult && (
        <Card className="detail-block">
          <SectionTitle title="Checklist runtime demo" text="Cette verification prepare le moteur sans modifier le design Lovable." />
          <div className="project-list">
            {runtimeResult.checklist.map((item) => (
              <article className="project-card" key={item.key}>
                <div>
                  <h2>{item.label}</h2>
                  <p>{item.detail}</p>
                </div>
                <Badge tone={item.done ? 'green' : 'amber'}>{item.done ? 'ok' : 'a corriger'}</Badge>
              </article>
            ))}
          </div>
        </Card>
      )}

      {selectedAgency && (
        <Card className="detail-block">
          <SectionTitle
            title="Demandes recues"
            text="Les formulaires vivants creent des donnees rattachees uniquement a cette agency."
          />
          <div className="project-list">
            {selectedLeads.length === 0 && selectedAppointments.length === 0 && (
              <p className="muted">Aucune demande recue pour cette agence pour le moment.</p>
            )}
            {selectedLeads.map((lead) => (
              <article className="project-card" key={lead.id}>
                <div>
                  <h2>{lead.firstName || 'Contact'} {lead.lastName}</h2>
                  <p>{lead.email || 'Email non renseigne'} · {lead.phone || 'Telephone non renseigne'}</p>
                  <small>{lead.source}</small>
                </div>
                <div className="project-card-meta">
                  <Badge tone="violet">{lead.moduleKey}</Badge>
                  <span>{new Date(lead.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </article>
            ))}
            {selectedAppointments.map((appointment) => (
              <article className="project-card" key={appointment.id}>
                <div>
                  <h2>{appointment.title}</h2>
                  <p>{String(appointment.payload.email ?? 'Email non renseigne')} · {String(appointment.payload.phone ?? 'Telephone non renseigne')}</p>
                  <small>Rendez-vous / visite qualifiee</small>
                </div>
                <div className="project-card-meta">
                  <Badge tone="green">{appointment.status}</Badge>
                  <span>{new Date(appointment.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      {selectedAgency && (
        <Card className="detail-block">
          <SectionTitle title="Configuration modules" text="Un module desactive ne doit pas etre visible dans la demo et doit etre refuse par l API." />
          <div className="project-list">
            {modules.map((agencyModule) => {
              const moduleDefinition = getDefaultModules().find((module) => module.key === agencyModule.moduleKey)
              return (
                <article className="project-card" key={agencyModule.moduleKey}>
                  <div>
                    <h2>{moduleDefinition?.name ?? agencyModule.moduleKey}</h2>
                    <p>{moduleDefinition?.description ?? 'Module Signature Digital'}</p>
                    <small>{agencyModule.moduleKey}</small>
                  </div>
                  <div className="project-card-meta">
                    <Badge tone={agencyModule.enabled ? 'green' : 'default'}>{agencyModule.enabled ? 'active' : 'desactive'}</Badge>
                    <Button
                      variant={agencyModule.enabled ? 'secondary' : 'primary'}
                      onClick={() => toggleModule(selectedAgency, agencyModule.moduleKey, !agencyModule.enabled)}
                    >
                      {agencyModule.enabled ? 'Desactiver' : 'Activer'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </Card>
      )}

      {selectedAgency && (
        <Card className="detail-block">
          <SectionTitle title="Modules disponibles par secteur" />
          <div className="badge-row">
            {getModulesForSector(selectedAgency.sector).map((module) => (
              <Badge key={module.key} tone="violet">{module.name}</Badge>
            ))}
          </div>
        </Card>
      )}

      {selectedPrompt && (
        <Card className="detail-block">
          <SectionTitle title="Prompt Lovable genere" text="La demo peut etre visuellement differente, mais doit respecter les modules actives." />
          <TextArea label="Prompt" value={selectedPrompt.content} onChange={() => undefined} />
          <Button variant="secondary" onClick={() => selectedAgency && void copyPromptFromAdmin(selectedAgency, selectedPrompt.content)}>
            Copier le prompt Lovable
          </Button>
        </Card>
      )}

      <Card className="detail-block">
        <SectionTitle title="Tables preparees" />
        <div className="badge-row">
          {Object.entries(state).map(([key, value]) => (
            <Badge key={key}>{key}: {Array.isArray(value) ? value.length : 0}</Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value || 'A completer'}</strong>
    </div>
  )
}
