import { Button, Card, SectionTitle } from '../shared/DesignSystem'

const templateRoutes = {
  public: '/demo/template-immobilier',
  login: '/demo/template-immobilier/connexion',
  seller: '/demo/template-immobilier/vendeur',
  agent: '/demo/template-immobilier/agent',
  owner: '/demo/template-immobilier/patron',
}

export function AdminTemplates() {
  function open(route: string) {
    window.open(route, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="admin-view">
      <SectionTitle
        eyebrow="Templates"
        title="Templates Signature Digital"
        text="Accès aux bases vivantes testables avant duplication client."
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
          <Button onClick={() => open(templateRoutes.public)}>Voir template vivante</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.login)}>Connexion template</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.seller)}>Espace vendeur</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.agent)}>Espace agent</Button>
          <Button variant="secondary" onClick={() => open(templateRoutes.owner)}>Espace patron</Button>
        </div>
      </Card>
    </div>
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
