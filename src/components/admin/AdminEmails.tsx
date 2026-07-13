import { useMemo, useState } from 'react'
import {
  cancelEmailOutboxItem,
  emailEvents,
  formatEmailForCopy,
  markEmailOutboxItemSimulated,
  readEmailOutbox,
  retryEmailOutboxItem,
  type EmailEvent,
  type EmailOutboxItem,
  type EmailOutboxStatus,
} from '../../lib/emailEventSystem'
import { Badge, Button, Card, SectionTitle } from '../shared/DesignSystem'

const emailStatuses: Array<EmailOutboxStatus | 'all'> = ['all', 'draft', 'ready', 'sending', 'sent', 'simulated', 'cancelled', 'failed', 'error']
const emailEventFilters: Array<EmailEvent | 'all'> = ['all', ...emailEvents]

export function AdminEmails() {
  const [version, setVersion] = useState(0)
  const [statusFilter, setStatusFilter] = useState<EmailOutboxStatus | 'all'>('all')
  const [eventFilter, setEventFilter] = useState<EmailEvent | 'all'>('all')
  const [selectedId, setSelectedId] = useState('')
  const [copied, setCopied] = useState('')
  const items = useMemo(() => {
    void version
    return readEmailOutbox()
  }, [version])
  const visibleItems = items.filter((item) => (
    (statusFilter === 'all' || item.status === statusFilter) &&
    (eventFilter === 'all' || item.event === eventFilter)
  ))
  const selected = items.find((item) => item.id === selectedId) ?? visibleItems[0]

  function refresh() {
    setVersion((current) => current + 1)
  }

  async function copyEmail(item: EmailOutboxItem) {
    await navigator.clipboard?.writeText(formatEmailForCopy(item)).catch(() => undefined)
    setCopied(item.id)
    window.setTimeout(() => setCopied(''), 1800)
  }

  function cancel(item: EmailOutboxItem) {
    cancelEmailOutboxItem(item.id)
    refresh()
  }

  function simulate(item: EmailOutboxItem) {
    markEmailOutboxItemSimulated(item.id)
    refresh()
  }

  async function retry(item: EmailOutboxItem) {
    await retryEmailOutboxItem(item.id)
    refresh()
  }

  return (
    <div className="admin-view admin-email-view">
      <SectionTitle
        eyebrow="Emails automatiques"
        title="File d'attente email"
        text="Les emails sont generes dans l'outbox puis envoyes via le serveur email lorsque la configuration live est disponible."
      />

      <Card className="detail-block">
        <div className="detail-grid">
          <Info label="Total" value={`${items.length}`} />
          <Info label="Prets" value={`${items.filter((item) => item.status === 'ready').length}`} />
          <Info label="Envoyes" value={`${items.filter((item) => item.status === 'sent').length}`} />
          <Info label="Echecs" value={`${items.filter((item) => item.status === 'failed' || item.status === 'error').length}`} />
          <Info label="Simules" value={`${items.filter((item) => item.status === 'simulated').length}`} />
        </div>
        <div className="inline-actions">
          <label className="sd-field">
            <span>Evenement</span>
            <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value as EmailEvent | 'all')}>
              {emailEventFilters.map((event) => <option key={event} value={event}>{event}</option>)}
            </select>
          </label>
          <label className="sd-field">
            <span>Statut</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EmailOutboxStatus | 'all')}>
              {emailStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <div className="admin-email-layout">
        <Card className="detail-block">
          <SectionTitle title="Emails en attente" />
          <div className="admin-email-list">
            {visibleItems.length === 0 && <p className="muted">Aucun email pour ce filtre.</p>}
            {visibleItems.map((item) => (
              <button className={item.id === selected?.id ? 'admin-email-item active' : 'admin-email-item'} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
                <span>{item.subject}</span>
                <small>{item.recipient.email}</small>
                <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card className="detail-block">
          <SectionTitle title="Previsualisation" />
          {selected ? (
            <div className="admin-email-preview">
              <Info label="Evenement" value={selected.event} />
              <Info label="Destinataire" value={`${selected.recipient.name} - ${selected.recipient.email}`} />
              <Info label="Objet" value={selected.subject} />
              <Info label="Preheader" value={selected.preheader} />
              <Info label="Statut" value={selected.status} />
              <Info label="Tentatives" value={`${selected.attemptCount}`} />
              {selected.provider && <Info label="Fournisseur" value={selected.provider} />}
              {selected.providerMessageId && <Info label="Message ID" value={selected.providerMessageId} />}
              {selected.sentAt && <Info label="Envoye le" value={selected.sentAt} />}
              {selected.lastError && <Info label="Erreur" value={selected.lastError} />}
              {selected.cta && <Info label="CTA" value={`${selected.cta.label} - ${selected.cta.url}`} />}
              <textarea readOnly value={formatEmailForCopy(selected)} />
              <div className="inline-actions">
                <Button onClick={() => void copyEmail(selected)}>Copier objet et contenu</Button>
                <Button variant="secondary" onClick={() => void retry(selected)} disabled={selected.status === 'sending' || selected.status === 'sent' || selected.status === 'cancelled'}>
                  Reessayer
                </Button>
                <Button variant="secondary" onClick={() => simulate(selected)} disabled={selected.status === 'simulated'}>
                  Simuler comme traite
                </Button>
                <Button variant="danger" onClick={() => cancel(selected)} disabled={selected.status === 'cancelled'}>
                  Annuler
                </Button>
                {copied === selected.id && <span className="copy-feedback">Email copie.</span>}
              </div>
            </div>
          ) : (
            <p className="muted">Selectionnez un email pour le previsualiser.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getStatusTone(status: EmailOutboxStatus): 'default' | 'violet' | 'green' | 'amber' {
  if (status === 'sent') return 'green'
  if (status === 'ready' || status === 'sending') return 'violet'
  if (status === 'failed' || status === 'error' || status === 'cancelled') return 'amber'
  return 'default'
}
