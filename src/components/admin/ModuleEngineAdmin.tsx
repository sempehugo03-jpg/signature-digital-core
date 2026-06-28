import { useMemo, useState } from 'react'
import { getDefaultModules, getModulesForSector } from '../../lib/modules'
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

export function ModuleEngineAdmin() {
  const [version, setVersion] = useState(0)
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
  const enabledCount = modules.filter((module) => module.enabled).length

  function refresh() {
    setVersion((current) => current + 1)
  }

  function toggleModule(agency: Agency, moduleKey: ModuleKey, enabled: boolean) {
    updateSignatureAgencyModule(agency.id, moduleKey, enabled)
    refresh()
  }

  return (
    <div className="admin-view">
      <SectionTitle
        eyebrow="Moteur Signature Digital"
        title="Plateforme multi-client configurable par modules."
        text="Chaque client garde son univers, mais les briques fonctionnelles viennent du meme moteur."
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
            <Info label="Ville" value={selectedAgency.city} />
            <Info label="Angle commercial" value={selectedAgency.commercialAngle} />
            <Info label="Modules actifs" value={`${enabledCount} / ${modules.length}`} />
          </div>
        )}
      </Card>

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
          <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(selectedPrompt.content)}>
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
